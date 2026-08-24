import React, { useState } from 'react';
import { Landmark, Plus, Edit, Trash2, X, Percent, CreditCard, Lock, Languages, RefreshCw, AlertTriangle, Receipt } from 'lucide-react';
import { db } from '../services/db';
import { transliterateText } from '../utils/marathiTransliterate';

export default function BankFDModal({ isAdmin, activeYear, onClose, onUpdate }) {
  const [selectedType, setSelectedType] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('7.5');
  const [expectedReturns, setExpectedReturns] = useState('');
  const [bankName, setBankName] = useState('Mandal Bank FD Account');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');

  const fdList = db.getBankFD();
  const fdSummary = db.getBankFDSummary();

  const filtered = fdList.filter(item => selectedType === 'All' || item.type === selectedType);

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
      setExpiryDate(item.expiry_date || '');
      setNote(item.note || '');
    } else {
      setEditItem(null);
      setTitle('');
      setType('deposit');
      setAmount('');
      setInterestRate('7.5');
      setExpectedReturns('');
      setBankName('Mandal Bank FD Account');
      setDate(new Date().toISOString().split('T')[0]);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(nextYear.toISOString().split('T')[0]);
      setNote('');
    }
    setShowForm(true);
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

    const payload = {
      title: title.trim(),
      type,
      year: activeYear,
      amount: numAmt,
      interest_rate: Number(interestRate) || 0,
      expected_returns: Number(expectedReturns) || numAmt,
      bank_name: bankName.trim(),
      date,
      expiry_date: expiryDate,
      note: note.trim()
    };

    if (editItem) {
      db.updateBankFD(editItem.id, payload);
    } else {
      db.addBankFD(payload);
    }

    setShowForm(false);
    if (onUpdate) onUpdate();
  };

  const handleDelete = (id, title, isLocked) => {
    if (!isAdmin) return;
    if (isLocked) {
      alert('Official Audit Record cannot be deleted!');
      return;
    }
    if (confirm(`Delete bank entry "${title}"?`)) {
      db.deleteBankFD(id);
      if (onUpdate) onUpdate();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="sheet-pill" />

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Mandal Bank FD & Treasury Ledger
              </h3>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                मंडळ बँक ठेव व मुदतपूर्ती नोंदवही
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#64748B" />
          </button>
        </div>

        {/* Summary Card */}
        <div style={{ background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', color: '#ffffff', padding: 18, borderRadius: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Active Bank FD Balance:</span>
            <strong style={{ fontSize: 22, color: '#A7F3D0' }}>Rs. {fdSummary.current_fd_balance.toLocaleString('en-IN')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12, opacity: 0.9 }}>
            <span>Expected Returns: <strong>Rs. {fdSummary.expected_returns.toLocaleString('en-IN')}</strong></span>
            {fdSummary.expired_count > 0 && <span style={{ color: '#FCD34D', fontWeight: 800 }}>⚠️ {fdSummary.expired_count} Matured</span>}
          </div>
        </div>

        {/* Filter Tabs & Add Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {['All', 'deposit', 'renew', 'interest', 'withdrawal', 'fd_expense'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`category-pill ${selectedType === t ? 'active' : ''}`}
                style={{ fontSize: 12, padding: '6px 12px', background: selectedType === t ? '#047857' : undefined }}
              >
                {t === 'All' ? 'All' : t === 'deposit' ? 'Deposits' : t === 'renew' ? 'Renewals' : t === 'interest' ? 'Interest' : t === 'withdrawal' ? 'Withdrawals' : 'FD Expense'}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => openForm()}
              className="btn btn-success"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 12, background: '#047857', borderColor: '#047857' }}
            >
              <Plus size={16} /> Add Entry
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '30px 0' }}>No bank entries found.</p>
          ) : (
            filtered.map(item => {
              const isNeg = item.type === 'withdrawal' || item.type === 'charge' || item.type === 'fd_expense';
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{item.title}</h5>
                    <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#64748B' }}>
                      {item.type.toUpperCase()} • {new Date(item.date).toLocaleDateString('en-IN')} {item.bank_name ? `• ${item.bank_name}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: isNeg ? '#DC2626' : '#059669' }}>
                      {isNeg ? '-' : '+'} Rs. {Number(item.amount).toLocaleString('en-IN')}
                    </span>
                    {isAdmin && !item.is_locked && (
                      <button onClick={() => handleDelete(item.id, item.title, item.is_locked)} style={{ background: '#FEE2E2', border: 'none', padding: 6, borderRadius: 8, color: '#DC2626', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inner Form Sheet */}
        {showForm && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px dashed #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#047857' }}>
                {editItem ? 'Edit Bank Transaction' : 'New Bank Transaction'}
              </h4>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group">
                <label className="input-label">Transaction Type</label>
                <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
                  <option value="deposit">FD Deposit / New FD (नवीन बँक ठेव पावती)</option>
                  <option value="renew">FD Renew (ठेव नूतनीकरण)</option>
                  <option value="interest">FD Interest Received (ठेवीवरील व्याज)</option>
                  <option value="withdrawal">FD Cash Withdrawal (ठेव रोख काढली)</option>
                  <option value="fd_expense">FD Withdrawal for Expense (ठेव मोडून खर्च करणे)</option>
                  <option value="charge">Bank Charge / Fee (बँक फी)</option>
                </select>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="input-label" style={{ margin: 0 }}>Title *</label>
                  <button type="button" onClick={() => { if (title) setTitle(transliterateText(title)); }} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, color: '#059669', padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                    <Languages size={12} /> Marathi
                  </button>
                </div>
                <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label">Amount (Rs.) *</label>
                <input type="number" className="input-field" value={amount} onChange={e => handleAmountRateChange(e.target.value, interestRate)} required />
              </div>

              {(type === 'deposit' || type === 'renew') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="input-group">
                    <label className="input-label">Rate (% p.a.)</label>
                    <input type="number" step="0.1" className="input-field" value={interestRate} onChange={e => handleAmountRateChange(amount, e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Expected Maturity (Rs.)</label>
                    <input type="number" className="input-field" value={expectedReturns} onChange={e => setExpectedReturns(e.target.value)} />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: 10, background: '#047857' }}>
                Save Transaction
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
