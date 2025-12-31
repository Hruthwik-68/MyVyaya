import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import MyVyayaLogo from "../assets/MyVyaya.png"; // ← ADD THIS LINE
export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: u } = await supabase.auth.getUser();
    const current = u?.user;
    setUser(current);

    if (!current) {
      setLoading(false);
      return;
    }

    const { data: gm, error } = await supabase
      .from("group_members")
      .select("tracker_id")
      .eq("user_id", current.id);

    if (error) {
      console.error("group_members error:", error);
      setLoading(false);
      return;
    }

    const ids = (gm || []).map((g) => g.tracker_id);

    if (ids.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data: trackers } = await supabase
      .from("trackers")
      .select("*")
      .in("id", ids)
      .eq("type", "group")
      .order("created_at", { ascending: false });

    setGroups(trackers || []);
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      {/* Header */}
     <div className="card" style={{ marginBottom: 20 }}>
       
        <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="card animate-fadeInUp" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>⚡ Quick Actions</h3>

        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 15,
          }}
        >
          <button
            className="btn-primary"
            onClick={() => navigate("/personal")}
            style={{
              padding: "14px 20px",
              fontSize: 16,
              background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
            }}
          >
            💼 Personal Tracker
          </button>

          <button
            className="btn-success"
            onClick={() => navigate("/create-group")}
            style={{
              padding: "14px 20px",
              fontSize: 16,
              background: "linear-gradient(135deg, #16a34a, #059669)",
            }}
          >
            ➕ Create Group
          </button>

          <button
            className="btn-primary"
            onClick={() => navigate("/join-group")}
            style={{
              padding: "14px 20px",
              fontSize: 16,
              background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
            }}
          >
            🔗 Join Group
          </button>

          <button
            className="btn-primary"
            onClick={() => navigate("/friends")}
            style={{
              padding: "14px 20px",
              fontSize: 16,
              background: "linear-gradient(135deg, #ec4899, #f472b6)",
            }}
          >
            👥 Friends
          </button>

          {/* ← NEW: TOOK/GAVE BUTTON */}
          <button
            className="btn-primary"
            onClick={() => navigate("/loans")}
            style={{
              padding: "14px 20px",
              fontSize: 16,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
            }}
          >
            💰 TOOK / GAVE
          </button>

          <button
            className="btn-outline"
            onClick={() => navigate("/profile")}
            style={{
              padding: "14px 20px",
              fontSize: 16,
            }}
          >
            👤 Profile
          </button>
        </div>
      </div>

      {/* Your Groups */}
      <div className="card animate-fadeInUp" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>📊 Your Groups</h3>
          {groups.length > 0 && (
            <span className="badge badge-info" style={{ fontSize: 14 }}>
              {groups.length} {groups.length === 1 ? "Group" : "Groups"}
            </span>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="spinner" style={{ margin: "0 auto" }}></div>
            <p style={{ marginTop: 16, color: "#6b7280" }}>Loading groups...</p>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
              You're not part of any groups yet.
            </p>
            <button
              className="btn-success"
              onClick={() => navigate("/create-group")}
            >
              Create Your First Group
            </button>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => navigate(`/group/${g.id}`)}
                style={{
                  padding: 16,
                  backgroundColor: "#f9fafb",
                  border: "2px solid #e5e7eb",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#7c3aed";
                  e.currentTarget.style.transform = "translateX(8px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    Code: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{g.group_code}</span>
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>→</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="card" style={{ textAlign: "center" }}>
        <button
          onClick={logout}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            padding: "12px 32px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "#dc2626";
            (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "#ef4444";
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}


