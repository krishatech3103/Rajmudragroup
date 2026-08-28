import React, { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { fetchMemberHistory } from '../services/supabase';

export default function MemberHistoryModal({ member, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!member?.id) {
      setHistory([]);
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);
    setLoadError('');
    fetchMemberHistory(member.id)
      .then(result => {
        if (isCurrent) setHistory(result.yearlyTotals || []);
      })
      .catch(error => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [member?.id]);

  if (!member) return null;

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

        {isLoading ? (
          <p style={{ fontSize: 13, color: '#64748B', padding: '20px 0', textAlign: 'center' }}>
            Loading donation history from Supabase…
          </p>
        ) : loadError ? (
          <p style={{ fontSize: 13, color: '#B91C1C', padding: '20px 0', textAlign: 'center' }}>
            Could not load donation history: {loadError}
          </p>
        ) : history.length === 0 ? (
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
