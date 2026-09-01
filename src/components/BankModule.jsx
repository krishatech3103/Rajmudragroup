import React, { useState } from 'react';
import { Landmark, Plus, Search, Edit, Trash2, X, Lock, RefreshCw, ArrowLeftRight, Download } from 'lucide-react';
import { createRecord, deleteRecord, updateRecord } from '../services/supabase';
import { calculateBankFDSummary, calculateTreasuryBalances, deriveYearFromDate } from '../utils/ledger';
import { generateBankTreasuryPDF } from '../utils/pdf';

const YEARS = ['2026-27', '2025-26', '2024-25', '2027-28', '2023-24'];
export default function BankModule({ isAdmin, activeYear, onUpdate, data = {} }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formMode, setFormMode] = useState('new_fd');

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordYear, setRecordYear] = useState(activeYear);
  const [note, setNote] = useState('');
  const [renewedFromId, setRenewedFromId] = useState('');
  const [withdrawnFromId, setWithdrawnFromId] = useState('');
  const [fdSource, setFdSource] = useState('Cash');
  const [withdrawDestination, setWithdrawDestination] = useState('Cash');
  const [renewalExtraAmount, setRenewalExtraAmount] = useState('');
  const [renewalExtraSource, setRenewalExtraSource] = useState('Cash');

  const fdList = Array.isArray(data.bank_fd) ? data.bank_fd : [];
  const fdSummary = calculateBankFDSummary(fdList);
  const treasuryBalances = calculateTreasuryBalances(activeYear, data);
  const renewedSourceIds = new Set(
    fdList
      .filter(item => item?.type === 'renew' && item?.renewed_from_id !== undefined && item.renewed_from_id !== null && String(item.id) !== String(editItem?.id))
      .map(item => String(item.renewed_from_id))
  );
  const activeFDs = fdList.filter(item => (
    ['deposit', 'renew', 'cash_to_bank', 'upi_to_bank'].includes(item?.type)
    && !renewedSourceIds.has(String(item.id))
  )).map(fd => ({
    ...fd,
    available_amount: Number(fd.amount) - fdList
      .filter(item => ['bank_to_cash', 'bank_to_upi'].includes(item?.type) && String(item.withdrawn_from_id) === String(fd.id) && String(item.id) !== String(editItem?.id))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  })).filter(fd => fd.available_amount > 0);
  const renewableFDs = activeFDs;

  const filtered = fdList.filter(item => {
    const matchesSearch = String(item.title || '').toLowerCase().includes(search.toLowerCase()) ||
                          (item.bank_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (item.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All'
      || (selectedType === 'new_fd' ? ['cash_to_bank', 'upi_to_bank', 'deposit'].includes(item.type) : false)
      || (selectedType === 'withdraw' ? ['bank_to_cash', 'bank_to_upi', 'withdrawal'].includes(item.type) : false)
      || item.type === selectedType;
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
      const mode = item.type === 'cash_to_bank' || item.type === 'upi_to_bank'
        ? 'new_fd'
        : item.type === 'bank_to_cash' || item.type === 'bank_to_upi'
          ? 'withdraw_fd'
          : item.type === 'renew' ? 'renew_fd' : null;
      if (!mode) {
        alert('This is a historical bank entry type. It remains in the audit list, but cannot be changed with the simplified FD flow.');
        return;
      }
      setEditItem(item);
      setFormMode(mode);
      setTitle(item.title);
      setType(item.type || 'deposit');
      setAmount(item.amount);
      setDate(item.date);
      setRecordYear(item.year || activeYear);
      setNote(item.note || '');
      setRenewedFromId(item.renewed_from_id ? String(item.renewed_from_id) : '');
      setWithdrawnFromId(item.withdrawn_from_id ? String(item.withdrawn_from_id) : '');
      setFdSource(item.type === 'upi_to_bank' ? 'UPI' : 'Cash');
      setWithdrawDestination(item.type === 'bank_to_upi' ? 'UPI' : 'Cash');
      setRenewalExtraAmount(item.renewal_extra_amount || '');
      setRenewalExtraSource(item.renewal_extra_source || 'Cash');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setEditItem(null);
      setFormMode('new_fd');
      setTitle('New FD from Cash');
      setType('cash_to_bank');
      setAmount('');
      setDate(today);
      setRecordYear(activeYear);
      setNote('');
      setRenewedFromId('');
      setWithdrawnFromId('');
      setFdSource('Cash');
      setWithdrawDestination('Cash');
      setRenewalExtraAmount('');
      setRenewalExtraSource('Cash');
    }
    setShowModal(true);
  };

  const openNewFDForm = () => {
    if (!isAdmin) return;
    const today = new Date().toISOString().split('T')[0];
    setEditItem(null);
    setFormMode('new_fd');
    setFdSource('Cash');
    setType('cash_to_bank');
    setTitle('New FD from Cash');
    setAmount('');
    setDate(today);
    setRecordYear(activeYear);
    setNote('');
    setRenewedFromId('');
    setWithdrawnFromId('');
    setRenewalExtraAmount('');
    setRenewalExtraSource('Cash');
    setShowModal(true);
  };

  const openWithdrawFDForm = () => {
    openNewFDForm();
    setFormMode('withdraw_fd');
    setType('bank_to_cash');
    setTitle('FD Withdrawal to Cash');
    setWithdrawDestination('Cash');
    setWithdrawnFromId('');
  };

  const openRenewFDForm = () => {
    openNewFDForm();
    setFormMode('renew_fd');
    setType('renew');
    setTitle('FD Renewal');
    setRenewedFromId('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount) {
      alert('Amount is required!');
      return;
    }

    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Enter a valid amount!');
      return;
    }

    const entryType = formMode === 'new_fd'
      ? (fdSource === 'Cash' ? 'cash_to_bank' : 'upi_to_bank')
      : formMode === 'withdraw_fd'
        ? (withdrawDestination === 'Cash' ? 'bank_to_cash' : 'bank_to_upi')
        : formMode === 'renew_fd' ? 'renew' : type;

    if (formMode === 'renew_fd' && !renewedFromId) {
      alert('Select the FD that is being renewed.');
      return;
    }
    if (formMode === 'withdraw_fd' && !withdrawnFromId) {
      alert('Select the FD to withdraw from.');
      return;
    }

    // Prevent a new transfer from moving more than the currently calculated
    // fund balance. Historical-year edits remain allowed because this screen
    // only has the active year's income and expense rows in memory.
    if (!editItem && recordYear === activeYear && formMode === 'new_fd') {
      const sourceBalance = fdSource === 'Cash' ? treasuryBalances.cash : treasuryBalances.online;
      if (numAmt > sourceBalance) {
        alert(`New FD amount is greater than the available ${fdSource} balance (Rs. ${sourceBalance.toLocaleString('en-IN')}).`);
        return;
      }
    }

    const selectedFD = activeFDs.find(fd => String(fd.id) === String(formMode === 'withdraw_fd' ? withdrawnFromId : renewedFromId));
    if (!editItem && formMode === 'withdraw_fd' && (!selectedFD || numAmt > selectedFD.available_amount)) {
      alert(`Withdrawal is greater than the selected FD balance (Rs. ${(selectedFD?.available_amount || 0).toLocaleString('en-IN')}).`);
      return;
    }

    const extraAmount = Number(renewalExtraAmount) || 0;
    if (formMode === 'renew_fd' && extraAmount > 0) {
      const sourceBalance = renewalExtraSource === 'Cash' ? treasuryBalances.cash : treasuryBalances.online;
      if (extraAmount > sourceBalance) {
        alert(`Renewal top-up is greater than the available ${renewalExtraSource} balance (Rs. ${sourceBalance.toLocaleString('en-IN')}).`);
        return;
      }
    }
    if (formMode === 'renew_fd' && selectedFD && numAmt < selectedFD.available_amount + extraAmount) {
      alert('Renewed FD total must include the selected FD balance and any top-up amount.');
      return;
    }

    const payload = {
      title: title.trim(),
      type: entryType,
      year: recordYear || deriveYearFromDate(date, activeYear),
      amount: numAmt,
      interest_rate: 0,
      expected_returns: 0,
      bank_name: 'Mandal Bank FD Account',
      date,
      expiry_date: null,
      renewed_from_id: entryType === 'renew' ? Number(renewedFromId) : null,
      withdrawn_from_id: ['bank_to_cash', 'bank_to_upi'].includes(entryType) ? Number(withdrawnFromId) : null,
      renewal_extra_amount: entryType === 'renew' ? extraAmount : 0,
      renewal_extra_source: entryType === 'renew' && extraAmount > 0 ? renewalExtraSource : '',
      holder_name: '',
      note: note.trim()
    };

    setIsSaving(true);
    try {
      const record = editItem
        ? await updateRecord('bank_fd', editItem.id, payload)
        : await createRecord('bank_fd', payload);
      onUpdate?.({ table: 'bank_fd', eventType: 'UPSERT', record });

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
      case 'cash_to_bank': return { label: 'New FD from Cash', color: '#047857', bg: '#ECFDF5' };
      case 'upi_to_bank': return { label: 'New FD from UPI', color: '#047857', bg: '#ECFDF5' };
      case 'renew': return { label: 'FD Renewal', color: '#B45309', bg: '#FFFBEB' };
      case 'bank_to_cash': return { label: 'FD Withdrawal to Cash', color: '#B45309', bg: '#FFFBEB' };
      case 'bank_to_upi': return { label: 'FD Withdrawal to UPI', color: '#B45309', bg: '#FFFBEB' };
      default: return { label: 'Historical bank entry', color: '#475569', bg: '#F8FAFC' };
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
        color: '#ffffff',
        padding: '18px 20px',
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        boxShadow: '0 14px 35px rgba(5, 150, 105, 0.3)'
      }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Landmark size={24} color="#A7F3D0" /> Mandal Bank FD
          </h2>
        </div>

        <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
          <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
            ALL-TIME FD BALANCE
          </span>
          <p style={{ fontSize: 26, fontWeight: 900, margin: '2px 0 0 0', letterSpacing: -0.5 }}>
            Rs. {fdSummary.current_fd_balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filter Tabs Pills */}
      <div data-disable-page-swipe="true" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        {['All', 'new_fd', 'renew', 'withdraw'].map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`category-pill ${selectedType === t ? 'active' : ''}`}
            style={{
              background: selectedType === t ? '#047857' : undefined,
              borderColor: selectedType === t ? '#047857' : undefined
            }}
          >
            {t === 'All' ? 'All Entries' : t === 'new_fd' ? 'New FDs' : t === 'renew' ? 'Renewals' : 'Withdrawals'}
          </button>
        ))}
      </div>

      {/* Search & Add Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: 16, top: 14 }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 46, borderRadius: 16 }}
            placeholder="Search FD entries or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => generateBankTreasuryPDF(fdList)}
          style={{ width: 'auto', padding: '0 18px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <Download size={18} /> All-Time Report
        </button>

        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' }}>
            <button className="btn btn-success" onClick={openNewFDForm} style={{ padding: '11px 8px', borderRadius: 14, background: '#047857', borderColor: '#047857', fontSize: 12 }}><Plus size={16} /> New FD</button>
            <button className="btn btn-secondary" onClick={openWithdrawFDForm} style={{ padding: '11px 8px', borderRadius: 14, fontSize: 12 }}><ArrowLeftRight size={16} /> Withdraw</button>
            <button className="btn btn-secondary" onClick={openRenewFDForm} style={{ padding: '11px 8px', borderRadius: 14, fontSize: 12 }}><RefreshCw size={16} /> Renew FD</button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
          <Landmark size={56} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 15, fontWeight: 700 }}>No bank entries added yet.</p>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Add a New FD from Cash/UPI, withdraw a selected FD, or renew a selected FD.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(item => {
            const meta = getTypeLabel(item.type);
            const isNegative = item.type === 'withdrawal' || item.type === 'charge' || item.type === 'fd_expense' || item.type === 'bank_expense' || item.type === 'bank_to_cash' || item.type === 'bank_to_upi';
            const isLinkedToRenewal = fdList.some(record => (
              String(record?.renewed_from_id) === String(item.id)
              || (['bank_to_cash', 'bank_to_upi'].includes(item.type) && String(record?.renewed_from_id) === String(item.withdrawn_from_id))
            ));

            return (
              <div key={item.id} className="luxe-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 15px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: meta.bg, color: meta.color, borderRadius: 8, padding: '3px 7px', fontSize: 11, fontWeight: 900 }}>{meta.label}</span>
                    {item.is_locked && <span style={{ color: '#B45309', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Lock size={11} /> Audit</span>}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, margin: '7px 0 0', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 700, margin: '3px 0 0' }}>{item.year} • {new Date(item.date).toLocaleDateString('en-IN')}</p>
                  {item.note && <p style={{ fontSize: 12, color: '#475569', margin: '5px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Note: {item.note}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: isNegative ? '#DC2626' : '#059669', whiteSpace: 'nowrap' }}>
                    {isNegative ? '-' : '+'} Rs. {Number(item.amount).toLocaleString('en-IN')}
                  </span>
                  {isAdmin && !item.is_locked && !isLinkedToRenewal && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openForm(item)} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: 7, borderRadius: 9, color: '#B45309', cursor: 'pointer' }} title="Edit entry"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(item.id, item.title, item.is_locked)} style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: 7, borderRadius: 9, color: '#B91C1C', cursor: 'pointer' }} title="Delete entry"><Trash2 size={15} /></button>
                    </div>
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
                {formMode === 'new_fd' ? (editItem ? 'Edit New FD' : 'Add New FD') : formMode === 'withdraw_fd' ? (editItem ? 'Edit FD Withdrawal' : 'Withdraw FD') : (editItem ? 'Edit FD Renewal' : 'Renew FD')}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {formMode === 'new_fd' && (
                <div className="input-group">
                  <label className="input-label">Fund new FD from *</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Cash', 'UPI'].map(source => <button key={source} type="button" onClick={() => { setFdSource(source); setType(source === 'Cash' ? 'cash_to_bank' : 'upi_to_bank'); setTitle(`New FD from ${source}`); }} style={{ flex: 1, padding: 11, borderRadius: 12, border: fdSource === source ? '2px solid #047857' : '1px solid #CBD5E1', background: fdSource === source ? '#ECFDF5' : '#ffffff', color: fdSource === source ? '#047857' : '#64748B', fontWeight: 800, cursor: 'pointer' }}>{source}</button>)}
                  </div>
                  <p style={{ margin: '7px 0 0', color: '#475569', fontSize: 12, fontWeight: 700 }}>Money moves from the selected current-year fund into this FD.</p>
                </div>
              )}

              {formMode === 'withdraw_fd' && (
                <div className="input-group">
                  <label className="input-label">Withdraw from FD *</label>
                  <select className="input-field" value={withdrawnFromId} onChange={event => setWithdrawnFromId(event.target.value)} required>
                    <option value="">Select FD</option>
                    {activeFDs.map(fd => <option key={fd.id} value={fd.id}>{fd.title} — Available Rs. {fd.available_amount.toLocaleString('en-IN')}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    {['Cash', 'UPI'].map(destination => <button key={destination} type="button" onClick={() => { setWithdrawDestination(destination); setType(destination === 'Cash' ? 'bank_to_cash' : 'bank_to_upi'); setTitle(`FD Withdrawal to ${destination}`); }} style={{ flex: 1, padding: 11, borderRadius: 12, border: withdrawDestination === destination ? '2px solid #D97706' : '1px solid #CBD5E1', background: withdrawDestination === destination ? '#FFFBEB' : '#ffffff', color: withdrawDestination === destination ? '#B45309' : '#64748B', fontWeight: 800, cursor: 'pointer' }}>To {destination}</button>)}
                  </div>
                </div>
              )}

              {formMode === 'renew_fd' && (
                <div className="input-group">
                  <label className="input-label">FD Being Renewed *</label>
                  <select className="input-field" value={renewedFromId} onChange={event => setRenewedFromId(event.target.value)} required>
                    <option value="">Select the old FD</option>
                    {renewableFDs.map(fd => <option key={fd.id} value={fd.id}>{fd.title} — Available Rs. {fd.available_amount.toLocaleString('en-IN')}</option>)}
                  </select>
                  <p style={{ margin: '7px 0 0', color: '#475569', fontSize: 12, fontWeight: 700 }}>The final renewed total replaces this selected FD, so its balance is never counted twice.</p>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">{formMode === 'renew_fd' ? 'Final renewed FD total (Rs.) *' : 'Amount (Rs.) *'}</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              {formMode === 'renew_fd' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Add extra money (optional)</label>
                    <input type="number" min="0" className="input-field" value={renewalExtraAmount} onChange={event => setRenewalExtraAmount(event.target.value)} placeholder="e.g. 5000" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Extra money from</label>
                    <select className="input-field" value={renewalExtraSource} onChange={event => setRenewalExtraSource(event.target.value)} disabled={!renewalExtraAmount || Number(renewalExtraAmount) <= 0}>
                      <option value="Cash">Cash</option><option value="UPI">UPI</option>
                    </select>
                  </div>
                </div>
              )}

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

              <div className="input-group">
                <label className="input-label">Important Note / Receipt Ref</label>
                <input
                  type="text"
                  className="input-field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. receipt no., reason, or reminder"
                />
              </div>

              <button type="submit" className="btn btn-success" disabled={isSaving} style={{ marginTop: 14, width: '100%', background: '#047857', borderColor: '#047857', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving…' : editItem ? 'Update FD Entry' : formMode === 'new_fd' ? 'Add New FD' : formMode === 'withdraw_fd' ? 'Withdraw Selected FD' : 'Renew Selected FD'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
