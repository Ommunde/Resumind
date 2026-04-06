import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publicId: { type: String, required: true },
    companyName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    feedback: { type: mongoose.Schema.Types.Mixed, default: null },
    // Disk-backed storage (may be ephemeral on free hosting). Kept for backwards compatibility.
    pdfRelPath: { type: String, default: "" },
    imageRelPath: { type: String, default: "" },

    // Mongo-backed preview image to avoid blank cards on hosts without persistent disk.
    // Stored as base64 string WITHOUT data URL prefix.
    imageBase64: { type: String, default: "" },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, publicId: 1 }, { unique: true });

export const Resume = mongoose.model("Resume", resumeSchema);
