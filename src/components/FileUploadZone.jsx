import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatBytes } from '../services/storage';

export default function FileUploadZone({ onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    const initialStatus = filesArray.map(file => ({
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' // uploading, done, error
    }));

    setUploadingFiles(initialStatus);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];

      // Simulate step progress for smooth UX feedback
      for (let p = 20; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 60));
        setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, progress: p } : item));
      }

      await onUploadSuccess(file);

      setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, progress: 100, status: 'done' } : item));
    }

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // fallback if canvas not ready
    }

    setTimeout(() => {
      setUploadingFiles([]);
    }, 2500);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div 
        className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple 
          style={{ display: 'none' }}
        />
        
        <div className="dropzone-icon-wrapper">
          <UploadCloud size={34} />
        </div>

        <div className="dropzone-title">
          Drag & Drop your files here to upload
        </div>
        <div className="dropzone-subtitle">
          Or <span style={{ color: '#00f2fe', textDecoration: 'underline', fontWeight: 600 }}>click to browse</span> from your device • Images, Documents, Videos, Audio, Code & Archives
        </div>

        <div style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Sparkles size={14} style={{ color: '#00f2fe' }} /> Instant Anywhere Sharable Links + Encrypted Storage
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Uploading {uploadingFiles.length} file(s)...</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Processing Cloud Storage</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {uploadingFiles.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <File size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatBytes(file.size)}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${file.progress}%`, background: 'var(--primary-gradient)', transition: 'width 0.2s ease' }} />
                  </div>
                </div>

                {file.status === 'done' ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <Loader2 size={18} className="spin" style={{ color: '#00f2fe', animation: 'spin 1s linear infinite' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
