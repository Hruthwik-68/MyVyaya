import { useState, useMemo } from "react";

export interface FilterOptions {
  // User filters
  showOnlyMe?: boolean;
  showOnlyOthers?: boolean;
  specificUser?: string;

  // Amount filters
  minAmount?: number;
  maxAmount?: number;

  // Category filter
  selectedCategories?: string[];

  // Payment status
  showOnlyIPaid?: boolean;
  showOnlyIOwe?: boolean;
  showOnlyTheyOweMe?: boolean;
}

export interface SortOptions {
  field: "date" | "amount" | "category" | "paidBy";
  direction: "asc" | "desc";
}

interface AdvancedFiltersProps {
  currentUserId?: string;
  members: any[];
  categories: { value: string; icon: string }[];
  showName: (uid: string) => string;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
  // ← NEW: Month/Year/Export props
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
  onDeleteAll?: () => void;
}

export default function AdvancedFilters({
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
  onDeleteAll,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter states
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

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 15,
          cursor: "pointer",
          backgroundColor: "#f9fafb",
          borderBottom: isOpen ? "1px solid #e5e7eb" : "none",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#111827" }}>
            Advanced Filters & Sort
          </h3>
          {activeFilterCount > 0 && (
            <span
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#6b7280",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: 20, backgroundColor: "#ffffff" }}>
          
          {/* ← NEW: MONTH/YEAR/EXPORT SECTION (MOVED INSIDE) */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 15 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>
                📅 Time Period & Export ({totalExpenses} expenses)
              </h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select
                  value={filterMonth}
                  onChange={(e) => onMonthChange?.(Number(e.target.value))}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 5,
                    border: "1px solid #d1d5db",
                    fontSize: 13,
                    backgroundColor: "#ffffff",
                    color: "#111827",
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2025, i).toLocaleDateString("en-US", { month: isMobile ? "short" : "long" })}
                    </option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => onYearChange?.(Number(e.target.value))}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 5,
                    border: "1px solid #d1d5db",
                    fontSize: 13,
                    backgroundColor: "#ffffff",
                    color: "#111827",
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - 2 + i}>
                      {new Date().getFullYear() - 2 + i}
                    </option>
                  ))}
                </select>
                {onExportCSV && (
                  <button
                    onClick={onExportCSV}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    📥 Export CSV
                  </button>
                )}
                {onDeleteAll && totalExpenses > 0 && (
                  <button
                    onClick={onDeleteAll}
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    🗑️ Delete All
                  </button>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Date Range:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange?.(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 5,
                  fontSize: 13,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              />
              <span style={{ color: "#6b7280" }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange?.(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 5,
                  fontSize: 13,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    onDateFromChange?.("");
                    onDateToChange?.("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 5,
                    fontSize: 13,
                    cursor: "pointer",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Sort Buttons */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block", color: "#111827" }}>
              📊 Sort By:
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: sortField === field ? "2px solid #3b82f6" : "1px solid #d1d5db",
                    backgroundColor: sortField === field ? "#eff6ff" : "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: sortField === field ? 600 : 400,
                    color: "#111827",
                  }}
                >
                  {icon} {label} {sortField === field && (sortDirection === "asc" ? "↑" : "↓")}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

          {/* Filter Options */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
            
            {/* Column 1: User Filters */}
            {members.length > 1 && (
              <div>
                <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "block", color: "#111827" }}>
                  👥 User Filters:
                </label>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
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
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 14, color: "#374151" }}>Show only MY expenses</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
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
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 14, color: "#374151" }}>Show only OTHERS' expenses</span>
                  </label>

                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 13, marginBottom: 4, display: "block", color: "#6b7280" }}>
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
                        padding: "8px",
                        borderRadius: 5,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        width: "100%",
                        backgroundColor: "#ffffff",
                        color: "#111827",
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

            {/* Column 2: Amount & Payment Filters */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "block", color: "#111827" }}>
                💰 Amount & Payment Filters:
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.length > 1 && (
                  <>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyIPaid || false}
                        onChange={(e) => updateFilter("showOnlyIPaid", e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 14, color: "#374151" }}>Show only expenses I PAID</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyIOwe || false}
                        onChange={(e) => updateFilter("showOnlyIOwe", e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 14, color: "#374151" }}>Show only expenses I OWE</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyTheyOweMe || false}
                        onChange={(e) => updateFilter("showOnlyTheyOweMe", e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 14, color: "#374151" }}>Show only expenses OWED to me</span>
                    </label>
                  </>
                )}

                <div style={{ marginTop: members.length > 1 ? 12 : 0 }}>
                  <label style={{ fontSize: 13, marginBottom: 4, display: "block", color: "#6b7280" }}>
                    Amount Range:
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={filters.minAmount || ""}
                      onChange={(e) => updateFilter("minAmount", e.target.value ? Number(e.target.value) : undefined)}
                      style={{
                        padding: "8px",
                        borderRadius: 5,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        width: "100%",
                        backgroundColor: "#ffffff",
                        color: "#111827",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={filters.maxAmount || ""}
                      onChange={(e) => updateFilter("maxAmount", e.target.value ? Number(e.target.value) : undefined)}
                      style={{
                        padding: "8px",
                        borderRadius: 5,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        width: "100%",
                        backgroundColor: "#ffffff",
                        color: "#111827",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter (Full Width) */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "block", color: "#111827" }}>
              📦 Category Filter:
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                      backgroundColor: isSelected ? "#eff6ff" : "white",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: "#111827",
                    }}
                  >
                    {cat.icon} {cat.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                🗑️ Clear All Filters ({activeFilterCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}