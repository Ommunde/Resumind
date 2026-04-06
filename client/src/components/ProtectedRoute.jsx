import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/authStore";

export function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const location = useLocation();

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-dark-200">Loading…</p>
      </main>
    );
  }

  if (!token) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
