import React, { useState, useEffect } from 'react';
import { 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Code, 
  Archive, 
  Star, 
  Share2, 
  Download, 
  Eye, 
  Trash2, 
  RotateCcw,
  Lock,
  Calendar
} from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function FileCard({ 
  file, 
  viewMode = 'grid', 
  onPreview, 
  onShare, 
  onToggleFavorite, 
  onDelete, 
  onRestore,
  isTrashView = false 
}) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let url = null;
    if (file.category === 'images' && file.blob) {
      url = URL.createObjectURL(file.blob);
      setImageUrl(url);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'images': return ImageIcon;
      case 'videos': return Video;
      case 'audio': return Music;
      case 'documents': return FileText;
      case 'code': return Code;
      case 'archives': return Archive;
      default: return File;
    }
  };

  const Icon = getCategoryIcon(file.category);

  const handleDownload = () => {
    let downloadUrl = file.blob ? URL.createObjectURL(file.blob) : file.url;
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    if (!file.blob) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (file.blob) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (viewMode === 'list') {
    return (
      <div className="glass-panel" style={{ padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} style={{ color: '#00f2fe' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.1rem' }}>
              <span>{formatBytes(file.size)}</span>
              <span>•</span>
              <span className={`badge badge-${file.category}`}>{file.category}</span>
              {file.password && <span style={{ color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Lock size={12} /> Protected</span>}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', minWidth: '100px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar size={13} /> {formatDate(file.uploadDate)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {!isTrashView ? (
            <>
              <button 
                className={`btn-icon ${file.isFavorite ? 'active' : ''}`}
                onClick={() => onToggleFavorite(file)}
                title="Favorite"
              >
                <Star size={16} fill={file.isFavorite ? '#00f2fe' : 'none'} />
              </button>

              <button className="btn-icon" onClick={() => onPreview(file)} title="Preview">
                <Eye size={16} />
              </button>

              <button className="btn-icon" onClick={() => onShare(file)} title="Share link & QR">
                <Share2 size={16} />
              </button>

              <button className="btn-icon" onClick={handleDownload} title="Download">
                <Download size={16} />
              </button>

              <button className="btn-icon" onClick={() => onDelete(file.id)} title="Delete">
                <Trash2 size={16} style={{ color: 'var(--accent-rose)' }} />
              </button>
            </>
          ) : (
            <>
              <button className="btn-icon" onClick={() => onRestore(file.id)} title="Restore">
                <RotateCcw size={16} style={{ color: 'var(--accent-emerald)' }} />
              </button>
              <button className="btn-icon" onClick={() => onDelete(file.id, true)} title="Delete permanently">
                <Trash2 size={16} style={{ color: 'var(--accent-rose)' }} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="glass-panel file-card">
      <div className="file-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          <span className={`badge badge-${file.category}`}>{file.category}</span>
          {file.password && (
            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
              <Lock size={11} />
            </span>
          )}
        </div>

        {!isTrashView && (
          <button 
            className={`btn-icon ${file.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(file)}
            style={{ width: 32, height: 32 }}
          >
            <Star size={14} fill={file.isFavorite ? '#00f2fe' : 'none'} />
          </button>
        )}
      </div>

      <div className="file-card-preview" onClick={() => !isTrashView && onPreview(file)} style={{ cursor: isTrashView ? 'default' : 'pointer' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={file.name} />
        ) : (
          <Icon size={42} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
        )}
      </div>

      <div>
        <div className="file-card-name" title={file.name}>
          {file.name}
        </div>
        <div className="file-card-info" style={{ marginTop: '0.2rem' }}>
          <span>{formatBytes(file.size)}</span>
          <span>•</span>
          <span>{formatDate(file.uploadDate)}</span>
        </div>
      </div>

      <div className="file-card-actions">
        {!isTrashView ? (
          <>
            <button className="btn-icon" onClick={() => onPreview(file)} title="Preview" style={{ flex: 1 }}>
              <Eye size={15} />
            </button>

            <button className="btn-icon" onClick={() => onShare(file)} title="Share link & QR" style={{ flex: 1 }}>
              <Share2 size={15} />
            </button>

            <button className="btn-icon" onClick={handleDownload} title="Download" style={{ flex: 1 }}>
              <Download size={15} />
            </button>

            <button className="btn-icon" onClick={() => onDelete(file.id)} title="Delete" style={{ width: 34 }}>
              <Trash2 size={15} style={{ color: 'var(--accent-rose)' }} />
            </button>
          </>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => onRestore(file.id)} style={{ flex: 1, justifyContent: 'center', padding: '0.4rem' }}>
              <RotateCcw size={14} /> Restore
            </button>
            <button className="btn-icon" onClick={() => onDelete(file.id, true)} title="Delete permanently">
              <Trash2 size={14} style={{ color: 'var(--accent-rose)' }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
