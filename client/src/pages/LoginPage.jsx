import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const next = search.get("next") || "/";
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate(next, { replace: true });
  }, [token, next, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      setAuth(data.token, data.user);
      navigate(next, { replace: true });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10 max-w-lg">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Welcome back</h1>
            <h2>Log in to Resumind</h2>
          </div>
          <form onSubmit={onSubmit} className="gap-4">
            {error && (
              <p className="text-red-600 text-sm w-full text-center">{error}</p>
            )}
            <div className="form-div">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-div">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              className="auth-button !w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>
          <p className="text-center text-dark-200">
            No account?{" "}
            <Link to="/register" className="text-[#606beb] font-medium">
              Register
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
