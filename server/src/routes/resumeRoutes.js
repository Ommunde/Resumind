import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Resume } from "../models/Resume.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

function ensureUserDir(userId) {
  const dir = path.join(uploadsRoot, userId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const list = await Resume.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();
    const items = list.map((r) => ({
      id: r.publicId,
      companyName: r.companyName,
      jobTitle: r.jobTitle,
      jobDescription: r.jobDescription,
      feedback: r.feedback,
      createdAt: r.createdAt,
    }));
    res.json({ resumes: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list resumes" });
  }
});

router.get("/:publicId", async (req, res) => {
  try {
    const doc = await Resume.findOne({
      user: req.userId,
      publicId: req.params.publicId,
    }).lean();
    if (!doc) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json({
      id: doc.publicId,
      companyName: doc.companyName,
      jobTitle: doc.jobTitle,
      jobDescription: doc.jobDescription,
      feedback: doc.feedback,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load resume" });
  }
});

router.get("/:publicId/pdf", async (req, res) => {
  try {
    const doc = await Resume.findOne({
      user: req.userId,
      publicId: req.params.publicId,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const abs = path.join(uploadsRoot, doc.pdfRelPath);
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(path.resolve(abs));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to serve PDF" });
  }
});

router.get("/:publicId/image", async (req, res) => {
  try {
    const doc = await Resume.findOne({
      user: req.userId,
      publicId: req.params.publicId,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    // Prefer Mongo-backed preview to survive free-host restarts.
    if (doc.imageBase64) {
      const buf = Buffer.from(doc.imageBase64, "base64");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", String(buf.length));
      return res.status(200).send(buf);
    }

    // Backwards compatibility: older records may only have disk path.
    if (doc.imageRelPath) {
      const abs = path.join(uploadsRoot, doc.imageRelPath);
      res.setHeader("Content-Type", "image/png");
      const resolved = path.resolve(abs);
      if (fs.existsSync(resolved)) {
        // Backfill Mongo-backed preview for future requests.
        const buf = fs.readFileSync(resolved);
        try {
          doc.imageBase64 = buf.toString("base64");
          await doc.save();
        } catch {
          // ignore save errors; still return the image
        }
        return res.status(200).send(buf);
      }
      return res.status(404).json({ error: "Preview image file missing" });
    }

    return res.status(404).json({ error: "Preview image not available" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

router.post(
  "/",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const pdfFile = req.files?.pdf?.[0];
      const imageFile = req.files?.image?.[0];
      if (!pdfFile || !imageFile) {
        return res.status(400).json({ error: "pdf and image files required" });
      }

      const {
        publicId,
        companyName = "",
        jobTitle = "",
        jobDescription = "",
        feedback: feedbackRaw,
      } = req.body;

      if (!publicId?.trim()) {
        return res.status(400).json({ error: "publicId required" });
      }

      let feedback = null;
      if (feedbackRaw) {
        try {
          feedback =
            typeof feedbackRaw === "string" ? JSON.parse(feedbackRaw) : feedbackRaw;
        } catch {
          feedback = feedbackRaw;
        }
      }

      const userDir = ensureUserDir(req.userId);
      const subDir = path.join(userDir, publicId.trim());
      fs.mkdirSync(subDir, { recursive: true });

      const pdfName = "resume.pdf";
      const imageName = "preview.png";
      const pdfDisk = path.join(subDir, pdfName);
      const imageDisk = path.join(subDir, imageName);

      fs.writeFileSync(pdfDisk, pdfFile.buffer);
      fs.writeFileSync(imageDisk, imageFile.buffer);

      const pdfRelPath = path.relative(uploadsRoot, pdfDisk).replace(/\\/g, "/");
      const imageRelPath = path.relative(uploadsRoot, imageDisk).replace(/\\/g, "/");
      const imageBase64 = imageFile.buffer.toString("base64");

      await Resume.findOneAndUpdate(
        { user: req.userId, publicId: publicId.trim() },
        {
          user: req.userId,
          publicId: publicId.trim(),
          companyName,
          jobTitle,
          jobDescription,
          feedback,
          pdfRelPath,
          imageRelPath,
          imageBase64,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({ id: publicId.trim() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save resume" });
    }
  }
);

router.delete("/:publicId", async (req, res) => {
  try {
    const doc = await Resume.findOneAndDelete({
      user: req.userId,
      publicId: req.params.publicId,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.pdfRelPath) {
      const dir = path.dirname(path.join(uploadsRoot, doc.pdfRelPath));
      fs.rmSync(dir, { recursive: true, force: true });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const list = await Resume.find({ user: req.userId });
    for (const doc of list) {
      if (doc.pdfRelPath) {
        const dir = path.dirname(path.join(uploadsRoot, doc.pdfRelPath));
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    await Resume.deleteMany({ user: req.userId });
    res.json({ ok: true, deleted: list.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to wipe" });
  }
});

export default router;
