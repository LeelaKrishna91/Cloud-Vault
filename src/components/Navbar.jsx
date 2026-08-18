import React from 'react';
import { CloudUpload, Search, HardDrive, Cloud, RefreshCw } from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  onTriggerUpload, 
  totalBytesUsed,
  quotaBytes,
  fileCount,
  isB2Connected,
  onOpenCloudSync
}) {
  return (
    <nav className="navbar">
      <a href="#" className="brand">
        <div className="brand-icon">
          <CloudUpload size={24} />
        </div>
        <div>
          <span className="gradient-text">CloudVault</span>
          <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-3px' }}>
            Universal Anywhere Stash
          </span>
        </div>
      </a>

      <div className="search-box">
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search files by name, extension, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Backblaze B2 Cloud Sync Indicator Button */}
        <button 
          onClick={onOpenCloudSync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: isB2Connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${isB2Connected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
          title={isB2Connected ? "Backblaze B2 Connected (Cross-device sync enabled)" : "Click to connect Backblaze B2 Cloud Storage"}
        >
          <Cloud size={16} style={{ color: isB2Connected ? '#10b981' : '#00f2fe' }} />
          <span>{isB2Connected ? 'Cloud Sync Active' : 'Connect Cloud (B2)'}</span>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isB2Connected ? '#10b981' : '#94a3b8',
            boxShadow: isB2Connected ? '0 0 8px #10b981' : 'none'
          }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <HardDrive size={18} style={{ color: '#00f2fe' }} />
          <div style={{ fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {formatBytes(totalBytesUsed)} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>of {formatBytes(quotaBytes)}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {fileCount} {fileCount === 1 ? 'file' : 'files'} {isB2Connected ? 'synced' : 'online'}
            </div>
          </div>
        </div>

        <button className="gradient-btn" onClick={onTriggerUpload}>
          <CloudUpload size={18} />
          Upload Files
        </button>
      </div>
    </nav>
  );
}

