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
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        borderRadius: 10,
        padding: "15px",
        marginTop: 20,
        marginBottom: 20,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>💰 Add New Expense</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 15,
        }}
      >
        {/* Amount */}
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: 5,
              fontSize: 13,
            }}
          >
            Amount *
          </label>
          <input
            type="number"
            placeholder="₹0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              border: "1px solid #ddd",
              borderRadius: 5,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: 5,
              fontSize: 13,
            }}
          >
            Description
          </label>
          <input
            placeholder="e.g., Team lunch"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              border: "1px solid #ddd",
              borderRadius: 5,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category */}
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: 5,
              fontSize: 13,
            }}
          >
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              border: "1px solid #ddd",
              borderRadius: 5,
              boxSizing: "border-box",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.value}
              </option>
            ))}
          </select>
        </div>

        {/* Paid By */}
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: 5,
              fontSize: 13,
            }}
          >
            Paid By *
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              border: "1px solid #ddd",
              borderRadius: 5,
              boxSizing: "border-box",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <option value="">Select who paid...</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {showName ? showName(m.user_id) : m.user_id}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}