

import { useState, useEffect } from "react";
import { supabase } from "../supabase";

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

interface WishlistModalProps {
  trackerId: string;
  currentUserId: string;
  showName: (uid: string) => string;
  onClose: () => void;
  onSelectItem?: (item: any) => void;
}

export default function WishlistModal({
  trackerId,
  currentUserId,
  showName,
  onClose,
  onSelectItem,
}: WishlistModalProps) {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("General");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [notes, setNotes] = useState("");

  const isMobile = window.innerWidth < 640;

  useEffect(() => {
    loadWishlist();
  }, [trackerId]);

  const loadWishlist = async () => {
    const { data } = await supabase
      .from("wishlist")
      .select("*")
      .eq("tracker_id", trackerId)
      .order("created_at", { ascending: false });

    setWishlistItems(data || []);
  };

  const addItem = async () => {
    if (!itemName.trim()) return alert("Enter item name");

    setLoading(true);

    await supabase.from("wishlist").insert({
      tracker_id: trackerId,
      created_by: currentUserId,
      item_name: itemName,
      category: category,
      estimated_amount: estimatedAmount ? Number(estimatedAmount) : null,
      notes: notes,
      is_purchased: false,
    });

    setItemName("");
    setCategory("General");
    setEstimatedAmount("");
    setNotes("");
    setShowAddForm(false);
    setLoading(false);
    loadWishlist();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;

    await supabase.from("wishlist").delete().eq("id", id);
    loadWishlist();
  };

  const markAsPurchased = async (item: any) => {
    await supabase
      .from("wishlist")
      .update({
        is_purchased: true,
        purchased_by: currentUserId,
        purchased_date: new Date().toISOString(),
      })
      .eq("id", item.id);

    loadWishlist();
  };

  const handleSelectItem = (item: any) => {
    if (onSelectItem) {
      onSelectItem(item);
      onClose();
    }
  };

  const unpurchasedItems = wishlistItems.filter((item) => !item.is_purchased);
  const purchasedItems = wishlistItems.filter((item) => item.is_purchased);

  return (
    // ← NEW: Full-screen overlay
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: isMobile ? 10 : 20,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      {/* ← NEW: Centered modal container */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          maxWidth: 900,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: isMobile ? 15 : 30,
          position: "relative",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 20,
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 10,
          paddingBottom: 15,
          borderBottom: "2px solid #e5e7eb"
        }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26 }}>🎁 Wishlist</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                border: "none",
                padding: isMobile ? "8px 12px" : "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                whiteSpace: "nowrap",
              }}
            >
              {showAddForm ? "✗ Cancel" : "➕ Add Item"}
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: isMobile ? "8px 12px" : "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: 10,
              padding: isMobile ? 12 : 20,
              marginBottom: 20,
              border: "2px solid #e5e7eb",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: 18 }}>✨ Add Wishlist Item</h3>
            <div style={{ display: "grid", gap: 15 }}>
              <input
                type="text"
                placeholder="Item name (e.g., New headphones)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 15,
                  width: "100%",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 15 }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 15,
                  }}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.value}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Estimated amount (optional)"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 15,
                  }}
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 15,
                  minHeight: 80,
                  resize: "vertical",
                }}
              />
              <button
                onClick={addItem}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #16a34a, #059669)",
                  color: "white",
                  border: "none",
                  padding: "14px 24px",
                  borderRadius: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {loading ? "⏳ Adding..." : "💾 Add to Wishlist"}
              </button>
            </div>
          </div>
        )}

        {/* Unpurchased Items */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: 18, marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
            🛒 Pending Items 
            <span style={{ 
              backgroundColor: "#3b82f6", 
              color: "white", 
              padding: "2px 10px", 
              borderRadius: 12, 
              fontSize: 14 
            }}>
              {unpurchasedItems.length}
            </span>
          </h3>
          {unpurchasedItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                color: "#666",
                border: "2px dashed #e5e7eb",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
              <p style={{ margin: 0, fontSize: 15 }}>No items in wishlist yet. Add one above!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {unpurchasedItems.map((item) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "white",
                      border: "2px solid #e5e7eb",
                      borderRadius: 12,
                      padding: isMobile ? 12 : 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 15,
                      flexWrap: isMobile ? "wrap" : "nowrap",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 6 }}>
                        {catInfo?.icon} {item.item_name}
                      </div>
                      <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                        Category: {item.category}
                      </div>
                      {item.estimated_amount && (
                        <div style={{ fontSize: 13, color: "#059669", marginBottom: 4, fontWeight: 600 }}>
                          Estimated: ₹{Number(item.estimated_amount).toFixed(0)}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 4 }}>
                          {item.notes}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                        Added by {showName(item.created_by)} • {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {onSelectItem && (
                        <button
                          onClick={() => handleSelectItem(item)}
                          style={{
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          💸 Use
                        </button>
                      )}
                      <button
                        onClick={() => markAsPurchased(item)}
                        style={{
                          background: "linear-gradient(135deg, #16a34a, #059669)",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ Mark Purchased
                      </button>
                      {item.created_by === currentUserId && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
              ✅ Purchased 
              <span style={{ 
                backgroundColor: "#16a34a", 
                color: "white", 
                padding: "2px 10px", 
                borderRadius: 12, 
                fontSize: 14 
              }}>
                {purchasedItems.length}
              </span>
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {purchasedItems.map((item) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "2px solid #16a34a",
                      borderRadius: 10,
                      padding: 12,
                      opacity: 0.8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: 15, textDecoration: "line-through", color: "#059669" }}>
                          {catInfo?.icon} {item.item_name}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          Purchased by {showName(item.purchased_by)} on{" "}
                          {new Date(item.purchased_date).toLocaleDateString()}
                        </div>
                      </div>
                      {item.created_by === currentUserId && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}