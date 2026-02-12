import React from "react";

interface Category {
  value: string;
  icon: string;
  color: string;
}

interface Props {
  amount: string;
  desc: string;
  paidBy: string;
  category: string;
  setAmount: (v: string) => void;
  setDesc: (v: string) => void;
  setPaidBy: (v: string) => void;
  setCategory: (v: string) => void;
  members: { user_id: string }[];
  addExpense: () => void;
  loading: boolean;
  showName?: (uid: string) => string;
  categories: Category[];
}

export default function AddExpenseForm({
  amount,
  desc,
  paidBy,
  category,
  setAmount,
  setDesc,
  setPaidBy,
  setCategory,
  members,
  addExpense,
  loading,
  showName,
  categories,
}: Props) {
  const inputStyle = {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "8px",
    color: "#f8fafc",
    boxSizing: "border-box" as const,
    outline: "none",
    transition: "all 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px",
    fontSize: "13px",
    color: "#94a3b8",
    letterSpacing: "0.02em",
  };

  return (
    <div
      style={{
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: 16,
        padding: "24px",
        marginTop: 24,
        marginBottom: 24,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 18, color: "#e2e8f0", display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: 'rgba(34, 211, 238, 0.1)', padding: 6, borderRadius: 8 }}>💰</span>
        Add New Expense
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
        }}
      >
        {/* Amount */}
        <div>
          <label style={labelStyle}>
            Amount *
          </label>
          <input
            type="number"
            placeholder="₹0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#22d3ee"}
            onBlur={(e) => e.target.style.borderColor = "rgba(148, 163, 184, 0.1)"}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>
            Description
          </label>
          <input
            placeholder="e.g., Team lunch"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#22d3ee"}
            onBlur={(e) => e.target.style.borderColor = "rgba(148, 163, 184, 0.1)"}
          />
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>
            Category *
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
              onFocus={(e) => e.target.style.borderColor = "#22d3ee"}
              onBlur={(e) => e.target.style.borderColor = "rgba(148, 163, 184, 0.1)"}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value} style={{ background: "#1e293b", color: "white" }}>
                  {cat.icon} {cat.value}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: 12 }}>▼</div>
          </div>
        </div>

        {/* Paid By */}
        <div>
          <label style={labelStyle}>
            Paid By *
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
              onFocus={(e) => e.target.style.borderColor = "#22d3ee"}
              onBlur={(e) => e.target.style.borderColor = "rgba(148, 163, 184, 0.1)"}
            >
              <option value="" style={{ background: "#1e293b", color: "#94a3b8" }}>Select who paid...</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id} style={{ background: "#1e293b", color: "white" }}>
                  {showName ? showName(m.user_id) : m.user_id}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: 12 }}>▼</div>
          </div>
        </div>
      </div>
    </div>
  );
}