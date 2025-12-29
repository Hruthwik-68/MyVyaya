

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import WishlistModal from ".././components/WishlistModal";
import ReceiptScanner from ".././components/ReceiptScanner";  // ← ADD THIS LINE


// Budget Categories
const EXPENSE_CATEGORIES = [
  { value: "Food & Dining", icon: "🍔", color: "#ff6b6b" },
  { value: "Travel", icon: "✈️", color: "#4ecdc4" },
  { value: "Shopping", icon: "🛍️", color: "#95e1d3" },
  { value: "Entertainment", icon: "🎬", color: "#f7b731" },
  { value: "Utilities", icon: "💡", color: "#5f27cd" },
  { value: "Groceries", icon: "🛒", color: "#00d2d3" },
  { value: "Health", icon: "💊", color: "#ff6348" },
  { value: "General", icon: "📦", color: "#a29bfe" },
];

export default function Personal() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [trackerId, setTrackerId] = useState<string>("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);

  // Form states
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Budget states
  const [budgets, setBudgets] = useState<any[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState<{ [key: string]: string }>({});

  // Filter states
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Wishlist states
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  const [showReceiptScanner, setShowReceiptScanner] = useState(false);  // ← ADD THIS LINE


  // Load user and personal tracker
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUser(data.user);
      await loadPersonalTracker(data.user.id);
    }
  };

  const loadPersonalTracker = async (userId: string) => {
    const { data: existing } = await supabase
      .from("trackers")
      .select("id")
      .eq("created_by", userId)
      .eq("type", "personal")
      .maybeSingle();

    if (existing) {
      setTrackerId(existing.id);
      loadExpenses(existing.id);
      loadBudgets(existing.id);
      loadWishlist(existing.id);
    } else {
      const { data: newTracker } = await supabase
        .from("trackers")
        .insert({
          name: "My Personal Expenses",
          type: "personal",
          created_by: userId,
        })
        .select("id")
        .single();

      if (newTracker) {
        setTrackerId(newTracker.id);
        loadExpenses(newTracker.id);
        loadBudgets(newTracker.id);
        loadWishlist(newTracker.id);
      }
    }
  };

  const loadExpenses = async (tId: string) => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("tracker_id", tId)
      .order("date", { ascending: false });

    setExpenses(data || []);
    setFilteredExpenses(data || []);
  };

  const loadBudgets = async (tId: string) => {
    const { data } = await supabase
      .from("group_budgets")
      .select("*")
      .eq("tracker_id", tId);

    setBudgets(data || []);

    const form: { [key: string]: string } = {};
    (data || []).forEach((b: any) => {
      form[b.category] = String(b.monthly_limit);
    });
    setBudgetForm(form);
  };

  const loadWishlist = async (tId: string) => {
    const { data } = await supabase
      .from("wishlist")
      .select("*")
      .eq("tracker_id", tId)
      .eq("is_purchased", false)
      .order("created_at", { ascending: false });

    setWishlistItems(data || []);
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, filterMonth, filterYear, dateFrom, dateTo]);

  const applyFilters = () => {
    let filtered = [...expenses];

    // Filter by month/year
    if (filterMonth >= 0 && filterYear) {
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.date);
        return (
          expDate.getMonth() === filterMonth &&
          expDate.getFullYear() === filterYear
        );
      });
    }

    // Filter by date range
    if (dateFrom && dateTo) {
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.date);
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        return expDate >= from && expDate <= to;
      });
    }

    setFilteredExpenses(filtered);
  };

  const addExpense = async () => {
    if (!amount) return alert("Enter amount");

    setLoading(true);

    await supabase.from("expenses").insert({
      tracker_id: trackerId,
      amount: Number(amount),
      description: desc,
      paid_by: currentUser?.id,
      created_by: currentUser?.id,
      date: new Date().toISOString(),
      category: category,
    });

    setAmount("");
    setDesc("");
    setCategory("General");
    setLoading(false);
    loadExpenses(trackerId);
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;

    await supabase.from("expenses").delete().eq("id", id);
    loadExpenses(trackerId);
  };

  const deleteAllExpenses = async () => {
    if (!confirm("⚠️ Delete ALL expenses? This cannot be undone!")) return;

    await supabase.from("expenses").delete().eq("tracker_id", trackerId);
    loadExpenses(trackerId);
  };

  const startEdit = (exp: any) => {
    setEditingId(exp.id);
    setEditAmount(String(exp.amount));
    setEditDesc(exp.description || "");
    setEditCategory(exp.category || "General");
  };

  const saveEdit = async (id: string) => {
    await supabase
      .from("expenses")
      .update({
        amount: Number(editAmount),
        description: editDesc,
        category: editCategory,
      })
      .eq("id", id);

    setEditingId(null);
    loadExpenses(trackerId);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveBudget = async (cat: string) => {
    const limit = budgetForm[cat];
    if (!limit || Number(limit) < 0) return alert("Enter valid amount");

    await supabase.from("group_budgets").upsert({
      tracker_id: trackerId,
      category: cat,
      monthly_limit: Number(limit),
    });

    await loadBudgets(trackerId);
    alert(`✓ Budget saved for ${cat}`);
  };

  const getCategorySpending = (forMonth?: number, forYear?: number) => {
    const spending: { [key: string]: number } = {};
    const targetMonth = forMonth ?? filterMonth;
    const targetYear = forYear ?? filterYear;
    
    expenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      if (
        expDate.getMonth() === targetMonth &&
        expDate.getFullYear() === targetYear
      ) {
        const cat = exp.category || "General";
        spending[cat] = (spending[cat] || 0) + Number(exp.amount);
      }
    });
    return spending;
  };

  const categorySpending = getCategorySpending();

  const getBudgetStatus = (cat: string) => {
    const budget = budgets.find((b) => b.category === cat);
    if (!budget) return null;

    const spent = categorySpending[cat] || 0;
    const limit = Number(budget.monthly_limit);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    let status = "on-track";
    let color = "#16a34a";
    if (percentage >= 100) {
      status = "exceeded";
      color = "#dc2626";
    } else if (percentage >= 90) {
      status = "critical";
      color = "#f97316";
    } else if (percentage >= 70) {
      status = "warning";
      color = "#f7b731";
    }

    return { spent, limit, percentage, status, color };
  };

  const totalSpent = Object.values(categorySpending).reduce((sum, amt) => sum + amt, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0);

  // Analytics calculations
  const getTopExpenses = () => {
    return [...filteredExpenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  };

  const getMonthlyTrend = () => {
    const trend: { [key: string]: number } = {};
    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      trend[key] = (trend[key] || 0) + Number(exp.amount);
    });
    return Object.entries(trend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount"];
    const rows = filteredExpenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      exp.description || "No description",
      exp.category || "General",
      `₹${Number(exp.amount).toFixed(2)}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const avgDaily = filteredExpenses.length > 0
    ? totalSpent / new Date(filterYear, filterMonth + 1, 0).getDate()
    : 0;

  const isMobile = window.innerWidth < 640;

  // CONTINUE IN PART 2...
  // CONTINUED FROM PART 1...

  return (
    <div style={{ padding: isMobile ? 10 : 20, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        className="card animate-fadeInUp"
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 15,
        }}
      >
        <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28 }}>💰 Personal Expenses</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              padding: isMobile ? "10px 12px" : "10px 15px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: isMobile ? 13 : 14,
              flex: isMobile ? 1 : "none",
            }}
          >
            📈 {isMobile ? "" : showAnalytics ? "Hide" : "Show"} Analytics
          </button>
          <button
            onClick={() => setShowWishlistModal(true)}
            style={{
              background: "linear-gradient(135deg, #ec4899, #f472b6)",
              color: "white",
              border: "none",
              padding: isMobile ? "10px 12px" : "10px 15px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: isMobile ? 13 : 14,
              flex: isMobile ? 1 : "none",
            }}
          >
            🎁 Wishlist
          </button>
          <button
  onClick={() => setShowReceiptScanner(true)}
  style={{
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white",
    border: "none",
    padding: isMobile ? "10px 12px" : "10px 15px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: isMobile ? 13 : 14,
    flex: isMobile ? 1 : "none",
  }}
>
  📸 Scan
</button>
          <button
            onClick={() => setShowBudgetModal(true)}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white",
              border: "none",
              padding: isMobile ? "10px 12px" : "10px 15px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: isMobile ? 13 : 14,
              flex: isMobile ? 1 : "none",
            }}
          >
            📊 Budgets
          </button>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: isMobile ? "10px 12px" : "10px 15px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: isMobile ? 13 : 14,
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div
        className="card animate-fadeInUp"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: 20,
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Total Budget</div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: "bold", marginTop: 8 }}>
              ₹{totalBudget.toFixed(0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Total Spent</div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: "bold", marginTop: 8 }}>
              ₹{totalSpent.toFixed(0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Remaining</div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: "bold", marginTop: 8 }}>
              ₹{(totalBudget - totalSpent).toFixed(0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Avg/Day</div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: "bold", marginTop: 8 }}>
              ₹{avgDaily.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="card animate-fadeInUp" style={{ marginBottom: 20 }}>
          <h3>📊 Analytics Dashboard</h3>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20, marginTop: 20 }}>
            {/* Category Breakdown */}
            <div>
              <h4>Category Breakdown</h4>
              {Object.entries(categorySpending)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, amount]) => {
                  const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === cat);
                  const percentage = totalSpent > 0 ? ((amount as number) / totalSpent) * 100 : 0;
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>
                          {catInfo?.icon} {cat}
                        </span>
                        <span style={{ fontWeight: "bold" }}>
                          ₹{(amount as number).toFixed(0)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="progress-container">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${percentage}%`,
                            background: catInfo?.color || "#a29bfe",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Top 5 Expenses */}
            <div>
              <h4>Top 5 Expenses</h4>
              {getTopExpenses().map((exp, idx) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                return (
                  <div
                    key={exp.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 12,
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea, #764ba2)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {catInfo?.icon} {exp.description || "No description"}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {new Date(exp.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: "bold", color: "#dc2626" }}>
                      ₹{Number(exp.amount).toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trend */}
          <div style={{ marginTop: 30 }}>
            <h4>Monthly Trend (Last 6 Months)</h4>
            <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
              {getMonthlyTrend().map(([month, amount]) => {
                const maxAmount = Math.max(...getMonthlyTrend().map(([, amt]) => amt as number));
                const height = ((amount as number) / maxAmount) * 150;
                return (
                  <div key={month} style={{ textAlign: "center", minWidth: 80 }}>
                    <div style={{ fontSize: 12, marginBottom: 8 }}>{month}</div>
                    <div
                      style={{
                        height: 150,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: height,
                          background: "linear-gradient(180deg, #667eea, #764ba2)",
                          borderRadius: "8px 8px 0 0",
                          transition: "height 0.3s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: "bold", marginTop: 8 }}>
                      ₹{(amount as number).toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTINUE IN PART 3... */}
      {/* CONTINUED FROM PART 2... */}

      {/* Budget Overview - ON MAIN PAGE */}
      {budgets.length > 0 && (
        <div className="card animate-fadeInUp" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <h3 style={{ margin: 0 }}>
              📊 Budget Overview - {new Date(filterYear, filterMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button
              onClick={() => setShowBudgetModal(true)}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 5,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ⚙️ Manage
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 15,
            }}
          >
            {budgets.map((budget) => {
              const cat = budget.category;
              const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === cat);
              const status = getBudgetStatus(cat);
              if (!status) return null;

              return (
                <div
                  key={cat}
                  className="card"
                  style={{
                    border: `2px solid ${status.color}`,
                    padding: 15,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: "bold" }}>
                        {catInfo?.icon} {cat}
                      </div>
                      <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                        ₹{status.spent.toFixed(0)} / ₹{status.limit.toFixed(0)}
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: status.color }}>
                      {status.percentage.toFixed(0)}%
                    </div>
                  </div>
                  <div className="progress-container" style={{ marginTop: 10 }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(status.percentage, 100)}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {status.status === "exceeded" && (
                      <span style={{ color: "#dc2626" }}>
                        🔴 Exceeded by ₹{(status.spent - status.limit).toFixed(0)}
                      </span>
                    )}
                    {status.status === "critical" && (
                      <span style={{ color: "#f97316" }}>🟠 {(100 - status.percentage).toFixed(0)}% left</span>
                    )}
                    {status.status === "warning" && (
                      <span style={{ color: "#f7b731" }}>🟡 ₹{(status.limit - status.spent).toFixed(0)} left</span>
                    )}
                    {status.status === "on-track" && <span style={{ color: "#16a34a" }}>🟢 On track</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      <div className="card animate-fadeInUp" style={{ marginBottom: 20 }}>
        <h3>💸 Add Expense</h3>
        
        {/* Wishlist Selector */}
        {wishlistItems.length > 0 && (
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block" }}>
              📦 Or select from wishlist:
            </label>
            <select
              onChange={(e) => {
                const item = wishlistItems.find((i) => i.id === e.target.value);
                if (item) {
                  setDesc(item.item_name);
                  setCategory(item.category);
                  if (item.estimated_amount) {
                    setAmount(String(item.estimated_amount));
                  }
                }
              }}
              style={{
                padding: "10px",
                borderRadius: 5,
                border: "1px solid #ddd",
                fontSize: 14,
                width: "100%",
              }}
            >
              <option value="">-- Select wishlist item --</option>
              {wishlistItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} {item.estimated_amount ? `(₹${item.estimated_amount})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: 15,
            marginTop: 15,
          }}
        >
          <input
            type="number"
            placeholder="Amount ₹"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.value}
              </option>
            ))}
          </select>
          <button
            className="btn-success"
            disabled={loading}
            onClick={addExpense}
            style={{ padding: "10px 20px" }}
          >
            {loading ? "Saving..." : "💾 Save"}
          </button>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="card animate-fadeInUp" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 15 }}>
          <h3 style={{ margin: 0, marginBottom: 10 }}>📋 Recent Expenses ({filteredExpenses.length})</h3>
          
          {/* Filters Row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              style={{
                padding: "8px 10px",
                borderRadius: 5,
                fontSize: 13,
                border: "1px solid #ddd",
                flex: isMobile ? "1 1 120px" : "none",
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {isMobile
                    ? new Date(2025, i).toLocaleDateString("en-US", { month: "short" })
                    : new Date(2025, i).toLocaleDateString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              style={{
                padding: "8px 10px",
                borderRadius: 5,
                fontSize: 13,
                border: "1px solid #ddd",
                flex: isMobile ? "1 1 80px" : "none",
              }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={exportToCSV}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: 5,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                flex: isMobile ? 1 : "none",
              }}
            >
              📥 {isMobile ? "CSV" : "Export CSV"}
            </button>
            {filteredExpenses.length > 0 && (
              <button
                onClick={deleteAllExpenses}
                style={{
                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  flex: isMobile ? 1 : "none",
                }}
              >
                🗑️ {isMobile ? "Del All" : "Delete All"}
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 15 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Date Range:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 5,
              fontSize: 13,
              border: "1px solid #ddd",
              flex: isMobile ? "1 1 120px" : "none",
            }}
          />
          <span style={{ fontSize: 13 }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 5,
              fontSize: 13,
              border: "1px solid #ddd",
              flex: isMobile ? "1 1 120px" : "none",
            }}
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 5,
                fontSize: 13,
                cursor: "pointer",
                border: "1px solid #ddd",
                background: "white",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* CONTINUE IN PART 4... */}
        {/* CONTINUED FROM PART 3... */}

        {/* Expenses List */}
        <div style={{ marginTop: 20 }}>
          {filteredExpenses.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p>No expenses found for this filter.</p>
            </div>
          ) : (
            filteredExpenses.map((exp) => {
              const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
              const isEditing = editingId === exp.id;

              return (
                <div
                  key={exp.id}
                  className="card"
                  style={{
                    marginBottom: 12,
                    padding: 15,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  {isEditing ? (
                    <>
                      <div style={{ flex: 1, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          style={{ width: 100 }}
                        />
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          style={{ flex: 1, minWidth: 150 }}
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          style={{ width: 150 }}
                        >
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => saveEdit(exp.id)}
                          style={{
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            background: "#6b7280",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          ✗
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: 16 }}>
                          {catInfo?.icon} {exp.description || "No description"}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          {exp.category} • {new Date(exp.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626" }}>
                          ₹{Number(exp.amount).toFixed(2)}
                        </div>
                        <button
                          onClick={() => startEdit(exp)}
                          style={{
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 900, width: "95%" }}
          >
            <h2 style={{ marginTop: 0 }}>📊 Budget Management</h2>

            {/* Month/Year Selector for Budget Overview */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontWeight: 600 }}>View Budget for:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                style={{ padding: "8px 12px", borderRadius: 5, fontSize: 14, border: "1px solid #ddd" }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2025, i).toLocaleDateString("en-US", { month: "long" })}
                  </option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                style={{ padding: "8px 12px", borderRadius: 5, fontSize: 14, border: "1px solid #ddd" }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Budget Overview for Selected Month */}
            {budgets.length > 0 && (
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: 10,
                  padding: 15,
                  marginBottom: 20,
                }}
              >
                <h3 style={{ marginTop: 0, fontSize: 16 }}>
                  📊 Budget Overview - {new Date(filterYear, filterMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                  }}
                >
                  {budgets.map((budget) => {
                    const cat = budget.category;
                    const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === cat);
                    const status = getBudgetStatus(cat);
                    if (!status) return null;

                    return (
                      <div
                        key={cat}
                        style={{
                          backgroundColor: "white",
                          border: `2px solid ${status.color}`,
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: "bold" }}>
                            {catInfo?.icon} {cat}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: "bold", color: status.color }}>
                            {status.percentage.toFixed(0)}%
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                          ₹{status.spent.toFixed(0)} / ₹{status.limit.toFixed(0)}
                        </div>
                        <div className="progress-container" style={{ height: 6 }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${Math.min(status.percentage, 100)}%`,
                              backgroundColor: status.color,
                              height: "100%",
                            }}
                          />
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11 }}>
                          {status.status === "exceeded" && (
                            <span style={{ color: "#dc2626" }}>🔴 Exceeded</span>
                          )}
                          {status.status === "critical" && (
                            <span style={{ color: "#f97316" }}>🟠 Critical</span>
                          )}
                          {status.status === "warning" && (
                            <span style={{ color: "#f7b731" }}>🟡 Warning</span>
                          )}
                          {status.status === "on-track" && (
                            <span style={{ color: "#16a34a" }}>🟢 On track</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Set Budget Limits */}
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Set Monthly Budget Limits</h3>
            <p style={{ color: "#666", fontSize: 13, marginBottom: 15 }}>
              These limits apply to every month. Spending resets monthly.
            </p>

            <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <div
                  key={cat.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 8,
                    gap: 10,
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: isMobile ? "100%" : 150 }}>
                    <div style={{ fontWeight: "bold", fontSize: 14 }}>
                      {cat.icon} {cat.value}
                    </div>
                    {categorySpending[cat.value] && (
                      <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                        Current month: ₹{categorySpending[cat.value].toFixed(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
                    <input
                      type="number"
                      placeholder="₹0"
                      value={budgetForm[cat.value] || ""}
                      onChange={(e) => setBudgetForm({ ...budgetForm, [cat.value]: e.target.value })}
                      style={{
                        width: isMobile ? "calc(100% - 80px)" : 100,
                        padding: 8,
                        border: "1px solid #ddd",
                        borderRadius: 5,
                        fontSize: 14,
                      }}
                    />
                    <button
                      onClick={() => saveBudget(cat.value)}
                      style={{
                        backgroundColor: "#16a34a",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: 5,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBudgetModal(false)}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: 5,
                cursor: "pointer",
                marginTop: 15,
                width: "100%",
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Wishlist Modal */}
      {showWishlistModal && (
  <WishlistModal
    trackerId={trackerId}
    currentUserId={currentUser?.id}
    showName={(uid: string) => (uid === currentUser?.id ? "You" : "User")}
    onClose={() => {
      setShowWishlistModal(false);
      loadWishlist(trackerId);
    }}
    onSelectItem={(item: any) => {
      setDesc(item.item_name);
      setCategory(item.category);
      if (item.estimated_amount) {
        setAmount(String(item.estimated_amount));
      }
    }}
  />
)}
{showReceiptScanner && (
        <ReceiptScanner
          onScanComplete={(data) => {
            setDesc(data.description);
            setAmount(data.amount);
            setCategory(data.category);
            setShowReceiptScanner(false);
          }}
          onClose={() => setShowReceiptScanner(false)}
        />
      )}
    </div>
  );
}