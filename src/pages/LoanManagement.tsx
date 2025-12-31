// ============================================
// LOAN MANAGEMENT - PART 1: IMPORTS & STATES
// Ultra-optimized with DSA, memoization, O(log n) queries
// ============================================

import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

// Types
interface Loan {
  id: string;
  user_id: string;
  type: 'took' | 'gave';
  name: string;
  phone?: string;
  amount: number;
  date: string;
  due_date?: string;
  description?: string;
  interest_rate: number;
  interest_type: 'simple' | 'compound' | 'none';
  interest_amount: number;
  is_repaid: boolean;
  repaid_date?: string;
  repaid_amount: number;
  remaining_amount: number;
  has_installments: boolean;
  installment_frequency?: string;
  total_installments: number;
  paid_installments: number;
  is_private: boolean;
  password_protected: boolean;
  is_shared: boolean;
  share_percentage: number;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface LoanInstallment {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  is_paid: boolean;
  paid_date?: string;
  paid_amount: number;
  notes?: string;
}

interface Analytics {
  total_took_count: number;
  total_took_amount: number;
  total_took_outstanding: number;
  total_took_repaid: number;
  total_gave_count: number;
  total_gave_amount: number;
  total_gave_outstanding: number;
  total_gave_repaid: number;
  total_interest_earned: number;
  total_interest_paid: number;
  net_position: number;
}

export default function LoanManagement() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [addLoanType, setAddLoanType] = useState<'took' | 'gave'>('gave');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    interest_rate: '0',
    interest_type: 'none' as 'simple' | 'compound' | 'none',
    category: 'Personal',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    has_installments: false,
    installment_frequency: 'monthly',
    total_installments: '1',
    is_private: false,
    password_protected: false,
    password: '',
  });

  // Filter & Sort States
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all',
    repaymentStatus: 'all', // all, pending, repaid
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    showPrivate: true,
  });

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name' | 'due_date' | 'remaining'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
const [showFilters, setShowFilters] = useState(false);  // ← ADD THIS LINE
  // Extras Modal States
  const [extrasTab, setExtrasTab] = useState<'analytics' | 'installments' | 'shared' | 'export' | 'privacy'>('analytics');
  
  // Installment States
  const [selectedLoanForInstallments, setSelectedLoanForInstallments] = useState<string | null>(null);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null);

  // Shared Loan States
  const [showSharedLoanModal, setShowSharedLoanModal] = useState(false);
  const [sharedLoanParticipants, setSharedLoanParticipants] = useState<any[]>([]);

  // ============================================
  // LOAD USER & DATA
  // ============================================
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUser(data.user);
    }
  };

  const loadLoans = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading loans:', error);
      return;
    }

    setLoans(data || []);
  };

  const loadInstallments = async () => {
    if (!currentUser) return;

    const loanIds = loans.map(l => l.id);
    if (loanIds.length === 0) return;

    const { data, error } = await supabase
      .from('loan_installments')
      .select('*')
      .in('loan_id', loanIds)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error loading installments:', error);
      return;
    }

    setInstallments(data || []);
  };

  const loadAnalytics = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('loan_analytics')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading analytics:', error);
      return;
    }

    setAnalytics(data);
  };

  // Refresh materialized view
  const refreshAnalytics = async () => {
    await supabase.rpc('refresh_loan_analytics');
    await loadAnalytics();
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([
        loadLoans(),
        loadAnalytics(),
      ]).finally(() => setLoading(false));
    }
  }, [currentUser]);

  useEffect(() => {
    if (loans.length > 0) {
      loadInstallments();
    }
  }, [loans]);

  // ============================================
  // MEMOIZED FILTERS & SORTING (O(n log n) max)
  // ============================================
  const filteredAndSortedLoans = useMemo(() => {
    let result = [...loans];

    // Text search (O(n))
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(loan => 
        loan.name.toLowerCase().includes(searchLower) ||
        loan.description?.toLowerCase().includes(searchLower) ||
        loan.phone?.includes(filters.search)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(loan => loan.category === filters.category);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      result = result.filter(loan => loan.priority === filters.priority);
    }

    // Repayment status filter
    if (filters.repaymentStatus === 'pending') {
      result = result.filter(loan => !loan.is_repaid);
    } else if (filters.repaymentStatus === 'repaid') {
      result = result.filter(loan => loan.is_repaid);
    }

    // Amount range filter
    if (filters.amountMin) {
      result = result.filter(loan => loan.amount >= Number(filters.amountMin));
    }
    if (filters.amountMax) {
      result = result.filter(loan => loan.amount <= Number(filters.amountMax));
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(loan => new Date(loan.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(loan => new Date(loan.date) <= new Date(filters.dateTo));
    }

    // Privacy filter
    if (!filters.showPrivate) {
      result = result.filter(loan => !loan.is_private);
    }

    // Sorting (O(n log n))
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'due_date':
          comparison = (a.due_date ? new Date(a.due_date).getTime() : Infinity) - 
                      (b.due_date ? new Date(b.due_date).getTime() : Infinity);
          break;
        case 'remaining':
          comparison = a.remaining_amount - b.remaining_amount;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [loans, filters, sortBy, sortDirection]);

  // Separate TOOK and GAVE (O(n))
  const tookLoans = useMemo(() => 
    filteredAndSortedLoans.filter(l => l.type === 'took'),
    [filteredAndSortedLoans]
  );

  const gaveLoans = useMemo(() => 
    filteredAndSortedLoans.filter(l => l.type === 'gave'),
    [filteredAndSortedLoans]
  );

  // Repaid loans go to bottom
  const sortedTookLoans = useMemo(() => {
    const pending = tookLoans.filter(l => !l.is_repaid);
    const repaid = tookLoans.filter(l => l.is_repaid);
    return [...pending, ...repaid];
  }, [tookLoans]);

  const sortedGaveLoans = useMemo(() => {
    const pending = gaveLoans.filter(l => !l.is_repaid);
    const repaid = gaveLoans.filter(l => l.is_repaid);
    return [...pending, ...repaid];
  }, [gaveLoans]);

// CONTINUE IN PART 2...

// ============================================
// LOAN MANAGEMENT - PART 2: BUSINESS LOGIC
// All CRUD operations, calculations, and helpers
// ============================================

  // ============================================
  // ADD LOAN
  // ============================================
  const addLoan = async () => {
    if (!formData.name || !formData.amount) {
      alert('Please enter name and amount');
      return;
    }

    setLoading(true);

    const loanData = {
      user_id: currentUser.id,
      type: addLoanType,
      name: formData.name,
      phone: formData.phone || null,
      amount: Number(formData.amount),
      date: formData.date,
      due_date: formData.due_date || null,
      description: formData.description || null,
      interest_rate: Number(formData.interest_rate),
      interest_type: formData.interest_type,
      category: formData.category,
      priority: formData.priority,
      has_installments: formData.has_installments,
      total_installments: formData.has_installments ? Number(formData.total_installments) : 1,
      is_private: formData.is_private,
      password_protected: formData.password_protected,
    };

    const { data: newLoan, error } = await supabase
      .from('loans')
      .insert(loanData)
      .select()
      .single();

    if (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan');
      setLoading(false);
      return;
    }

    // Generate installments if enabled
    if (formData.has_installments && newLoan) {
      await generateInstallmentSchedule(newLoan.id, Number(formData.amount), Number(formData.total_installments), formData.installment_frequency);
    }

    // Refresh data
    await loadLoans();
    await refreshAnalytics();

    // Reset form
    setFormData({
      name: '',
      phone: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      due_date: '',
      description: '',
      interest_rate: '0',
      interest_type: 'none',
      category: 'Personal',
      priority: 'medium',
      has_installments: false,
      installment_frequency: 'monthly',
      total_installments: '1',
      is_private: false,
      password_protected: false,
      password: '',
    });

    setShowAddLoanModal(false);
    setLoading(false);
    alert('Loan added successfully!');
  };

  // ============================================
  // UPDATE LOAN
  // ============================================
  const updateLoan = async () => {
    if (!editingLoan) return;

    setLoading(true);

    const { error } = await supabase
      .from('loans')
      .update({
        name: formData.name,
        phone: formData.phone || null,
        amount: Number(formData.amount),
        date: formData.date,
        due_date: formData.due_date || null,
        description: formData.description || null,
        interest_rate: Number(formData.interest_rate),
        interest_type: formData.interest_type,
        category: formData.category,
        priority: formData.priority,
        is_private: formData.is_private,
      })
      .eq('id', editingLoan.id);

    if (error) {
      console.error('Error updating loan:', error);
      alert('Failed to update loan');
      setLoading(false);
      return;
    }

    await loadLoans();
    await refreshAnalytics();

    setShowEditModal(false);
    setEditingLoan(null);
    setLoading(false);
    alert('Loan updated successfully!');
  };

  // ============================================
  // DELETE LOAN
  // ============================================
  const deleteLoan = async (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (!loan.is_repaid) {
      alert('⚠️ Cannot delete an unpaid loan! Mark as repaid first.');
      return;
    }

    if (!confirm(`Delete loan from "${loan.name}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId);

    if (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan');
      setLoading(false);
      return;
    }

    await loadLoans();
    await refreshAnalytics();
    setLoading(false);
    alert('Loan deleted successfully!');
  };

  // ============================================
  // TOGGLE REPAID
  // ============================================
  const toggleRepaid = async (loanId: string, currentStatus: boolean) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const newStatus = !currentStatus;

    const { error } = await supabase
      .from('loans')
      .update({
        is_repaid: newStatus,
        repaid_date: newStatus ? new Date().toISOString() : null,
        repaid_amount: newStatus ? loan.amount + loan.interest_amount : 0,
      })
      .eq('id', loanId);

    if (error) {
      console.error('Error toggling repaid:', error);
      alert('Failed to update repayment status');
      return;
    }

    await loadLoans();
    await refreshAnalytics();
  };

  // ============================================
  // GENERATE INSTALLMENT SCHEDULE
  // ============================================
  const generateInstallmentSchedule = async (
    loanId: string,
    totalAmount: number,
    numInstallments: number,
    frequency: string
  ) => {
    const installmentAmount = totalAmount / numInstallments;
    const installmentsData = [];

    for (let i = 1; i <= numInstallments; i++) {
      let dueDate = new Date();

      switch (frequency) {
        case 'daily':
          dueDate.setDate(dueDate.getDate() + i);
          break;
        case 'weekly':
          dueDate.setDate(dueDate.getDate() + (i * 7));
          break;
        case 'monthly':
          dueDate.setMonth(dueDate.getMonth() + i);
          break;
        case 'yearly':
          dueDate.setFullYear(dueDate.getFullYear() + i);
          break;
      }

      installmentsData.push({
        loan_id: loanId,
        installment_number: i,
        due_date: dueDate.toISOString(),
        amount: installmentAmount,
      });
    }

    const { error } = await supabase
      .from('loan_installments')
      .insert(installmentsData);

    if (error) {
      console.error('Error generating installments:', error);
    }
  };

  // ============================================
  // MARK PARTIAL PAYMENT
  // ============================================
  const markPartialPayment = async () => {
    if (!selectedInstallment || !partialPaymentAmount) return;

    const amount = Number(partialPaymentAmount);
    if (amount <= 0 || amount > selectedInstallment.amount) {
      alert('Invalid payment amount');
      return;
    }

    const { error } = await supabase
      .from('loan_installments')
      .update({
        is_paid: amount >= selectedInstallment.amount,
        paid_amount: amount,
        paid_date: new Date().toISOString(),
      })
      .eq('id', selectedInstallment.id);

    if (error) {
      console.error('Error marking payment:', error);
      alert('Failed to mark payment');
      return;
    }

    await loadInstallments();
    await loadLoans();
    await refreshAnalytics();

    setShowPartialPaymentModal(false);
    setSelectedInstallment(null);
    setPartialPaymentAmount('');
    alert('Payment recorded successfully!');
  };

  // ============================================
  // CALCULATE INTEREST (Manual trigger)
  // ============================================
  const calculateInterest = useCallback((loan: Loan): number => {
    if (loan.interest_type === 'none' || loan.interest_rate === 0) {
      return 0;
    }

    const years = (new Date().getTime() - new Date(loan.date).getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (loan.interest_type === 'simple') {
      return loan.amount * (loan.interest_rate / 100) * years;
    } else {
      // Compound interest
      return loan.amount * (Math.pow(1 + loan.interest_rate / 100, years) - 1);
    }
  }, []);

  // ============================================
  // EXPORT TO CSV
  // ============================================
  const exportToCSV = useCallback(() => {
    const headers = ['Type', 'Name', 'Phone', 'Amount', 'Interest', 'Remaining', 'Date', 'Due Date', 'Status', 'Category', 'Priority'];
    
    const rows = filteredAndSortedLoans.map(loan => [
      loan.type === 'took' ? 'BORROWED' : 'LENT',
      loan.name,
      loan.phone || 'N/A',
      `₹${loan.amount.toFixed(2)}`,
      `₹${loan.interest_amount.toFixed(2)}`,
      `₹${loan.remaining_amount.toFixed(2)}`,
      new Date(loan.date).toLocaleDateString(),
      loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A',
      loan.is_repaid ? 'REPAID' : 'PENDING',
      loan.category,
      loan.priority.toUpperCase(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [filteredAndSortedLoans]);

  // ============================================
  // EXPORT TO PDF (Basic implementation)
  // ============================================
  const exportToPDF = useCallback(() => {
    // This would require a PDF library like jsPDF
    // For now, we'll create a printable HTML version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loan Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .summary-item { margin: 10px 0; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>💰 Loan Management Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-item"><strong>Total Borrowed:</strong> ₹${analytics?.total_took_amount.toFixed(2) || 0}</div>
          <div class="summary-item"><strong>Total Lent:</strong> ₹${analytics?.total_gave_amount.toFixed(2) || 0}</div>
          <div class="summary-item"><strong>Outstanding (Borrowed):</strong> ₹${analytics?.total_took_outstanding.toFixed(2) || 0}</div>
          <div class="summary-item"><strong>Outstanding (Lent):</strong> ₹${analytics?.total_gave_outstanding.toFixed(2) || 0}</div>
          <div class="summary-item"><strong>Net Position:</strong> ₹${analytics?.net_position.toFixed(2) || 0}</div>
        </div>

        <h2>Detailed Loans</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Interest</th>
              <th>Remaining</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedLoans.map(loan => `
              <tr>
                <td>${loan.type === 'took' ? 'BORROWED' : 'LENT'}</td>
                <td>${loan.name}</td>
                <td>₹${loan.amount.toFixed(2)}</td>
                <td>₹${loan.interest_amount.toFixed(2)}</td>
                <td>₹${loan.remaining_amount.toFixed(2)}</td>
                <td>${new Date(loan.date).toLocaleDateString()}</td>
                <td>${loan.is_repaid ? '✓ REPAID' : '⏳ PENDING'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print PDF</button>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }, [filteredAndSortedLoans, analytics]);

  // ============================================
  // SHARE VIA WHATSAPP
  // ============================================
  const shareViaWhatsApp = useCallback((loan: Loan) => {
    const message = encodeURIComponent(
      `💰 Loan Details\n\n` +
      `Type: ${loan.type === 'took' ? 'BORROWED from' : 'LENT to'} ${loan.name}\n` +
      `Amount: ₹${loan.amount.toFixed(2)}\n` +
      `Interest: ₹${loan.interest_amount.toFixed(2)}\n` +
      `Remaining: ₹${loan.remaining_amount.toFixed(2)}\n` +
      `Date: ${new Date(loan.date).toLocaleDateString()}\n` +
      `Status: ${loan.is_repaid ? 'REPAID ✓' : 'PENDING ⏳'}\n\n` +
      `${loan.description || ''}`
    );

    const phone = loan.phone ? loan.phone.replace(/\D/g, '') : '';
    const url = phone 
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(url, '_blank');
  }, []);

  // ============================================
  // OPEN EDIT MODAL
  // ============================================
  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      name: loan.name,
      phone: loan.phone || '',
      amount: String(loan.amount),
      date: loan.date.split('T')[0],
      due_date: loan.due_date ? loan.due_date.split('T')[0] : '',
      description: loan.description || '',
      interest_rate: String(loan.interest_rate),
      interest_type: loan.interest_type,
      category: loan.category,
      priority: loan.priority,
      has_installments: loan.has_installments,
      installment_frequency: loan.installment_frequency || 'monthly',
      total_installments: String(loan.total_installments),
      is_private: loan.is_private,
      password_protected: loan.password_protected,
      password: '',
    });
    setShowEditModal(true);
  };

  const isMobile = window.innerWidth < 640;

// CONTINUE IN PART 3...

// ============================================
// LOAN MANAGEMENT - PART 3: UI RENDERING (HEADER + ANALYTICS + EXTRAS)
// Clean professional UI with all features in EXTRAS button
// ============================================

  return (
    <div style={{ padding: isMobile ? 10 : 20, maxWidth: 1400, margin: "0 auto" }}>
      
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 15,
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 32, color: "#1f2937" }}>
          💰 TOOK / GAVE Manager
        </h1>
        
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowExtrasModal(true)}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            ⚡ EXTRAS
          </button>
          
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
                  color: "#1f2937",  // ← ADD THIS LINE
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* ANALYTICS SUMMARY CARDS */}
      {/* ============================================ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 15,
        marginBottom: 20,
      }}>
        {/* Total Borrowed */}
        <div style={{
          background: "linear-gradient(135deg, #dc2626, #ef4444)",
          color: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>💸 Total Borrowed</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>₹{analytics?.total_took_amount.toFixed(0) || 0}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            Outstanding: ₹{analytics?.total_took_outstanding.toFixed(0) || 0}
          </div>
        </div>

        {/* Total Lent */}
        <div style={{
          background: "linear-gradient(135deg, #16a34a, #22c55e)",
          color: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>💰 Total Lent</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>₹{analytics?.total_gave_amount.toFixed(0) || 0}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            Outstanding: ₹{analytics?.total_gave_outstanding.toFixed(0) || 0}
          </div>
        </div>

        {/* Net Position */}
        <div style={{
          background: analytics && analytics.net_position >= 0
            ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
            : "linear-gradient(135deg, #f59e0b, #f97316)",
          color: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>📊 Net Position</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>
            {analytics && analytics.net_position >= 0 ? '+' : ''}₹{analytics?.net_position.toFixed(0) || 0}
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            {analytics && analytics.net_position >= 0 ? 'Net Lender' : 'Net Borrower'}
          </div>
        </div>

        {/* Interest */}
        <div style={{
          background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
          color: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>💵 Interest</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>
            ₹{((analytics?.total_interest_earned || 0) - (analytics?.total_interest_paid || 0)).toFixed(0)}
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            Earned: ₹{analytics?.total_interest_earned.toFixed(0) || 0} | Paid: ₹{analytics?.total_interest_paid.toFixed(0) || 0}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTERS & SORT */}
      {/* ============================================ */}
     {/* ============================================ */}
{/* FILTERS & SORT */}
{/* ============================================ */}
<div style={{
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 15,
  marginBottom: 20,
}}>
  {/* Filter Toggle Button */}
  <button
    onClick={() => setShowFilters(!showFilters)}
    style={{
      width: "100%",
      padding: "12px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 15,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>🔍 Filters & Sort</span>
    <span>{showFilters ? '▼ Hide' : '▶ Show'}</span>
  </button>
{/* Collapsible Filter Content */}
  {showFilters && (
    <div style={{ marginTop: 15 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search by name, phone..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        >
          <option value="all">All Categories</option>
          <option value="Personal">Personal</option>
          <option value="Business">Business</option>
          <option value="Emergency">Emergency</option>
          <option value="Investment">Investment</option>
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        >
          <option value="all">All Priorities</option>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🟠 High</option>
          <option value="urgent">🔴 Urgent</option>
        </select>

        {/* Repayment Status */}
        <select
          value={filters.repaymentStatus}
          onChange={(e) => setFilters({ ...filters, repaymentStatus: e.target.value })}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="repaid">✓ Repaid</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        >
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
          <option value="name">Sort: Name</option>
          <option value="due_date">Sort: Due Date</option>
          <option value="remaining">Sort: Remaining</option>
        </select>

        {/* Sort Direction */}
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            backgroundColor: "#fff",
            color: "#1f2937",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </button>
      </div>

      {/* Amount Range */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>Amount Range:</span>
        <input
          type="number"
          placeholder="Min ₹"
          value={filters.amountMin}
          onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            width: 120,
            fontSize: 14,
          }}
        />
        <span style={{ color: "#1f2937" }}>to</span>
        <input
          type="number"
          placeholder="Max ₹"
          value={filters.amountMax}
          onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            width: 120,
            fontSize: 14,
          }}
        />

        <button
          onClick={() => setFilters({
            search: '',
            category: 'all',
            priority: 'all',
            repaymentStatus: 'all',
            amountMin: '',
            amountMax: '',
            dateFrom: '',
            dateTo: '',
            showPrivate: true,
          })}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          🗑️ Clear Filters
        </button>
      </div>
    </div>
  )}
</div>
  

      {/* ============================================ */}
      {/* ADD LOAN MODAL */}
      {/* ============================================ */}
      {showAddLoanModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: 20,
        }} onClick={() => setShowAddLoanModal(false)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 30,
            maxWidth: 600,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 20 }}>
              {addLoanType === 'took' ? '💸 Add Borrowed Loan' : '💰 Add Lent Loan'}
            </h2>

            <div style={{ display: "grid", gap: 15 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Person/Entity name"
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="50000"
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Due Date (Optional)</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Purpose of loan..."
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Interest Rate (%)</label>
                  <input
                    type="number"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    placeholder="0"
                    step="0.1"
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Interest Type</label>
                  <select
                    value={formData.interest_type}
                    onChange={(e) => setFormData({ ...formData, interest_type: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="none">No Interest</option>
                    <option value="simple">Simple Interest</option>
                    <option value="compound">Compound Interest</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.has_installments}
                    onChange={(e) => setFormData({ ...formData, has_installments: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontWeight: 600 }}>Enable Installments (EMI)</span>
                </label>
              </div>

              {formData.has_installments && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, padding: 15, backgroundColor: "#f9fafb", borderRadius: 8 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Total Installments</label>
                    <input
                      type="number"
                      value={formData.total_installments}
                      onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                      min="2"
                      style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Frequency</label>
                    <select
                      value={formData.installment_frequency}
                      onChange={(e) => setFormData({ ...formData, installment_frequency: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.is_private}
                    onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontWeight: 600 }}>🔒 Mark as Private</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 25 }}>
              <button
                onClick={addLoan}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: loading ? "#ccc" : "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {loading ? "Adding..." : "✓ Add Loan"}
              </button>

              <button
                onClick={() => setShowAddLoanModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* EDIT LOAN MODAL */}
      {/* ============================================ */}
      {showEditModal && editingLoan && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: 20,
        }} onClick={() => setShowEditModal(false)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 30,
            maxWidth: 600,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 20 }}>✏️ Edit Loan</h2>

            <div style={{ display: "grid", gap: 15 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 25 }}>
              <button
                onClick={updateLoan}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: loading ? "#ccc" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {loading ? "Updating..." : "✓ Update"}
              </button>

              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{/* CONTINUE TO EXTRAS MODAL... */}


      {/* ============================================ */}
      {/* MAIN CONTENT: TOOK (LEFT) | GAVE (RIGHT) */}
      {/* ============================================ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 20,
        marginBottom: 20,
      }}>
        
        {/* ============================================ */}
        {/* TOOK SECTION (BORROWED) */}
        {/* ============================================ */}
        <div style={{
          backgroundColor: "#fff",
          border: "2px solid #dc2626",
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#dc2626" }}>💸 TOOK ({sortedTookLoans.length})</h2>
            <button
              onClick={() => {
                setAddLoanType('took');
                setShowAddLoanModal(true);
              }}
              style={{
                background: "linear-gradient(135deg, #dc2626, #ef4444)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              + Add
            </button>
          </div>

          {loading && sortedTookLoans.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p>Loading...</p>
            </div>
          ) : sortedTookLoans.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p>No borrowed loans</p>
            </div>
          ) : (
            <div style={{ maxHeight: isMobile ? "none" : 600, overflowY: "auto" }}>
              {sortedTookLoans.map((loan) => (
                <div
                  key={loan.id}
                  style={{
                    backgroundColor: loan.is_repaid ? "#f9fafb" : "#fff",
                    border: `1px solid ${loan.is_repaid ? "#d1d5db" : "#fca5a5"}`,
                    borderRadius: 8,
                    padding: 15,
                    marginBottom: 12,
                    textDecoration: loan.is_repaid ? "line-through" : "none",
                    opacity: loan.is_repaid ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
                        {loan.name}
                        {loan.is_private && <span style={{ marginLeft: 8, fontSize: 12, color: "#7c3aed" }}>🔒</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        {loan.phone && <span>📱 {loan.phone}</span>}
                        {loan.category && <span style={{ marginLeft: 10 }}>📦 {loan.category}</span>}
                      </div>
                    </div>
                    
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={loan.is_repaid}
                        onChange={() => toggleRepaid(loan.id, loan.is_repaid)}
                        style={{ width: 20, height: 20, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: loan.is_repaid ? "#16a34a" : "#6b7280" }}>
                        {loan.is_repaid ? "Repaid" : "Pending"}
                      </span>
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Amount</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#dc2626" }}>₹{loan.amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Interest</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#f97316" }}>₹{loan.interest_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Remaining</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#dc2626" }}>₹{loan.remaining_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Date</div>
                      <div style={{ fontSize: 13 }}>{new Date(loan.date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {loan.description && (
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, fontStyle: "italic" }}>
                      "{loan.description}"
                    </div>
                  )}

                  {loan.has_installments && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                        Installments: {loan.paid_installments}/{loan.total_installments}
                      </div>
                      <div style={{ width: "100%", height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          width: `${(loan.paid_installments / loan.total_installments) * 100}%`,
                          height: "100%",
                          backgroundColor: "#22c55e",
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => openEditModal(loan)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      ✏️ Edit
                    </button>
                    
                    {loan.is_repaid && (
                      <button
                        onClick={() => deleteLoan(loan.id)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                    
                    {loan.phone && (
                      <button
                        onClick={() => shareViaWhatsApp(loan)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        📱 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* GAVE SECTION (LENT) */}
        {/* ============================================ */}
        <div style={{
          backgroundColor: "#fff",
          border: "2px solid #16a34a",
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#16a34a" }}>💰 GAVE ({sortedGaveLoans.length})</h2>
            <button
              onClick={() => {
                setAddLoanType('gave');
                setShowAddLoanModal(true);
              }}
              style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              + Add
            </button>
          </div>

          {loading && sortedGaveLoans.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p>Loading...</p>
            </div>
          ) : sortedGaveLoans.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p>No lent loans</p>
            </div>
          ) : (
            <div style={{ maxHeight: isMobile ? "none" : 600, overflowY: "auto" }}>
              {sortedGaveLoans.map((loan) => (
                <div
                  key={loan.id}
                  style={{
                    backgroundColor: loan.is_repaid ? "#f9fafb" : "#fff",
                    border: `1px solid ${loan.is_repaid ? "#d1d5db" : "#86efac"}`,
                    borderRadius: 8,
                    padding: 15,
                    marginBottom: 12,
                    textDecoration: loan.is_repaid ? "line-through" : "none",
                    opacity: loan.is_repaid ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
                        {loan.name}
                        {loan.is_private && <span style={{ marginLeft: 8, fontSize: 12, color: "#7c3aed" }}>🔒</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        {loan.phone && <span>📱 {loan.phone}</span>}
                        {loan.category && <span style={{ marginLeft: 10 }}>📦 {loan.category}</span>}
                      </div>
                    </div>
                    
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={loan.is_repaid}
                        onChange={() => toggleRepaid(loan.id, loan.is_repaid)}
                        style={{ width: 20, height: 20, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: loan.is_repaid ? "#16a34a" : "#6b7280" }}>
                        {loan.is_repaid ? "Repaid" : "Pending"}
                      </span>
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Amount</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#16a34a" }}>₹{loan.amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Interest</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#22c55e" }}>₹{loan.interest_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Remaining</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#16a34a" }}>₹{loan.remaining_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Date</div>
                      <div style={{ fontSize: 13 }}>{new Date(loan.date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {loan.description && (
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, fontStyle: "italic" }}>
                      "{loan.description}"
                    </div>
                  )}

                  {loan.has_installments && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                        Installments: {loan.paid_installments}/{loan.total_installments}
                      </div>
                      <div style={{ width: "100%", height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          width: `${(loan.paid_installments / loan.total_installments) * 100}%`,
                          height: "100%",
                          backgroundColor: "#22c55e",
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => openEditModal(loan)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      ✏️ Edit
                    </button>
                    
                    {loan.is_repaid && (
                      <button
                        onClick={() => deleteLoan(loan.id)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                    
                    {loan.phone && (
                      <button
                        onClick={() => shareViaWhatsApp(loan)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        📱 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* EXTRAS MODAL */}
      {/* ============================================ */}
      {showExtrasModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: 20,
        }} onClick={() => setShowExtrasModal(false)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 30,
            maxWidth: 900,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 20 }}>⚡ EXTRAS</h2>
            
            {/* Tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap"}}>
            {['analytics', 'installments', 'export', 'privacy'].map(tab => (
  <button
    key={tab}
    onClick={() => setExtrasTab(tab as any)}
    style={{
      padding: "10px 20px",
      border: extrasTab === tab ? "2px solid #7c3aed" : "1px solid #d1d5db",
      backgroundColor: extrasTab === tab ? "#eff6ff" : "white",
      color: "#1f2937",  // ← ADD THIS LINE
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: extrasTab === tab ? 600 : 400,
    }}
  >
                  {tab === 'analytics' && '📊 Analytics'}
                  {tab === 'installments' && '🎯 Installments'}
                  {tab === 'export' && '📤 Export'}
                  {tab === 'privacy' && '🔒 Privacy'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div>
              {extrasTab === 'analytics' && (
                <div>
                  <h3>📊 Analytics Dashboard</h3>
                  <div style={{ display: "grid", gap: 15, marginTop: 20 }}>
                    <div style={{ padding: 15, backgroundColor: "#f9fafb", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 5 }}>Total Loans</div>
                      <div style={{ fontSize: 24, fontWeight: "bold" }}>{loans.length}</div>
                    </div>
                    <div style={{ padding: 15, backgroundColor: "#fef2f2", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 5 }}>Total Borrowed</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#dc2626" }}>₹{analytics?.total_took_amount.toFixed(2) || 0}</div>
                    </div>
                    <div style={{ padding: 15, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 5 }}>Total Lent</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#16a34a" }}>₹{analytics?.total_gave_amount.toFixed(2) || 0}</div>
                    </div>
                    <div style={{ padding: 15, backgroundColor: "#eff6ff", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 5 }}>Net Position</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: analytics && analytics.net_position >= 0 ? "#16a34a" : "#dc2626" }}>
                        {analytics && analytics.net_position >= 0 ? '+' : ''}₹{analytics?.net_position.toFixed(2) || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {extrasTab === 'installments' && (
                <div>
                  <h3>🎯 Installments Manager</h3>
                  <p style={{ color: "#6b7280", marginBottom: 20 }}>
                    Loans with installments: {loans.filter(l => l.has_installments).length}
                  </p>
                  {installments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                      <p>No installments to display</p>
                    </div>
                  ) : (
                    installments.slice(0, 10).map(inst => (
                      <div key={inst.id} style={{ padding: 15, border: "1px solid #e5e7eb", marginBottom: 10, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>Installment #{inst.installment_number}</div>
                          <div style={{ fontSize: 13, color: inst.is_paid ? "#16a34a" : "#f97316" }}>
                            {inst.is_paid ? '✓ Paid' : '⏳ Pending'}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, color: "#6b7280" }}>
                          Amount: ₹{inst.amount.toFixed(2)} | Due: {new Date(inst.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {extrasTab === 'export' && (
                <div>
                  <h3>📤 Export & Share</h3>
                  <div style={{ display: "grid", gap: 15, marginTop: 20 }}>
                    <button
                      onClick={exportToCSV}
                      style={{
                        padding: "16px",
                        backgroundColor: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      📥 Export to CSV
                    </button>
                    
                    <button
                      onClick={exportToPDF}
                      style={{
                        padding: "16px",
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      📄 Export to PDF (Print)
                    </button>

                    <div style={{ padding: 15, backgroundColor: "#f9fafb", borderRadius: 8, marginTop: 10 }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
                        💡 Tip: Use WhatsApp button on individual loans to share details directly!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {extrasTab === 'privacy' && (
                <div>
                  <h3>🔒 Privacy Settings</h3>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 15, backgroundColor: "#f9fafb", borderRadius: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.showPrivate}
                        onChange={(e) => setFilters({ ...filters, showPrivate: e.target.checked })}
                        style={{ width: 20, height: 20 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>Show private loans</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                          Private loans are marked with 🔒 and hidden from summary when unchecked
                        </div>
                      </div>
                    </label>

                    <div style={{ marginTop: 20, padding: 15, backgroundColor: "#eff6ff", borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>💡 Privacy Tips:</div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#6b7280" }}>
                        <li>Mark sensitive loans as private when adding/editing</li>
                        <li>Private loans won't appear in analytics when hidden</li>
                        <li>Repaid private loans can still be deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowExtrasModal(false)}
              style={{
                marginTop: 20,
                padding: "12px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                width: "100%",
                fontSize: 16,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

