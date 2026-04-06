import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Summary from "@/components/Summary";
import ATS from "@/components/ATS";
import Details from "@/components/Details";
import { apiFetch, fetchResumeImageBlob, fetchResumePdfBlob } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

function isFeedback(x) {
  if (!x || typeof x !== "object") return false;
  const f = x;
  return (
    typeof f.overallScore === "number" &&
    f.ATS &&
    typeof f.ATS.score === "number" &&
    Array.isArray(f.ATS.tips)
  );
}

const ResumePage = () => {
  const token = useAuthStore((s) => s.token);
  const { id } = useParams();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!token) navigate(`/login?next=/resume/${id}`);
  }, [token, id, navigate]);

  useEffect(() => {
    if (!id || !token) return;

    let dead = false;
    let a = "";
    let b = "";

    const loadResume = async () => {
      setLoadError("");
      const metaRes = await apiFetch(`/api/resumes/${id}`);
      if (!metaRes.ok) {
        if (!dead) setLoadError("Resume not found.");
        return;
      }
      const row = await metaRes.json();
      if (!dead && row.feedback && isFeedback(row.feedback)) {
        setFeedback(row.feedback);
      } else if (!dead && row.feedback) {
        setLoadError("Feedback data could not be displayed.");
      }

      const pdfBlob = await fetchResumePdfBlob(id);
      const imageBlob = await fetchResumeImageBlob(id);
      if (dead) return;
      if (pdfBlob) {
        a = URL.createObjectURL(pdfBlob);
        setResumeUrl(a);
      }
      if (imageBlob) {
        b = URL.createObjectURL(imageBlob);
        setImageUrl(b);
      }
    };

    void loadResume();

    return () => {
      dead = true;
      if (a) URL.revokeObjectURL(a);
      if (b) URL.revokeObjectURL(b);
    };
  }, [id, token]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                  alt="Resume preview"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {loadError && <p className="text-red-600">{loadError}</p>}
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" alt="" />
          )}
        </section>
      </div>
    </main>
  );
};

export default ResumePage;
