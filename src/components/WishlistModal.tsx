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
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1001 }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 800, width: "95%", maxHeight: "85vh" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>🎁 Wishlist</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 5,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {showAddForm ? "✗ Cancel" : "➕ Add Item"}
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: 10,
              padding: 15,
              marginBottom: 20,
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Add Wishlist Item</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                type="text"
                placeholder="Item name (e.g., New headphones)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: 5,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: 5,
                    border: "1px solid #ddd",
                    fontSize: 14,
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
                    padding: "10px",
                    borderRadius: 5,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: 5,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  minHeight: 60,
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
                  padding: "10px 20px",
                  borderRadius: 5,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {loading ? "Adding..." : "💾 Add to Wishlist"}
              </button>
            </div>
          </div>
        )}

        {/* Unpurchased Items */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>
            🛒 Pending Items ({unpurchasedItems.length})
          </h3>
          {unpurchasedItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                color: "#666",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎁</div>
              <p style={{ margin: 0 }}>No items in wishlist yet. Add one above!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {unpurchasedItems.map((item) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "white",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: isMobile ? "wrap" : "nowrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: "bold", fontSize: 15, marginBottom: 4 }}>
                        {catInfo?.icon} {item.item_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                        Category: {item.category}
                      </div>
                      {item.estimated_amount && (
                        <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                          Estimated: ₹{Number(item.estimated_amount).toFixed(0)}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 12, color: "#666", fontStyle: "italic" }}>
                          {item.notes}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                        Added by {showName(item.created_by)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {onSelectItem && (
                        <button
                          onClick={() => handleSelectItem(item)}
                          style={{
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 12,
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
                          padding: "6px 12px",
                          borderRadius: 5,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ Mark
                      </button>
                      {item.created_by === currentUserId && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 12,
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
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>
              ✓ Purchased ({purchasedItems.length})
            </h3>
            <div style={{ display: "grid", gap: 8 }}>
              {purchasedItems.map((item) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "2px solid #16a34a",
                      borderRadius: 8,
                      padding: 10,
                      opacity: 0.7,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: 14, textDecoration: "line-through" }}>
                          {catInfo?.icon} {item.item_name}
                        </div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
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
                            padding: "4px 8px",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 11,
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

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: 5,
            cursor: "pointer",
            width: "100%",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}