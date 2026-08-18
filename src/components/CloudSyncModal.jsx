import React, { useState, useEffect } from 'react';
import { X, Cloud, ShieldCheck, Check, AlertCircle, ExternalLink, HelpCircle, Loader2, Key, HardDrive, RefreshCw } from 'lucide-react';
import { getB2Config, saveB2Config, clearB2Config, testB2Connection } from '../services/b2Storage';

export default function CloudSyncModal({ onClose, onSyncStateChanged }) {
  const [config, setConfig] = useState({
    bucketName: '',
    endpoint: '',
    region: 'us-west-004',
    accessKeyId: '',
    secretAccessKey: '',
    enabled: true,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: true } or { error: string }
  const [showGuide, setShowGuide] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const saved = getB2Config();
    if (saved) {
      setConfig(saved);
      if (saved.bucketName && saved.endpoint && saved.accessKeyId && saved.secretAccessKey) {
        setIsConnected(true);
      }
    }
  }, []);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!config.bucketName || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
      setTestResult({ error: 'Please fill in all Backblaze B2 credential fields.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await testB2Connection(config);
      setTestResult({ success: true, message: 'Successfully connected to Backblaze B2!' });
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.bucketName || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
      setTestResult({ error: 'Please fill in all Backblaze B2 credential fields before saving.' });
      return;
    }

    // Auto test connection if not tested yet
    if (!testResult?.success) {
      setIsTesting(true);
      try {
        await testB2Connection(config);
      } catch (err) {
        setIsTesting(false);
        setTestResult({ error: err.message });
        return;
      }
      setIsTesting(false);
    }

    saveB2Config({ ...config, enabled: true });
    setIsConnected(true);
    setTestResult({ success: true, message: 'Backblaze B2 Cloud Sync enabled!' });
    
    if (onSyncStateChanged) onSyncStateChanged();
    setTimeout(() => onClose(), 1200);
  };

  const handleDisconnect = () => {
    clearB2Config();
    setConfig({
      bucketName: '',
      endpoint: '',
      region: 'us-west-004',
      accessKeyId: '',
      secretAccessKey: '',
      enabled: false,
    });
    setIsConnected(false);
    setTestResult({ message: 'Disconnected from Backblaze B2. App switched to local browser storage.' });
    if (onSyncStateChanged) onSyncStateChanged();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090d16'
            }}>
              <Cloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Backblaze B2 Cloud Sync</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sync uploaded files across all your devices using Backblaze B2 S3 storage</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Connection Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : '#94a3b8',
                boxShadow: isConnected ? '0 0 10px #10b981' : 'none'
              }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {isConnected ? 'Backblaze B2 Connected' : 'Local Browser Storage Active'}
              </span>
            </div>
            <button 
              type="button"
              className="btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', height: 'auto' }}
              onClick={() => setShowGuide(!showGuide)}
            >
              <HelpCircle size={14} /> Setup Instructions
            </button>
          </div>

          {/* Setup Instructions Box */}
          {showGuide && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-cyan)',
              fontSize: '0.8rem',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ExternalLink size={14} /> Quick 3-Step Setup for Backblaze B2:
              </div>
              <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                <li>Log in to <strong>Backblaze B2</strong> $\rightarrow$ Create a <strong>Bucket</strong> (e.g. <code>my-cloudvault</code>).</li>
                <li>Go to <strong>Application Keys</strong> $\rightarrow$ Generate a key with <strong>Read and Write</strong> access. Copy the <code>keyID</code> and <code>applicationKey</code>.</li>
                <li>In Bucket Settings $\rightarrow$ Add a <strong>CORS Rule</strong> for Origin <code>*</code> allowing methods <code>GET, PUT, POST, DELETE, HEAD</code> (required for browser uploads).</li>
              </ol>
            </div>
          )}

          {/* Credentials Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                Bucket Name
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. cloudvault-bucket" 
                value={config.bucketName}
                onChange={(e) => handleChange('bucketName', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                Region
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. us-west-004" 
                value={config.region}
                onChange={(e) => handleChange('region', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
              Endpoint URL
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. s3.us-west-004.backblazeb2.com" 
              value={config.endpoint}
              onChange={(e) => handleChange('endpoint', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                Application Key ID (keyID)
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="004..." 
                value={config.accessKeyId}
                onChange={(e) => handleChange('accessKeyId', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                Application Key (secretAccessKey)
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="K004..." 
                value={config.secretAccessKey}
                onChange={(e) => handleChange('secretAccessKey', e.target.value)}
              />
            </div>
          </div>

          {/* Test Status Messages */}
          {testResult?.success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.82rem'
            }}>
              <Check size={16} />
              <span>{testResult.message}</span>
            </div>
          )}

          {testResult?.error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.82rem',
              lineHeight: '1.4'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{testResult.error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {isConnected && (
              <button className="btn-secondary" onClick={handleDisconnect} style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                Disconnect B2
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? <Loader2 size={16} className="spin-icon" /> : <RefreshCw size={16} />}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <button className="gradient-btn" onClick={handleSave} disabled={isTesting}>
              <ShieldCheck size={16} />
              Save & Enable Cloud Sync
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
