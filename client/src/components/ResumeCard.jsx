import { Link } from "react-router-dom";
import ScoreCircle from "@/components/ScoreCircle";
import { useEffect, useState } from "react";
import { fetchResumeImageBlob, fetchResumePdfBlob } from "@/lib/api";
import { convertPdfToImage } from "@/lib/pdf2img";

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback },
  onDelete,
}) => {
  const [resumeUrl, setResumeUrl] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let revoked = false;
    let url = "";
    const loadResume = async () => {
      // 1) Try server-side preview image
      const blob = await fetchResumeImageBlob(id);
      if (blob && !revoked) {
        url = URL.createObjectURL(blob);
        setResumeUrl(url);
        return;
      }

      // 2) Fallback: fetch the PDF and render a thumbnail in the browser
      const pdfBlob = await fetchResumePdfBlob(id);
      if (!pdfBlob || revoked) return;

      const pdfFile = new File([pdfBlob], "resume.pdf", {
        type: "application/pdf",
      });
      const rendered = await convertPdfToImage(pdfFile);
      if (!rendered.file || revoked) return;

      // convertPdfToImage already returns an object URL (rendered.imageUrl)
      url = rendered.imageUrl;
      setResumeUrl(url);
    };

    loadResume();
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-1000"
    >
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          {companyName && (
            <h2 className="!text-black font-bold break-words">{companyName}</h2>
          )}
          {jobTitle && (
            <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
          )}
          {!companyName && !jobTitle && (
            <h2 className="!text-black font-bold">Resume</h2>
          )}
        </div>
        <div className="flex flex-row gap-2 items-start">
          <div className="flex-shrink-0">
            <ScoreCircle score={feedback?.overallScore ?? 0} />
          </div>
          {typeof onDelete === "function" && (
            <button
              type="button"
              className="text-xs px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!confirm("Delete this resume?")) return;
                try {
                  setIsDeleting(true);
                  await onDelete(id);
                } finally {
                  setIsDeleting(false);
                }
              }}
              title="Delete resume"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
      <div className="gradient-border animate-in fade-in duration-1000">
        <div className="w-full h-full">
          <img
            src={resumeUrl || "/images/pdf.png"}
            alt="resume"
            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
          />
        </div>
      </div>
    </Link>
  );
};
export default ResumeCard;
