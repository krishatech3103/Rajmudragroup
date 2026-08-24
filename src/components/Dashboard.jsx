import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Users, Sparkles, ArrowUpRight, ArrowDownRight, Flame, Sun, Moon, Landmark, ChevronRight } from 'lucide-react';
import { db } from '../services/db';

export default function Dashboard({ isAdmin, activeYear, onUpdate, onNavigateTab }) {
  const summary = db.getSummary(activeYear);
  const members = db.getMembers();
  const vargani = db.getVargani(activeYear);
  const aartiList = db.getAarti(activeYear);
  const fdSummary = db.getBankFDSummary();

  const paidMemberIds = [...new Set(vargani.map(v => v.member_id))];
  const paidCount = paidMemberIds.length;
  const memberCount = members.length;
  const pendingCount = Math.max(0, memberCount - paidCount);
  const pctPaid = memberCount > 0 ? Math.round((paidCount / memberCount) * 100) : 0;

  const isPositive = summary.balance >= 0;
  const fmt = (v) => `Rs. ${Number(v).toLocaleString('en-IN')}`;

  const latestAarti = aartiList.length > 0 ? aartiList[0] : null;

  return (
    <div style={{ padding: '20px 20px 28px 20px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }} className="animate-fade-in">
      {/* Hero Net Balance Metallic Luxury Banner */}
      <div
        style={{
          background: isPositive
            ? 'linear-gradient(135deg, #FF5722 0%, #F4511E 40%, #D84315 100%)'
            : 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)',
          borderRadius: 28,
          padding: 24,
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.95, display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.8 }}>
            <Wallet size={18} /> NET FESTIVAL CASH BALANCE
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

        <h2 style={{ fontSize: 36, fontWeight: 900, margin: '14px 0 10px 0', letterSpacing: -0.5, position: 'relative', zIndex: 2, color: '#ffffff' }}>
          Rs. {Number(summary.balance).toLocaleString('en-IN')}
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '12px 16px', marginTop: 14, position: 'relative', zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownRight size={18} color="#4ADE80" />
            <div>
              <span style={{ fontSize: 10, opacity: 0.85, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Revenue</span>
              <span style={{ fontSize: 14, fontWeight: 900 }}>{fmt(summary.income)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={18} color="#F87171" />
            <div>
              <span style={{ fontSize: 10, opacity: 0.85, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Expenses</span>
              <span style={{ fontSize: 14, fontWeight: 900 }}>{fmt(summary.kharch)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandal Bank FD & Treasury Balance Metallic Luxe Banner */}
      <div
        className="luxe-card"
        onClick={() => { if (onNavigateTab) onNavigateTab('bank'); }}
        style={{
          background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
          color: '#ffffff',
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          cursor: 'pointer',
          boxShadow: '0 12px 30px rgba(5, 150, 105, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Landmark size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' }}>
                MANDAL BANK FIXED DEPOSIT (FD)
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: '2px 0 0 0', color: '#ffffff' }}>
                Rs. {fdSummary.current_fd_balance.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.18)', padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 800 }}>
            <span>Open Bank Tab</span>
            <ChevronRight size={16} />
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)', marginTop: 14, paddingTop: 10, fontSize: 12, opacity: 0.95
        }}>
          <span>Total Net Assets (Cash + Bank FD):</span>
          <strong style={{ fontSize: 14, color: '#A7F3D0' }}>Rs. {(summary.balance + fdSummary.current_fd_balance).toLocaleString('en-IN')}</strong>
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
        <div className="luxe-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 14, background: '#EFF6FF',
            color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
          }}>
            <Users size={18} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', margin: 0 }}>Donations</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#1D4ED8', marginTop: 4 }}>{fmt(summary.vargani)}</p>
        </div>

        <div className="luxe-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 14, background: '#ECFDF5',
            color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <TrendingUp size={18} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', margin: 0 }}>Other Income</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#059669', marginTop: 4 }}>{fmt(summary.jama)}</p>
        </div>

        <div className="luxe-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 14, background: '#FEF2F2',
            color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
          }}>
            <TrendingDown size={18} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', margin: 0 }}>Expenses</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>{fmt(summary.kharch)}</p>
        </div>
      </div>

      {/* Member Progress Luxe Card */}
      <div className="luxe-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
            Member Contribution Rate
          </h3>
          <span style={{
            fontSize: 12, fontWeight: 900, color: '#FF5722',
            background: '#FFF7ED', padding: '4px 12px', borderRadius: 20, border: '1px solid #FFEDD5'
          }}>
            {pctPaid}% Paid
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 16, border: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#334155', margin: 0 }}>{memberCount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: '2px 0 0 0' }}>Members</p>
          </div>
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 16, border: '1px solid #DCFCE7' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#16A34A', margin: 0 }}>{paidCount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803D', margin: '2px 0 0 0' }}>Paid ✅</p>
          </div>
          <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 16, border: '1px solid #FEE2E2' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#DC2626', margin: 0 }}>{pendingCount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C', margin: '2px 0 0 0' }}>Pending ⏳</p>
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
            <span style={{ color: '#0F172A' }}>Total Revenue</span>
            <span style={{ color: '#10B981' }}>{fmt(summary.income)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
            <span style={{ color: '#0F172A' }}>Total Expenses</span>
            <span style={{ color: '#EF4444' }}>{fmt(summary.kharch)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '2px solid #FF5722' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900 }}>
            <span style={{ color: '#0F172A' }}>Net Cash Balance</span>
            <span style={{ color: isPositive ? '#10B981' : '#EF4444' }}>{fmt(summary.balance)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900 }}>
            <span style={{ color: '#059669' }}>Mandal Bank FD Balance</span>
            <span style={{ color: '#059669' }}>Rs. {fdSummary.current_fd_balance.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, background: '#F0FDF4', padding: '10px 14px', borderRadius: 14, border: '1px solid #DCFCE7' }}>
            <span style={{ color: '#065F46' }}>Total Net Assets</span>
            <span style={{ color: '#047857' }}>Rs. {(summary.balance + fdSummary.current_fd_balance).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
