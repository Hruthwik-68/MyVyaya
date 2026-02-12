// ============================================
// EXPENSES TABLE - DARK THEME
// ============================================

import React, { useState } from "react";
import { supabase } from "../../supabase";
import { Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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
        color: "#94a3b8",
        background: "rgba(30, 41, 59, 0.4)",
        borderRadius: 16,
        border: "1px dashed rgba(148, 163, 184, 0.2)"
      }}>
        <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.7 }}>📭</div>
        <h3 style={{ margin: 0, fontSize: 18, color: "#e2e8f0" }}>No expenses found</h3>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#64748b" }}>
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
                background: "rgba(30, 41, 59, 0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 16,
                padding: 16,
                position: "relative",
              }}
            >
              {/* Date Badge */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(33, 150, 196, 0.15)",
                  color: "#38bdf8",
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid rgba(33, 150, 196, 0.2)"
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
                color: "#f1f5f9",
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
                  fontSize: 12,
                  color: "#94a3b8",
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(148, 163, 184, 0.1)"
                }}>
                  {exp.category || "General"}
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f87171", // Red for expense
                }}>
                  ₹{Number(exp.amount).toFixed(2)}
                </div>
              </div>

              {/* Paid By */}
              <div style={{
                fontSize: 13,
                color: "#cbd5e1",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span style={{ fontWeight: 600, color: "#64748b" }}>Paid by:</span>
                <span>{showName(exp.paid_by)}</span>
                {exp.paid_by === currentUser?.id && (
                  <span style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    YOU
                  </span>
                )}
              </div>

              {/* PARTICIPANTS */}
              <div style={{
                marginBottom: 12,
                paddingTop: 12,
                borderTop: "1px solid rgba(148, 163, 184, 0.1)",
              }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  Split Between:
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
                        background: split.user_id === currentUser?.id
                          ? "rgba(33, 150, 196, 0.15)"
                          : "rgba(15, 23, 42, 0.6)",
                        border: `1px solid ${split.user_id === currentUser?.id
                          ? "rgba(33, 150, 196, 0.3)"
                          : "rgba(148, 163, 184, 0.1)"}`,
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: split.user_id === currentUser?.id ? "#38bdf8" : "#94a3b8",
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
                    background: isDeleting ? "rgba(148, 163, 184, 0.2)" : "rgba(220, 38, 38, 0.15)",
                    color: isDeleting ? "#94a3b8" : "#f87171",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    borderRadius: 8,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s"
                  }}
                >
                  <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete Expense"}
                </button>
              )}
            </div>
          );
        })}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div style={{
            marginTop: 20,
            padding: 16,
            background: "rgba(30, 41, 59, 0.4)",
            borderRadius: 12,
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 13,
              color: "#94a3b8",
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
                className="pagination-btn"
                style={{
                  padding: "8px",
                  background: currentPage === 1 ? "rgba(255,255,255,0.05)" : "rgba(33, 150, 196, 0.15)",
                  color: currentPage === 1 ? "#64748b" : "#38bdf8",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
                style={{
                  padding: "8px",
                  background: currentPage === 1 ? "rgba(255,255,255,0.05)" : "rgba(33, 150, 196, 0.15)",
                  color: currentPage === 1 ? "#64748b" : "#38bdf8",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                style={{
                  padding: "8px",
                  background: currentPage === totalPages ? "rgba(255,255,255,0.05)" : "rgba(33, 150, 196, 0.15)",
                  color: currentPage === totalPages ? "#64748b" : "#38bdf8",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                style={{
                  padding: "8px",
                  background: currentPage === totalPages ? "rgba(255,255,255,0.05)" : "rgba(33, 150, 196, 0.15)",
                  color: currentPage === totalPages ? "#64748b" : "#38bdf8",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // TABLET & DESKTOP VIEW
  return (
    <>
      <div style={{
        overflowX: "auto",
        background: "rgba(30, 41, 59, 0.4)",
        borderRadius: 16,
        border: "1px solid rgba(148, 163, 184, 0.1)"
      }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
            }}>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
              <th style={{ padding: "16px", textAlign: "right", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid By</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participants</th>
              <th style={{ padding: "16px", textAlign: "center", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
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
                    borderBottom: "1px solid rgba(148, 163, 184, 0.05)",
                    background: index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <td style={{ padding: "16px", fontSize: 13, color: "#94a3b8" }}>
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px", fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>
                    {exp.description || "No description"}
                  </td>
                  <td style={{ padding: "16px", fontSize: 13, color: "#94a3b8" }}>
                    {exp.category || "General"}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right", fontSize: 15, fontWeight: 600, color: "#f87171" }}>
                    ₹{Number(exp.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: "16px", fontSize: 14, color: "#cbd5e1" }}>
                    {showName(exp.paid_by)}
                    {exp.paid_by === currentUser?.id && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 10,
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        YOU
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 300 }}>
                      {exp.expense_splits?.map((split: any) => (
                        <div
                          key={split.user_id}
                          style={{
                            background: split.user_id === currentUser?.id ? "rgba(33, 150, 196, 0.15)" : "rgba(15, 23, 42, 0.6)",
                            border: `1px solid ${split.user_id === currentUser?.id ? "rgba(33, 150, 196, 0.3)" : "rgba(148, 163, 184, 0.1)"}`,
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500,
                            color: split.user_id === currentUser?.id ? "#38bdf8" : "#94a3b8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {showName(split.user_id)} ({split.percent}%)
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    {canDelete ? (
                      <button
                        onClick={() => handleDelete(exp.id, exp.created_by)}
                        disabled={isDeleting}
                        style={{
                          padding: "6px 10px",
                          background: isDeleting ? "rgba(148, 163, 184, 0.2)" : "rgba(220, 38, 38, 0.15)",
                          color: isDeleting ? "#94a3b8" : "#f87171",
                          border: "none",
                          borderRadius: 6,
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          transition: "all 0.2s"
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>—</span>
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
          padding: 16,
          background: "rgba(30, 41, 59, 0.4)",
          borderRadius: 12,
          border: "1px solid rgba(148, 163, 184, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
        }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            Showing {startIndex + 1}-{Math.min(endIndex, expenses.length)} of {expenses.length} expenses
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: "6px 10px",
                background: currentPage === 1 ? "transparent" : "rgba(33, 150, 196, 0.15)",
                color: currentPage === 1 ? "#475569" : "#38bdf8",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 6,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronsLeft size={14} />
            </button>

            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 10px",
                background: currentPage === 1 ? "transparent" : "rgba(33, 150, 196, 0.15)",
                color: currentPage === 1 ? "#475569" : "#38bdf8",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 6,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronLeft size={14} />
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
                      padding: "6px 12px",
                      background: currentPage === pageNum ? "#38bdf8" : "transparent",
                      color: currentPage === pageNum ? "white" : "#94a3b8",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: currentPage === pageNum ? 600 : 400,
                      minWidth: 32,
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
                padding: "6px 10px",
                background: currentPage === totalPages ? "transparent" : "rgba(33, 150, 196, 0.15)",
                color: currentPage === totalPages ? "#475569" : "#38bdf8",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 6,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 10px",
                background: currentPage === totalPages ? "transparent" : "rgba(33, 150, 196, 0.15)",
                color: currentPage === totalPages ? "#475569" : "#38bdf8",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: 6,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronsRight size={14} />
            </button>
          </div>

          {/* Items per page */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#94a3b8"
          }}>
            <label>Show:</label>
            <div style={{ position: "relative" }}>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "4px 24px 4px 8px",
                  borderRadius: 6,
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  fontSize: 13,
                  background: "rgba(15, 23, 42, 0.6)",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  appearance: "none"
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={80}>80</option>
              </select>
              <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10 }}>▼</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
