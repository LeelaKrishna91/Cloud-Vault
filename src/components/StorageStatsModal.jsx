import React from 'react';
import { X, PieChart, HardDrive, Cloud, Sliders, Check } from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function StorageStatsModal({ files, onClose, totalBytesUsed, quotaBytes, onUpdateQuota }) {
  const categories = ['images', 'documents', 'videos', 'audio', 'code', 'archives', 'other'];

  const stats = categories.map(cat => {
    const catFiles = files.filter(f => !f.isTrash && f.category === cat);
    const size = catFiles.reduce((acc, curr) => acc + (curr.size || 0), 0);
    return {
      category: cat,
      count: catFiles.length,
      size,
    };
  });

  const trashedFiles = files.filter(f => f.isTrash);
  const trashSize = trashedFiles.reduce((acc, curr) => acc + (curr.size || 0), 0);

  const colors = {
    images: '#38bdf8',
    documents: '#34d399',
    videos: '#f472b6',
    audio: '#c084fc',
    code: '#fbbf24',
    archives: '#fb7185',
    other: '#cbd5e1',
  };

  const quotaOptions = [
    { label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 },
    { label: '15 GB', bytes: 15 * 1024 * 1024 * 1024 },
    { label: '50 GB', bytes: 50 * 1024 * 1024 * 1024 },
    { label: '100 GB', bytes: 100 * 1024 * 1024 * 1024 },
    { label: '500 GB', bytes: 500 * 1024 * 1024 * 1024 },
    { label: '1 TB', bytes: 1024 * 1024 * 1024 * 1024 },
    { label: '10 TB', bytes: 10 * 1024 * 1024 * 1024 * 1024 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PieChart size={20} style={{ color: '#00f2fe' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Storage Analytics & Quota Settings</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main Storage Stat Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(0, 242, 254, 0.05)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              <HardDrive size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {formatBytes(totalBytesUsed)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>used of {formatBytes(quotaBytes)}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total Occupied Storage across {files.filter(f => !f.isTrash).length} active file(s)
              </div>
            </div>
          </div>

          {/* Increase Storage Quota Selector */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              <Sliders size={16} style={{ color: '#00f2fe' }} /> Increase Storage Quota Tier
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Select your desired storage limit. Upload capacity will expand instantly.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {quotaOptions.map(opt => {
                const isSelected = quotaBytes === opt.bytes;
                return (
                  <button
                    key={opt.label}
                    className={`btn-secondary ${isSelected ? 'active' : ''}`}
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      borderColor: isSelected ? '#00f2fe' : 'var(--border-color)',
                      background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#00f2fe' : 'var(--text-main)',
                      fontWeight: isSelected ? 700 : 500,
                    }}
                    onClick={() => onUpdateQuota(opt.bytes)}
                  >
                    {isSelected && <Check size={13} style={{ color: '#00f2fe' }} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Distribution Bar */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Category Storage Breakdown
            </div>
            <div style={{ height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
              {stats.map(s => {
                if (totalBytesUsed === 0 || s.size === 0) return null;
                const widthPct = (s.size / totalBytesUsed) * 100;
                return (
                  <div 
                    key={s.category}
                    style={{
                      height: '100%',
                      width: `${widthPct}%`,
                      background: colors[s.category] || '#ccc',
                    }}
                    title={`${s.category}: ${formatBytes(s.size)} (${widthPct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Detailed breakdown list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {stats.map(s => (
              <div key={s.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[s.category] }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{s.category}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{formatBytes(s.size)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{s.count} items</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trash Bin Occupancy</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
              {formatBytes(trashSize)} ({trashedFiles.length} items)
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Cloud size={14} style={{ color: '#00f2fe' }} /> High-performance Vercel Edge Cache & Local Storage
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
