import React, { useState } from 'react';
import { LayoutGrid, List, ArrowUpDown, FolderOpen, Trash2 } from 'lucide-react';
import FileCard from './FileCard';

export default function FileBrowser({ 
  files, 
  activeCategory, 
  onPreview, 
  onShare, 
  onToggleFavorite, 
  onDelete, 
  onRestore,
  onClearTrash
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'size' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.uploadDate) - new Date(b.uploadDate);
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'all': return 'All Uploaded Files';
      case 'favorites': return 'Favorite Files';
      case 'images': return 'Image Gallery';
      case 'documents': return 'Documents & Spreadsheets';
      case 'video': return 'Video Files';
      case 'audio': return 'Audio Tracks';
      case 'code': return 'Code & Scripts';
      case 'archives': return 'Archives & Zip Files';
      case 'trash': return 'Trash Bin';
      default: return 'Files';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{getCategoryTitle()}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {sortedFiles.length} file(s)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeCategory === 'trash' && sortedFiles.length > 0 && (
            <button className="btn-secondary" onClick={onClearTrash} style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
              <Trash2 size={16} /> Empty Trash
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <option value="date" style={{ background: '#121622' }}>Sort by Date</option>
              <option value="size" style={{ background: '#121622' }}>Sort by Size</option>
              <option value="name" style={{ background: '#121622' }}>Sort by Name</option>
            </select>
            <button 
              style={{ background: 'none', border: 'none', color: '#00f2fe', cursor: 'pointer', fontWeight: 700 }}
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {sortedFiles.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
            <FolderOpen size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>No files found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {activeCategory === 'trash' ? 'Trash bin is empty.' : 'Upload files using the drop zone above to access them anywhere!'}
            </p>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'file-grid' : 'file-list'}>
          {sortedFiles.map(file => (
            <FileCard
              key={file.id}
              file={file}
              viewMode={viewMode}
              onPreview={onPreview}
              onShare={onShare}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              onRestore={onRestore}
              isTrashView={activeCategory === 'trash'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
