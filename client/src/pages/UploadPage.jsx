import { useState } from "react";
import Navbar from "@/components/Navbar";
import FileUploader from "@/components/FileUploader";
import { usePuterStore } from "@/lib/puter";
import { Link, useNavigate } from "react-router-dom";
import { convertPdfToImage } from "@/lib/pdf2img";
import { generateUUID } from "@/lib/utils";
import { prepareInstructions } from "@/constants";
import { saveResumeToServer } from "@/lib/api";

const UploadPage = () => {
  const { auth: puterAuth, fs, ai } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState(null);

  const handleFileSelect = (f) => {
    setFile(f);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }) => {
    if (!puterAuth.isAuthenticated) {
      setStatusText("Please sign in to Puter first (required for AI).");
      navigate("/puter?next=/upload");
      return;
    }

    setIsProcessing(true);

    try {
      setStatusText("Uploading the file to Puter...");
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        setStatusText("Error: Failed to upload file");
        return;
      }

      setStatusText("Converting to image...");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        setStatusText(
          imageFile.error
            ? `Error: ${imageFile.error}`
            : "Error: Failed to convert PDF to image"
        );
        return;
      }

      setStatusText("Uploading the image...");
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        setStatusText("Error: Failed to upload image");
        return;
      }

      const uuid = generateUUID();

      setStatusText("Analyzing with AI...");
      const feedback = await Promise.race([
        ai.feedback(
          uploadedFile.path,
          prepareInstructions({ jobTitle, jobDescription })
        ),
        new Promise((resolve) => setTimeout(() => resolve(null), 120_000)),
      ]);

      let parsedFeedback = null;
      if (feedback) {
        const content = feedback.message.content;
        let feedbackRaw;
        if (typeof content === "string") {
          feedbackRaw = content;
        } else if (Array.isArray(content)) {
          const firstWithText = content.find(
            (c) => typeof c.text === "string"
          );
          feedbackRaw =
            (firstWithText && firstWithText.text) ?? JSON.stringify(content);
        } else {
          feedbackRaw = JSON.stringify(content);
        }
        try {
          parsedFeedback = JSON.parse(feedbackRaw);
        } catch {
          parsedFeedback = feedbackRaw;
        }
      }

      setStatusText("Saving to your account...");
      const ok = await saveResumeToServer({
        publicId: uuid,
        companyName,
        jobTitle,
        jobDescription,
        pdf: file,
        image: imageFile.file,
        feedback: parsedFeedback,
      });

      if (!ok) {
        setStatusText(
          "Error: Failed to save resume on server. Is the API running?"
        );
        return;
      }

      setStatusText("Done! Redirecting...");
      navigate(`/resume/${uuid}`);
    } catch (error) {
      console.error(error);
      setStatusText("Error: Failed to analyze resume");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get("company-name");
    const jobTitle = formData.get("job-title");
    const jobDescription = formData.get("job-description");

    if (!file) return;

    void handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {!puterAuth.isAuthenticated && (
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl">
              Sign in to{" "}
              <Link to="/puter?next=/upload" className="underline font-medium">
                Puter
              </Link>{" "}
              before analyzing (AI + file hosting).
            </p>
          )}
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" alt="" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              {statusText && !isProcessing && (
                <p className="text-red-600 text-center">{statusText}</p>
              )}
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default UploadPage;
