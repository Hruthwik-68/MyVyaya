import React from "react";

interface Props {
  expenses: any[];
  currentUser: any;
  showName: (uid: string) => string;
}

export default function ExpensesTable({ expenses, currentUser, showName }: Props) {
  return (
    <div>
      <hr />
      <h3>Expenses</h3>

      <table border={1} cellPadding={6} width="100%">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount ₹</th>
            <th>Paid By</th>
            <th>People</th>   {/* 👈 NEW */}
          </tr>
        </thead>

        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.date).toLocaleString()}</td>
              <td>{e.description || "-"}</td>
              <td>{Number(e.amount).toFixed(2)}</td>
              <td>{showName(e.paid_by)}</td>

              {/* ==== TAGS COLUMN ==== */}
              <td>
                {e.expense_splits?.map((s: any) => (
                  <span
                    key={s.user_id}
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      marginRight: 6,
                      marginBottom: 4,
                      borderRadius: 8,
                      background: "#0A3866",
                      color: "white",
                      fontSize: 12
                    }}
                  >
                    {showName(s.user_id)}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
