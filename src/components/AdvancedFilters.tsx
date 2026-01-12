// ============================================
// FILTERS MODAL - MODERN POPUP DESIGN
// ✅ Opens as modal instead of collapsible
// ✅ Professional UI with tabs
// ✅ Perfect for mobile/tablet/desktop
// ============================================

import { useState, useMemo } from "react";

export interface FilterOptions {
  showOnlyMe?: boolean;
  showOnlyOthers?: boolean;
  specificUser?: string;
  minAmount?: number;
  maxAmount?: number;
  selectedCategories?: string[];
  showOnlyIPaid?: boolean;
  showOnlyIOwe?: boolean;
  showOnlyTheyOweMe?: boolean;
}

export interface SortOptions {
  field: "date" | "amount" | "category" | "paidBy";
  direction: "asc" | "desc";
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  members: any[];
  categories: { value: string; icon: string }[];
  showName: (uid: string) => string;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
  filterMonth?: number;
  filterYear?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  onExportCSV?: () => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  totalExpenses?: number;
}

export default function FiltersModal({
  isOpen,
  onClose,
  currentUserId,
  members,
  categories,
  showName,
  onFilterChange,
  onSortChange,
  filterMonth = new Date().getMonth(),
  filterYear = new Date().getFullYear(),
  onMonthChange,
  onYearChange,
  onExportCSV,
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
  totalExpenses = 0,
}: FiltersModalProps) {
  const [activeTab, setActiveTab] = useState<"filters" | "sort" | "time">("filters");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortField, setSortField] = useState<"date" | "amount" | "category" | "paidBy">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const isMobile = window.innerWidth < 640;

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const updateSort = (field: typeof sortField) => {
    let newDirection: "asc" | "desc" = "desc";
    
    if (field === sortField) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    onSortChange({ field, direction: newDirection });
  };

  const clearFilters = () => {
    setFilters({});
    setSortField("date");
    setSortDirection("desc");
    onFilterChange({});
    onSortChange({ field: "date", direction: "desc" });
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== undefined && v !== false && 
      (Array.isArray(v) ? v.length > 0 : true)).length;
  }, [filters]);

  if (!isOpen) return null;

  return (
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
        alignItems: isMobile ? "flex-end" : "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: isMobile ? "20px 20px 0 0" : 16,
          width: isMobile ? "100%" : "min(800px, 90vw)",
          maxHeight: isMobile ? "85vh" : "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: isMobile ? "slideUp 0.3s ease-out" : "fadeIn 0.2s ease-out",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white",
            borderRadius: isMobile ? "20px 20px 0 0" : "16px 16px 0 0",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>🔍 Filters & Sort</h2>
            {activeFilterCount > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.9 }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 20,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          {[
            { id: "filters", label: "Filters", icon: "🔍" },
            { id: "sort", label: "Sort", icon: "📊" },
            { id: "time", label: "Time & Export", icon: "📅" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: 15,
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #3b82f6" : "none",
                backgroundColor: activeTab === tab.id ? "white" : "transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                transition: "all 0.2s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* FILTERS TAB */}
          {activeTab === "filters" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* User Filters */}
              {members.length > 1 && (
                <div>
                  <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                    👥 User Filters
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyMe || false}
                        onChange={(e) => {
                          updateFilter("showOnlyMe", e.target.checked);
                          if (e.target.checked) {
                            updateFilter("showOnlyOthers", false);
                            updateFilter("specificUser", undefined);
                          }
                        }}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Show only MY expenses</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyOthers || false}
                        onChange={(e) => {
                          updateFilter("showOnlyOthers", e.target.checked);
                          if (e.target.checked) {
                            updateFilter("showOnlyMe", false);
                            updateFilter("specificUser", undefined);
                          }
                        }}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Show only OTHERS' expenses</span>
                    </label>

                    <div>
                      <label style={{ fontSize: 13, color: "#6b7280", marginBottom: 6, display: "block" }}>
                        Or select specific user:
                      </label>
                      <select
                        value={filters.specificUser || ""}
                        onChange={(e) => {
                          const value = e.target.value || undefined;
                          updateFilter("specificUser", value);
                          if (value) {
                            updateFilter("showOnlyMe", false);
                            updateFilter("showOnlyOthers", false);
                          }
                        }}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          width: "100%",
                          fontSize: 14,
                        }}
                      >
                        <option value="">All users</option>
                        {members.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {showName(m.user_id)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Filters */}
              {members.length > 1 && (
                <div>
                  <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                    💰 Payment Filters
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyIPaid || false}
                        onChange={(e) => updateFilter("showOnlyIPaid", e.target.checked)}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Expenses I PAID</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyIOwe || false}
                        onChange={(e) => updateFilter("showOnlyIOwe", e.target.checked)}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Expenses I OWE</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyTheyOweMe || false}
                        onChange={(e) => updateFilter("showOnlyTheyOweMe", e.target.checked)}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Expenses OWED to me</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Amount Range */}
              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                  💵 Amount Range
                </h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={filters.minAmount || ""}
                    onChange={(e) => updateFilter("minAmount", e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={filters.maxAmount || ""}
                    onChange={(e) => updateFilter("maxAmount", e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                  📦 Categories
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {categories.map((cat) => {
                    const isSelected = filters.selectedCategories?.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        onClick={() => {
                          const current = filters.selectedCategories || [];
                          const updated = isSelected
                            ? current.filter(c => c !== cat.value)
                            : [...current, cat.value];
                          updateFilter("selectedCategories", updated.length > 0 ? updated : undefined);
                        }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 20,
                          border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                          backgroundColor: isSelected ? "#eff6ff" : "white",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {cat.icon} {cat.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SORT TAB */}
          {activeTab === "sort" && (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#111827" }}>
                Sort Expenses By
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { field: "date", icon: "📅", label: "Date" },
                  { field: "amount", icon: "💰", label: "Amount" },
                  { field: "category", icon: "📦", label: "Category" },
                  { field: "paidBy", icon: "👤", label: "Paid By" },
                ].map(({ field, icon, label }) => (
                  <button
                    key={field}
                    onClick={() => updateSort(field as any)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: sortField === field ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      backgroundColor: sortField === field ? "#eff6ff" : "white",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: sortField === field ? 600 : 400,
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{icon} {label}</span>
                    {sortField === field && (
                      <span style={{ fontSize: 18 }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TIME & EXPORT TAB */}
          {activeTab === "time" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Month/Year */}
              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                  📅 Filter by Month
                </h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <select
                    value={filterMonth}
                    onChange={(e) => onMonthChange?.(Number(e.target.value))}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(2025, i).toLocaleDateString("en-US", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterYear}
                    onChange={(e) => onYearChange?.(Number(e.target.value))}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - 2 + i}>
                        {new Date().getFullYear() - 2 + i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                  📆 Custom Date Range
                </h3>
                <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange?.(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  />
                  <span style={{ alignSelf: "center", color: "#6b7280" }}>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange?.(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      onDateFromChange?.("");
                      onDateToChange?.("");
                    }}
                    style={{
                      marginTop: 10,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Clear Date Range
                  </button>
                )}
              </div>

              {/* Export */}
              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#111827" }}>
                  📥 Export Data
                </h3>
                <div style={{ 
                  padding: 16,
                  backgroundColor: "#f9fafb",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}>
                  <p style={{ margin: "0 0 12px", fontSize: 14, color: "#6b7280" }}>
                    {totalExpenses} expenses in current filter
                  </p>
                  {onExportCSV && (
                    <button
                      onClick={() => {
                        onExportCSV();
                        onClose();
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 20px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      📥 Export to CSV
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 20,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: 10,
            backgroundColor: "#f9fafb",
          }}
        >
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                flex: 1,
                padding: "12px 20px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              🗑️ Clear All
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 20px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ✓ Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
