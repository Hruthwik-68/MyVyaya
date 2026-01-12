// ============================================
// EXPENSES TABLE - COMPLETELY REDESIGNED
// ✅ Participants visible on mobile
// ✅ Delete button (only for creator)
// ✅ Pagination (default 10, customizable)
// ✅ Perfect responsive UI
// ============================================

import React, { useState, useMemo } from "react";
import { supabase } from "../../supabase";

interface Props {
  expenses: any[];
  currentUser: any;
  showName: (uid: string) => string;
  onExpenseDeleted?: () => void;
}

export default function ExpensesTable({ 
  expenses, 
  currentUser, 
  showName,
  onExpenseDeleted 
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isMobile = window.innerWidth < 640;
  const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

  // Pagination
  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, endIndex);

  // Reset to page 1 when expenses change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleDelete = async (expenseId: string, createdBy: string) => {
    if (createdBy !== currentUser?.id) {
      alert("⚠️ You can only delete expenses you created!");
      return;
    }

    const confirmDelete = confirm(
      "🗑️ Delete this expense?\n\nThis action cannot be undone!\n\n" +
      "All splits and settlement calculations will be updated."
    );

    if (!confirmDelete) return;

    setDeletingId(expenseId);

    try {
      // Delete expense (cascade will delete splits)
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      alert("✅ Expense deleted successfully!");
      onExpenseDeleted?.();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("❌ Failed to delete expense. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: 60, 
        color: "#666",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
        <h3 style={{ margin: 0, fontSize: 20, color: "#111827" }}>No expenses found</h3>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>
          Try adjusting your filters or add a new expense
        </p>
      </div>
    );
  }

  // MOBILE VIEW
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {currentExpenses.map((exp, index) => {
          const canDelete = exp.created_by === currentUser?.id;
          const isDeleting = deletingId === exp.id;

          return (
            <div
              key={exp.id}
              style={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 15,
                position: "relative",
              }}
            >
              {/* Date Badge */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {new Date(exp.date).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric" 
                })}
              </div>

              {/* Description */}
              <div style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                marginBottom: 8,
                paddingRight: 80,
                color: "#111827",
              }}>
                {exp.description || "No description"}
              </div>

              {/* Category & Amount */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 12,
              }}>
                <div style={{ 
                  fontSize: 13, 
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}>
                  {exp.category || "General"}
                </div>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 700,
                  color: "#dc2626",
                }}>
                  ₹{Number(exp.amount).toFixed(2)}
                </div>
              </div>

              {/* Paid By */}
              <div style={{ 
                fontSize: 13,
                color: "#374151",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span style={{ fontWeight: 600 }}>💰 Paid by:</span>
                <span>{showName(exp.paid_by)}</span>
                {exp.paid_by === currentUser?.id && (
                  <span style={{ 
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    YOU
                  </span>
                )}
              </div>

              {/* ✅ PARTICIPANTS - NOW VISIBLE ON MOBILE */}
              <div style={{ 
                marginBottom: 12,
                paddingTop: 12,
                borderTop: "1px solid #e5e7eb",
              }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: 6,
                }}>
                  👥 Split Between:
                </div>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 6,
                }}>
                  {exp.expense_splits?.map((split: any) => (
                    <div
                      key={split.user_id}
                      style={{
                        backgroundColor: split.user_id === currentUser?.id 
                          ? "#dbeafe" 
                          : "#f3f4f6",
                        border: `1px solid ${split.user_id === currentUser?.id 
                          ? "#3b82f6" 
                          : "#d1d5db"}`,
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      {showName(split.user_id)} ({split.percent}%)
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete Button */}
              {canDelete && (
                <button
                  onClick={() => handleDelete(exp.id, exp.created_by)}
                  disabled={isDeleting}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: isDeleting ? "#9ca3af" : "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {isDeleting ? "⏳ Deleting..." : "🗑️ Delete Expense"}
                </button>
              )}
            </div>
          );
        })}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            marginTop: 20,
            padding: 15,
            backgroundColor: "#f9fafb",
            borderRadius: 10,
            textAlign: "center",
          }}>
            <div style={{ 
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 12,
            }}>
              Page {currentPage} of {totalPages} ({expenses.length} total)
            </div>
            
            <div style={{ 
              display: "flex", 
              gap: 8,
              justifyContent: "center",
              marginBottom: 12,
            }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === 1 ? "#e5e7eb" : "#3b82f6",
                  color: currentPage === 1 ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ⏮️ First
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === 1 ? "#e5e7eb" : "#3b82f6",
                  color: currentPage === 1 ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ◀️ Prev
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === totalPages ? "#e5e7eb" : "#3b82f6",
                  color: currentPage === totalPages ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Next ▶️
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === totalPages ? "#e5e7eb" : "#3b82f6",
                  color: currentPage === totalPages ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Last ⏭️
              </button>
            </div>

            {/* Items per page selector */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
            }}>
              <label style={{ color: "#6b7280" }}>Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  backgroundColor: "white",
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={80}>80</option>
              </select>
              <label style={{ color: "#6b7280" }}>per page</label>
            </div>
          </div>
        )}
      </div>
    );
  }

  // TABLET & DESKTOP VIEW
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr style={{ 
              backgroundColor: "#f9fafb", 
              borderBottom: "2px solid #e5e7eb" 
            }}>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Date
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Description
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Category
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "right", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Amount
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Paid By
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Participants
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "center", 
                fontWeight: 600, 
                fontSize: 14,
                color: "#111827",
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentExpenses.map((exp, index) => {
              const canDelete = exp.created_by === currentUser?.id;
              const isDeleting = deletingId === exp.id;

              return (
                <tr
                  key={exp.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb",
                  }}
                >
                  <td style={{ 
                    padding: "12px", 
                    fontSize: 13,
                    color: "#6b7280",
                  }}>
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    fontSize: 14, 
                    fontWeight: 500,
                    color: "#111827",
                  }}>
                    {exp.description || "No description"}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    fontSize: 13,
                    color: "#6b7280",
                  }}>
                    {exp.category || "General"}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    fontSize: 16, 
                    fontWeight: 600,
                    color: "#dc2626",
                  }}>
                    ₹{Number(exp.amount).toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#111827",
                  }}>
                    {showName(exp.paid_by)}
                    {exp.paid_by === currentUser?.id && (
                      <span style={{ 
                        marginLeft: 8,
                        fontSize: 11,
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>
                        YOU
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ 
                      display: "flex", 
                      flexWrap: "wrap", 
                      gap: 4,
                      maxWidth: 250,
                    }}>
                      {exp.expense_splits?.map((split: any) => (
                        <div
                          key={split.user_id}
                          style={{
                            backgroundColor: split.user_id === currentUser?.id 
                              ? "#dbeafe" 
                              : "#f3f4f6",
                            border: `1px solid ${split.user_id === currentUser?.id 
                              ? "#3b82f6" 
                              : "#d1d5db"}`,
                            padding: "3px 8px",
                            borderRadius: 5,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {showName(split.user_id)} ({split.percent}%)
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {canDelete ? (
                      <button
                        onClick={() => handleDelete(exp.id, exp.created_by)}
                        disabled={isDeleting}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: isDeleting ? "#9ca3af" : "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isDeleting ? "⏳" : "🗑️"}
                      </button>
                    ) : (
                      <span style={{ 
                        fontSize: 12, 
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Desktop Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          marginTop: 20,
          padding: 20,
          backgroundColor: "#f9fafb",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
        }}>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Showing {startIndex + 1}-{Math.min(endIndex, expenses.length)} of {expenses.length} expenses
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage === 1 ? "#e5e7eb" : "#3b82f6",
                color: currentPage === 1 ? "#9ca3af" : "white",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⏮️ First
            </button>
            
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage === 1 ? "#e5e7eb" : "#3b82f6",
                color: currentPage === 1 ? "#9ca3af" : "white",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ◀️ Previous
            </button>

            {/* Page numbers */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: currentPage === pageNum ? "#3b82f6" : "white",
                      color: currentPage === pageNum ? "white" : "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: currentPage === pageNum ? 600 : 400,
                      minWidth: 40,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage === totalPages ? "#e5e7eb" : "#3b82f6",
                color: currentPage === totalPages ? "#9ca3af" : "white",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Next ▶️
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage === totalPages ? "#e5e7eb" : "#3b82f6",
                color: currentPage === totalPages ? "#9ca3af" : "white",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Last ⏭️
            </button>
          </div>

          {/* Items per page */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            fontSize: 14,
          }}>
            <label style={{ color: "#6b7280" }}>Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 14,
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={80}>80</option>
            </select>
            <label style={{ color: "#6b7280" }}>per page</label>
          </div>
        </div>
      )}
    </>
  );
}
