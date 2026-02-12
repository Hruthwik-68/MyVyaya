import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

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

  const getUserName = () => {
    if (!user?.email) return "";
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const actions = [
    { icon: "💼", title: "Personal", path: "/personal", color: "icon-blue" },
    { icon: "➕", title: "Create Group", path: "/create-group", color: "icon-green" },
    { icon: "🔗", title: "Join Group", path: "/join-group", color: "icon-cyan" },
    { icon: "👥", title: "Friends", path: "/friends", color: "icon-pink" },
    { icon: "💰", title: "Took / Gave", path: "/loans", color: "icon-amber" },
    { icon: "👤", title: "Profile", path: "/profile", color: "icon-purple" },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="home-hero home-animate home-animate-d1">
        <p className="home-greeting">Welcome back</p>
        <h1 className="home-title">
          Manage Your <strong>Finances</strong>
        </h1>
        <p className="home-subtitle">
          Track expenses, split bills, and stay on top of your money — all in one place.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="home-animate home-animate-d2">
        <p className="home-section-label">Quick Actions</p>
      </div>
      <div className="home-actions-grid">
        {actions.map((action, i) => (
          <div
            key={action.path}
            className={`home-action-card home-animate home-animate-d${i + 2}`}
            onClick={() => navigate(action.path)}
          >
            <div className={`home-action-icon ${action.color}`}>
              {action.icon}
            </div>
            <div className="home-action-title">{action.title}</div>
          </div>
        ))}
      </div>

      {/* Groups Section */}
      <div className="home-animate home-animate-d6">
        <div className="home-groups-header">
          <h3 className="home-groups-title">Your Groups</h3>
          {groups.length > 0 && (
            <span className="home-groups-count">
              {groups.length} {groups.length === 1 ? "Group" : "Groups"}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="home-loading home-animate home-animate-d7">
          <div className="spinner" style={{ margin: "0 auto" }} />
          <p className="home-loading-text">Loading groups...</p>
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="home-empty-state home-animate home-animate-d7">
          <div className="home-empty-icon">📭</div>
          <p className="home-empty-text">
            You're not part of any groups yet.
          </p>
          <button
            className="home-empty-btn"
            onClick={() => navigate("/create-group")}
          >
            Create Your First Group
          </button>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="home-groups-list">
          {groups.map((g, i) => (
            <div
              key={g.id}
              className={`home-group-card home-animate home-animate-d${Math.min(i + 7, 7)}`}
              onClick={() => navigate(`/group/${g.id}`)}
            >
              <div>
                <div className="home-group-name">{g.name}</div>
                <div className="home-group-code">
                  Code: <span>{g.group_code}</span>
                </div>
              </div>
              <div className="home-group-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
