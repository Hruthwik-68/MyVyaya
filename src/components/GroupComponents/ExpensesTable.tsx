import React from "react";

interface Props {
  expenses: any[];
  currentUser: any;
  showName: (uid: string) => string;
}

export default function ExpensesTable({ expenses, currentUser, showName }: Props) {
  const isMobile = window.innerWidth < 640;

  if (expenses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <p>No expenses found for this filter.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>Date</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>Description</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>Category</th>
            <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, fontSize: 14 }}>Amount</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>Paid By</th>
            {!isMobile && (
              <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>Participants</th>
            )}
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp, index) => (
            <tr
              key={exp.id}
              style={{
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb",
              }}
            >
              <td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
                {new Date(exp.date).toLocaleDateString()}
              </td>
              <td style={{ padding: "12px", fontSize: 14, fontWeight: 500 }}>
                {exp.description || "No description"}
              </td>
              <td style={{ padding: "12px", fontSize: 13 }}>
                {exp.category || "General"}
              </td>
              <td style={{ padding: "12px", textAlign: "right", fontSize: 15, fontWeight: 600, color: "#dc2626" }}>
                ₹{Number(exp.amount).toFixed(2)}
              </td>
              <td style={{ padding: "12px", fontSize: 13 }}>
                {showName(exp.paid_by)}
              </td>
              {!isMobile && (
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {exp.expense_splits?.map((split: any) => (
                      <span
                        key={split.user_id}
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 12,
                          backgroundColor: split.user_id === currentUser?.id ? "#dbeafe" : "#f3f4f6",
                          color: split.user_id === currentUser?.id ? "#1e40af" : "#666",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {showName(split.user_id)} ({split.percent}%)
                      </span>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}