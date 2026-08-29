import React, { useState } from 'react';
import { Landmark, Plus, Search, Edit, Trash2, X, Percent, CreditCard, Lock, Languages, RefreshCw, Calendar, AlertTriangle, Receipt } from 'lucide-react';
import { transliterateText } from '../utils/marathiTransliterate';
import { createRecord, deleteRecord, updateRecord } from '../services/supabase';
import { calculateBankFDSummary, deriveYearFromDate } from '../utils/ledger';

const YEARS = ['2026-27', '2025-26', '2024-25', '2027-28', '2023-24'];

export default function BankModule({ isAdmin, activeYear, onUpdate, data = {} }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('deposit'); // 'deposit', 'renew', 'interest', 'withdrawal', 'fd_expense', 'charge'
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('7.5');
  const [expectedReturns, setExpectedReturns] = useState('');
  const [bankName, setBankName] = useState('Mandal Bank FD Account');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordYear, setRecordYear] = useState(activeYear);
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');

  const fdList = Array.isArray(data.bank_fd) ? data.bank_fd : [];
  const fdSummary = calculateBankFDSummary(fdList);

  const filtered = fdList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          (item.bank_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (item.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDateChange = (dateVal) => {
    setDate(dateVal);
    const derived = deriveYearFromDate(dateVal, activeYear);
    setRecordYear(derived);
  };

  const openForm = (item = null) => {
    if (!isAdmin) return;
    if (item && item.is_locked) {
      alert('Official Audit Bank Record is non-editable!');
      return;
    }
    if (item) {
      setEditItem(item);
      setTitle(item.title);
      setType(item.type || 'deposit');
      setAmount(item.amount);
      setInterestRate(item.interest_rate || '7.5');
      setExpectedReturns(item.expected_returns || '');
      setBankName(item.bank_name || 'Mandal Bank FD Account');
      setDate(item.date);
      setRecordYear(item.year || activeYear);
      setExpiryDate(item.expiry_date || '');
      setNote(item.note || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setEditItem(null);
      setTitle('');
      setType('deposit');
      setAmount('');
      setInterestRate('7.5');
      setExpectedReturns('');
      setBankName('Mandal Bank FD Account');
      setDate(today);
      setRecordYear(deriveYearFromDate(today, activeYear));
      // Default expiry date 1 year from now
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(nextYear.toISOString().split('T')[0]);
      setNote('');
    }
    setShowModal(true);
  };

  const handleAmountRateChange = (amtVal, rateVal) => {
    setAmount(amtVal);
    setInterestRate(rateVal);
    const numAmt = Number(amtVal);
    const numRate = Number(rateVal);
    if (!isNaN(numAmt) && numAmt > 0 && !isNaN(numRate) && numRate > 0) {
      const expInterest = Math.round(numAmt * (numRate / 100));
      setExpectedReturns(numAmt + expInterest);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      alert('Title and amount are required!');
      return;
    }

    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Enter a valid amount!');
      return;
    }

    const payload = {
      title: title.trim(),
      type,
      year: recordYear || deriveYearFromDate(date, activeYear),
      amount: numAmt,
      interest_rate: Number(interestRate) || 0,
      expected_returns: Number(expectedReturns) || numAmt,
      bank_name: bankName.trim(),
      date,
      expiry_date: expiryDate || null,
      note: note.trim()
    };

    setIsSaving(true);
    try {
      const record = editItem
        ? await updateRecord('bank_fd', editItem.id, payload)
        : await createRecord('bank_fd', payload);
      onUpdate?.({ table: 'bank_fd', eventType: 'UPSERT', record });

      // Keep the existing FD-expense feature, but make both server writes
      // explicit and awaited. A failed companion expense rolls back the just
      // created Bank FD row so an incomplete transaction is not left behind.
      if (!editItem && type === 'fd_expense') {
        try {
          const expenseRecord = await createRecord('kharch', {
            title: `[FD Withdrawal Expense] ${payload.title}`,
            category: 'Miscellaneous Expenses',
            year: payload.year,
            amount: payload.amount,
            date: payload.date,
            payment_mode: 'Online',
            note: `Auto-recorded from Bank FD withdrawal for expense: ${payload.note || ''}`.trim()
          });
          onUpdate?.({ table: 'kharch', eventType: 'UPSERT', record: expenseRecord });
        } catch (expenseError) {
          try {
            await deleteRecord('bank_fd', record.id);
            onUpdate?.({ table: 'bank_fd', eventType: 'DELETE', id: record.id });
          } catch (rollbackError) {
            console.error('Could not roll back incomplete FD expense:', rollbackError);
          }
          throw new Error(`The companion expense could not be saved, so the bank entry was rolled back. ${expenseError.message}`);
        }
      }

      setShowModal(false);
    } catch (error) {
      alert(`Could not save the bank entry: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, title, isLocked) => {
    if (!isAdmin) return;
    if (isLocked) {
      alert('Official Audit Record cannot be deleted!');
      return;
    }
    if (confirm(`Delete bank entry "${title}"?`)) {
      try {
        await deleteRecord('bank_fd', id);
        onUpdate?.({ table: 'bank_fd', eventType: 'DELETE', id });
      } catch (error) {
        alert(`Could not delete the bank entry: ${error.message}`);
      }
    }
  };

  const getTypeLabel = (t) => {
    switch (t) {
      case 'deposit': return { label: 'FD Deposit / New FD (नवीन ठेव पावती)', color: '#059669', bg: '#ECFDF5', icon: <Landmark size={18} /> };
      case 'renew': return { label: 'FD Renew (ठेव नूतनीकरण)', color: '#D97706', bg: '#FEF3C7', icon: <RefreshCw size={18} /> };
      case 'interest': return { label: 'FD Interest Received (ठेवीवरील व्याज)', color: '#2563EB', bg: '#EFF6FF', icon: <Percent size={18} /> };
      case 'withdrawal': return { label: 'FD Cash Withdrawal (ठेव रोख काढली)', color: '#DC2626', bg: '#FEF2F2', icon: <Landmark size={18} /> };
      case 'fd_expense': return { label: 'FD Withdrawal for Expense (ठेव मोडून खर्च करणे)', color: '#9333EA', bg: '#F3E8FF', icon: <Receipt size={18} /> };
      case 'charge': return { label: 'Bank Charge / Fee (बँक फी)', color: '#D97706', bg: '#FFFBEB', icon: <CreditCard size={18} /> };
      default: return { label: 'Bank Entry', color: '#475569', bg: '#F8FAFC', icon: <Landmark size={18} /> };
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
        color: '#ffffff',
        padding: '22px 24px',
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        boxShadow: '0 14px 35px rgba(5, 150, 105, 0.3)'
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Landmark size={24} color="#A7F3D0" /> Mandal Bank FD & Treasury
          </h2>
          <span style={{ fontSize: 13, opacity: 0.9, fontWeight: 600, display: 'block', marginTop: 4 }}>
            मंडळ बँक ठेव, मुदतपूर्ती व खर्च व्यवस्थापन
          </span>
        </div>

        <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
          <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
            ALL-TIME BANK FD BALANCE
          </span>
          <p style={{ fontSize: 26, fontWeight: 900, margin: '2px 0 0 0', letterSpacing: -0.5 }}>
            Rs. {fdSummary.current_fd_balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="luxe-card" style={{ padding: 16, background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', display: 'block', textTransform: 'uppercase' }}>
            Expected Maturity Returns
          </span>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#047857', margin: '4px 0 0 0' }}>
            Rs. {fdSummary.expected_returns.toLocaleString('en-IN')}
          </p>
        </div>

        {fdSummary.expired_count > 0 && (
          <div className="luxe-card" style={{ padding: 16, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="#D97706" /> FD Matured / Renew Due
            </span>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#92400E', margin: '4px 0 0 0' }}>
              {fdSummary.expired_count} FD Receipt Matured
            </p>
          </div>
        )}
      </div>

      {/* Filter Tabs Pills */}
      <div data-disable-page-swipe="true" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        {['All', 'deposit', 'renew', 'interest', 'withdrawal', 'fd_expense', 'charge'].map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`category-pill ${selectedType === t ? 'active' : ''}`}
            style={{
              background: selectedType === t ? '#047857' : undefined,
              borderColor: selectedType === t ? '#047857' : undefined
            }}
          >
            {t === 'All' ? 'All Transactions' : t === 'deposit' ? 'FD Deposits' : t === 'renew' ? 'FD Renewals' : t === 'interest' ? 'Interest Earned' : t === 'withdrawal' ? 'Withdrawals' : t === 'fd_expense' ? 'FD Expense' : 'Bank Fees'}
          </button>
        ))}
      </div>

      {/* Search & Add Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 16, top: 14 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 46, borderRadius: 16 }}
            placeholder="Search bank entries or bank name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            className="btn btn-success"
            onClick={() => openForm()}
            style={{ width: 'auto', padding: '0 22px', borderRadius: 16, background: '#047857', borderColor: '#047857' }}
          >
            <Plus size={20} /> Add Bank Entry
          </button>
        )}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
          <Landmark size={56} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 15, fontWeight: 700 }}>No bank entries added yet.</p>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Click "Add Bank Entry" above to add FD deposits, interest, or past records!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(item => {
            const meta = getTypeLabel(item.type);
            const isNegative = item.type === 'withdrawal' || item.type === 'charge' || item.type === 'fd_expense';
            const isExpired = item.expiry_date && item.expiry_date <= todayStr && (item.type === 'deposit' || item.type === 'renew');

            return (
              <div key={item.id} className="luxe-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: isExpired ? '1.5px solid #F59E0B' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16, background: meta.bg,
                    color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {meta.icon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A' }}>{item.title}</h4>
                      <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                        Year {item.year}
                      </span>
                      {item.is_locked && (
                        <span style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#D84315', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={12} /> Audit Record
                        </span>
                      )}
                      {isExpired && (
                        <span style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={12} /> Matured / Renew Due
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '4px 0 0 0' }}>
                      {meta.label} • {new Date(item.date).toLocaleDateString('en-IN')} {item.bank_name ? `• ${item.bank_name}` : ''}
                    </p>
                    {item.expiry_date && (
                      <p style={{ fontSize: 11, color: isExpired ? '#D97706' : '#059669', fontWeight: 700, margin: '2px 0 0 0' }}>
                        📅 Expiry Date: {new Date(item.expiry_date).toLocaleDateString('en-IN')} {item.expected_returns ? `• Expected Maturity: Rs. ${Number(item.expected_returns).toLocaleString('en-IN')}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: isNegative ? '#DC2626' : '#059669', marginRight: 4 }}>
                    {isNegative ? '-' : '+'} Rs. {Number(item.amount).toLocaleString('en-IN')}
                  </span>

                  {isAdmin && !item.is_locked && (
                    <>
                      <button
                        onClick={() => openForm(item)}
                        style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: 9, borderRadius: 12, color: '#B45309', cursor: 'pointer' }}
                        title="Edit entry"
                      >
                        <Edit size={17} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title, item.is_locked)}
                        style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: 9, borderRadius: 12, color: '#B91C1C', cursor: 'pointer' }}
                        title="Delete entry"
                      >
                        <Trash2 size={17} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-pill" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#047857' }}>
                {editItem ? 'Edit Bank Transaction' : 'Record New Bank / FD Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group">
                <label className="input-label">Transaction Type *</label>
                <select
                  className="input-field"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  disabled={!!editItem}
                >
                  <option value="deposit">FD Deposit / New FD</option>
                  <option value="renew">FD Renew</option>
                  <option value="interest">FD Interest Received</option>
                  <option value="withdrawal">FD Cash Withdrawal</option>
                  <option value="fd_expense">FD Withdrawal for Expense</option>
                  <option value="charge">Bank Charges / Service Fee</option>
                </select>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>Title / Description *</label>
                  <button
                    type="button"
                    onClick={() => { if (title) setTitle(transliterateText(title)); }}
                    style={{
                      background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10,
                      color: '#059669', padding: '3px 9px', fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Languages size={13} /> मराठीत रुपांतरित करा
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. FD Renewal 2025"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Amount (Rs.) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={e => handleAmountRateChange(e.target.value, interestRate)}
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Transaction Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={date}
                    onChange={e => handleDateChange(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Financial Year</label>
                  <select
                    className="input-field"
                    value={recordYear}
                    onChange={e => setRecordYear(e.target.value)}
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(type === 'deposit' || type === 'renew') && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Interest Rate (% p.a.)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        value={interestRate}
                        onChange={e => handleAmountRateChange(amount, e.target.value)}
                        placeholder="e.g. 7.5"
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Expected Maturity (Rs.)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={expectedReturns}
                        onChange={e => setExpectedReturns(e.target.value)}
                        placeholder="e.g. 53750"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Expiry / Maturity Date (मुदतपूर्ती दिनांक)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <label className="input-label">Bank / Branch Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India / Mandal Account"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Note / Receipt Ref</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Additional receipt details"
                />
              </div>

              {type === 'fd_expense' && (
                <div style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', padding: 12, borderRadius: 14, marginBottom: 14, fontSize: 12, color: '#6B21A8', fontWeight: 700 }}>
                  💡 This will deduct Rs. {amount || 0} from Bank FD balance and automatically post a corresponding expense entry into the Mandal Expenses ledger!
                </div>
              )}

              <button type="submit" className="btn btn-success" disabled={isSaving} style={{ marginTop: 14, width: '100%', background: '#047857', borderColor: '#047857', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving to Supabase…' : editItem ? 'Update Bank Entry' : 'Save Bank Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
