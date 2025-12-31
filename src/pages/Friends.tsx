import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../supabase";
import CollapsibleSection from "../components/CollapsibleSection";

interface Payment {
  id: string;
  tracker_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
  source_type?: string;
  source_id?: string;
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
    
    // Real-time updates
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

    // Get ALL pending payments
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

  // ← NEW: MEMOIZED FRIEND GROUPS
  const friendsWithDebts = useMemo(() => 
    friends.filter(f => f.balance < 0), 
    [friends]
  );

  const friendsWithCredits = useMemo(() => 
    friends.filter(f => f.balance > 0), 
    [friends]
  );

  const settledFriends = useMemo(() => 
    friends.filter(f => f.balance === 0), 
    [friends]
  );

  const friendsWithPendingRequests = useMemo(() => 
    friends.filter(f => f.incomingRequest), 
    [friends]
  );

  // Pay via UPI
  const handlePayViaUPI = useCallback((friend: FriendRow) => {
    if (!friend.upi_id) {
      alert(`${friend.name} hasn't added their UPI ID yet. Ask them to add it in their Profile!`);
      return;
    }

    const amount = Math.abs(friend.balance);
    const upiUrl = `upi://pay?pa=${friend.upi_id}&pn=${encodeURIComponent(friend.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Vyaya Settlement')}`;
    
    window.location.href = upiUrl;
    
    setTimeout(() => {
      const shouldMarkPaid = window.confirm(
        `UPI payment app should have opened.\n\nAfter completing the payment, click OK to mark as paid.`
      );
      
      if (shouldMarkPaid) {
        handleMarkPaid(friend);
      }
    }, 1000);
  }, []);

