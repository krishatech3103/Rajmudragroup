import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, ArrowDownCircle, Languages, Lock } from 'lucide-react';
import { db } from '../services/db';
import { transliterateText } from '../utils/marathiTransliterate';

const INCOME_CATEGORIES = ['All', 'Donations', 'Sponsorship / Awards', 'Advertisements', 'Interest Income', 'Other Income'];

export default function IncomeModule({ isAdmin, activeYear, onUpdate }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Donations');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const jamaList = db.getJama(activeYear);
  const totalJama = jamaList.reduce((sum, j) => sum + Number(j.amount), 0);

  const filtered = jamaList.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
                          j.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || j.category === selectedCategory;
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
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setTitle('');
      setCategory('Donations');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
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

    if (editItem) {
      db.updateJama(editItem.id, { title: title.trim(), category, amount: numAmt, date, note: note.trim() });
    } else {
      db.addJama({ title: title.trim(), category, year: activeYear, amount: numAmt, date, note: note.trim() });
    }

    setShowModal(false);
    onUpdate();
  };

  const handleDelete = (id, title, isLocked) => {
    if (!isAdmin) return;
    if (isLocked) {
      alert('Official Audit Record cannot be deleted!');
      return;
    }
    if (confirm(`Delete income record "${title}"?`)) {
      db.deleteJama(id);
      onUpdate();
    }
  };

  return (
    <div style={{ padding: 20 }} className="animate-fade-in">
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        marginBottom: 18,
        boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)'
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownCircle size={22} color="#A7F3D0" /> Revenue & Other Income
          </h2>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>Festival Year {activeYear}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
            ₹{totalJama.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.2)', padding: '2px 10px', borderRadius: 12, fontWeight: 700 }}>
            {jamaList.length} Entries
          </span>
        </div>
      </div>

      {/* Category Filter Horizontal Pills Bar */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        {INCOME_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 16, top: 14 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 46, borderRadius: 16 }}
            placeholder="Search income title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            className="btn btn-success"
            onClick={() => openForm()}
            style={{ width: 'auto', padding: '0 22px', borderRadius: 16 }}
          >
            <Plus size={20} /> Add
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
          <ArrowDownCircle size={56} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 15, fontWeight: 700 }}>No income records found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(j => (
            <div key={j.id} className="luxe-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16, background: '#ECFDF5',
                  color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #A7F3D0'
                }}>
                  <ArrowDownCircle size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A' }}>{j.title}</h4>
                    {j.is_locked && (
                      <span style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#D84315', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> Audit Record
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '3px 0 0 0' }}>
                    {j.category} • {new Date(j.date).toLocaleDateString('en-IN')} {j.note ? `• ${j.note}` : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#059669', marginRight: 4 }}>
                  ₹{Number(j.amount).toLocaleString('en-IN')}
                </span>

                {isAdmin && !j.is_locked && (
                  <>
                    <button
                      onClick={() => openForm(j)}
                      style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: 9, borderRadius: 12, color: '#B45309', cursor: 'pointer' }}
                    >
                      <Edit size={17} />
                    </button>
                    <button
                      onClick={() => handleDelete(j.id, j.title, j.is_locked)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-pill" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>
                {editItem ? 'Edit Income Record' : 'Record New Income'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>Title / Source *</label>
                  <button
                    type="button"
                    onClick={() => { if (title) setTitle(transliterateText(title)); }}
                    style={{
                      background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10,
                      color: '#059669', padding: '3px 9px', fontSize: 11, fontWeight: 800,
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
                  placeholder="e.g. Aarti Collection or आरती संग्रह"
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
                  {INCOME_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
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
                <label className="input-label">Note / Reference</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Additional details"
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ marginTop: 14, width: '100%' }}>
                {editItem ? 'Update Income' : 'Save Income'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
