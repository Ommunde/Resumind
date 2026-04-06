import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/authStore";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">RESUMIND</p>
      </Link>
      <div className="flex flex-row items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-dark-200 max-sm:hidden">
              {user.email}
            </span>
            <Link to="/upload" className="primary-button w-fit">
              Upload Resume
            </Link>
            <button
              type="button"
              className="primary-button w-fit !px-4"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="primary-button w-fit">
              Log in
            </Link>
            <Link to="/register" className="primary-button w-fit">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
