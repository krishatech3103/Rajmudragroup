import React, { useState } from 'react';
import { Download, CheckCircle2, Clock, BarChart2, X } from 'lucide-react';
import { generatePDFReport } from '../utils/pdf';
import { calculateSummary, getKharchByCategory } from '../utils/ledger';
import CollapsibleSection from './CollapsibleSection';
import ModalPortal from './ModalPortal';

export default function ReportsModule({ activeYear, data = {} }) {
  const [subTab, setSubTab] = useState('financials');
  const [memberFilter, setMemberFilter] = useState('paid');
  const [pdfScope, setPdfScope] = useState('all');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const ledgerData = data || {};

  const summary = calculateSummary(activeYear, ledgerData);
  const kharchCats = getKharchByCategory(activeYear, ledgerData.kharch);
  const members = Array.isArray(ledgerData.members) ? ledgerData.members : [];
  const varganiList = (Array.isArray(ledgerData.vargani) ? ledgerData.vargani : []).filter(vargani => !activeYear || vargani?.year === activeYear);

  const paidMemberIds = new Set(
    varganiList
      .filter(vargani => (vargani?.status || 'paid') === 'paid')
      .map(vargani => vargani.member_id)
      .filter(memberId => memberId !== undefined && memberId !== null)
      .map(memberId => String(memberId))
  );
  // Report only members with a donation row in the selected year. A global
  // members list may contain historic or deleted-test rows, which must not be
  // displayed as a current-year pending payment.
  const activeMemberIds = new Set(
    varganiList
      .map(vargani => vargani?.member_id)
      .filter(memberId => memberId !== undefined && memberId !== null)
      .map(memberId => String(memberId))
  );
  const activeMembers = members.filter(member => activeMemberIds.has(String(member.id)));
  const paidMembers = activeMembers.filter(member => paidMemberIds.has(String(member.id)));
  const pendingMembers = activeMembers.filter(member => !paidMemberIds.has(String(member.id)));

  const fmt = (v) => `Rs. ${Number(v).toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Top Banner with Clean PDF Export Button Alignment */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#ffffff',
        padding: '22px 26px',
        borderRadius: 26,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justify: 'space-between',
        gap: 16,
        marginBottom: 20,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ flex: '1 1 250px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#ffffff' }}>
            <BarChart2 size={24} color="#FFD700" /> Financial Audit Reports
          </h2>
          <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 4, display: 'block' }}>
            Official Mandal Statement • Year {activeYear}
          </span>
        </div>

        <button
          onClick={() => setShowPdfModal(true)}
            className="btn btn-gold"
            style={{
              flexShrink: 0,
              padding: '12px 20px',
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)'
            }}
          >
          <Download size={18} /> Download PDF
        </button>
      </div>

      {/* Sub Tabs Segmented Bar */}
      <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: 18, padding: 5, marginBottom: 20 }}>
        <button
          onClick={() => setSubTab('financials')}
          style={{
            flex: 1, padding: '12px 16px', border: 'none', borderRadius: 14,
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            background: subTab === 'financials' ? '#ffffff' : 'transparent',
            color: subTab === 'financials' ? '#FF5722' : '#64748B',
            boxShadow: subTab === 'financials' ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          Financial Overview
        </button>
        <button
          onClick={() => setSubTab('members')}
          style={{
            flex: 1, padding: '12px 16px', border: 'none', borderRadius: 14,
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            background: subTab === 'members' ? '#ffffff' : 'transparent',
            color: subTab === 'members' ? '#FF5722' : '#64748B',
            boxShadow: subTab === 'members' ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          Paid vs Pending Members
        </button>
      </div>

      {subTab === 'financials' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Revenue vs Expenses Ratio */}
          <CollapsibleSection
            title="Revenue vs expenses"
            summary={`Income ${fmt(summary.income)} • Expenses ${fmt(summary.kharch)}`}
            defaultOpen
          >

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Total Income</span>
                <span style={{ fontWeight: 900, color: '#059669' }}>{fmt(summary.income)}</span>
              </div>
              <div style={{ height: 12, background: '#ECFDF5', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#10B981', borderRadius: 8 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Total Expenses</span>
                <span style={{ fontWeight: 900, color: '#DC2626' }}>{fmt(summary.kharch)}</span>
              </div>
              <div style={{ height: 12, background: '#FEF2F2', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${summary.income > 0 ? Math.min(100, (summary.kharch / summary.income) * 100) : 0}%`,
                  background: '#EF4444', borderRadius: 8
                }} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Expense Category Breakdown */}
          <CollapsibleSection
            title="Expense category details"
            summary={`${kharchCats.length} categories — open when you need the breakdown`}
          >

            {kharchCats.length === 0 ? (
              <p style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>
                No expense records available for this festival year.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {kharchCats.map(item => {
                  const pct = summary.kharch > 0 ? Math.round((item.total / summary.kharch) * 100) : 0;
                  return (
                    <div key={item.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{item.category}</span>
                        <span style={{ fontWeight: 900, color: '#DC2626' }}>{fmt(item.total)} ({pct}%)</span>
                      </div>
                      <div style={{ height: 10, background: '#FEF2F2', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#EF4444', borderRadius: 6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleSection>
        </div>
      ) : (
        <div>
          {/* Member Paid vs Pending filter toggle */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <button
              onClick={() => setMemberFilter('paid')}
              style={{
                flex: 1, padding: '14px', borderRadius: 16,
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                background: memberFilter === 'paid' ? '#ECFDF5' : '#ffffff',
                color: memberFilter === 'paid' ? '#059669' : '#64748B',
                border: memberFilter === 'paid' ? '1.5px solid #A7F3D0' : '1.5px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <CheckCircle2 size={18} /> Contributed ({paidMembers.length})
            </button>

            <button
              onClick={() => setMemberFilter('pending')}
              style={{
                flex: 1, padding: '14px', borderRadius: 16,
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                background: memberFilter === 'pending' ? '#FEF2F2' : '#ffffff',
                color: memberFilter === 'pending' ? '#DC2626' : '#64748B',
                border: memberFilter === 'pending' ? '1.5px solid #FCA5A5' : '1.5px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <Clock size={18} /> Pending ({pendingMembers.length})
            </button>
          </div>

          {/* Members List */}
          {memberFilter === 'paid' ? (
            paidMembers.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>No members have contributed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paidMembers.map(m => (
                  <div key={m.id} className="luxe-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A' }}>{m.name}</h4>
                      <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0 0' }}>{m.phone || 'No mobile number'}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '5px 14px', borderRadius: 14 }}>
                      Paid ✅
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            pendingMembers.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '50px 0', color: '#059669', fontWeight: 800 }}>
                All members have contributed! 🎉
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingMembers.map(m => (
                  <div key={m.id} className="luxe-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0F172A' }}>{m.name}</h4>
                      <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0 0' }}>{m.phone || 'No mobile number'}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '5px 14px', borderRadius: 14 }}>
                      Pending ⏳
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {showPdfModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowPdfModal(false)}>
            <div className="modal-sheet" onClick={event => event.stopPropagation()}>
              <div className="sheet-pill" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <h3 style={{ margin: 0, color: '#0F172A', fontSize: 20, fontWeight: 900 }}>Download PDF Report</h3>
                <button type="button" onClick={() => setShowPdfModal(false)} aria-label="Close PDF report options" style={{ border: 'none', background: 'transparent', padding: 6, cursor: 'pointer' }}>
                  <X size={22} color="#64748B" />
                </button>
              </div>
              <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                Select the records you want included in the downloadable report.
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { value: 'all', title: 'All records', description: 'Income and expenses', color: '#7C3AED' },
                  { value: 'income', title: 'Income only', description: 'Donations and other income', color: '#047857' },
                  { value: 'expense', title: 'Expense only', description: 'Expense categories and entries', color: '#B91C1C' }
                ].map(option => {
                  const selected = pdfScope === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPdfScope(option.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '13px 14px', borderRadius: 14, border: selected ? `2px solid ${option.color}` : '1px solid #E2E8F0', background: selected ? `${option.color}12` : '#ffffff', color: '#0F172A', cursor: 'pointer' }}
                    >
                      <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? option.color : '#CBD5E1'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selected && <span style={{ width: 10, height: 10, borderRadius: '50%', background: option.color }} />}
                      </span>
                      <span><strong style={{ display: 'block', fontSize: 14, fontWeight: 900 }}>{option.title}</strong><small style={{ display: 'block', marginTop: 2, color: '#64748B', fontSize: 12, fontWeight: 600 }}>{option.description}</small></span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => { setShowPdfModal(false); generatePDFReport(activeYear, ledgerData, pdfScope); }}
                style={{ width: '100%', marginTop: 18, padding: '13px 18px', borderRadius: 14, fontSize: 14, fontWeight: 900 }}
              >
                <Download size={18} /> Download {pdfScope === 'all' ? 'All' : pdfScope === 'income' ? 'Income' : 'Expense'} Report
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
