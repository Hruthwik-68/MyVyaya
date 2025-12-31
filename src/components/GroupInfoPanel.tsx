import { useState } from "react";
import { supabase } from "../supabase";

interface GroupInfoPanelProps {
  groupId: string;
  groupName: string;
  groupPassword?: string;
  isAdmin: boolean;
}

export default function GroupInfoPanel({
  groupId,
  groupName,
  groupPassword,
  isAdmin,
}: GroupInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState(groupPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  const shareUrl = `${window.location.origin}/join/${groupId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`✅ ${label} copied to clipboard!`);
  };

  const updatePassword = async () => {
    if (!isAdmin) return;
    
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from("trackers")
        .update({ group_password: password || null })
        .eq("id", groupId);

      if (error) throw error;
      
      alert("✅ Group password updated!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("❌ Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 15,
          cursor: "pointer",
          backgroundColor: "#f0f9ff",
          borderBottom: isOpen ? "1px solid #e5e7eb" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Group Info & Share
          </h3>
        </div>
        <div style={{ fontSize: 18 }}>
          {isOpen ? "▲" : "▼"}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: 20 }}>
          {/* Group Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block", color: "#666" }}>
              📝 Group Name:
            </label>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {groupName}
            </div>
          </div>

          {/* Group Code */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block", color: "#666" }}>
              🔑 Group Code:
            </label>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                {groupId.slice(0, 8).toUpperCase()}
              </div>
              <button
                onClick={() => copyToClipboard(groupId, "Group Code")}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          {/* Group Password (Admin Only) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block", color: "#666" }}>
              🔐 Group Password {isAdmin ? "(Optional)" : ""}:
            </label>
            {isAdmin ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password (optional)"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                <button
                  onClick={updatePassword}
                  disabled={updating}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: updating ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  {updating ? "⏳" : "💾"} Save
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#666",
                }}
              >
                {groupPassword ? "🔒 Password protected (admin only)" : "🔓 No password set"}
              </div>
            )}
            {isAdmin && (
              <p style={{ fontSize: 12, color: "#666", marginTop: 8, marginBottom: 0 }}>
                💡 Password is optional. If set, users will need it to join via link.
              </p>
            )}
          </div>

          {/* Share Link */}
          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block", color: "#666" }}>
              🔗 Share Link:
            </label>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f0f9ff",
                borderRadius: 8,
                border: "2px solid #3b82f6",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  marginBottom: 10,
                }}
              >
                {shareUrl}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => copyToClipboard(shareUrl, "Share Link")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => {
                    const text = `Join my group "${groupName}" on Vyaya!\n\n🔗 Link: ${shareUrl}\n${
                      groupPassword ? `🔐 Password: ${groupPassword}` : ""
                    }`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: `Join ${groupName}`,
                        text: text,
                      });
                    } else {
                      copyToClipboard(text, "Invitation");
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  📤 Share
                </button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#666", marginTop: 8, marginBottom: 0 }}>
              💡 Anyone with this link can join the group
              {groupPassword && " (password required)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}