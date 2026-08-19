import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-indigo-600 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="font-bold text-lg">SkillXchange</Link>
      <div className="flex gap-4 items-center text-sm">
        <Link to="/browse">Browse</Link>
        {user && <Link to="/requests">My Requests</Link>}
        {user && <Link to="/profile">Profile</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <span className="opacity-80">
              {user.name} {!user.verified && user.role !== "admin" && "(unverified)"}
            </span>
            <button
              className="bg-indigo-800 px-3 py-1 rounded"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="bg-indigo-800 px-3 py-1 rounded">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
