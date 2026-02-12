// ============================================
// CREATE GROUP - COMPLETE WITH ALL FIXES
// ✅ FIX #1: Creator becomes admin
// ✅ FIX #2: Numeric 6-digit group code
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function CreateGroup() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUser(data.user);
    }
  };

  // ✅ FIX #2: Generate 6-digit numeric code
  const generateGroupCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (usePassword && !groupPassword.trim()) {
      alert("Please enter a password or disable password protection");
      return;
    }

    if (!currentUser?.id) {
      alert("You must be logged in to create a group");
      return;
    }

    setLoading(true);

    try {
      // ✅ FIX #1 & #2: Create group with admin and numeric code
      const { data: newGroup, error: groupError } = await supabase
        .from("trackers")
        .insert({
          name: groupName.trim(),
          type: "group",
          group_code: generateGroupCode(), // ✅ 6-digit numeric code
          group_password: usePassword ? groupPassword.trim() : null,
          admin_user_id: currentUser.id, // ✅ CRITICAL: Set creator as admin
          use_smart_split: true, // Default to smart split
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          tracker_id: newGroup.id,
          user_id: currentUser.id,
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      // Success!
      alert(
        `✅ Group "${groupName}" created successfully!\n\n` +
        `📝 Group Code: ${newGroup.group_code}\n` +
        `${usePassword ? `🔐 Password: ${groupPassword}\n` : ""}` +
        `\nShare the code with others to invite them!`
      );

      // Navigate to the new group
      navigate(`/group/${newGroup.id}`);

    } catch (error: any) {
      console.error("Error creating group:", error);
      alert(`❌ Failed to create group: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth < 640;

  return (
    <div style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: isMobile ? 15 : 20,
      animation: 'fadeSlideUp 0.6s ease-out'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? 24 : 32,
          background: "linear-gradient(135deg, #1a8a9e, #4db8d9)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          ➕ Create New Group
        </h1>
        <p style={{
          margin: "8px 0 0",
          color: "#8ba4bc",
          fontSize: 14
        }}>
          Start tracking expenses with friends & family
        </p>
      </div>

      {/* Form */}
      <div style={{
        background: "rgba(10, 31, 51, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(33, 150, 196, 0.1)",
        borderRadius: 16,
        padding: isMobile ? 20 : 30,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}>

        {/* Group Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block",
            fontWeight: 600,
            marginBottom: 8,
            fontSize: 14,
            color: "#8ba4bc",
          }}>
            📝 Group Name *
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Weekend Trip, Roommates, Office Lunch"
            maxLength={50}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(33, 150, 196, 0.15)",
              fontSize: 15,
              fontFamily: "inherit",
              background: "rgba(12, 36, 58, 0.6)",
              color: "#e8eff5",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
            onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
          />
          <p style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: "#5a7a94"
          }}>
            Choose a descriptive name for your group
          </p>
        </div>

        {/* Password Protection Toggle */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}>
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                cursor: "pointer",
                accentColor: "#1a8a9e",
              }}
            />
            <span style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#8ba4bc",
            }}>
              🔐 Enable Password Protection (Optional)
            </span>
          </label>
          <p style={{
            margin: "6px 0 0 28px",
            fontSize: 12,
            color: "#5a7a94"
          }}>
            Require a password when others join via link
          </p>
        </div>

        {/* Password Input (Conditional) */}
        {usePassword && (
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              fontWeight: 600,
              marginBottom: 8,
              fontSize: 14,
              color: "#8ba4bc",
            }}>
              🔑 Group Password
            </label>
            <input
              type="text"
              value={groupPassword}
              onChange={(e) => setGroupPassword(e.target.value)}
              placeholder="Enter a password"
              maxLength={20}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(33, 150, 196, 0.15)",
                fontSize: 15,
                fontFamily: "inherit",
                background: "rgba(12, 36, 58, 0.6)",
                color: "#e8eff5",
                outline: "none",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              }}
              onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
            />
            <p style={{
              margin: "6px 0 0",
              fontSize: 12,
              color: "#5a7a94"
            }}>
              Members will need this password to join
            </p>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          background: "rgba(26, 138, 158, 0.08)",
          border: "1px solid rgba(77, 184, 217, 0.15)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 25,
        }}>
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 8,
            color: "#4db8d9",
          }}>
            ℹ️ What happens next:
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 13,
            color: "#8ba4bc",
          }}>
            <li>You'll be the group admin with full control</li>
            <li>Get a unique 6-digit code to share with others</li>
            <li>Add expenses and split bills easily</li>
            <li>Track who owes whom automatically</li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: 12,
          flexDirection: isMobile ? "column" : "row",
        }}>
          <button
            onClick={createGroup}
            disabled={loading || !groupName.trim()}
            style={{
              flex: 1,
              padding: "14px 24px",
              background: loading || !groupName.trim()
                ? "rgba(90, 122, 148, 0.2)"
                : "linear-gradient(135deg, #1a8a9e, #2196c4)",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: loading || !groupName.trim() ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: loading || !groupName.trim() ? "none" : "0 8px 24px rgba(26, 138, 158, 0.3)",
            }}
          >
            {loading ? "⏳ Creating..." : "✨ Create Group"}
          </button>

          <button
            onClick={() => navigate("/home")}
            disabled={loading}
            style={{
              flex: isMobile ? 1 : 0,
              padding: "14px 24px",
              background: "rgba(12, 36, 58, 0.6)",
              color: "#8ba4bc",
              border: "1px solid rgba(33, 150, 196, 0.15)",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              transition: "all 0.3s ease",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div style={{
        marginTop: 20,
        padding: 16,
        background: "rgba(226, 185, 59, 0.06)",
        border: "1px solid rgba(226, 185, 59, 0.15)",
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 13, color: "#e2b93b" }}>
          💡 <strong>Pro Tip:</strong> After creating, you'll get a shareable link and code.
          Anyone with the code can join instantly!
        </div>
      </div>
    </div>
  );
}