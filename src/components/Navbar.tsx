import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav
      style={{
        background: "#052044",
        color: "white",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 3px 10px rgba(0,0,0,.2)",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      {/* LEFT — LOGO */}
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        💸 Money Tracker
      </div>

      {/* DESKTOP MENU */}
      <div
        className="desktop-menu"
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <Link
          to="/home"
          style={{
            textDecoration: "none",
            color: location.pathname === "/home" ? "#4dabff" : "white",
            fontWeight: 500,
          }}
        >
          Home
        </Link>

        <Link
          to="/profile"
          style={{
            textDecoration: "none",
            color: location.pathname === "/profile" ? "#4dabff" : "white",
            fontWeight: 500,
          }}
        >
          Profile
        </Link>

        <button
          onClick={logout}
          style={{
            background: "#e63946",
            border: "none",
            padding: "6px 12px",
            borderRadius: 8,
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* MOBILE HAMBURGER BUTTON */}
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          fontSize: 26,
          cursor: "pointer",
          display: "none",
        }}
      >
        ☰
      </button>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div
          className="mobile-menu"
          style={{
            position: "absolute",
            top: 60,
            right: 10,
            background: "#0A2F5A",
            borderRadius: 10,
            padding: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,.25)",
            width: 180,
          }}
        >
          <Link
            to="/home"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              color: "white",
              padding: "10px 8px",
              textDecoration: "none",
            }}
          >
            Home
          </Link>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              color: "white",
              padding: "10px 8px",
              textDecoration: "none",
            }}
          >
            Profile
          </Link>

          <button
            onClick={logout}
            style={{
              width: "100%",
              marginTop: 6,
              background: "#e63946",
              border: "none",
              padding: "8px 0",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