  // UNIFIED MARK PAID
  const handleMarkPaid = async (friend: FriendRow) => {
    if (!user || processingPayment) return;

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

      if (groupBalances.length === 0) {
        alert("No debts found in shared groups!");
        return;
      }

      const payments = groupBalances.map(gb => ({
        tracker_id: gb.trackerId,
        from_user: user.id,
        to_user: friend.id,
        amount: gb.balance,
        status: "pending",
        source_type: "friend",
        source_id: null,
      }));

      const { error } = await supabase
        .from("payments")
        .insert(payments);

      if (error) throw error;

      alert(`✅ Payment request sent!\n\nMarked ₹${Math.abs(friend.balance).toFixed(2)} as paid across ${payments.length} group(s).\n\nWaiting for ${friend.name} to confirm.`);

      await load();
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("❌ Failed to mark as paid. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  // UNIFIED CONFIRM
  const handleConfirmPayment = async (friend: FriendRow) => {
    if (processingPayment || !friend.incomingRequest) return;
    
    setProcessingPayment(friend.id);

    try {
      const paymentIds = friend.incomingRequest.payments.map(p => p.id);

      const { error } = await supabase
        .from("payments")
        .update({ 
          status: "confirmed",
          confirmed_at: new Date().toISOString()
        })
        .in("id", paymentIds);

      if (error) throw error;

      alert(`✅ Payment confirmed!\n\n₹${friend.incomingRequest.total.toFixed(2)} confirmed across ${paymentIds.length} group(s).\n\nBalances updated!`);

      await load();
    } catch (error) {
      console.error("Error confirming payments:", error);
      alert("❌ Failed to confirm payments. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  // UNIFIED REJECT
  const handleRejectPayment = async (friend: FriendRow) => {
    if (processingPayment || !friend.incomingRequest) return;
    
    if (!confirm(`Reject ₹${friend.incomingRequest.total.toFixed(2)} payment from ${friend.name}?`)) return;
    
    setProcessingPayment(friend.id);

    try {
      const paymentIds = friend.incomingRequest.payments.map(p => p.id);

      const { error } = await supabase
        .from("payments")
        .delete()
        .in("id", paymentIds);

      if (error) throw error;

      alert(`✅ Payment rejected!\n\n${friend.name} can try again.`);

      await load();
    } catch (error) {
      console.error("Error rejecting payments:", error);
      alert("❌ Failed to reject payments. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  const isMobile = window.innerWidth < 640;

  const FriendCard = ({ f }: { f: FriendRow }) => (
    <div
      key={f.id}
      style={{
        padding: 15,
        marginBottom: 15,
        border: "1px solid #ddd",
        borderRadius: 8,
        backgroundColor: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
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
            {f.balance > 0 && `↓ ${f.name} owes you ₹${f.balance.toFixed(2)}`}
            {f.balance < 0 && `↑ You owe ${f.name} ₹${Math.abs(f.balance).toFixed(2)}`}
            {f.balance === 0 && `✓ Settled up`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {f.balance < 0 && !f.pendingPayment && (
            <>
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
                  fontSize: 14,
                  whiteSpace: "nowrap"
                }}
              >
                💳 Pay via UPI
              </button>

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
                  opacity: processingPayment ? 0.5 : 1,
                  fontSize: 14,
                  whiteSpace: "nowrap"
                }}
              >
                ✓ Mark Paid
              </button>
            </>
          )}

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
                cursor: "not-allowed",
                fontSize: 14,
                whiteSpace: "nowrap"
              }}
            >
              ⏳ Pending Confirmation
            </button>
          )}

          {f.incomingRequest && (
            <>
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
                  cursor: processingPayment ? "not-allowed" : "pointer",
                  fontSize: 14,
                  whiteSpace: "nowrap"
                }}
              >
                ✓ Confirm
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
                  cursor: processingPayment ? "not-allowed" : "pointer",
                  fontSize: 14,
                  whiteSpace: "nowrap"
                }}
              >
                ✗ Reject
              </button>
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
            </>
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
          💰 {f.name} marked ₹{f.incomingRequest.total.toFixed(2)} as paid across {f.incomingRequest.payments.length} group{f.incomingRequest.payments.length > 1 ? 's' : ''}. Confirm to update all balances.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, marginBottom: 5 }}>👥 Your Friends</h2>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
          Net balance across all shared groups
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div className="spinner"></div>
          <p style={{ color: "#666", marginTop: 10 }}>Loading...</p>
        </div>
      )}

      {!loading && !friends.length && (
        <div style={{ 
          textAlign: "center", 
          padding: 40,
          backgroundColor: "#f9fafb",
          borderRadius: 12,
          border: "2px dashed #e5e7eb"
        }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>👥</div>
          <p style={{ color: "#999", fontStyle: "italic", margin: 0 }}>
            No friends yet. Join a group to see friends!
          </p>
        </div>
      )}

      {!loading && friends.length > 0 && (
        <>
          {/* ← NEW: COLLAPSIBLE PENDING REQUESTS */}
          {friendsWithPendingRequests.length > 0 && (
            <CollapsibleSection 
              title="Pending Payment Requests" 
              icon="🔔" 
              badge={friendsWithPendingRequests.length}
              badgeColor="#ef4444"
              defaultOpen={true}
            >
              {friendsWithPendingRequests.map(f => <FriendCard key={f.id} f={f} />)}
            </CollapsibleSection>
          )}

          {/* ← NEW: COLLAPSIBLE YOU OWE */}
          {friendsWithDebts.length > 0 && (
            <CollapsibleSection 
              title="You Owe" 
              icon="↑" 
              badge={friendsWithDebts.length}
              badgeColor="#dc2626"
              defaultOpen={true}
            >
              {friendsWithDebts.map(f => <FriendCard key={f.id} f={f} />)}
            </CollapsibleSection>
          )}

          {/* ← NEW: COLLAPSIBLE THEY OWE YOU */}
          {friendsWithCredits.length > 0 && (
            <CollapsibleSection 
              title="They Owe You" 
              icon="↓" 
              badge={friendsWithCredits.length}
              badgeColor="#16a34a"
              defaultOpen={true}
            >
              {friendsWithCredits.map(f => <FriendCard key={f.id} f={f} />)}
            </CollapsibleSection>
          )}

          {/* ← NEW: COLLAPSIBLE SETTLED */}
          {settledFriends.length > 0 && (
            <CollapsibleSection 
              title="Settled Up" 
              icon="✓" 
              badge={settledFriends.length}
              badgeColor="#6b7280"
              defaultOpen={false}
            >
              {settledFriends.map(f => <FriendCard key={f.id} f={f} />)}
            </CollapsibleSection>
          )}
        </>
      )}

      {/* Info Box */}
      <div style={{ marginTop: 30, padding: 15, backgroundColor: "#f0f9ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 16, color: "#1e40af" }}>💡 How Unified Payments Work</h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#333", lineHeight: 1.8 }}>
          <li><strong>One Payment = All Groups:</strong> Mark paid once, updates across ALL shared groups</li>
          <li><strong>Smart Calculation:</strong> Automatically calculates what you owe per group</li>
          <li><strong>Instant UPI:</strong> Pay directly via PhonePe/GPay with amount pre-filled</li>
          <li><strong>Pending Sync:</strong> When you mark paid in Friends, ALL groups show "Pending"</li>
          <li><strong>Confirm Once:</strong> Friend confirms once, balances update everywhere</li>
          <li><strong>Always Current:</strong> Balance reflects all groups you share with this friend</li>
        </ul>
      </div>
    </div>
  );
}