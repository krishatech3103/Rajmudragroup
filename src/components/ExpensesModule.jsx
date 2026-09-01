import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, ArrowUpCircle, Languages, Lock, ChevronDown, ChevronUp, CreditCard, Banknote } from 'lucide-react';
import { transliterateText } from '../utils/marathiTransliterate';
import { createRecord, deleteRecord, updateRecord } from '../services/supabase';
import { calculateTreasuryBalances } from '../utils/ledger';

const EXPENSE_CATEGORIES = [
  'All',
  'Mandap & Decoration',
  'Lighting & Illumination',
  'Sound System & DJ',
  'Pooja & Prasadam',
  'Band & Dhol-Tasha',
  'Visarjan Procession',
  'Annadaan / Feast',
  'Security & Police',
  'Transportation',
  'Miscellaneous Expenses',
  'Other Expense'
];

export default function ExpensesModule({ isAdmin, activeYear, onUpdate, data = {} }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mandap & Decoration');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [note, setNote] = useState('');

  const kharchList = (Array.isArray(data.kharch) ? data.kharch : [])
    .filter(record => record?.year === activeYear);
  const totalKharch = kharchList.reduce((sum, k) => sum + Number(k.amount), 0);
  const treasuryBalances = calculateTreasuryBalances(activeYear, data);
  const availableForSelectedMode = (() => {
    const available = { ...treasuryBalances };
    if (editItem) {
      const previousMode = String(editItem.payment_mode || 'Cash').trim().toLowerCase();
      if (previousMode === 'cash') available.cash += Number(editItem.amount) || 0;
      else available.online += Number(editItem.amount) || 0;
    }
    return paymentMode === 'Cash' ? available.cash : available.online;
  })();

  const filtered = kharchList.filter(k => {
    const matchesSearch = k.title.toLowerCase().includes(search.toLowerCase()) ||
                          k.category.toLowerCase().includes(search.toLowerCase()) ||
                          (k.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || k.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openForm = (item = null) => {
    if (!isAdmin) return;
    if (item && item.is_locked) {
      alert('Official Audit Record is non-editable!');
      return;
    }
    if (item) {
      setEditItem(item);
      setTitle(item.title);
      setCategory(item.category);
      setAmount(item.amount);
      setDate(item.date);
      setPaymentMode(item.payment_mode || 'Cash');
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setTitle('');
      setCategory('Mandap & Decoration');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Cash');
      setNote('');
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      alert('Expense title and amount are required!');
      return;
    }
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Enter a valid amount!');
      return;
    }

    // An edit replaces the old expense. Add its old amount back before
    // checking the selected payment mode, otherwise an unchanged edit would
    // incorrectly look like a second expense.
    if (numAmt > availableForSelectedMode) {
      alert(`Not enough ${paymentMode} balance for this expense. Available: Rs. ${availableForSelectedMode.toLocaleString('en-IN')}.`);
      return;
    }

    setIsSaving(true);
    try {
      const payload = { title: title.trim(), category, year: activeYear, amount: numAmt, date, payment_mode: paymentMode, note: note.trim() };
      const record = editItem
        ? await updateRecord('kharch', editItem.id, payload)
        : await createRecord('kharch', payload);
      onUpdate?.({ table: 'kharch', eventType: 'UPSERT', record });
      setShowModal(false);
    } catch (error) {
      alert(`Could not save the expense: ${error.message}`);
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
    if (confirm(`Delete expense record "${title}"?`)) {
      try {
        await deleteRecord('kharch', id);
        onUpdate?.({ table: 'kharch', eventType: 'DELETE', id });
      } catch (error) {
        alert(`Could not delete the expense: ${error.message}`);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)',
        color: '#ffffff',
        padding: '16px 18px',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
        boxShadow: '0 12px 30px rgba(239, 68, 68, 0.35)'
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpCircle size={20} color="#FCA5A5" /> Mandal Expenses
          </h2>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, display: 'block', marginTop: 2 }}>
            Festival Year {activeYear}
          </span>
        </div>

        <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
          <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            Rs. {totalKharch.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.25)', padding: '3px 10px', borderRadius: 12, fontWeight: 800, marginTop: 2, display: 'inline-block' }}>
            {kharchList.length} Entries
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="luxe-card" style={{ padding: '11px 13px', border: '1px solid #FECACA' }}>
          <span style={{ color: '#991B1B', fontSize: 11, fontWeight: 800, display: 'block' }}>CASH AVAILABLE</span>
          <strong style={{ color: treasuryBalances.cash < 0 ? '#991B1B' : '#DC2626', fontSize: 17 }}>Rs. {treasuryBalances.cash.toLocaleString('en-IN')}</strong>
        </div>
        <div className="luxe-card" style={{ padding: '11px 13px', border: '1px solid #BFDBFE' }}>
          <span style={{ color: '#1D4ED8', fontSize: 11, fontWeight: 800, display: 'block' }}>UPI / ONLINE AVAILABLE</span>
          <strong style={{ color: treasuryBalances.online < 0 ? '#991B1B' : '#2563EB', fontSize: 17 }}>Rs. {treasuryBalances.online.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Category Filter Horizontal Pills Bar */}
      <div data-disable-page-swipe="true" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
        {EXPENSE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            style={{
              background: selectedCategory === cat ? '#DC2626' : undefined,
              borderColor: selectedCategory === cat ? '#DC2626' : undefined
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Add */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 14, top: 13 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 42, borderRadius: 14 }}
            placeholder="Search expense title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            className="btn btn-danger"
            onClick={() => openForm()}
            style={{ width: 'auto', padding: '0 18px', borderRadius: 14 }}
          >
            <Plus size={18} /> Add
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>
          <ArrowUpCircle size={48} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
          <p style={{ fontSize: 14, fontWeight: 700 }}>No expense records found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(k => {
            const isExpanded = expandedId === k.id;
            return (
              <div
                key={k.id}
                className="luxe-card"
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: isExpanded ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  boxShadow: isExpanded ? '0 8px 24px rgba(239, 68, 68, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleExpand(k.id)}
              >
                {/* Clean Summary Row without Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {k.title}
                      </h4>
                      {k.is_locked && (
                        <span style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#D84315', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={12} /> Audit Record
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '2px 0 0 0' }}>
                      {k.category} • {new Date(k.date).toLocaleDateString('en-IN')} • {k.payment_mode || 'Cash'} {k.note ? `• ${k.note}` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#DC2626' }}>
                      Rs. {Number(k.amount).toLocaleString('en-IN')}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#EF4444" /> : <ChevronDown size={18} color="#94A3B8" />}
                  </div>
                </div>

                {/* Expanded Action Tray */}
                {isExpanded && isAdmin && !k.is_locked && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'flex-end',
                      gap: 8
                    }}
                  >
                    <button
                      onClick={() => openForm(k)}
                      style={{
                        background: '#FEF3C7', border: '1px solid #FDE68A',
                        padding: '8px 14px', borderRadius: 12, color: '#B45309',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <Edit size={15} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(k.id, k.title, k.is_locked)}
                      style={{
                        background: '#FEE2E2', border: '1px solid #FCA5A5',
                        padding: '8px 14px', borderRadius: 12, color: '#B91C1C',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-pill" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#DC2626' }}>
                {editItem ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>Expense Title *</label>
                  <button
                    type="button"
                    onClick={() => { if (title) setTitle(transliterateText(title)); }}
                    style={{
                      background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
                      color: '#DC2626', padding: '3px 9px', fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                    title="Convert English typing to Marathi offline"
                  >
                    <Languages size={13} /> मराठीत रुपांतरित करा
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Sound System Rent or साऊंड सिस्टम भाडे"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className="input-field"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Amount (Rs.) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 12000"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Payment Mode *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setPaymentMode('Cash')} style={{ flex: 1, padding: '10px', borderRadius: 12, border: paymentMode === 'Cash' ? '2px solid #DC2626' : '1px solid #CBD5E1', background: paymentMode === 'Cash' ? '#FEF2F2' : '#ffffff', color: paymentMode === 'Cash' ? '#DC2626' : '#64748B', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Banknote size={16} /> Cash
                  </button>
                  <button type="button" onClick={() => setPaymentMode('UPI')} style={{ flex: 1, padding: '10px', borderRadius: 12, border: paymentMode === 'UPI' ? '2px solid #2563EB' : '1px solid #CBD5E1', background: paymentMode === 'UPI' ? '#EFF6FF' : '#ffffff', color: paymentMode === 'UPI' ? '#2563EB' : '#64748B', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CreditCard size={16} /> UPI / Online
                  </button>
                </div>
                <p style={{ margin: '7px 0 0', fontSize: 12, fontWeight: 700, color: availableForSelectedMode < 0 ? '#B91C1C' : '#475569' }}>
                  Available {paymentMode} balance: Rs. {availableForSelectedMode.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Note / Bill No.</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Bill No. 450"
                />
              </div>

              <button type="submit" className="btn btn-danger" disabled={isSaving} style={{ marginTop: 14, width: '100%', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving…' : editItem ? 'Update Expense' : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
