import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, FileText, Lock } from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function FilePreviewModal({ file, onClose }) {
  const [contentUrl, setContentUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!file.password);

  useEffect(() => {
    if (!file || !file.blob) return;
    const url = URL.createObjectURL(file.blob);
    setContentUrl(url);

    if (file.category === 'code' || file.category === 'documents' || file.type.includes('text')) {
      const reader = new FileReader();
      reader.onload = (e) => setTextContent(e.target.result);
      reader.readAsText(file.blob);
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === file.password) {
      setIsUnlocked(true);
    } else {
      alert('Incorrect password. Please try again.');
    }
  };

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!contentUrl) return;
    const a = document.createElement('a');
    a.href = contentUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <span className={`badge badge-${file.category}`}>{file.category}</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!isUnlocked ? (
            <form onSubmit={handleUnlock} style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Password Protected File</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enter the access key to view or download this file</p>
              </div>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter password..." 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ maxWidth: '280px', textAlign: 'center' }}
                autoFocus
              />
              <button type="submit" className="gradient-btn" style={{ minWidth: '140px', justifyContent: 'center' }}>
                Unlock File
              </button>
            </form>
          ) : (
            <>
              {file.category === 'images' && contentUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '500px' }}>
                  <img src={contentUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                </div>
              )}

              {file.category === 'videos' && contentUrl && (
                <div style={{ background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <video src={contentUrl} controls style={{ width: '100%', maxHeight: '450px' }} />
                </div>
              )}

              {file.category === 'audio' && contentUrl && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)' }}>
                  <audio src={contentUrl} controls style={{ width: '100%' }} />
                </div>
              )}

              {(file.category === 'code' || textContent !== null) && (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Text Content Preview</span>
                    <button className="btn-secondary" onClick={handleCopyText} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      {isCopied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                      {isCopied ? 'Copied!' : 'Copy Content'}
                    </button>
                  </div>
                  <pre style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.85rem', 
                    background: 'rgba(0, 0, 0, 0.4)', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    overflowX: 'auto', 
                    maxHeight: '350px',
                    color: '#e2e8f0',
                    border: '1px solid var(--border-color)'
                  }}>
                    {textContent || 'Loading content preview...'}
                  </pre>
                </div>
              )}

              {file.category !== 'images' && file.category !== 'videos' && file.category !== 'audio' && file.category !== 'code' && textContent === null && (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                  <FileText size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Standard File Document</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Size: {formatBytes(file.size)} • Type: {file.type || 'Binary'}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {isUnlocked && (
            <button className="gradient-btn" onClick={handleDownload}>
              <Download size={16} /> Download File ({formatBytes(file.size)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
