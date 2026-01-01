// ============================================
// GROUP INFO PANEL - FIXED
// ✅ FIX #2: Shows numeric 6-digit code (not UUID)
// ✅ FIX #2: Copy functionality works properly
// ============================================

import { useState } from "react";
import { supabase } from "../supabase";

interface GroupInfoPanelProps {
  groupId: string;
  groupName: string;
  groupCode: string;  // ✅ ADD THIS - the 6-digit numeric code
  groupPassword?: string;
  isAdmin: boolean;
}

export default function GroupInfoPanel({
  groupId,
  groupName,
  groupCode,  // ✅ Receive the numeric code
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
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#e0f2fe";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f0f9ff";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0c4a6e" }}>
            Group Info & Share
          </h3>
        </div>
        <div 
          style={{ 
            fontSize: 18,
            color: "#0284c7",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: 20 }}>
          {/* Group Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              marginBottom: 5, 
              display: "block", 
              color: "#374151" 
            }}>
              📝 Group Name:
            </label>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {groupName}
            </div>
          </div>

          {/* ✅ FIX #2: 6-Digit Numeric Join Code */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              marginBottom: 5, 
              display: "block", 
              color: "#374151" 
            }}>
              🔑 Join Code (Share this 6-digit code):
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
                  padding: "16px",
                  backgroundColor: "#f0f9ff",
                  border: "2px solid #3b82f6",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: 4,
                  textAlign: "center",
                  color: "#1e40af",
                }}
              >
                {/* ✅ Display the numeric code */}
                {groupCode || "------"}
              </div>
              <button
                onClick={() => copyToClipboard(groupCode, "Join Code")}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = "#3b82f6";
                }}
              >
                📋 Copy
              </button>
            </div>
            <p style={{ 
              fontSize: 12, 
              color: "#6b7280", 
              marginTop: 8,
              marginBottom: 0,
            }}>
              💡 Others can join by entering this code in the "Join Group" page
            </p>
          </div>

          {/* Group Password (Admin Only) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              marginBottom: 5, 
              display: "block", 
              color: "#374151" 
            }}>
              🔐 Group Password {isAdmin ? "(Optional - for link sharing)" : ""}:
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
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #d1d5db",
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
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                {groupPassword ? "🔒 Password protected (admin only)" : "🔓 No password set"}
              </div>
            )}
            {isAdmin && (
              <p style={{ 
                fontSize: 12, 
                color: "#6b7280", 
                marginTop: 8, 
                marginBottom: 0 
              }}>
                💡 Password is optional. If set, required when joining via link (not code).
              </p>
            )}
          </div>

          {/* Share Link */}
          <div style={{ marginBottom: 0 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              marginBottom: 5, 
              display: "block", 
              color: "#374151" 
            }}>
              🔗 Direct Join Link:
            </label>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fef3c7",
                borderRadius: 8,
                border: "2px solid #fbbf24",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  marginBottom: 10,
                  color: "#78350f",
                }}
              >
                {shareUrl}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => copyToClipboard(shareUrl, "Share Link")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f59e0b",
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
                    const text = `Join my group "${groupName}" on Vyaya!\n\n🔗 Link: ${shareUrl}\n🔑 Code: ${groupCode}${
                      groupPassword ? `\n🔐 Password: ${groupPassword}` : ""
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
                  📤 Share All
                </button>
              </div>
            </div>
            <p style={{ 
              fontSize: 12, 
              color: "#6b7280", 
              marginTop: 8, 
              marginBottom: 0 
            }}>
              💡 Share either the link OR the 6-digit code. Link works instantly!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}