import { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CustomBudgetCategoriesProps {
  trackerId: string;
  userId: string;
  onCategoriesChange: () => void;
}

const DEFAULT_ICONS = ["📦", "💰", "🎯", "🎨", "🎮", "🏠", "🚗", "📚", "🏋️", "🎵", "🐶", "🌱", "💼", "🔧", "⚡"];
const DEFAULT_COLORS = ["#ff6b6b", "#4ecdc4", "#95e1d3", "#f7b731", "#5f27cd", "#00d2d3", "#ff6348", "#a29bfe", "#8b5cf6", "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1"];

export default function CustomBudgetCategories({
  trackerId,
  userId,
  onCategoriesChange,
}: CustomBudgetCategoriesProps) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newColor, setNewColor] = useState("#a29bfe");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomCategories();
  }, [trackerId]);

  const loadCustomCategories = async () => {
    const { data } = await supabase
      .from("custom_categories")
      .select("*")
      .eq("tracker_id", trackerId)
      .order("created_at", { ascending: true });

    setCustomCategories(data || []);
  };

  const addCustomCategory = async () => {
    if (!newName.trim()) {
      alert("Please enter a category name");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("custom_categories")
        .insert({
          tracker_id: trackerId,
          user_id: userId,
          name: newName.trim(),
          icon: newIcon,
          color: newColor,
        });

      if (error) {
        if (error.code === "23505") {
          alert("❌ A category with this name already exists!");
        } else {
          throw error;
        }
      } else {
        alert("✅ Custom category added!");
        setNewName("");
        setNewIcon("📦");
        setNewColor("#a29bfe");
        setShowAddForm(false);
        await loadCustomCategories();
        onCategoriesChange();
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("❌ Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomCategory = async (id: string, name: string) => {
    if (!confirm(`Delete custom category "${name}"?\n\nThis will NOT delete existing expenses in this category.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("✅ Category deleted!");
      await loadCustomCategories();
      onCategoriesChange();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("❌ Failed to delete category");
    }
  };

  const isMobile = window.innerWidth < 640;

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "2px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>
          ✨ Custom Categories {customCategories.length > 0 && `(${customCategories.length})`}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: "8px 16px",
            backgroundColor: showAddForm ? "#6b7280" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {showAddForm ? "✕ Cancel" : "➕ Add Custom"}
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#666", marginBottom: 15 }}>
        💡 Add your own categories in addition to the default ones
      </p>

      {/* Add Custom Category Form */}
      {showAddForm && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "2px solid #3b82f6",
            borderRadius: 10,
            padding: 15,
            marginBottom: 15,
          }}
        >
          <h4 style={{ marginTop: 0, fontSize: 15 }}>Add New Category</h4>
          
          <div style={{ display: "grid", gap: 12 }}>
            {/* Category Name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>
                Category Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Rent, Education, Pets"
                maxLength={30}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>
                Icon
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DEFAULT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    style={{
                      padding: "8px 12px",
                      fontSize: 18,
                      borderRadius: 6,
                      border: newIcon === icon ? "2px solid #3b82f6" : "1px solid #ddd",
                      backgroundColor: newIcon === icon ? "#eff6ff" : "white",
                      cursor: "pointer",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>
                Color
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: newColor === color ? "3px solid #000" : "1px solid #ddd",
                      backgroundColor: color,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div
              style={{
                padding: "12px",
                backgroundColor: "white",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            >
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Preview:</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor: newColor + "20",
                  border: `2px solid ${newColor}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{newIcon}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {newName || "Category Name"}
                </span>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={addCustomCategory}
              disabled={loading || !newName.trim()}
              style={{
                padding: "12px 20px",
                backgroundColor: loading || !newName.trim() ? "#ccc" : "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: loading || !newName.trim() ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {loading ? "⏳ Adding..." : "✅ Add Category"}
            </button>
          </div>
        </div>
      )}

      {/* Custom Categories List */}
      {customCategories.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {customCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                backgroundColor: cat.color + "20",
                border: `2px solid ${cat.color}`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{cat.name}</span>
              </div>
              <button
                onClick={() => deleteCustomCategory(cat.id, cat.name)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 30,
            backgroundColor: "#f9fafb",
            borderRadius: 10,
            border: "2px dashed #e5e7eb",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>✨</div>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            No custom categories yet. Click "Add Custom" to create one!
          </p>
        </div>
      )}
    </div>
  );
}