import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Users, Sparkles, ArrowUpRight, ArrowDownRight, Flame, Sun, Moon } from 'lucide-react';
import { db } from '../services/db';

export default function Dashboard({ activeYear }) {
  const summary = db.getSummary(activeYear);
  const members = db.getMembers();
  const vargani = db.getVargani(activeYear);
  const aartiList = db.getAarti(activeYear);

  const paidMemberIds = [...new Set(vargani.map(v => v.member_id))];
  const paidCount = paidMemberIds.length;
  const memberCount = members.length;
  const pendingCount = Math.max(0, memberCount - paidCount);
  const pctPaid = memberCount > 0 ? Math.round((paidCount / memberCount) * 100) : 0;

  const isPositive = summary.balance >= 0;
  const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

  const latestAarti = aartiList.length > 0 ? aartiList[0] : null;

  return (
    <div style={{ padding: '20px 20px 28px 20px' }} className="animate-fade-in">
      {/* Hero Net Balance Metallic Luxury Banner */}
      <div
        style={{
          background: isPositive
            ? 'linear-gradient(135deg, #FF5722 0%, #F4511E 40%, #D84315 100%)'
            : 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)',
          borderRadius: 28,
          padding: 26,
          color: '#ffffff',
          boxShadow: isPositive
            ? '0 16px 40px rgba(255, 87, 34, 0.35)'
            : '0 16px 40px rgba(220, 38, 38, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.95, display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.8 }}>
            <Wallet size={18} /> NET FESTIVAL BALANCE
          </span>
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '5px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}>
            <Sparkles size={13} color="#FFD700" />
            {isPositive ? 'SURPLUS' : 'DEFICIT'}
          </span>
        </div>

        <h2 style={{ fontSize: 42, fontWeight: 900, margin: '14px 0 8px 0', letterSpacing: -1, position: 'relative', zIndex: 2 }}>
          {fmt(summary.balance)}
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          background: 'rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '10px 14px', marginTop: 14, position: 'relative', zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowDownRight size={16} color="#4ADE80" />
            <div>
              <span style={{ fontSize: 10, opacity: 0.8, display: 'block' }}>Total Revenue</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{fmt(summary.income)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpRight size={16} color="#F87171" />
            <div>
              <span style={{ fontSize: 10, opacity: 0.8, display: 'block' }}>Total Expenses</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{fmt(summary.kharch)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aarti Schedule Highlight Card */}
      {latestAarti && (
        <div className="luxe-card" style={{ marginBottom: 20, border: '1.5px solid rgba(255, 179, 0, 0.4)', background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF5ED 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#D84315', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={18} color="#FF5722" /> Aarti Schedule & Hosts
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '3px 10px', borderRadius: 10 }}>
              {latestAarti.day_title}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#ffffff', padding: 10, borderRadius: 12, border: '1px solid #FDE68A' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', display: 'block' }}>
                <Sun size={12} style={{ display: 'inline', marginRight: 3 }} /> Morning Aarti ({latestAarti.morning_time || '09.00 AM'})
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#451A03' }}>
                {latestAarti.morning_host || 'Enter Name'}
              </span>
            </div>

            <div style={{ background: '#ffffff', padding: 10, borderRadius: 12, border: '1px solid #BAE6FD' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', display: 'block' }}>
                <Moon size={12} style={{ display: 'inline', marginRight: 3 }} /> Evening Aarti ({latestAarti.evening_time || '08.00 PM'})
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0C4A6E' }}>
                {latestAarti.evening_host || 'Enter Name'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary 3 Glass Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="luxe-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14, background: '#EFF6FF',
            color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
          }}>
            <Users size={20} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>Donations</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#1D4ED8', marginTop: 2 }}>{fmt(summary.vargani)}</p>
        </div>

        <div className="luxe-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14, background: '#ECFDF5',
            color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <TrendingUp size={20} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>Other Income</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#059669', marginTop: 2 }}>{fmt(summary.jama)}</p>
        </div>

        <div className="luxe-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14, background: '#FEF2F2',
            color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
          }}>
            <TrendingDown size={20} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>Expenses</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#DC2626', marginTop: 2 }}>{fmt(summary.kharch)}</p>
        </div>
      </div>

      {/* Member Progress Luxe Card */}
      <div className="luxe-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
            Member Contribution Rate
          </h3>
          <span style={{
            fontSize: 13, fontWeight: 900, color: '#FF5722',
            background: '#FFF7ED', padding: '4px 12px', borderRadius: 20, border: '1px solid #FFEDD5'
          }}>
            {pctPaid}% Paid
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 16, border: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#334155' }}>{memberCount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Members</p>
          </div>
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 16, border: '1px solid #DCFCE7' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#16A34A' }}>{paidCount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>Paid ✅</p>
          </div>
          <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 16, border: '1px solid #FEE2E2' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#DC2626' }}>{pendingCount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C' }}>Pending ⏳</p>
          </div>
        </div>

        {memberCount > 0 && (
          <div>
            <div style={{
              height: 12, background: '#F1F5F9', borderRadius: 8, overflow: 'hidden', padding: 2
            }}>
              <div style={{
                height: '100%', width: `${pctPaid}%`,
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                borderRadius: 6,
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Ledger Breakdown Card */}
      <div className="luxe-card">
        <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 16, color: '#0F172A' }}>
          Mandal Financial Ledger
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: '#475569' }}>1. Member Donations (Vargani)</span>
            <span style={{ color: '#1D4ED8', fontWeight: 800 }}>{fmt(summary.vargani)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: '#475569' }}>2. Other Income (Jama)</span>
            <span style={{ color: '#059669', fontWeight: 800 }}>{fmt(summary.jama)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
            <span style={{ color: '#0F172A' }}>Total Income</span>
            <span style={{ color: '#10B981' }}>{fmt(summary.income)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
            <span style={{ color: '#0F172A' }}>Total Expenses</span>
            <span style={{ color: '#EF4444' }}>{fmt(summary.kharch)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '2px solid #FF5722' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
            <span style={{ color: '#0F172A' }}>Net Balance</span>
            <span style={{ color: isPositive ? '#10B981' : '#EF4444' }}>{fmt(summary.balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
