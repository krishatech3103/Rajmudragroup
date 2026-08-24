import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Edit, Trash2, X, HeartHandshake, Sparkles, Languages } from 'lucide-react';
import { db } from '../services/db';
import { generateWhatsAppReceipt } from '../utils/whatsapp';
import { transliterateText } from '../utils/marathiTransliterate';
import MemberHistoryModal from './MemberHistoryModal';

export default function DonationsModule({ isAdmin, activeYear, onUpdate }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState(null);

  // Form State
  const [memberName, setMemberName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const members = db.getMembers();
  const varganiList = db.getVargani(activeYear);
  const totalVargani = varganiList.reduce((sum, v) => sum + Number(v.amount), 0);

  const filtered = varganiList.filter(v =>
    v.member_name.toLowerCase().includes(search.toLowerCase()) ||
    (v.note || '').toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (item = null) => {
    if (!isAdmin) return;
    if (item) {
      setEditItem(item);
      setMemberName(item.member_name);
      setPhone(item.phone || '');
      setAmount(item.amount);
      setDate(item.date);
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setMemberName('');
      setPhone('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setShowModal(true);
  };

  const handleTransliterateName = () => {
    if (!memberName.trim()) return;
    const converted = transliterateText(memberName);
    setMemberName(converted);
  };

  const handleSave = (e) => {
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

    const memberObj = db.upsertMember(memberName, phone);

    if (editItem) {
      db.updateVargani(editItem.id, {
        member_id: memberObj.id,
        member_name: memberObj.name,
        phone: phone.trim() || memberObj.phone,
        amount: numAmt,
        date,
        note: note.trim()
      });
    } else {
      db.addVargani({
        member_id: memberObj.id,
        member_name: memberObj.name,
        phone: phone.trim() || memberObj.phone,
        year: activeYear,
        amount: numAmt,
        date,
        note: note.trim()
      });
    }

    setShowModal(false);
    onUpdate();
  };

  const handleDelete = (id, name) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete donation record for ${name}?`)) {
      db.deleteVargani(id);
      onUpdate();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }} className="animate-fade-in">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 18,
        boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)'
      }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartHandshake size={22} color="#93C5FD" /> Member Donations
          </h2>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, display: 'block', marginTop: 4 }}>
            Festival Year {activeYear}
          </span>
        </div>

        <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
          <p style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            ₹ {totalVargani.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.25)', padding: '3px 10px', borderRadius: 12, fontWeight: 800, marginTop: 4, display: 'inline-block' }}>
            {varganiList.length} Receipts
          </span>
        </div>
      </div>

      {/* Search & Add Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 16, top: 14 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 46, borderRadius: 16 }}
            placeholder="Search by member name or receipt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => openForm()}
            style={{ width: 'auto', padding: '0 22px', borderRadius: 16 }}
          >
            <Plus size={20} /> Add
          </button>
        )}
      </div>

      {/* Vargani Item List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
          <HeartHandshake size={56} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 15, fontWeight: 700 }}>No donation records found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(v => (
            <div key={v.id} className="luxe-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setSelectedMemberHistory({ id: v.member_id, name: v.member_name })}
                  style={{
                    width: 48, height: 48, borderRadius: 16,
                    background: 'linear-gradient(135deg, #FFEDD5, #FED7AA)',
                    color: '#D84315', fontWeight: 900, fontSize: 18, border: '1px solid rgba(255, 87, 34, 0.2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 87, 34, 0.15)', flexShrink: 0
                  }}
                  title="Click to view full member history"
                >
                  {v.member_name ? v.member_name[0].toUpperCase() : 'M'}
                </button>

                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A' }}>{v.member_name}</h4>
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '4px 0 0 0' }}>
                    {new Date(v.date).toLocaleDateString('en-IN')} {v.note ? `• ${v.note}` : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#1D4ED8', marginRight: 4 }}>
                  ₹ {Number(v.amount).toLocaleString('en-IN')}
                </span>

                <button
                  onClick={() => generateWhatsAppReceipt(v, activeYear)}
                  style={{
                    background: '#DCFCE7', border: '1px solid #86EFAC', padding: 9, borderRadius: 12,
                    color: '#15803D', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                  title="Send Instant WhatsApp Receipt"
                >
                  <MessageSquare size={17} />
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => openForm(v)}
                      style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: 9, borderRadius: 12, color: '#B45309', cursor: 'pointer' }}
                    >
                      <Edit size={17} />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, v.member_name)}
                      style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: 9, borderRadius: 12, color: '#B91C1C', cursor: 'pointer' }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
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
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>Member Name *</label>
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

                <input
                  type="text"
                  className="input-field"
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
                <label className="input-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  required
                />
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
                <label className="input-label">Note / Receipt No.</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Receipt No. 104"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 14, width: '100%' }}>
                {editItem ? 'Update Donation' : 'Save & Issue Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
