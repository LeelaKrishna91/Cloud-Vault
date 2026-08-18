import React from 'react';
import { CloudUpload, Search, HardDrive } from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  onTriggerUpload, 
  totalBytesUsed,
  quotaBytes,
  fileCount
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <HardDrive size={18} style={{ color: '#00f2fe' }} />
          <div style={{ fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {formatBytes(totalBytesUsed)} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>of {formatBytes(quotaBytes)}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {fileCount} {fileCount === 1 ? 'file' : 'files'} online
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
