import React from "react";

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface Props {
  settlements: Settlement[];
  currentUser: any;
  markPaid: (s: Settlement) => void;
  showName: (uid: string) => string;

  // NEW props (optional)
  disableIf?: (s: Settlement) => boolean;
  pendingNow?: boolean;
}

export default function SettlementsTable({
  settlements,
  currentUser,
  markPaid,
  showName,
  disableIf,
  pendingNow
}: Props) {
  return (
    <div>
      <hr />
      <h3>Who should pay whom</h3>

      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {settlements.map((s) => {
            const disabled =
              pendingNow || (disableIf ? disableIf(s) : false);

            return (
              <tr key={s.from + s.to}>
                <td>{showName(s.from)}</td>
                <td>{showName(s.to)}</td>
                <td>₹{s.amount.toFixed(2)}</td>

                <td>
                  {s.from === currentUser?.id && (
                    <button disabled={disabled} onClick={() => markPaid(s)}>
                      {disabled ? "Pending…" : "Mark Paid"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
