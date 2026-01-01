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
      padding: isMobile ? 15 : 20 
    }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: isMobile ? 24 : 32,
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          ➕ Create New Group
        </h1>
        <p style={{ 
          margin: "8px 0 0", 
          color: "#6b7280", 
          fontSize: 14 
        }}>
          Start tracking expenses with friends & family
        </p>
      </div>

      {/* Form */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: isMobile ? 20 : 30,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        
        {/* Group Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: "block", 
            fontWeight: 600, 
            marginBottom: 8,
            fontSize: 14,
            color: "#374151",
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
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 15,
              fontFamily: "inherit",
            }}
          />
          <p style={{ 
            margin: "6px 0 0", 
            fontSize: 12, 
            color: "#6b7280" 
          }}>
            Choose a descriptive name for your group
          </p>
        </div>

        {/* Password Protection Toggle */}
        <div style={{ marginBottom: 20 }}>
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
              }}
            />
            <span style={{ 
              fontWeight: 600, 
              fontSize: 14,
              color: "#374151",
            }}>
              🔐 Enable Password Protection (Optional)
            </span>
          </label>
          <p style={{ 
            margin: "6px 0 0 28px", 
            fontSize: 12, 
            color: "#6b7280" 
          }}>
            Require a password when others join via link
          </p>
        </div>

        {/* Password Input (Conditional) */}
        {usePassword && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: "block", 
              fontWeight: 600, 
              marginBottom: 8,
              fontSize: 14,
              color: "#374151",
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
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 15,
                fontFamily: "inherit",
              }}
            />
            <p style={{ 
              margin: "6px 0 0", 
              fontSize: 12, 
              color: "#6b7280" 
            }}>
              Members will need this password to join
            </p>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 8,
          padding: 15,
          marginBottom: 25,
        }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 14,
            marginBottom: 8,
            color: "#0c4a6e",
          }}>
            ℹ️ What happens next:
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: 20,
            fontSize: 13,
            color: "#0369a1",
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
                ? "#d1d5db" 
                : "linear-gradient(135deg, #16a34a, #059669)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading || !groupName.trim() ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              transition: "all 0.2s",
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
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: "#fefce8",
        border: "1px solid #fde047",
        borderRadius: 8,
      }}>
        <div style={{ fontSize: 13, color: "#854d0e" }}>
          💡 <strong>Pro Tip:</strong> After creating, you'll get a shareable link and code. 
          Anyone with the code can join instantly!
        </div>
      </div>
    </div>
  );
}