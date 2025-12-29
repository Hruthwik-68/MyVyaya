

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

import AddExpenseForm from "../components/GroupComponents/AddExpenseForm";
import MemberTags from "../components/GroupComponents/MemberTags";
import MultiPersonSlider from "../components/GroupComponents/MultiPersonSlider";
import ExpensesTable from "../components/GroupComponents/ExpensesTable";
import BalanceSummary from "../components/GroupComponents/BalanceSummary";
import SettlementsTable from "../components/GroupComponents/SettlementsTable";
import PendingPayments from "../components/GroupComponents/PendingPayments";
import PaymentHistory from "../components/GroupComponents/PaymentHistory";
import SettlementsGraph from "../components/GroupComponents/SettlementsGraph";
import WishlistModal from "../components/WishlistModal";
import ReceiptScanner from "../components/ReceiptScanner";
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

export default function Group() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("General");

  const [participants, setParticipants] = useState<string[]>([]);
  const [splits, setSplits] = useState<{ user_id: string; percent: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const [showMineOnly, setShowMineOnly] = useState(true);
  const [pendingNow, setPendingNow] = useState(false);

  // Budget states
  const [budgets, setBudgets] = useState<any[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState<{ [key: string]: string }>({});

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filter states
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);

  // Wishlist states
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  // ------------ NAME HELPER ------------
  const showName = (uid: string) => {
    if (!uid) return "";
    if (uid === currentUser?.id) return "You";
    return profiles[uid] || uid.slice(0, 6);
  };

  // ------------ LOAD USER ------------
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUser(data.user);
      setPaidBy(data.user.id);
    }
  };

  // ------------ LOAD MEMBERS + NAMES ------------
  const loadMembers = async () => {
    const { data: gm } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("tracker_id", id);

    setMembers(gm || []);
    const ids = (gm || []).map((m) => m.user_id);
    setParticipants(ids);

    if (!ids.length) return;

    const { data: profs } = await supabase
      .from("profiles")
      .select("id,name")
      .in("id", ids);

    const map: Record<string, string> = {};
    (profs || []).forEach((p: any) => (map[p.id] = p.name));
    setProfiles(map);

    const equal = ids.length ? 100 / ids.length : 0;
    setSplits(
      ids.map((u) => ({
        user_id: u,
        percent: Number(equal.toFixed(2)),
      }))
    );
  };

  // ------------ LOAD EXPENSES ------------
  const loadExpenses = async () => {
    const { data } = await supabase
      .from("expenses")
      .select(`
        id,
        description,
        amount,
        date,
        paid_by,
        category,
        expense_splits!expense_splits_expense_id_fkey(
          user_id,
          percent
        )
      `)
      .eq("tracker_id", id)
      .order("date", { ascending: false });

    setExpenses(data || []);
    setFilteredExpenses(data || []);
  };

  // ------------ LOAD PAYMENTS ------------
  const loadPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("tracker_id", id)
      .order("created_at", { ascending: false });

    setPayments(data || []);
  };

  // ------------ LOAD BUDGETS ------------
  const loadBudgets = async () => {
    const { data } = await supabase
      .from("group_budgets")
      .select("*")
      .eq("tracker_id", id);

    setBudgets(data || []);

    const form: { [key: string]: string } = {};
    (data || []).forEach((b: any) => {
      form[b.category] = String(b.monthly_limit);
    });
    setBudgetForm(form);
  };

  // ------------ LOAD WISHLIST ------------
  const loadWishlist = async () => {
    const { data } = await supabase
      .from("wishlist")
      .select("*")
      .eq("tracker_id", id)
      .eq("is_purchased", false)
      .order("created_at", { ascending: false });

    setWishlistItems(data || []);
  };

  useEffect(() => {
    loadUser();
    loadMembers();
    loadExpenses();
    loadPayments();
    loadBudgets();
    loadWishlist();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [expenses, filterMonth, filterYear, dateFrom, dateTo]);

  // ------------ APPLY FILTERS ------------
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

  // CONTINUE IN PART 2...
  // CONTINUED FROM PART 1...

  // ------------ ADD EXPENSE ------------
  const addExpense = async () => {
    if (!amount || !paidBy) return alert("Enter amount & select payer");
    if (!participants.length) return alert("Select at least one participant");

    const total = splits.reduce((s, x) => s + x.percent, 0);
    if (Math.round(total) !== 100) return alert("Percent must total 100");

    setLoading(true);

    const { data: u } = await supabase.auth.getUser();

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        tracker_id: id,
        amount: Number(amount),
        description: desc,
        paid_by: paidBy,
        created_by: u?.user?.id,
        date: new Date().toISOString(),
        category: category,
      })
      .select("*")
      .single();

    if (!error) {
      await supabase.from("expense_splits").insert(
        splits.map((s) => ({
          expense_id: expense.id,
          user_id: s.user_id,
          percent: s.percent,
        }))
      );
    }

    setAmount("");
    setDesc("");
    setCategory("General");
    setPaidBy(currentUser?.id || "");
    setLoading(false);
    loadExpenses();
  };

  // ------------ SAVE BUDGET ------------
  const saveBudget = async (cat: string) => {
    const limit = budgetForm[cat];
    if (!limit || Number(limit) < 0) return alert("Enter valid amount");

    await supabase.from("group_budgets").upsert({
      tracker_id: id,
      category: cat,
      monthly_limit: Number(limit),
    });

    await loadBudgets();
    alert(`✓ Budget saved for ${cat}`);
  };

  // ------------ CALCULATE CATEGORY SPENDING ------------
  const getCategorySpending = (forMonth?: number, forYear?: number) => {
    const targetMonth = forMonth ?? filterMonth;
    const targetYear = forYear ?? filterYear;

    const spending: { [key: string]: number } = {};

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

  // ------------ GET BUDGET STATUS ------------
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

  // ------------ ANALYTICS HELPERS ------------
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
    const headers = ["Date", "Description", "Category", "Amount", "Paid By"];
    const rows = filteredExpenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      exp.description || "No description",
      exp.category || "General",
      `₹${Number(exp.amount).toFixed(2)}`,
      showName(exp.paid_by),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalSpent = Object.values(categorySpending).reduce((sum, amt) => sum + amt, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0);

  // ------------ BALANCES (UNCHANGED) ------------
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.user_id] = 0));

  expenses.forEach((exp) => {
    const amt = Number(exp.amount);
    balances[exp.paid_by] += amt;

    exp.expense_splits?.forEach((s: any) => {
      balances[s.user_id] -= amt * (s.percent / 100);
    });
  });

  payments
    .filter((p) => p.status === "confirmed")
    .forEach((p) => {
      const amt = Number(p.amount);
      balances[p.from_user] += amt;
      balances[p.to_user] -= amt;
    });

  Object.keys(balances).forEach((u) => {
    if (Math.abs(balances[u]) < 0.05) balances[u] = 0;
  });

  const users = Object.keys(balances);
  const settlements: any[] = [];

  let creditors = users
    .filter((u) => balances[u] > 0)
    .map((u) => ({ u, amt: balances[u] }));

  let debtors = users
    .filter((u) => balances[u] < 0)
    .map((u) => ({ u, amt: -balances[u] }));

  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);

    settlements.push({
      from: debtors[i].u,
      to: creditors[j].u,
      amount: Number(pay.toFixed(2)),
    });

    debtors[i].amt -= pay;
    creditors[j].amt -= pay;

    if (debtors[i].amt <= 0.0001) i++;
    if (creditors[j].amt <= 0.0001) j++;
  }

  const shownSettlements = settlements.filter(
    (s) => s.from === currentUser?.id || s.to === currentUser?.id
  );

  const existingPending = (s: any) =>
    payments.some(
      (p) =>
        p.status === "pending" &&
        p.from_user === s.from &&
        p.to_user === s.to
    );

  const markPaid = async (s: any) => {
    if (pendingNow || existingPending(s)) return;

    const amt = prompt("Enter amount paid", s.amount);
    if (!amt) return;

    setPendingNow(true);

    await supabase.from("payments").insert({
      tracker_id: id,
      from_user: s.from,
      to_user: s.to,
      amount: Number(amt),
      status: "pending",
    });

    await loadPayments();
    setPendingNow(false);
  };

  const confirmPayment = async (pid: string) => {
    await supabase
      .from("payments")
      .update({ status: "confirmed" })
      .eq("id", pid);

    loadPayments();
  };

  const isMobile = window.innerWidth < 640;

  // CONTINUE IN PART 3...
  // CONTINUED FROM PART 2...

  return (
    <div style={{ padding: "15px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}>Group Expenses</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            📈 {showAnalytics ? "Hide" : "Show"} Analytics
          </button>
          <button
            onClick={() => setShowWishlistModal(true)}
            style={{
              background: "linear-gradient(135deg, #ec4899, #f472b6)",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "600",
              whiteSpace: "nowrap",
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
            padding: "10px 15px",
            borderRadius: 5,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          📸 Scan Receipt
        </button>
          <button
            onClick={() => setShowBudgetModal(true)}
            style={{
              backgroundColor: "#7c3aed",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            📊 Budgets
          </button>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "10px 15px",
              borderRadius: 5,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Back
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>📊 Analytics Dashboard</h3>

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
                      <div
                        style={{
                          height: 10,
                          backgroundColor: "#e0e0e0",
                          borderRadius: 5,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background: catInfo?.color || "#a29bfe",
                            transition: "width 0.3s ease",
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
                          Paid by {showName(exp.paid_by)} • {new Date(exp.date).toLocaleDateString()}
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

      {/* CONTINUE IN PART 4... */}
      {/* CONTINUED FROM PART 3... */}

      {/* Budget Overview - ON MAIN PAGE */}
      {budgets.length > 0 && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: 10,
            padding: "15px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 18 }}>
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
              gridTemplateColumns: isMobile 
                ? "1fr" 
                : window.innerWidth < 1024 
                ? "repeat(2, 1fr)" 
                : "repeat(auto-fit, minmax(280px, 1fr))",
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
                  style={{
                    backgroundColor: "white",
                    border: `2px solid ${status.color}`,
                    borderRadius: 8,
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

                  <div
                    style={{
                      marginTop: 10,
                      backgroundColor: "#e0e0e0",
                      height: 10,
                      borderRadius: 5,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(status.percentage, 100)}%`,
                        height: "100%",
                        backgroundColor: status.color,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {status.status === "exceeded" && (
                      <span style={{ color: "#dc2626" }}>🔴 Budget exceeded by ₹{(status.spent - status.limit).toFixed(0)}</span>
                    )}
                    {status.status === "critical" && (
                      <span style={{ color: "#f97316" }}>🟠 {(100 - status.percentage).toFixed(0)}% remaining</span>
                    )}
                    {status.status === "warning" && (
                      <span style={{ color: "#f7b731" }}>🟡 ₹{(status.limit - status.spent).toFixed(0)} left</span>
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

      {/* Add Expense Form with Wishlist */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: 10,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>💸 Add Expense</h3>

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

        <AddExpenseForm
          amount={amount}
          desc={desc}
          paidBy={paidBy}
          category={category}
          setAmount={setAmount}
          setDesc={setDesc}
          setPaidBy={setPaidBy}
          setCategory={setCategory}
          members={members}
          addExpense={addExpense}
          loading={loading}
          showName={showName}
          categories={EXPENSE_CATEGORIES}
        />
      </div>

      <MemberTags
        members={members}
        participants={participants}
        setParticipants={setParticipants}
        splits={splits}
        setSplits={setSplits}
        currentUser={currentUser}
        showName={showName}
      />

      <MultiPersonSlider
        splits={splits}
        setSplits={setSplits}
        currentUser={currentUser}
        showName={showName}
      />

      {/* Save Expense Button - ONLY ONE */}
      <button
        disabled={loading}
        onClick={addExpense}
        style={{
          backgroundColor: loading ? "#ccc" : "#16a34a",
          color: "white",
          border: "none",
          padding: "14px 28px",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 18,
          fontWeight: "600",
          width: "100%",
          maxWidth: 400,
          margin: "20px auto",
          display: "block",
          boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.target as HTMLButtonElement).style.backgroundColor = "#15803d";
            (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            (e.target as HTMLButtonElement).style.backgroundColor = "#16a34a";
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(22, 163, 74, 0.3)";
          }
        }}
      >
        {loading ? "⏳ Saving..." : "💾 Save Expense"}
      </button>

      {/* Expense Filters & Export */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: 10,
          padding: 15,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 15 }}>
          <h3 style={{ margin: 0 }}>🔍 Filter Expenses ({filteredExpenses.length})</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              style={{ padding: "8px 12px", borderRadius: 5, fontSize: 13, border: "1px solid #ddd" }}
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
              style={{ padding: "8px 12px", borderRadius: 5, fontSize: 13, border: "1px solid #ddd" }}
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
            <button
              onClick={exportToCSV}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 5,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Date Range:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 5, fontSize: 13, border: "1px solid #ddd" }}
          />
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 5, fontSize: 13, border: "1px solid #ddd" }}
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
      </div>

      <ExpensesTable
        expenses={filteredExpenses}
        currentUser={currentUser}
        showName={showName}
      />

      <BalanceSummary myBalance={balances[currentUser?.id] || 0} />

      <SettlementsTable
        settlements={shownSettlements}
        currentUser={currentUser}
        markPaid={markPaid}
        showName={showName}
      />

      <PendingPayments
        payments={payments}
        currentUser={currentUser}
        confirmPayment={confirmPayment}
        showName={showName}
      />

      <PaymentHistory
        payments={payments}
        currentUser={currentUser}
        showName={showName}
      />

      <SettlementsGraph
        members={members}
        settlements={shownSettlements}
        currentUserId={currentUser?.id}
        showName={showName}
      />

      {/* CONTINUE IN PART 5 FOR MODALS... */}
      {/* CONTINUED FROM PART 4... */}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowBudgetModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              padding: 30,
              maxWidth: 800,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>📊 Budget Management</h2>

            {/* Month/Year Selector */}
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
                        <div
                          style={{
                            height: 6,
                            backgroundColor: "#e0e0e0",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(status.percentage, 100)}%`,
                              height: "100%",
                              backgroundColor: status.color,
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
            <p style={{ color: "#666", fontSize: 14 }}>
              Set spending limits for each category. You'll get alerts when approaching or exceeding limits.
            </p>

            {EXPENSE_CATEGORIES.map((cat) => (
              <div
                key={cat.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 15,
                  padding: 15,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                  flexWrap: isMobile ? "wrap" : "nowrap",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>
                    {cat.icon} {cat.value}
                  </div>
                  {categorySpending[cat.value] && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      Current month: ₹{categorySpending[cat.value].toFixed(0)} spent
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="number"
                    placeholder="₹0"
                    value={budgetForm[cat.value] || ""}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, [cat.value]: e.target.value })
                    }
                    style={{
                      width: 120,
                      padding: 8,
                      border: "1px solid #ddd",
                      borderRadius: 5,
                    }}
                  />
                  <button
                    onClick={() => saveBudget(cat.value)}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 5,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowBudgetModal(false)}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: 5,
                cursor: "pointer",
                marginTop: 20,
                width: "100%",
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
          trackerId={id!}
          currentUserId={currentUser?.id}
          showName={showName}
          onClose={() => {
            setShowWishlistModal(false);
            loadWishlist();
          }}
          onSelectItem={(item) => {
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