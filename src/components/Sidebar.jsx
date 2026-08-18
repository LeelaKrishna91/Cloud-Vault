import React from 'react';
import { 
  Folder, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Code, 
  Archive, 
  Star, 
  Trash2, 
  PieChart,
  Globe,
  Cloud
} from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function Sidebar({ 
  activeCategory, 
  setActiveCategory, 
  categoryCounts,
  totalBytesUsed,
  quotaBytes,
  onOpenStats,
  isB2Connected,
  onOpenCloudSync
}) {
  const percentage = Math.min(100, Math.round((totalBytesUsed / (quotaBytes || 1)) * 100));

  const mainNav = [
    { id: 'all', label: 'All Files', icon: Folder, count: categoryCounts.all || 0 },
    { id: 'favorites', label: 'Favorites', icon: Star, count: categoryCounts.favorites || 0 },
  ];

  const categoryNav = [
    { id: 'images', label: 'Images', icon: Image, count: categoryCounts.images || 0 },
    { id: 'documents', label: 'Documents', icon: FileText, count: categoryCounts.documents || 0 },
    { id: 'video', label: 'Videos', icon: Video, count: categoryCounts.video || 0 },
    { id: 'audio', label: 'Audio', icon: Music, count: categoryCounts.audio || 0 },
    { id: 'code', label: 'Code & Scripts', icon: Code, count: categoryCounts.code || 0 },
    { id: 'archives', label: 'Archives', icon: Archive, count: categoryCounts.archives || 0 },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="nav-group-title">Overview</div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${activeCategory === item.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(item.id)}
            >
              <div className="sidebar-item-left">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              <span className="count-pill">{item.count}</span>
            </button>
          );
        })}
      </div>

      <div>
        <div className="nav-group-title">Categories</div>
        {categoryNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${activeCategory === item.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(item.id)}
            >
              <div className="sidebar-item-left">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              <span className="count-pill">{item.count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div className="nav-group-title">System</div>
        <button
          className={`sidebar-link ${activeCategory === 'trash' ? 'active' : ''}`}
          onClick={() => setActiveCategory('trash')}
        >
          <div className="sidebar-item-left">
            <Trash2 size={18} style={{ color: 'var(--accent-rose)' }} />
            <span>Trash Bin</span>
          </div>
          <span className="count-pill">{categoryCounts.trash || 0}</span>
        </button>

        <div 
          className="glass-panel" 
          style={{ padding: '1rem', marginTop: '1.25rem', borderRadius: 'var(--radius-md)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Storage Quota</span>
            <button 
              style={{ background: 'none', border: 'none', color: '#00f2fe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
              onClick={onOpenStats}
            >
              <PieChart size={14} /> Manage
            </button>
          </div>
          <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.6rem' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${percentage}%`, 
                background: 'var(--primary-gradient)',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{formatBytes(totalBytesUsed)}</span>
            <span>{formatBytes(quotaBytes)}</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Globe size={14} style={{ color: '#00f2fe' }} /> CloudVault Ready for Vercel
        </div>
      </div>
    </aside>
  );
}

