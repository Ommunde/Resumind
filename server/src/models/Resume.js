import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publicId: { type: String, required: true },
    companyName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    feedback: { type: mongoose.Schema.Types.Mixed, default: null },
    pdfRelPath: { type: String, required: true },
    imageRelPath: { type: String, required: true },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, publicId: 1 }, { unique: true });

export const Resume = mongoose.model("Resume", resumeSchema);
