import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Plus,
  Link as LinkIcon,
  Users,
  ArrowLeftRight,
  User,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const actions = [
    {
      icon: <Wallet size={24} />,
      title: "Personal",
      desc: "Track daily expenses",
      path: "/personal",
      color: "icon-blue"
    },
    {
      icon: <Plus size={24} />,
      title: "Create Group",
      desc: "Start a new ledger",
      path: "/create-group",
      color: "icon-teal"
    },
    {
      icon: <LinkIcon size={24} />,
      title: "Join Group",
      desc: "Enter via code",
      path: "/join-group",
      color: "icon-emerald"
    },
    {
      icon: <Users size={24} />,
      title: "Friends",
      desc: "Settle debts",
      path: "/friends",
      color: "icon-purple"
    },
    {
      icon: <ArrowLeftRight size={24} />,
      title: "Took / Gave",
      desc: "Manage loans",
      path: "/loans",
      color: "icon-amber"
    },
    {
      icon: <User size={24} />,
      title: "Profile",
      desc: "Account settings",
      path: "/profile",
      color: "icon-rose"
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <div className="dashboard-hero home-animate home-animate-d1">
        <p className="hero-greeting">
          {getGreeting()}
          {user?.email && `, ${user.email.split('@')[0]}`}
        </p>
        <h1 className="hero-title">
          Financial <span>Overview</span>
        </h1>
        <p className="hero-subtitle">
          Manage your personal spending, tracking, and shared expenses all in one secure place.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="home-animate home-animate-d2">
        <div className="section-header">
          <h2 className="section-title">
            <LayoutDashboard size={20} className="text-accent" />
            Quick Actions
          </h2>
        </div>

        <div className="actions-grid">
          {actions.map((action, i) => (
            <div
              key={action.path}
              className={`action-card home-animate home-animate-d${i + 2}`}
              onClick={() => navigate(action.path)}
            >
              <div className={`action-icon-wrapper ${action.color}`}>
                {action.icon}
              </div>
              <div>
                <div className="action-label">{action.title}</div>
                <div className="action-desc">{action.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Groups Section */}
      <div className="home-animate home-animate-d6">
        <div className="section-header">
          <h3 className="section-title">
            <Users size={20} className="text-accent" />
            Your Groups
            {groups.length > 0 && (
              <span style={{
                fontSize: 12,
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 8px',
                borderRadius: 12,
                marginLeft: 10
              }}>
                {groups.length}
              </span>
            )}
          </h3>
          <div className="section-action" onClick={() => navigate("/create-group")}>
            <Plus size={14} /> New Group
          </div>
        </div>

        {loading && (
          <div className="home-loading home-animate home-animate-d7">
            <div className="spinner" style={{ margin: "0 auto" }} />
            <p className="home-loading-text">Syncing groups...</p>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="dashboard-empty home-animate home-animate-d7">
            <div className="empty-icon-circle">
              <Users size={32} />
            </div>
            <p className="empty-text">
              You haven't joined any groups yet.
            </p>
            <button
              className="btn-primary-glow"
              onClick={() => navigate("/create-group")}
            >
              <Plus size={18} /> Create Your First Group
            </button>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="groups-grid">
            {groups.map((g, i) => (
              <div
                key={g.id}
                className={`group-card home-animate home-animate-d${Math.min(i + 7, 7)}`}
                onClick={() => navigate(`/group/${g.id}`)}
              >
                <div className="group-icon">
                  <Users size={24} />
                </div>
                <div className="group-info">
                  <div className="group-name">{g.name}</div>
                  <div className="group-meta">
                    <span>Code: <span style={{ fontFamily: 'monospace' }}>{g.group_code}</span></span>
                  </div>
                </div>
                <ChevronRight className="group-arrow" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
