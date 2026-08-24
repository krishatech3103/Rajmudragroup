import React, { useState } from 'react';
import { Download, CheckCircle2, Clock, BarChart2 } from 'lucide-react';
import { db } from '../services/db';
import { generatePDFReport } from '../utils/pdf';

export default function ReportsModule({ activeYear }) {
  const [subTab, setSubTab] = useState('financials');
  const [memberFilter, setMemberFilter] = useState('paid');

  const summary = db.getSummary(activeYear);
  const kharchCats = db.getKharchByCategory(activeYear);
  const members = db.getMembers();
  const varganiList = db.getVargani(activeYear);

  const paidMemberIds = [...new Set(varganiList.map(v => v.member_id))];
  const paidMembers = members.filter(m => paidMemberIds.includes(m.id));
  const pendingMembers = members.filter(m => !paidMemberIds.includes(m.id));

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
          onClick={() => generatePDFReport(activeYear)}
          className="btn btn-gold"
          style={{
            flexShrink: 0,
            padding: '12px 22px',
            borderRadius: 16,
            fontSize: 14,
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)'
          }}
        >
          <Download size={18} /> Download PDF Audit Report
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
          <div className="luxe-card">
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, color: '#0F172A' }}>
              Revenue vs Expenses Ratio
            </h3>

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
          </div>

          {/* Expense Category Breakdown */}
          <div className="luxe-card">
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, color: '#0F172A' }}>
              Expenses Category Distribution
            </h3>

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
          </div>
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
    </div>
  );
}
