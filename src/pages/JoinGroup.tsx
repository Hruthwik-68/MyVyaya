import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function JoinGroup() {
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const join = async () => {
    // get logged in user
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      alert("You must be logged in");
      return;
    }

    const codeClean = code.trim();
    const passClean = pass.trim();

    // find the group
    const { data: group, error } = await supabase
      .from("trackers")
      .select("*")
      .eq("group_code", codeClean)
      .eq("passcode", passClean)
      .eq("type", "group")
      .maybeSingle();

    if (error) {
      console.error("Lookup error:", error);
      alert("Something went wrong");
      return;
    }

    if (!group) {
      alert("Invalid Group Code or Passcode");
      return;
    }

    // check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("tracker_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabase
        .from("group_members")
        .insert({
          tracker_id: group.id,
          user_id: user.id,
          role: "member",
        });

      if (insertErr) {
        console.error("Insert error:", insertErr);
        alert(insertErr.message);
        return;
      }
    }

    alert("Joined group successfully!");
    navigate("/home");
  };

  return (
    <div style={{
      maxWidth: 500,
      margin: "0 auto",
      padding: "40px 20px",
      animation: 'fadeSlideUp 0.6s ease-out'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
        <h2 style={{
          margin: 0,
          fontSize: 28,
          background: "linear-gradient(135deg, #1a8a9e, #4db8d9)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 800,
        }}>
          Join a Group
        </h2>
        <p style={{ margin: "8px 0 0", color: "#8ba4bc", fontSize: 14 }}>
          Enter the group code shared with you
        </p>
      </div>

      {/* Form Card */}
      <div style={{
        background: "rgba(10, 31, 51, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(33, 150, 196, 0.1)",
        borderRadius: 20,
        padding: 32,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3), 0 0 40px rgba(26, 138, 158, 0.05)",
      }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14, color: "#8ba4bc" }}>
            📝 Group Code
          </label>
          <input
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "1px solid rgba(33, 150, 196, 0.15)",
              fontSize: 24,
              fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "0.3em",
              background: "rgba(12, 36, 58, 0.6)",
              color: "#e8eff5",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
            onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14, color: "#8ba4bc" }}>
            🔐 Passcode
          </label>
          <input
            placeholder="Enter 6-digit passcode"
            maxLength={6}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "1px solid rgba(33, 150, 196, 0.15)",
              fontSize: 24,
              fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "0.3em",
              background: "rgba(12, 36, 58, 0.6)",
              color: "#e8eff5",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
            onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={join}
            disabled={!code.trim()}
            style={{
              flex: 1,
              padding: "16px 24px",
              background: !code.trim() ? "rgba(90, 122, 148, 0.2)" : "linear-gradient(135deg, #1a8a9e, #2196c4)",
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              cursor: !code.trim() ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: !code.trim() ? "none" : "0 8px 24px rgba(26, 138, 158, 0.3)",
            }}
          >
            🚀 Join Group
          </button>

          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "16px 24px",
              background: "rgba(12, 36, 58, 0.6)",
              color: "#8ba4bc",
              border: "1px solid rgba(33, 150, 196, 0.15)",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
