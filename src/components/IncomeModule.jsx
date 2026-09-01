import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, ArrowDownCircle, Languages, Lock, MessageSquare, ChevronDown, ChevronUp, CreditCard, Banknote } from 'lucide-react';
import { generateWhatsAppReceipt } from '../utils/whatsapp';
import { transliterateText } from '../utils/marathiTransliterate';
import { createRecord, deleteDonationRecord, deleteRecord, findOrCreateMember, updateRecord } from '../services/supabase';
import { calculatePaymentModeTotals } from '../utils/ledger';
import { getIncomeCategories, MEMBER_DONATION_CATEGORY } from '../utils/categories';
import ModalPortal from './ModalPortal';

export default function IncomeModule({ isAdmin, activeYear, onUpdate, data = {}, settings = {} }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [entryType, setEntryType] = useState('donation'); // 'donation' or 'other'
  const [memberName, setMemberName] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const incomeCategories = getIncomeCategories(settings);
  const incomeFilterCategories = ['All', MEMBER_DONATION_CATEGORY, ...incomeCategories];
  const [category, setCategory] = useState(() => incomeCategories[0] || 'Other Income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' or 'Online'
  const [note, setNote] = useState('');

  const members = Array.isArray(data.members) ? data.members : [];
  const jamaList = (Array.isArray(data.jama) ? data.jama : [])
    .filter(record => record?.year === activeYear)
    .map(j => ({ ...j, isVargani: false }));
  const varganiList = (Array.isArray(data.vargani) ? data.vargani : [])
    .filter(record => record?.year === activeYear)
    .map(v => ({
    id: `vargani_${v.id}`,
    raw_id: v.id,
    title: v.member_name,
    category: MEMBER_DONATION_CATEGORY,
    amount: v.amount,
    date: v.date,
    note: v.note,
    phone: v.phone,
    payment_mode: v.payment_mode || 'Cash',
    status: v.status || 'paid',
    isVargani: true
  }));

  const allIncome = [...jamaList, ...varganiList].sort((a, b) => new Date(b.date) - new Date(a.date));
  const receivedIncome = allIncome.filter(item => !item.isVargani || (item.status || 'paid') === 'paid');
  const totalIncome = receivedIncome.reduce((sum, item) => sum + Number(item.amount), 0);
  const receivedByMode = calculatePaymentModeTotals(allIncome, { excludePending: true });

  const filtered = allIncome.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.category.toLowerCase().includes(search.toLowerCase()) ||
                          (item.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openForm = (item = null) => {
    if (!isAdmin) return;
    if (item) {
      setEditItem(item);
      if (item.isVargani) {
        setEntryType('donation');
        setMemberName(item.title);
        setPhone(item.phone || '');
      } else {
        setEntryType('other');
        setTitle(item.title);
        setCategory(item.category);
      }
      setAmount(item.amount);
      setDate(item.date);
      setPaymentMode(item.payment_mode || 'Cash');
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setEntryType('donation');
      setMemberName('');
      setPhone('');
      setTitle('');
      setCategory(incomeCategories[0] || 'Other Income');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Cash');
      setNote('');
    }
    setShowModal(true);
  };

  const handleTransliterateName = () => {
    if (entryType === 'donation') {
      if (!memberName.trim()) return;
      setMemberName(transliterateText(memberName));
    } else {
      if (!title.trim()) return;
      setTitle(transliterateText(title));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Enter a valid amount!');
      return;
    }

    if (entryType === 'donation' && !memberName.trim()) {
      alert('Member Name is required!');
      return;
    }
    if (entryType !== 'donation' && !title.trim()) {
      alert('Income title is required!');
      return;
    }

    setIsSaving(true);
    try {
      if (entryType === 'donation') {
        const memberObj = await findOrCreateMember(
          { name: memberName, phone },
          { knownMembers: members }
        );
        const payload = {
          member_id: memberObj.id,
          member_name: memberObj.name,
          phone: phone.trim() || memberObj.phone,
          year: activeYear,
          amount: numAmt,
          date,
          payment_mode: paymentMode,
          note: note.trim()
        };
        const record = editItem && editItem.isVargani
          ? await updateRecord('vargani', editItem.raw_id, payload)
          : await createRecord('vargani', payload);
        onUpdate?.({ table: 'members', eventType: 'UPSERT', record: memberObj });
        onUpdate?.({ table: 'vargani', eventType: 'UPSERT', record });
      } else {
        const payload = {
          title: title.trim(),
          category,
          year: activeYear,
          amount: numAmt,
          date,
          payment_mode: paymentMode,
          note: note.trim()
        };
        const record = editItem && !editItem.isVargani
          ? await updateRecord('jama', editItem.id, payload)
          : await createRecord('jama', payload);
        onUpdate?.({ table: 'jama', eventType: 'UPSERT', record });
      }

      setShowModal(false);
    } catch (error) {
      alert(`Could not save the income entry: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!isAdmin) return;
    if (confirm(`Delete income entry for "${item.title}"?`)) {
      try {
        if (item.isVargani) {
          const deleted = await deleteDonationRecord(item.raw_id);
          onUpdate?.({ table: 'vargani', eventType: 'DELETE', id: deleted.id });
          if (deleted.deletedMemberId !== null) {
            onUpdate?.({ table: 'members', eventType: 'DELETE', id: deleted.deletedMemberId });
          }
        } else {
          await deleteRecord('jama', item.id);
          onUpdate?.({ table: 'jama', eventType: 'DELETE', id: item.id });
        }
      } catch (error) {
        alert(`Could not delete the income entry: ${error.message}`);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      {/* Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
        color: '#ffffff',
        padding: '16px 18px',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
        boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)'
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownCircle size={20} color="#A7F3D0" /> Revenue & Total Income
          </h2>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, display: 'block', marginTop: 2 }}>
            Festival Year {activeYear}
          </span>
        </div>

        <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
          <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            Rs. {totalIncome.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.25)', padding: '3px 10px', borderRadius: 12, fontWeight: 800, marginTop: 2, display: 'inline-block' }}>
            {receivedIncome.length} Received entries
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="luxe-card" style={{ padding: '10px 12px', borderRadius: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', boxShadow: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#166534' }}><Banknote size={15} /> Cash received</span>
          <strong style={{ display: 'block', marginTop: 3, fontSize: 16, color: '#047857' }}>Rs. {receivedByMode.cash.toLocaleString('en-IN')}</strong>
        </div>
        <div className="luxe-card" style={{ padding: '10px 12px', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', boxShadow: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#1D4ED8' }}><CreditCard size={15} /> Online / UPI</span>
          <strong style={{ display: 'block', marginTop: 3, fontSize: 16, color: '#1D4ED8' }}>Rs. {receivedByMode.online.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Category Filter Horizontal Pills */}
      <div data-disable-page-swipe="true" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
        {incomeFilterCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            style={{
              background: selectedCategory === cat ? '#059669' : undefined,
              borderColor: selectedCategory === cat ? '#059669' : undefined
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Add Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 14, top: 13 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 42, borderRadius: 14 }}
            placeholder="Search income title or member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            className="btn btn-success"
            onClick={() => openForm()}
            style={{ width: 'auto', padding: '0 18px', borderRadius: 14 }}
          >
            <Plus size={18} /> Add
          </button>
        )}
      </div>

      {/* List View */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>
          <ArrowDownCircle size={48} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
          <p style={{ fontSize: 14, fontWeight: 700 }}>No income records found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="luxe-card"
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: isExpanded ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                  boxShadow: isExpanded ? '0 8px 24px rgba(16, 185, 129, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleExpand(item.id)}
              >
                {/* Summary Row without Avatar Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </h4>
                      {item.isVargani && (
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>
                          Donation
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '2px 0 0 0' }}>
                      {item.category} • {new Date(item.date).toLocaleDateString('en-IN')} {item.payment_mode ? `• ${item.payment_mode}` : ''} {item.note ? `• ${item.note}` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>
                      Rs. {Number(item.amount).toLocaleString('en-IN')}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#10B981" /> : <ChevronDown size={18} color="#94A3B8" />}
                  </div>
                </div>

                {/* Expandable Action Tray (100% fit inside card) */}
                {isExpanded && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}
                  >
                    {item.isVargani && (
                      <button
                        onClick={() => generateWhatsAppReceipt({ member_name: item.title, amount: item.amount, date: item.date, note: item.note, phone: item.phone }, activeYear)}
                        style={{
                          flex: 1,
                          background: '#DCFCE7', border: '1px solid #86EFAC',
                          padding: '8px 12px', borderRadius: 12, color: '#15803D',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                        }}
                      >
                        <MessageSquare size={15} /> Receipt
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openForm(item)}
                          style={{
                            background: '#FEF3C7', border: '1px solid #FDE68A',
                            padding: '8px 12px', borderRadius: 12, color: '#B45309',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Edit size={15} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          style={{
                            background: '#FEE2E2', border: '1px solid #FCA5A5',
                            padding: '8px 12px', borderRadius: 12, color: '#B91C1C',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Income Modal */}
      {showModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-pill" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>
                {editItem ? 'Edit Income Entry' : 'Record New Income / Revenue Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Income Type Selector */}
              <div className="input-group">
                <label className="input-label">Income Type *</label>
                <select
                  className="input-field"
                  value={entryType}
                  onChange={e => setEntryType(e.target.value)}
                  disabled={!!editItem}
                >
                  <option value="donation">Member Donation</option>
                  <option value="other">Other Income / Revenue</option>
                </select>
              </div>

              {/* Dynamic Field: Member Name or Title */}
              {entryType === 'donation' ? (
                <>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="input-label" style={{ margin: 0 }}>Member Name *</label>
                      <button
                        type="button"
                        onClick={handleTransliterateName}
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
                      value={memberName}
                      onChange={e => setMemberName(e.target.value)}
                      placeholder="e.g. Ramesh Patil or रमेश पाटील"
                      list="member-income-suggestions"
                      required
                    />
                    <datalist id="member-income-suggestions">
                      {members.map(m => <option key={m.id} value={m.name} />)}
                    </datalist>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Mobile / WhatsApp No.</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="input-label" style={{ margin: 0 }}>Income Title *</label>
                      <button
                        type="button"
                        onClick={handleTransliterateName}
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
                      placeholder="e.g. Stall Banner Rental or जाहिरात बॅनर"
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
                      {incomeCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Amount */}
              <div className="input-group">
                <label className="input-label">Amount (Rs.) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  required
                />
              </div>

              {/* Payment Mode Field */}
              <div className="input-group">
                <label className="input-label">Payment Mode *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      border: paymentMode === 'Cash' ? '2px solid #059669' : '1px solid #CBD5E1',
                      background: paymentMode === 'Cash' ? '#ECFDF5' : '#ffffff',
                      color: paymentMode === 'Cash' ? '#059669' : '#64748B',
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Banknote size={16} /> Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Online')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      border: paymentMode === 'Online' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: paymentMode === 'Online' ? '#EFF6FF' : '#ffffff',
                      color: paymentMode === 'Online' ? '#2563EB' : '#64748B',
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <CreditCard size={16} /> Online / UPI
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="input-group">
                <label className="input-label">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              {/* Note / Receipt Ref */}
              <div className="input-group">
                <label className="input-label">Note / Receipt No. (टीप / पावती क्र.)</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Receipt No. 104 or UPI Ref ID"
                />
              </div>

              <button type="submit" className="btn btn-success" disabled={isSaving} style={{ marginTop: 14, width: '100%', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving…' : editItem ? 'Update Income Entry' : 'Save Income Entry'}
              </button>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
