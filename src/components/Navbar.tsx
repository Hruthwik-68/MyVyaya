import { useState } from "react";
import MyVyayaPhotoroom from "../assets/MyVyaya-Photoroom.png";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import { Menu, X, LogOut, Home, User } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isActive = (path: string) => location.pathname === path;

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
            color: isActive("/home") ? "#3b8bff" : "rgba(241, 245, 249, 0.7)",
            fontWeight: 500,
            fontSize: "14px",
            letterSpacing: "0.01em",
            position: "relative",
            padding: "8px 0",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Home size={16} /> Home
        </Link>
        <Link
          to="/profile"
          className="nav-link"
          style={{
            textDecoration: "none",
            color: isActive("/profile") ? "#3b8bff" : "rgba(241, 245, 249, 0.7)",
            fontWeight: 500,
            fontSize: "14px",
            letterSpacing: "0.01em",
            position: "relative",
            padding: "8px 0",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <User size={16} /> Profile
        </Link>

        <button
          onClick={logout}
          className="logout-btn"
          style={{
            background: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.2)",
            padding: "8px 16px",
            borderRadius: 8,
            color: "#f87171",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "13px",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <LogOut size={14} /> Logout
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
          cursor: "pointer",
          display: "none",
          padding: "4px",
        }}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div
          className="mobile-menu"
          style={{
            position: "absolute",
            top: 70,
            right: 16,
            background: "rgba(12, 20, 37, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: 8,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            width: 220,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <Link
            to="/home"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: isActive("/home") ? "#3b8bff" : "rgba(241, 245, 249, 0.8)",
              background: isActive("/home") ? "rgba(59, 139, 255, 0.1)" : "transparent",
              padding: "12px 16px",
              textDecoration: "none",
              fontSize: "14px",
              borderRadius: 12,
              transition: "all 0.2s",
              fontWeight: 500,
            }}
          >
            <Home size={18} /> Home
          </Link>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: isActive("/profile") ? "#3b8bff" : "rgba(241, 245, 249, 0.8)",
              background: isActive("/profile") ? "rgba(59, 139, 255, 0.1)" : "transparent",
              padding: "12px 16px",
              textDecoration: "none",
              fontSize: "14px",
              borderRadius: 12,
              transition: "all 0.2s",
              fontWeight: 500,
            }}
          >
            <User size={18} /> Profile
          </Link>

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />

          <button
            onClick={logout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(248, 113, 113, 0.1)",
              border: "none",
              padding: "12px 16px",
              borderRadius: 12,
              color: "#f87171",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}