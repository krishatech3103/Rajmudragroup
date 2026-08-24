import React, { useState } from 'react';
import { Plus, Search, Calendar, Clock, Sun, Moon, Edit, Trash2, X, Flame, Languages, Copy, Check } from 'lucide-react';
import { db } from '../services/db';
import { transliterateText } from '../utils/marathiTransliterate';

export default function AartiModule({ isAdmin, activeYear, onUpdate }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [dayTitle, setDayTitle] = useState('Day 1 (Sthapana)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [morningTime, setMorningTime] = useState('09.00 AM');
  const [morningHost, setMorningHost] = useState('');
  const [eveningTime, setEveningTime] = useState('08.00 PM');
  const [eveningHost, setEveningHost] = useState('');
  const [note, setNote] = useState('');

  const aartiList = db.getAarti(activeYear);

  const filtered = aartiList.filter(a =>
    a.day_title.toLowerCase().includes(search.toLowerCase()) ||
    (a.morning_host || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.evening_host || '').toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (item = null) => {
    if (!isAdmin) return;
    if (item) {
      setEditItem(item);
      setDayTitle(item.day_title);
      setDate(item.date || new Date().toISOString().split('T')[0]);
      setMorningTime(item.morning_time || '09.00 AM');
      setMorningHost(item.morning_host || '');
      setEveningTime(item.evening_time || '08.00 PM');
      setEveningHost(item.evening_host || '');
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setDayTitle(`Day ${aartiList.length + 1}`);
      setDate(new Date().toISOString().split('T')[0]);
      setMorningTime('09.00 AM');
      setMorningHost('');
      setEveningTime('08.00 PM');
      setEveningHost('');
      setNote('');
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!dayTitle.trim()) {
      alert('Day title is required!');
      return;
    }

    if (editItem) {
      db.updateAarti(editItem.id, {
        day_title: dayTitle.trim(),
        date,
        morning_time: morningTime,
        morning_host: morningHost.trim(),
        evening_time: eveningTime,
        evening_host: eveningHost.trim(),
        note: note.trim()
      });
    } else {
      db.addAarti({
        year: activeYear,
        day_title: dayTitle.trim(),
        date,
        morning_time: morningTime,
        morning_host: morningHost.trim(),
        evening_time: eveningTime,
        evening_host: eveningHost.trim(),
        note: note.trim()
      });
    }

    setShowModal(false);
    onUpdate();
  };

  const handleDelete = (id, title) => {
    if (!isAdmin) return;
    if (confirm(`Delete Aarti schedule for "${title}"?`)) {
      db.deleteAarti(id);
      onUpdate();
    }
  };

  // Build authentic Marathi Aarti Notice message for WhatsApp
  const buildAartiNoticeText = (item, type = 'morning') => {
    const isMorning = type === 'morning';
    const timeText = isMorning ? (item.morning_time || '09.00 वा.') : (item.evening_time || '08.00 वा.');
    const sessionText = isMorning ? 'सकाळी' : 'संध्याकाळी';
    const hostText = isMorning ? (item.morning_host || 'साळुंखे व पुजारी परिवार') : (item.evening_host || 'मंडळ परिवार');

    return `*🚩 राजमुद्रा गणेशोत्सव मंडळ 🚩*\n` +
      `*🙏उद्या ${sessionText} ठिक ${timeText} ${hostText} यांच्या हस्ते आरती संपन्न होईल, कृपया सर्वांनी वेळेत हजर रहावे.🙏*\n` +
      `*🌸 गणपति बाप्पा मोरया 🌸*`;
  };

  const handleCopyNotice = (item, type, copyKey) => {
    const text = buildAartiNoticeText(item, type);
    navigator.clipboard.writeText(text);
    setCopiedId(copyKey);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="animate-fade-in">
      {/* Aarti Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #D84315 0%, #FF5722 50%, #FF9100 100%)',
        color: '#ffffff',
        padding: '22px 26px',
        borderRadius: 26,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justify: 'space-between',
        gap: 16,
        marginBottom: 20,
        boxShadow: '0 12px 30px rgba(216, 67, 21, 0.35)'
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#ffffff' }}>
            <Flame size={24} color="#FFD700" /> Aarti Schedule & Copy Notice
          </h2>
          <span style={{ fontSize: 13, color: '#FFE0B2', fontWeight: 600, marginTop: 4, display: 'block' }}>
            Daily Aarti Timings, Family Hosts & Copy Notices • Year {activeYear}
          </span>
        </div>

        {isAdmin && (
          <button
            className="btn btn-gold"
            onClick={() => openForm()}
            style={{
              padding: '12px 22px',
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)'
            }}
          >
            <Plus size={18} /> Add Aarti Day
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 16, top: 14 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 46, borderRadius: 16 }}
            placeholder="Search by Aarti day or family host..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Schedule Cards List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }} className="luxe-card">
          <Flame size={56} color="#FFCC80" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', margin: 0 }}>Aarti Schedule is Empty</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Click "Add Aarti Day" to set morning and evening Aarti family hosts.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {filtered.map(a => (
            <div key={a.id} className="luxe-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#D84315', background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '3px 10px', borderRadius: 10 }}>
                    📅 {new Date(a.date).toLocaleDateString('en-IN')}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#0F172A' }}>
                    {a.day_title}
                  </h3>
                </div>

                {/* Morning Aarti Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                  border: '1px solid #FDE68A', borderRadius: 18, padding: 14, marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sun size={16} color="#D97706" /> Morning Aarti
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#78350F', background: '#ffffff', padding: '2px 8px', borderRadius: 8 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />{a.morning_time || '09.00 AM'}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px 0', color: '#451A03' }}>
                    👤 {a.morning_host || 'Enter Name'}
                  </p>

                  <button
                    onClick={() => handleCopyNotice(a, 'morning', `${a.id}_m`)}
                    style={{
                      width: '100%', padding: '9px 14px', borderRadius: 12,
                      background: copiedId === `${a.id}_m` ? '#10B981' : '#ffffff',
                      color: copiedId === `${a.id}_m` ? '#ffffff' : '#B45309',
                      border: copiedId === `${a.id}_m` ? '1px solid #10B981' : '1px solid #FDE68A',
                      fontSize: 13, fontWeight: 900,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedId === `${a.id}_m` ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === `${a.id}_m` ? 'Notice Copied! ✅' : '📋 Copy WhatsApp Notice'}
                  </button>
                </div>

                {/* Evening Aarti Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                  border: '1px solid #BAE6FD', borderRadius: 18, padding: 14, marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Moon size={16} color="#0284C7" /> Evening Aarti
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#0C4A6E', background: '#ffffff', padding: '2px 8px', borderRadius: 8 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />{a.evening_time || '08.00 PM'}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px 0', color: '#0C4A6E' }}>
                    👤 {a.evening_host || 'Mandal Family'}
                  </p>

                  <button
                    onClick={() => handleCopyNotice(a, 'evening', `${a.id}_e`)}
                    style={{
                      width: '100%', padding: '9px 14px', borderRadius: 12,
                      background: copiedId === `${a.id}_e` ? '#10B981' : '#ffffff',
                      color: copiedId === `${a.id}_e` ? '#ffffff' : '#0369A1',
                      border: copiedId === `${a.id}_e` ? '1px solid #10B981' : '1px solid #BAE6FD',
                      fontSize: 13, fontWeight: 900,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedId === `${a.id}_e` ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === `${a.id}_e` ? 'Notice Copied! ✅' : '📋 Copy WhatsApp Notice'}
                  </button>
                </div>

                {a.note && (
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '6px 0 0 0' }}>
                    📌 {a.note}
                  </p>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => openForm(a)}
                    style={{ flex: 1, background: '#FEF3C7', border: '1px solid #FDE68A', padding: 8, borderRadius: 12, color: '#B45309', cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Edit size={15} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id, a.day_title)}
                    style={{ flex: 1, background: '#FEE2E2', border: '1px solid #FCA5A5', padding: 8, borderRadius: 12, color: '#B91C1C', cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-pill" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#D84315' }}>
                {editItem ? 'Edit Aarti Schedule' : 'Schedule Festival Aarti Day'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>Day Title / Name *</label>
                  <button
                    type="button"
                    onClick={() => { if (dayTitle) setDayTitle(transliterateText(dayTitle)); }}
                    style={{
                      background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 10,
                      color: '#D84315', padding: '3px 9px', fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Languages size={13} /> Convert to Marathi
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={dayTitle}
                  onChange={e => setDayTitle(e.target.value)}
                  placeholder="e.g. Day 1 (Sthapana)"
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

              {/* Morning Aarti Section */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 14, borderRadius: 16, marginBottom: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: '#B45309', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sun size={18} /> Morning Aarti
                </h4>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ width: '130px' }}
                    value={morningTime}
                    onChange={e => setMorningTime(e.target.value)}
                    placeholder="e.g. 09.00 AM"
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="input-field"
                      value={morningHost}
                      onChange={e => setMorningHost(e.target.value)}
                      placeholder="Enter Name"
                    />
                  </div>
                </div>
                {morningHost && (
                  <button
                    type="button"
                    onClick={() => setMorningHost(transliterateText(morningHost))}
                    style={{ background: '#ffffff', border: '1px solid #FDE68A', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: '#B45309', cursor: 'pointer' }}
                  >
                    <Languages size={12} style={{ display: 'inline', marginRight: 3 }} /> Convert Host Name to Marathi
                  </button>
                )}
              </div>

              {/* Evening Aarti Section */}
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: 14, borderRadius: 16, marginBottom: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: '#0369A1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Moon size={18} /> Evening Aarti
                </h4>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ width: '130px' }}
                    value={eveningTime}
                    onChange={e => setEveningTime(e.target.value)}
                    placeholder="e.g. 08.00 PM"
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="input-field"
                      value={eveningHost}
                      onChange={e => setEveningHost(e.target.value)}
                      placeholder="Enter Name"
                    />
                  </div>
                </div>
                {eveningHost && (
                  <button
                    type="button"
                    onClick={() => setEveningHost(transliterateText(eveningHost))}
                    style={{ background: '#ffffff', border: '1px solid #BAE6FD', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: '#0369A1', cursor: 'pointer' }}
                  >
                    <Languages size={12} style={{ display: 'inline', marginRight: 3 }} /> Convert Host Name to Marathi
                  </button>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Note / Special Event</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Special Sangeet Aarti & Mahapooja"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 14, width: '100%' }}>
                {editItem ? 'Update Aarti Schedule' : 'Save Aarti Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
