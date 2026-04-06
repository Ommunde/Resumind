import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";

const WipePage = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const handleWipe = async () => {
    if (!confirm("Delete all your saved resumes from the server?")) return;
    const res = await apiFetch("/api/resumes", { method: "DELETE" });
    if (!res.ok) {
      setMsg("Failed to wipe data.");
      return;
    }
    const data = await res.json();
    setMsg(`Removed ${data.deleted ?? 0} resume(s).`);
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <main>
      <Navbar />
      <div className="main-section max-w-lg mx-auto text-center gap-4">
        <h2 className="!text-2xl font-bold">Danger zone</h2>
        <p className="text-dark-200">
          Removes all resume records and files from your MongoDB-backed account.
          Puter files are not deleted here.
        </p>
        <button
          type="button"
          className="primary-button bg-red-600"
          onClick={() => void handleWipe()}
        >
          Wipe server data
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  );
};

export default WipePage;
