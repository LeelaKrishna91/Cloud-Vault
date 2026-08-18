import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, QrCode, Lock, Clock, ShieldCheck, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { updateFileInDB } from '../services/storage';

export default function ShareModal({ file, onClose, onUpdateFile }) {
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState(file.password || '');
  const [expiration, setExpiration] = useState(file.expiresAt || 'never');
  const [isSaved, setIsSaved] = useState(false);
  const canvasRef = useRef(null);

  const shareUrl = `${window.location.origin}/share/${file.shareCode}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 180,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSecurity = async () => {
    let expiresAt = null;
    if (expiration === '1h') expiresAt = new Date(Date.now() + 3600000).toISOString();
    else if (expiration === '24h') expiresAt = new Date(Date.now() + 86400000).toISOString();
    else if (expiration === '7d') expiresAt = new Date(Date.now() + 604800000).toISOString();

    const updated = await updateFileInDB(file.id, {
      password: password.trim() || null,
      expiresAt,
    });
    onUpdateFile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Share2 size={20} style={{ color: '#00f2fe' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Share File Anywhere</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Share URL & Copy */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
              Public Share Link
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                value={shareUrl} 
                readOnly 
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
              <button className="gradient-btn" onClick={handleCopy} style={{ flexShrink: 0 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div className="qr-frame">
              <canvas ref={canvasRef} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                <QrCode size={18} style={{ color: '#00f2fe' }} /> Mobile Scan QR Code
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Point any mobile camera at this QR code to instantly download or preview <strong style={{ color: '#fff' }}>{file.name}</strong> on phone or tablet.
              </p>
            </div>
          </div>

          {/* Security & Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)' }} /> Access & Security Controls
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                  <Lock size={12} /> Password Protection
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Optional password..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                  <Clock size={12} /> Expiration Timer
                </label>
                <select 
                  className="form-input" 
                  value={expiration} 
                  onChange={(e) => setExpiration(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="never" style={{ background: '#121622' }}>Never Expire</option>
                  <option value="1h" style={{ background: '#121622' }}>1 Hour</option>
                  <option value="24h" style={{ background: '#121622' }}>24 Hours</option>
                  <option value="7d" style={{ background: '#121622' }}>7 Days</option>
                </select>
              </div>
            </div>

            <button className="btn-secondary" onClick={handleSaveSecurity} style={{ justifyContent: 'center', marginTop: '0.2rem' }}>
              {isSaved ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : null}
              {isSaved ? 'Security Settings Saved!' : 'Save Security Settings'}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
