import { useEffect, useState } from "react";
import { supabase } from "../supabase";

interface Payment {
  id: string;
  tracker_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
  created_at?: string;
}

interface FriendRow {
  id: string;
  name: string;
  balance: number;
  upi_id?: string;
  pendingPayment?: {
    count: number;
    total: number;
  };
  incomingRequest?: {
    payments: Payment[];
    total: number;
  };
}

export default function Friends() {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    load();
    
    const channel = supabase
      .channel('friend-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const load = async () => {
    setLoading(true);
    
    const { data: session } = await supabase.auth.getUser();
    const me = session?.user ?? null;

    if (!me) {
      setLoading(false);
      return;
    }
    setUser(me);

    const { data: myGroups } = await supabase
      .from("group_members")
      .select("tracker_id")
      .eq("user_id", me.id);

    const trackerIds = (myGroups || []).map((g) => g.tracker_id);
    
    if (!trackerIds.length) {
      setLoading(false);
      return;
    }

    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, tracker_id")
      .in("tracker_id", trackerIds);

    const otherUserIds = [...new Set(
      (members || [])
        .map((m) => m.user_id)
        .filter((uid) => uid !== me.id)
    )];

    if (!otherUserIds.length) {
      setLoading(false);
      return;
    }

    // Get names AND UPI IDs
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, upi_id")
      .in("id", otherUserIds);

    const { data: allPendingPayments } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .or(`from_user.eq.${me.id},to_user.eq.${me.id}`);

    const pendingPayments = (allPendingPayments || []) as Payment[];

    const result: FriendRow[] = [];

    for (let fid of otherUserIds) {
      const bal = await calcBalance(me.id, fid, trackerIds);
      const profile = profiles?.find((p) => p.id === fid);

      const myPendingPayments = pendingPayments.filter(
        (p: Payment) => p.from_user === me.id && p.to_user === fid
      );
      
      const theirPendingPayments = pendingPayments.filter(
        (p: Payment) => p.from_user === fid && p.to_user === me.id
      );

      result.push({
        id: fid,
        name: profile?.name || fid.slice(0, 6),
        upi_id: profile?.upi_id,
        balance: bal,
        pendingPayment: myPendingPayments.length > 0 ? { 
          count: myPendingPayments.length,
          total: myPendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        } : undefined,
        incomingRequest: theirPendingPayments.length > 0 ? {
          payments: theirPendingPayments,
          total: theirPendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        } : undefined
      });
    }

    result.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    setFriends(result);
    setLoading(false);
  };

  const calcBalance = async (me: string, friend: string, trackers: string[]) => {
    let bal = 0;

    const { data: exps } = await supabase
      .from("expenses")
      .select(`
        id, amount, paid_by, tracker_id,
        expense_splits!expense_splits_expense_id_fkey (user_id, percent)
      `)
      .in("tracker_id", trackers);

    exps?.forEach(exp => {
      const amt = Number(exp.amount);
      const mySplit = exp.expense_splits?.find((s: any) => s.user_id === me);
      const frSplit = exp.expense_splits?.find((s: any) => s.user_id === friend);

      if (!mySplit || !frSplit) return;

      const myShare = amt * (mySplit.percent / 100);
      const frShare = amt * (frSplit.percent / 100);

      if (exp.paid_by === friend) {
        bal -= myShare;
      }

      if (exp.paid_by === me) {
        bal += frShare;
      }
    });

    const { data: pays } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "confirmed")
      .in("tracker_id", trackers);

    pays?.forEach(p => {
      const amt = Number(p.amount);

      if (p.from_user === me && p.to_user === friend) {
        bal += amt;
      }

      if (p.from_user === friend && p.to_user === me) {
        bal -= amt;
      }
    });

    return Number(bal.toFixed(2));
  };

  // 💳 NEW: Pay via UPI
  const handlePayViaUPI = (friend: FriendRow) => {
    if (!friend.upi_id) {
      alert(`${friend.name} hasn't added their UPI ID yet. Ask them to add it in their Profile!`);
      return;
    }

    const amount = Math.abs(friend.balance);
    const upiUrl = `upi://pay?pa=${friend.upi_id}&pn=${encodeURIComponent(friend.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Money Tracker Settlement')}`;
    
    // Open UPI app
    window.location.href = upiUrl;
    
    // Show instructions
    setTimeout(() => {
      const shouldMarkPaid = window.confirm(
        `UPI payment app should have opened.\n\nAfter completing the payment, click OK to mark as paid.`
      );
      
      if (shouldMarkPaid) {
        handleMarkPaid(friend);
      }
    }, 1000);
  };

  const handleMarkPaid = async (friend: FriendRow) => {
    if (!user || processingPayment) return;

    const totalAmount = Math.abs(friend.balance);
    
    setProcessingPayment(friend.id);

    try {
      const { data: myGroups } = await supabase
        .from("group_members")
        .select("tracker_id")
        .eq("user_id", user.id);

      const { data: friendGroups } = await supabase
        .from("group_members")
        .select("tracker_id")
        .eq("user_id", friend.id);

      const myTrackerIds = (myGroups || []).map(g => g.tracker_id);
      const friendTrackerIds = (friendGroups || []).map(g => g.tracker_id);
      
      const sharedTrackerIds = myTrackerIds.filter(id => 
        friendTrackerIds.includes(id)
      );

      if (!sharedTrackerIds.length) {
        alert("No shared groups found!");
        return;
      }

      const groupBalances: { trackerId: string; balance: number }[] = [];
      
      for (const trackerId of sharedTrackerIds) {
        const bal = await calcBalance(user.id, friend.id, [trackerId]);
        if (bal < 0) {
          groupBalances.push({
            trackerId,
            balance: Math.abs(bal)
          });
        }
      }

      const payments = groupBalances.map(gb => ({
        tracker_id: gb.trackerId,
        from_user: user.id,
        to_user: friend.id,
        amount: gb.balance,
        status: "pending"
      }));

      if (payments.length === 0) {
        alert("No debts found in shared groups!");
        return;
      }

      const { error } = await supabase
        .from("payments")
        .insert(payments);

      if (error) throw error;

      await load();
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Failed to mark as paid. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleConfirmPayment = async (friend: FriendRow) => {
    if (processingPayment || !friend.incomingRequest) return;
    
    setProcessingPayment(friend.id);

    try {
      const paymentIds = friend.incomingRequest.payments.map(p => p.id);

      const { error } = await supabase
        .from("payments")
        .update({ status: "confirmed" })
        .in("id", paymentIds);

      if (error) throw error;

      await load();
    } catch (error) {
      console.error("Error confirming payments:", error);
      alert("Failed to confirm payments. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleRejectPayment = async (friend: FriendRow) => {
    if (processingPayment || !friend.incomingRequest) return;
    
    setProcessingPayment(friend.id);

    try {
      const paymentIds = friend.incomingRequest.payments.map(p => p.id);

      const { error } = await supabase
        .from("payments")
        .delete()
        .in("id", paymentIds);

      if (error) throw error;

      await load();
    } catch (error) {
      console.error("Error rejecting payments:", error);
      alert("Failed to reject payments. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h2>Your Friends</h2>
      <p style={{ color: "#666", fontSize: 14 }}>
        Net balance across all groups
      </p>

      {loading && <p>Loading...</p>}

      {!loading && !friends.length && (
        <p style={{ color: "#999", fontStyle: "italic" }}>
          No friends yet. Join a group to see friends!
        </p>
      )}

      {!loading && friends.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {friends.map((f) => (
            <div
              key={f.id}
              style={{
                padding: 15,
                marginBottom: 15,
                border: "1px solid #ddd",
                borderRadius: 8,
                backgroundColor: "#fff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{f.name}</strong>
                  {f.upi_id && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                      💳 {f.upi_id}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 16,
                      fontWeight: "bold",
                      color:
                        f.balance > 0
                          ? "green"
                          : f.balance < 0
                          ? "red"
                          : "#666",
                    }}
                  >
                    {f.balance > 0 && `↓ owes you ₹${f.balance}`}
                    {f.balance < 0 && `↑ you owe ₹${Math.abs(f.balance)}`}
                    {f.balance === 0 && `✓ Settled`}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {/* If I owe them money (negative balance) */}
                  {f.balance < 0 && !f.pendingPayment && (
                    <>
                      {/* Pay via UPI button */}
                      <button
                        onClick={() => handlePayViaUPI(f)}
                        disabled={!!processingPayment}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#8b5cf6",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: "bold",
                          cursor: processingPayment ? "not-allowed" : "pointer",
                          opacity: processingPayment ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        💳 Pay via UPI
                      </button>

                      {/* Mark Paid button */}
                      <button
                        onClick={() => handleMarkPaid(f)}
                        disabled={!!processingPayment}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: "bold",
                          cursor: processingPayment ? "not-allowed" : "pointer",
                          opacity: processingPayment ? 0.5 : 1
                        }}
                      >
                        Paid
                      </button>
                    </>
                  )}

                  {/* If I've marked as paid (waiting for confirmation) */}
                  {f.pendingPayment && (
                    <button
                      disabled
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#94a3b8",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: "bold",
                        cursor: "not-allowed"
                      }}
                    >
                      Pending ⏳
                    </button>
                  )}

                  {/* If they've marked as paid (I need to confirm) */}
                  {f.incomingRequest && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleConfirmPayment(f)}
                        disabled={!!processingPayment}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: "bold",
                          cursor: processingPayment ? "not-allowed" : "pointer"
                        }}
                      >
                        ✓ Confirm All
                      </button>
                      <button
                        onClick={() => handleRejectPayment(f)}
                        disabled={!!processingPayment}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: "bold",
                          cursor: processingPayment ? "not-allowed" : "pointer"
                        }}
                      >
                        ✗ Reject All
                      </button>
                    </div>
                  )}

                  {f.incomingRequest && (
                    <div
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: "bold"
                      }}
                    >
                      !
                    </div>
                  )}
                </div>
              </div>

              {f.pendingPayment && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    backgroundColor: "#fef3c7",
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  ⏳ Waiting for {f.name} to confirm ₹{f.pendingPayment.total.toFixed(2)} across {f.pendingPayment.count} group{f.pendingPayment.count > 1 ? 's' : ''}
                </div>
              )}

              {f.incomingRequest && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    backgroundColor: "#dbeafe",
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  💰 {f.name} marked ₹{f.incomingRequest.total.toFixed(2)} as paid across {f.incomingRequest.payments.length} group{f.incomingRequest.payments.length > 1 ? 's' : ''}. Confirm?
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 30, padding: 15, backgroundColor: "#f0f9ff", borderRadius: 8 }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>How it works</h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#333" }}>
          <li>💳 <strong>Pay via UPI</strong>: Instantly open PhonePe/GPay with amount pre-filled</li>
          <li>Balances are calculated across ALL groups you share</li>
          <li>Green = they owe you money</li>
          <li>Red = you owe them money</li>
          <li>Pending payments need confirmation from the receiver</li>
          <li>Once confirmed, balance updates across all groups</li>
        </ul>
      </div>
    </div>
  );
}