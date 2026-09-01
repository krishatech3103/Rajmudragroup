import React, { useEffect, useState } from 'react';
import { Plus, Search, MessageSquare, Edit, Trash2, X, HeartHandshake, Languages, ChevronDown, ChevronUp, History, CheckCircle2, Clock, CreditCard, Banknote, Tag } from 'lucide-react';
import { generateWhatsAppReceipt } from '../utils/whatsapp';
import { transliterateText } from '../utils/marathiTransliterate';
import { createRecord, deleteDonationRecord, findOrCreateMember, updateRecord } from '../services/supabase';
import { calculatePaymentModeTotals } from '../utils/ledger';
import MemberHistoryModal from './MemberHistoryModal';

export default function DonationsModule({ isAdmin, activeYear, onUpdate, data = {}, initialFilter = 'all' }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all', 'paid', 'pending'
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [prefix, setPrefix] = useState('श्री'); // 'श्री', 'सौ.', 'मे.', 'कु.'
  const [memberName, setMemberName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' or 'UPI'
  const [status, setStatus] = useState('paid'); // 'paid' or 'pending'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = useState('');
  const [note, setNote] = useState('');

  const members = Array.isArray(data.members) ? data.members : [];
  const varganiList = (Array.isArray(data.vargani) ? data.vargani : [])
    .filter(record => record?.year === activeYear);
  const activeMemberIds = new Set(varganiList.map(record => record?.member_id).filter(id => id !== undefined && id !== null).map(String));
  const activeMemberCount = activeMemberIds.size || new Set(varganiList.map(record => record?.member_name).filter(Boolean)).size;
  const receivedByMode = calculatePaymentModeTotals(varganiList, { excludePending: true });
  const totalVargani = receivedByMode.cash + receivedByMode.online;
  const paidDonationCount = varganiList.filter(v => (v.status || 'paid') === 'paid').length;
  const pendingDonations = varganiList.filter(v => v.status === 'pending');
  const pendingDonationAmount = pendingDonations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  const filtered = varganiList.filter(v => {
    const vStatus = v.status || 'paid';
    const matchesSearch = v.member_name.toLowerCase().includes(search.toLowerCase()) ||
                          (v.receipt_no || '').toLowerCase().includes(search.toLowerCase()) ||
                          (v.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openForm = (item = null) => {
    if (!isAdmin) return;
    if (item) {
      setEditItem(item);
      setPrefix(item.prefix || 'श्री');
      setMemberName(item.member_name);
      setPhone(item.phone || '');
      setAmount(item.amount);
      setPaymentMode(item.payment_mode || 'Cash');
      setStatus(item.status || 'paid');
      // An edit represents the latest donation/payment update, so the date
      // shown on the receipt row moves to today when it is saved.
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptNo(item.receipt_no || '');
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setPrefix('श्री');
      setMemberName('');
      setPhone('');
      setAmount('');
      setPaymentMode('Cash');
      setStatus('paid');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptNo('');
      setNote('');
    }
    setShowModal(true);
  };

  const handleTransliterateName = () => {
    if (!memberName.trim()) return;
    const converted = transliterateText(memberName);
    setMemberName(converted);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!memberName.trim() || !amount) {
      alert('Member name and amount are required!');
      return;
    }

    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Enter a valid amount!');
      return;
    }

    setIsSaving(true);
    try {
      const memberObj = await findOrCreateMember(
        { name: memberName, phone },
        { knownMembers: members }
      );
      const payload = {
        prefix,
        member_id: memberObj.id,
        member_name: memberObj.name,
        phone: phone.trim() || memberObj.phone,
        year: activeYear,
        amount: numAmt,
        // Pending donations have no payment method yet. The database column
        // remains non-null for compatibility, while every display and ledger
        // calculation ignores the value until the donation is marked paid.
        payment_mode: status === 'paid' ? paymentMode : 'Cash',
        status,
        date: editItem ? new Date().toISOString().split('T')[0] : date,
        receipt_no: receiptNo.trim(),
        note: note.trim()
      };

      const record = editItem
        ? await updateRecord('vargani', editItem.id, payload)
        : await createRecord('vargani', payload);

      onUpdate?.({ table: 'members', eventType: 'UPSERT', record: memberObj });
      onUpdate?.({ table: 'vargani', eventType: 'UPSERT', record });
      setShowModal(false);
    } catch (error) {
      alert(`Could not save the donation: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete donation record for ${name}?`)) {
      try {
        const deleted = await deleteDonationRecord(id);
        onUpdate?.({ table: 'vargani', eventType: 'DELETE', id: deleted.id });
        if (deleted.deletedMemberId !== null) {
          onUpdate?.({ table: 'members', eventType: 'DELETE', id: deleted.deletedMemberId });
        }
      } catch (error) {
        alert(`Could not delete the donation: ${error.message}`);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
        color: '#ffffff',
        padding: '16px 18px',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
        boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)'
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartHandshake size={20} color="#93C5FD" /> Member Donations
          </h2>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, display: 'block', marginTop: 2 }}>
            Festival Year {activeYear} • {activeMemberCount} Active Members
          </span>
        </div>

        <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
          <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            Rs. {totalVargani.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.25)', padding: '3px 10px', borderRadius: 12, fontWeight: 800, marginTop: 2, display: 'inline-block' }}>
            {paidDonationCount} Paid receipts
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

      {/* Filter Tabs for Status: All, Paid, Pending */}
      <div data-disable-page-swipe="true" style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
        <button
          onClick={() => setStatusFilter('all')}
          className={`category-pill ${statusFilter === 'all' ? 'active' : ''}`}
          style={{ background: statusFilter === 'all' ? '#1D4ED8' : undefined, borderColor: statusFilter === 'all' ? '#1D4ED8' : undefined }}
        >
          All Records ({varganiList.length})
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`category-pill ${statusFilter === 'paid' ? 'active' : ''}`}
          style={{ background: statusFilter === 'paid' ? '#15803D' : undefined, borderColor: statusFilter === 'paid' ? '#15803D' : undefined }}
        >
          Paid (जमा: {varganiList.filter(v => (v.status || 'paid') === 'paid').length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`category-pill ${statusFilter === 'pending' ? 'active' : ''}`}
          style={{ background: statusFilter === 'pending' ? '#D97706' : undefined, borderColor: statusFilter === 'pending' ? '#D97706' : undefined }}
        >
          Pending (बाकी: {pendingDonations.length} · Rs. {pendingDonationAmount.toLocaleString('en-IN')})
        </button>
      </div>

      {/* Search & Add Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 14, top: 13 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 42, borderRadius: 14 }}
            placeholder="Search member name or receipt no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => openForm()}
            style={{ width: 'auto', padding: '0 18px', borderRadius: 14 }}
          >
            <Plus size={18} /> Add
          </button>
        )}
      </div>

      {/* Vargani Item List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>
          <HeartHandshake size={48} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
          <p style={{ fontSize: 14, fontWeight: 700 }}>No donation records found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(v => {
            const isExpanded = expandedId === v.id;
            const isPaid = (v.status || 'paid') === 'paid';
            const itemPrefix = v.prefix || 'श्री';
            const isUPI = isPaid && v.payment_mode === 'UPI';

            return (
              <div
                key={v.id}
                className="luxe-card"
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: isExpanded ? '1.5px solid #FF5722' : '1px solid #E2E8F0',
                  boxShadow: isExpanded ? '0 8px 24px rgba(255, 87, 34, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleExpand(v.id)}
              >
                {/* Main Card Summary Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#FF5722', background: '#FFF7ED', padding: '1px 5px', borderRadius: 6, border: '1px solid #FFEDD5', flexShrink: 0 }}>
                        {itemPrefix}
                      </span>
                      <h4 style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.3, margin: 0, color: '#0F172A', overflowWrap: 'anywhere' }}>
                        {v.member_name}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                      <span>📅 {new Date(v.date).toLocaleDateString('en-IN')}</span>
                      {v.receipt_no && <span>• पावती क्र.: {v.receipt_no}</span>}
                      <span
                        title={isPaid ? 'Paid' : 'Pending'}
                        aria-label={isPaid ? 'Paid' : 'Pending'}
                        style={{ display: 'flex', color: isPaid ? '#15803D' : '#B45309' }}
                      >
                        {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </span>
                      {isPaid && <span
                        title={isUPI ? 'Online / UPI' : 'Cash'}
                        aria-label={isUPI ? 'Online / UPI' : 'Cash'}
                        style={{ display: 'flex', color: isUPI ? '#2563EB' : '#475569' }}
                      >
                        {isUPI ? <CreditCard size={16} /> : <Banknote size={16} />}
                      </span>}
                    </div>
                    {v.note && <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '4px 0 0 0', overflowWrap: 'anywhere' }}>📌 {v.note}</p>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: isPaid ? '#1D4ED8' : '#D97706' }}>
                      Rs. {Number(v.amount).toLocaleString('en-IN')}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#FF5722" /> : <ChevronDown size={18} color="#94A3B8" />}
                  </div>
                </div>

                {/* Expanded Action Tray - Single Compact Inline Row with Icons */}
                {isExpanded && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'flex-end',
                      gap: 8
                    }}
                  >
                    <button
                      onClick={() => setSelectedMemberHistory({ id: v.member_id, name: v.member_name })}
                      title="Member History"
                      style={{
                        background: '#EFF6FF', border: '1px solid #BFDBFE',
                        padding: '7px 12px', borderRadius: 10, color: '#1D4ED8',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <History size={15} />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => generateWhatsAppReceipt(v, activeYear)}
                      title="Send WhatsApp Receipt"
                      style={{
                        background: '#DCFCE7', border: '1px solid #86EFAC',
                        padding: '7px 12px', borderRadius: 10, color: '#15803D',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <MessageSquare size={15} />
                      <span>WhatsApp</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openForm(v)}
                          title="Edit Donation"
                          style={{
                            background: '#FEF3C7', border: '1px solid #FDE68A',
                            padding: '7px 11px', borderRadius: 10, color: '#B45309',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 3
                          }}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.member_name)}
                          title="Delete Donation"
                          style={{
                            background: '#FEE2E2', border: '1px solid #FCA5A5',
                            padding: '7px 11px', borderRadius: 10, color: '#B91C1C',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 3
                          }}
                        >
                          <Trash2 size={15} />
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

      {selectedMemberHistory && (
        <MemberHistoryModal
          member={selectedMemberHistory}
          onClose={() => setSelectedMemberHistory(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-pill" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
                {editItem ? 'Edit Donation Record' : 'Record New Donation'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Salutation Prefix & Member Name */}
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>Salutation & Donor Name *</label>
                  <button
                    type="button"
                    onClick={handleTransliterateName}
                    style={{
                      background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 10,
                      color: '#D84315', padding: '3px 9px', fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                    title="Click to convert English typing to Marathi offline"
                  >
                    <Languages size={13} /> मराठीत रुपांतरित करा
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={prefix}
                    onChange={e => setPrefix(e.target.value)}
                    style={{
                      width: 90,
                      padding: '12px 8px',
                      borderRadius: 14,
                      border: '1.5px solid #CBD5E1',
                      background: '#F8FAFC',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#0F172A',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="श्री">श्री</option>
                    <option value="सौ.">सौ.</option>
                    <option value="मे.">मे.</option>
                    <option value="कु.">कु.</option>
                  </select>

                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 1 }}
                    value={memberName}
                    onChange={e => setMemberName(e.target.value)}
                    placeholder="e.g. Ramesh Patil or रमेश पाटील"
                    list="member-suggestions"
                    required
                  />
                  <datalist id="member-suggestions">
                    {members.map(m => <option key={m.id} value={m.name} />)}
                  </datalist>
                </div>
              </div>

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

              {/* Status Picker: Paid vs Pending */}
              <div className="input-group">
                <label className="input-label">Payment Status *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStatus('paid')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      border: status === 'paid' ? '2px solid #15803D' : '1px solid #CBD5E1',
                      background: status === 'paid' ? '#DCFCE7' : '#ffffff',
                      color: status === 'paid' ? '#15803D' : '#64748B',
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <CheckCircle2 size={16} /> Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      border: status === 'pending' ? '2px solid #D97706' : '1px solid #CBD5E1',
                      background: status === 'pending' ? '#FEF3C7' : '#ffffff',
                      color: status === 'pending' ? '#B45309' : '#64748B',
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Clock size={16} /> Pending
                  </button>
                </div>
              </div>

              {/* Payment mode is chosen only after the donation is marked paid. */}
              {status === 'paid' && <div className="input-group">
                <label className="input-label">Payment Mode *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      border: paymentMode === 'Cash' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: paymentMode === 'Cash' ? '#EFF6FF' : '#ffffff',
                      color: paymentMode === 'Cash' ? '#2563EB' : '#64748B',
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Banknote size={16} /> Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      border: paymentMode === 'UPI' ? '2px solid #059669' : '1px solid #CBD5E1',
                      background: paymentMode === 'UPI' ? '#ECFDF5' : '#ffffff',
                      color: paymentMode === 'UPI' ? '#059669' : '#64748B',
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <CreditCard size={16} /> Online / UPI
                  </button>
                </div>
              </div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Receipt No.</label>
                  <input
                    type="text"
                    className="input-field"
                    value={receiptNo}
                    onChange={e => setReceiptNo(e.target.value)}
                    placeholder="e.g. 101"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">{editItem ? 'Updated Date' : 'Date'}</label>
                  <input
                    type="date"
                    className="input-field"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    disabled={Boolean(editItem)}
                  />
                </div>
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

              <div className="input-group">
                <label className="input-label">Note (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Additional details (will not appear in WhatsApp receipt)"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ marginTop: 14, width: '100%', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving…' : editItem ? 'Update Donation' : 'Save & Issue Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
