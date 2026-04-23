import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    setDropdownOpen(false);
    dispatch(logout());
    navigate("/login");
  };

  const initials = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          Questivate
        </Link>

        {/* Main links */}
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/collections"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Collections
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Search
          </NavLink>
          <NavLink
            to="/vibe-match"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Vibe Match
          </NavLink>
        </div>

        {/* User section */}
        <div className="navbar-user">
          <button
            className="navbar-user-btn"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-expanded={dropdownOpen}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="navbar-avatar"
              />
            ) : (
              <div className="navbar-avatar-placeholder">{initials}</div>
            )}
            <span className="navbar-username">{user?.username}</span>
            <svg
              className={`navbar-chevron ${dropdownOpen ? "open" : ""}`}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M3 5l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay to close dropdown on outside click */}
              <div
                className="navbar-overlay"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="navbar-dropdown">
                <Link
                  to={`/users/${user?.username}`}
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Public profile
                </Link>
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-item-danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
