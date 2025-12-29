import React from "react";

interface Payment {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Props {
  payments: Payment[];
  currentUser: any;                 // <-- add this
  showName: (uid: string) => string; // <-- and this
}

export default function PaymentHistory({ payments, currentUser, showName }: Props) {
  return (
    <div>
      <hr />
      <h3>Payment History</h3>

      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleString("en-IN")}</td>
              <td>{showName(p.from_user)}</td>
              <td>{showName(p.to_user)}</td>
              <td>₹{p.amount}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
