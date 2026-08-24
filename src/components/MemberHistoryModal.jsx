import React from 'react';
import { History, X } from 'lucide-react';
import { db } from '../services/db';

export default function MemberHistoryModal({ member, onClose }) {
  if (!member) return null;
  const history = db.getMemberHistory(member.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-pill" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#8B0000', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#FF6D00" />
            {member.name} - Donation History
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#757575" />
          </button>
        </div>

        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: '#757575', padding: '20px 0', textAlign: 'center' }}>
            No past donation history found.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.year} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Year {item.year}</span>
                <span style={{ fontWeight: 800, color: '#1565C0', fontSize: 15 }}>
                  Rs. {Number(item.total).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 20 }}>
          Close
        </button>
      </div>
    </div>
  );
}
