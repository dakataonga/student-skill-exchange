import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50  text-black px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-display text-2xl italic tracking-tight text-moss-600 hover:text-black transition-colors">
        Skillxchange
      </Link>
      <div className="flex gap-5 items-center text-sm font-medium">
        <Link to="/browse" className="text-moss-600 hover:text-black transition-colors">Browse</Link>
        {user && <Link to="/requests" className="text-moss-600 hover:text-black transition-colors">My Requests</Link>}
        {user && <Link to="/profile" className="text-moss-600 hover:text-black transition-colors">Profile</Link>}
        {user?.role === "admin" && <Link to="/admin" className="text-moss-600 hover:text-black transition-colors">Admin</Link>}
        {user ? (
          <>
            <span className="text-black opacity-70 hidden sm:inline">
              {user.name}{!user.verified && user.role !== "admin" && " · unverified"}
            </span>
            <button
              className="text-moss-600  px-3 py-1.5 hover:text-black transition-colors"
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
            <Link to="/login" className="text-moss-600 hover:text-black transition-colors">Log in</Link>
            <Link to="/register" className="text-moss-600 hover:text-black transition-colors">
              Join
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}