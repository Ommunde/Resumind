import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { usePuterStore } from "@/lib/puter";
import { useAuthStore } from "@/lib/authStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import UploadPage from "@/pages/UploadPage";
import ResumePage from "@/pages/ResumePage";
import WipePage from "@/pages/WipePage";
import PuterAuthPage from "@/pages/PuterAuthPage";

export default function App() {
  const initPuter = usePuterStore((s) => s.init);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    initPuter();
  }, [initPuter]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/puter" element={<PuterAuthPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/:id"
        element={
          <ProtectedRoute>
            <ResumePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wipe"
        element={
          <ProtectedRoute>
            <WipePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
