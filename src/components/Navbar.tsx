import { useState } from "react";
import MyVyayaPhotoroom from "../assets/MyVyaya-Photoroom.png";
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
        background: "rgba(6, 11, 24, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        color: "white",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      {/* LEFT — LOGO */}
      <Link
        to="/home"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          transition: "transform 0.3s ease",
        }}
        className="navbar-logo-link"
      >
        <img
          src={MyVyayaPhotoroom}
          alt="My Vyaya"
          className="navbar-logo"
          style={{
            height: "45px",
            width: "auto",
            maxWidth: "180px",
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
            transition: "all 0.3s ease",
          }}
        />
      </Link>

      {/* DESKTOP MENU */}
      <div
        className="desktop-menu"
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
        }}
      >
        <Link
          to="/home"
          className="nav-link"
          style={{
            textDecoration: "none",
            color:
              location.pathname === "/home"
                ? "#3b8bff"
                : "rgba(241, 245, 249, 0.7)",
            fontWeight: 400,
            fontSize: "14px",
            letterSpacing: "0.01em",
            position: "relative",
            padding: "8px 0",
            transition: "all 0.3s ease",
          }}
        >
          Home
        </Link>

        <Link
          to="/profile"
          className="nav-link"
          style={{
            textDecoration: "none",
            color:
              location.pathname === "/profile"
                ? "#3b8bff"
                : "rgba(241, 245, 249, 0.7)",
            fontWeight: 400,
            fontSize: "14px",
            letterSpacing: "0.01em",
            position: "relative",
            padding: "8px 0",
            transition: "all 0.3s ease",
          }}
        >
          Profile
        </Link>

        <button
          onClick={logout}
          className="logout-btn"
          style={{
            background: "transparent",
            border: "1px solid rgba(248, 113, 113, 0.3)",
            padding: "7px 18px",
            borderRadius: 8,
            color: "#f87171",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "13px",
            transition: "all 0.3s ease",
            boxShadow: "none",
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
          color: "rgba(241, 245, 249, 0.8)",
          fontSize: 24,
          cursor: "pointer",
          display: "none",
          padding: "4px",
        }}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div
          className="mobile-menu"
          style={{
            position: "absolute",
            top: 64,
            right: 12,
            background: "rgba(12, 20, 37, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 20px 50px rgba(0,0,0,.5)",
            border: "1px solid rgba(148, 163, 184, 0.08)",
            width: 200,
          }}
        >
          <Link
            to="/home"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              color: "rgba(241, 245, 249, 0.8)",
              padding: "12px 10px",
              textDecoration: "none",
              fontSize: "14px",
              borderRadius: 8,
              transition: "background 0.2s",
            }}
          >
            Home
          </Link>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              color: "rgba(241, 245, 249, 0.8)",
              padding: "12px 10px",
              textDecoration: "none",
              fontSize: "14px",
              borderRadius: 8,
              transition: "background 0.2s",
            }}
          >
            Profile
          </Link>

          <button
            onClick={logout}
            style={{
              width: "100%",
              marginTop: 8,
              background: "transparent",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              padding: "10px 0",
              borderRadius: 8,
              color: "#f87171",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}