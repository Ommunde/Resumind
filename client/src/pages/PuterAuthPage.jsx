import { usePuterStore } from "@/lib/puter";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const PuterAuthPage = () => {
  const { isLoading, auth } = usePuterStore();
  const [search] = useSearchParams();
  const next = search.get("next") || "/upload";
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next, { replace: true });
  }, [auth.isAuthenticated, next, navigate]);

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10 max-w-lg">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Puter</h1>
            <h2>Sign in for AI resume analysis (free)</h2>
            <p className="text-sm text-dark-200">
              Your Resumind account is separate. Puter powers file + AI only.
            </p>
          </div>
          <div>
            {isLoading ? (
              <button
                className="auth-button animate-pulse !w-full"
                type="button"
                disabled
              >
                <p>Loading…</p>
              </button>
            ) : (
              <>
                {auth.isAuthenticated ? (
                  <button
                    className="auth-button !w-full"
                    type="button"
                    onClick={auth.signOut}
                  >
                    <p>Disconnect Puter</p>
                  </button>
                ) : (
                  <button
                    className="auth-button !w-full"
                    type="button"
                    onClick={auth.signIn}
                  >
                    <p>Sign in with Puter</p>
                  </button>
                )}
              </>
            )}
          </div>
          <Link to={next} className="text-center text-[#606beb]">
            Skip for now
          </Link>
        </section>
      </div>
    </main>
  );
};

export default PuterAuthPage;
