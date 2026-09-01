import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Flame, Landmark, ChevronRight, Users, CheckCircle2, Clock } from 'lucide-react';
import { calculateBankFDSummary, calculateSummary } from '../utils/ledger';
import CollapsibleSection from './CollapsibleSection';

export default function Dashboard({ isAdmin, activeYear, onUpdate, onNavigateTab, data = {} }) {
  const ledgerData = data || {};
  const summary = calculateSummary(activeYear, ledgerData);
  const aartiList = (Array.isArray(ledgerData.aarti) ? ledgerData.aarti : []).filter(aarti => !activeYear || aarti?.year === activeYear);
  const fdSummary = calculateBankFDSummary(ledgerData.bank_fd);

  const isPositive = summary.balance >= 0;
  const fmt = (v) => `Rs. ${Number(v).toLocaleString('en-IN')}`;

  const latestAarti = aartiList.length > 0 ? aartiList[0] : null;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      {/* Hero Net Balance Metallic Luxury Banner */}
      <div
        style={{
          background: isPositive
            ? 'linear-gradient(135deg, #FF5722 0%, #F4511E 40%, #D84315 100%)'
            : 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)',
          borderRadius: 24,
          padding: 20,
          color: '#ffffff',
          boxShadow: isPositive
            ? '0 16px 40px rgba(255, 87, 34, 0.35)'
            : '0 16px 40px rgba(220, 38, 38, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 16
        }}
      >
        {/* Glow Spheres */}
        <div style={{
          position: 'absolute', right: -30, top: -30, width: 160, height: 160,
          background: 'rgba(255, 255, 255, 0.15)', borderRadius: '50%', filter: 'blur(25px)'
        }} />
        <div style={{
          position: 'absolute', left: -20, bottom: -20, width: 120, height: 120,
          background: 'rgba(255, 179, 0, 0.25)', borderRadius: '50%', filter: 'blur(20px)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.95, display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.8 }}>
            <Wallet size={18} /> YEARLY FINANCIAL SUMMARY
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '12px 16px', marginTop: 18, position: 'relative', zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownRight size={18} color="#4ADE80" />
            <div>
              <span style={{ fontSize: 10, opacity: 0.85, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Income</span>
              <span style={{ fontSize: 14, fontWeight: 900 }}>{fmt(summary.income)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={18} color="#F87171" />
            <div>
              <span style={{ fontSize: 10, opacity: 0.85, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Expense</span>
              <span style={{ fontSize: 14, fontWeight: 900 }}>{fmt(summary.kharch)}</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, marginTop: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.85, letterSpacing: 0.8, textTransform: 'uppercase' }}>Available Balance</span>
          <h2 style={{ fontSize: 34, fontWeight: 900, margin: '4px 0 0 0', letterSpacing: -0.5, color: '#ffffff' }}>
            Rs. {Number(summary.balance).toLocaleString('en-IN')}
          </h2>
        </div>
      </div>

      <CollapsibleSection
        title="Yearly details & member status"
        summary="Donations, other income, expenses, and member payment progress"
        style={{ marginBottom: 16 }}
      >
      {/* Financial Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('vargani'); }}
          style={{ padding: '14px 12px', textAlign: 'center', cursor: 'pointer', borderRadius: 16 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 12, background: '#EFF6FF',
            color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto'
          }}>
            <Users size={18} />
          </div>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 800, display: 'block' }}>Donations</span>
          <p style={{ fontSize: 15, fontWeight: 900, margin: '2px 0 0 0', color: '#1D4ED8' }}>
            {fmt(summary.vargani)}
          </p>
        </div>

        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('jama'); }}
          style={{ padding: '14px 12px', textAlign: 'center', cursor: 'pointer', borderRadius: 16 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 12, background: '#ECFDF5',
            color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto'
          }}>
            <ArrowDownRight size={18} />
          </div>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 800, display: 'block' }}>Other Income</span>
          <p style={{ fontSize: 15, fontWeight: 900, margin: '2px 0 0 0', color: '#059669' }}>
            {fmt(summary.jama)}
          </p>
        </div>

        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('kharch'); }}
          style={{ padding: '14px 12px', textAlign: 'center', cursor: 'pointer', borderRadius: 16 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 12, background: '#FEF2F2',
            color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto'
          }}>
            <ArrowUpRight size={18} />
          </div>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 800, display: 'block' }}>Expenses</span>
          <p style={{ fontSize: 15, fontWeight: 900, margin: '2px 0 0 0', color: '#DC2626' }}>
            {fmt(summary.kharch)}
          </p>
        </div>
      </div>

      {/* Member Payment Status Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('vargani'); }}
          style={{ padding: '14px 10px', textAlign: 'center', cursor: 'pointer', borderRadius: 16 }}
        >
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 800, display: 'block' }}>Active Members</span>
          <h4 style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 0 0', color: '#0F172A' }}>
            {summary.membersCount}
          </h4>
          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>Total Registered</span>
        </div>

        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('vargani'); }}
          style={{ padding: '14px 10px', textAlign: 'center', cursor: 'pointer', borderRadius: 16, border: '1px solid #86EFAC', background: '#F0FDF4' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#15803D' }}>
            <CheckCircle2 size={14} />
            <span style={{ fontSize: 11, fontWeight: 900 }}>Paid</span>
          </div>
          <h4 style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 0 0', color: '#15803D' }}>
            {summary.paidMembersCount}
          </h4>
          <span style={{ fontSize: 10, color: '#166534', fontWeight: 700 }}>Receipt Issued</span>
        </div>

        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('vargani', { donationFilter: 'pending' }); }}
          style={{ padding: '14px 10px', textAlign: 'center', cursor: 'pointer', borderRadius: 16, border: '1px solid #FDE68A', background: '#FFFBEB' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#B45309' }}>
            <Clock size={14} />
            <span style={{ fontSize: 11, fontWeight: 900 }}>Pending</span>
          </div>
          <h4 style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 0 0', color: '#B45309' }}>
            {summary.pendingMembersCount}
          </h4>
          <span style={{ fontSize: 10, color: '#92400E', fontWeight: 700 }}>Rs. {summary.pendingVargani.toLocaleString('en-IN')} due</span>
        </div>
      </div>
      </CollapsibleSection>

      {/* Today's Aarti Yajman Card (Visible to Viewers & Admin) */}
      {latestAarti && (
        <div
          className="luxe-card"
          onClick={() => { if (onNavigateTab) onNavigateTab('aarti'); }}
          style={{
            padding: 16,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid #FFD700',
            marginBottom: 16,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, background: '#FF5722',
                color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Flame size={20} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#C2410C', fontWeight: 800, textTransform: 'uppercase' }}>
                  Aarti Schedule • {latestAarti.slot === 'morning' ? 'Morning (सकाळ)' : 'Evening (संध्याकाळ)'}
                </span>
                <h4 style={{ fontSize: 16, fontWeight: 900, margin: '2px 0 0 0', color: '#7C2D12' }}>
                  {latestAarti.yajman_name}
                </h4>
              </div>
            </div>

            <ChevronRight size={20} color="#C2410C" />
          </div>
        </div>
      )}

      {/* Mandal Bank / FD is useful less often, so it remains at the end. */}
      <div
        className="luxe-card"
        onClick={() => { if (onNavigateTab) onNavigateTab('bank'); }}
        style={{
          background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
          color: '#ffffff',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          cursor: 'pointer',
          boxShadow: '0 12px 30px rgba(5, 150, 105, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 14, background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Landmark size={20} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' }}>
                MANDAL BANK / FD BALANCE
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: '2px 0 0 0', color: '#ffffff' }}>
                Rs. {fdSummary.current_fd_balance.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.18)', padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
            <span>Open Bank Tab</span>
            <ChevronRight size={15} />
          </div>
        </div>

        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700
        }}>
          <span>Kept separate from the yearly donation and expense balance.</span>
          <span style={{ fontWeight: 900, color: '#A7F3D0' }}>View Bank Ledger →</span>
        </div>
      </div>
    </div>
  );
}
