import { useState } from "react";
import { supabase } from "../supabase";

type Props = {
  members: any[];
  trackerId: string;
  reload: () => void;
  close: () => void;
};

export default function AddExpense({ members, trackerId, reload, close }: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"equal" | "percentage" | "amount">("equal");
  const [splits, setSplits] = useState<any[]>(
    members.map((m) => ({ user_id: m.user_id, value: 0 }))
  );

  function updateSplit(i: number, value: number) {
    const s = [...splits];
    s[i].value = value;
    setSplits(s);
  }

  async function save() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // 1️⃣ Insert expense
    const { data: exp } = await supabase
      .from("expenses")
      .insert({
        tracker_id: trackerId,
        amount: Number(amount),
        description,
        date: new Date().toISOString(),
        created_by: user.id,
        paid_by: user.id,
      })
      .select("id")
      .single();

    const expenseId = exp!.id;

    // 2️⃣ Build split rows
    let rows: any[] = [];

    if (mode === "equal") {
      const share = 100 / members.length;
      rows = members.map((m) => ({
        expense_id: expenseId,
        user_id: m.user_id,
        percentage: share,
      }));
    }

    if (mode === "percentage") {
      rows = splits.map((s) => ({
        expense_id: expenseId,
        user_id: s.user_id,
        percentage: s.value,
      }));
    }

    if (mode === "amount") {
      rows = splits.map((s) => ({
        expense_id: expenseId,
        user_id: s.user_id,
        amount: s.value,
      }));
    }

    // 3️⃣ Save splits
    await supabase.from("expense_splits").insert(rows);

    reload();
    close();
  }

  return (
    <div style={{ border: "1px solid gray", padding: 20, marginTop: 20 }}>
      <h3>Add Group Expense</h3>

      <input
        placeholder="Amount ₹"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      /><br/><br/>

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      /><br/><br/>

      <div>
        <label><input type="radio" checked={mode === "equal"} onChange={() => setMode("equal")} /> Equal</label>
        <label><input type="radio" checked={mode === "percentage"} onChange={() => setMode("percentage")} /> % Split</label>
        <label><input type="radio" checked={mode === "amount"} onChange={() => setMode("amount")} /> Amount</label>
      </div>

      {mode !== "equal" &&
        members.map((m, i) => (
          <div key={m.user_id}>
            {m.user_id.slice(0, 6)} — 
            <input
              type="number"
              value={splits[i].value}
              onChange={(e) => updateSplit(i, Number(e.target.value))}
            />
          </div>
        ))
      }

      <br/>

      <button onClick={save}>Save</button>
      <button onClick={close} style={{ marginLeft: 10 }}>Cancel</button>
    </div>
  );
}
