import React, { useState } from 'react';
import { ArrowLeftRight, Banknote, CreditCard, X } from 'lucide-react';
import { createRecord } from '../services/supabase';
import { calculateTreasuryBalances } from '../utils/ledger';
import ModalPortal from './ModalPortal';

export default function TreasuryTransferModal({ isAdmin, activeYear, data = {}, onUpdate, onClose }) {
  const [direction, setDirection] = useState('cash_to_upi');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const balances = calculateTreasuryBalances(activeYear, data);
  const fromCash = direction === 'cash_to_upi';
  const source = fromCash ? 'Cash' : 'UPI';
  const destination = fromCash ? 'UPI' : 'Cash';
  const sourceBalance = fromCash ? balances.cash : balances.online;

  if (!isAdmin) return null;

  const handleSave = async event => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert('Enter a valid transfer amount.');
      return;
    }
    if (numericAmount > sourceBalance) {
      alert(`Transfer is greater than the available ${source} balance (Rs. ${sourceBalance.toLocaleString('en-IN')}).`);
      return;
    }

    setIsSaving(true);
    try {
      const record = await createRecord('bank_fd', {
        title: `${source} to ${destination} transfer`,
        type: direction,
        year: activeYear,
        amount: numericAmount,
        interest_rate: 0,
        expected_returns: 0,
        bank_name: 'Mandal Treasury',
        date,
        expiry_date: null,
        renewed_from_id: null,
        withdrawn_from_id: null,
        renewal_extra_amount: 0,
        renewal_extra_source: '',
        holder_name: '',
        note: note.trim(),
        is_locked: false
      });
      onUpdate?.({ table: 'bank_fd', eventType: 'UPSERT', record });
      onClose?.();
    } catch (error) {
      alert(`Could not save the transfer: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={event => event.stopPropagation()}>
          <div className="sheet-pill" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <div>
              <h3 style={{ margin: 0, color: '#0F172A', fontSize: 20, fontWeight: 900 }}>Cash / UPI Transfer</h3>
              <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12, fontWeight: 600 }}>Move money between the two current-year operating balances.</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close transfer form" style={{ border: 'none', background: 'transparent', padding: 6, cursor: 'pointer' }}>
              <X size={22} color="#64748B" />
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="input-group" style={{ marginTop: 18 }}>
              <label className="input-label">Transfer direction</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { value: 'cash_to_upi', label: 'Cash → UPI', icon: <Banknote size={17} /> },
                  { value: 'upi_to_cash', label: 'UPI → Cash', icon: <CreditCard size={17} /> }
                ].map(option => {
                  const selected = direction === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDirection(option.value)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12, borderRadius: 12, border: selected ? '2px solid #2563EB' : '1px solid #CBD5E1', background: selected ? '#EFF6FF' : '#ffffff', color: selected ? '#1D4ED8' : '#64748B', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {option.icon} {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: fromCash ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${fromCash ? '#BBF7D0' : '#BFDBFE'}` }}>
                <span style={{ display: 'block', color: '#64748B', fontSize: 11, fontWeight: 800 }}>Available {source}</span>
                <strong style={{ display: 'block', marginTop: 3, color: fromCash ? '#047857' : '#1D4ED8', fontSize: 16 }}>Rs. {sourceBalance.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ display: 'block', color: '#64748B', fontSize: 11, fontWeight: 800 }}>Destination</span>
                <strong style={{ display: 'block', marginTop: 3, color: '#334155', fontSize: 16 }}>{destination}</strong>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Amount (Rs.) *</label>
              <input type="number" min="0.01" step="0.01" className="input-field" value={amount} onChange={event => setAmount(event.target.value)} placeholder="e.g. 500" required />
            </div>
            <div className="input-group">
              <label className="input-label">Transfer date</label>
              <input type="date" className="input-field" value={date} onChange={event => setDate(event.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Note (optional)</label>
              <input type="text" className="input-field" value={note} onChange={event => setNote(event.target.value)} placeholder="Reason for this transfer" />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ width: '100%', marginTop: 8, borderRadius: 14, opacity: isSaving ? 0.7 : 1 }}>
              <ArrowLeftRight size={18} /> {isSaving ? 'Saving transfer…' : `Transfer ${source} to ${destination}`}
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
