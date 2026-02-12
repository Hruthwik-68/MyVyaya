// ============================================
// GROUP INFO PANEL - DARK THEME + LUCIDE ICONS
// ============================================

import { useState } from "react";
import { supabase } from "../supabase";
import {
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Key,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  Link as LinkIcon,
  Share2
} from "lucide-react";

interface GroupInfoPanelProps {
  groupId: string;
  groupName: string;
  groupCode: string;
  groupPassword?: string;
  isAdmin: boolean;
}

export default function GroupInfoPanel({
  groupId,
  groupName,
  groupCode,
  groupPassword,
  isAdmin,
}: GroupInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState(groupPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  const shareUrl = `${window.location.origin}/join/${groupId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ ${label} copied to clipboard!`);
    }).catch(() => {
      alert(`❌ Failed to copy ${label}`);
    });
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
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: 16,
        marginBottom: 24,
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          cursor: "pointer",
          background: isOpen ? "rgba(33, 150, 196, 0.1)" : "transparent",
          borderBottom: isOpen ? "1px solid rgba(148, 163, 184, 0.1)" : "none",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "rgba(33, 150, 196, 0.15)",
            padding: 8,
            borderRadius: 8,
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Info size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>
            Group Info & Share
          </h3>
        </div>
        <div style={{ color: "#94a3b8" }}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Group Name */}
          <div>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <FileText size={14} /> Group Name
            </label>
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                color: "#f8fafc",
              }}
            >
              {groupName}
            </div>
          </div>

          {/* Join Code */}
          <div>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <Key size={14} /> Join Code
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: 10,
                  fontFamily: "monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 4,
                  textAlign: "center",
                  color: "#38bdf8",
                  textShadow: "0 0 20px rgba(56, 189, 248, 0.2)"
                }}
              >
                {groupCode || "------"}
              </div>
              <button
                onClick={() => copyToClipboard(groupCode, "Code")}
                style={{
                  padding: "0 20px",
                  background: "rgba(33, 150, 196, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(33, 150, 196, 0.3)",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s"
                }}
              >
                <Copy size={18} /> Copy
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, marginBottom: 0 }}>
              Share this 6-digit code with friends to join the group.
            </p>
          </div>

          {/* Group Password */}
          <div>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <Lock size={14} /> Group Password {isAdmin && <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', marginLeft: 'auto' }}>(Optional)</span>}
            </label>

            {isAdmin ? (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password (optional)"
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 16px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      borderRadius: 10,
                      fontSize: 14,
                      color: "white",
                      boxSizing: "border-box"
                    }}
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "flex"
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                <button
                  onClick={updatePassword}
                  disabled={updating}
                  style={{
                    padding: "0 20px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 10,
                    cursor: updating ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap"
                  }}
                >
                  <Save size={18} /> {updating ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {groupPassword ? <Lock size={16} /> : <Unlock size={16} />}
                {groupPassword ? "Password protected (admin only)" : "No password set"}
              </div>
            )}
          </div>

          {/* Share Link */}
          <div>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <LinkIcon size={14} /> Direct Join Link
            </label>

            <div
              style={{
                padding: "16px",
                background: "rgba(251, 191, 36, 0.05)",
                borderRadius: 12,
                border: "1px solid rgba(251, 191, 36, 0.2)",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  marginBottom: 12,
                  color: "#fbbf24",
                  opacity: 0.9
                }}
              >
                {shareUrl}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => copyToClipboard(shareUrl, "Link")}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(251, 191, 36, 0.15)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Copy size={16} /> Copy Link
                </button>
                <button
                  onClick={() => {
                    const text = `Join my group "${groupName}" on Vyaya!\n\n🔗 Link: ${shareUrl}\n🔑 Code: ${groupCode}${groupPassword ? `\n🔐 Password: ${groupPassword}` : ""
                      }`;

                    if (navigator.share) {
                      navigator.share({
                        title: `Join ${groupName}`,
                        text: text,
                      }).catch(() => {
                        copyToClipboard(text, "Invitation");
                      });
                    } else {
                      copyToClipboard(text, "Invitation");
                    }
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Share2 size={16} /> Share All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}