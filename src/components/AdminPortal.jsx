import React, { useState, useEffect } from 'react';
import { 
  getB2Config, 
  saveB2Config, 
  testB2Connection, 
  clearB2Config 
} from '../services/b2Storage';
import { Server, Settings, CheckCircle, XCircle, HardDrive, Shield, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { formatBytes } from '../services/storage';

export default function AdminPortal({ quotaBytes, onUpdateQuota }) {
  const [b2Config, setB2Config] = useState(() => getB2Config());
  const [testStatus, setTestStatus] = useState(null); // 'idle', 'testing', 'success', 'error'
  const [testMessage, setTestMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localQuota, setLocalQuota] = useState(quotaBytes / (1024 * 1024 * 1024)); // in GB

  const MAX_QUOTA_GB = 10;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setB2Config((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Save B2 Config
    saveB2Config(b2Config);
    
    // Save Quota
    const newQuotaBytes = Math.min(localQuota * 1024 * 1024 * 1024, MAX_QUOTA_GB * 1024 * 1024 * 1024);
    onUpdateQuota(newQuotaBytes);

    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing connection to Backblaze B2...');
    try {
      await testB2Connection(b2Config);
      setTestStatus('success');
      setTestMessage('Connection successful! Your credentials are correct.');
    } catch (err) {
      setTestStatus('error');
      setTestMessage(err.message);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all cloud credentials?')) {
      clearB2Config();
      setB2Config(getB2Config());
      setTestStatus(null);
      setTestMessage('');
    }
  };

  return (
    <div className="admin-portal">
      <div className="admin-header">
        <Shield className="admin-icon" size={32} />
        <div>
          <h2>Admin Portal</h2>
          <p>Manage system settings, storage quotas, and cloud credentials.</p>
        </div>
      </div>

      <div className="admin-content">
        {/* Storage Settings Section */}
        <div className="admin-section">
          <div className="section-header">
            <HardDrive size={24} />
            <h3>Storage Limits</h3>
          </div>
          <div className="section-body">
            <div className="form-group">
              <label>Maximum Global Quota (GB)</label>
              <input 
                type="number" 
                value={localQuota} 
                onChange={(e) => setLocalQuota(Math.max(1, Math.min(MAX_QUOTA_GB, parseFloat(e.target.value) || 1)))} 
                min="1"
                max={MAX_QUOTA_GB}
              />
              <small>Hard limit cap is {MAX_QUOTA_GB} GB.</small>
            </div>
          </div>
        </div>

        {/* Backblaze B2 Credentials Section */}
        <div className="admin-section">
          <div className="section-header">
            <Server size={24} />
            <h3>Backblaze B2 Configuration</h3>
          </div>
          
          <div className="section-body">
            <div className="form-row">
              <div className="form-group">
                <label>S3 Endpoint</label>
                <input 
                  type="text" 
                  name="endpoint"
                  value={b2Config.endpoint} 
                  onChange={handleInputChange} 
                  placeholder="e.g., s3.us-east-005.backblazeb2.com"
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input 
                  type="text" 
                  name="region"
                  value={b2Config.region} 
                  onChange={handleInputChange} 
                  placeholder="e.g., us-east-005"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bucket Name</label>
                <input 
                  type="text" 
                  name="bucketName"
                  value={b2Config.bucketName} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="form-group">
                <label>Custom Domain (Optional)</label>
                <input 
                  type="text" 
                  name="customDomain"
                  value={b2Config.customDomain || ''} 
                  onChange={handleInputChange} 
                  placeholder="e.g., cdn.yourdomain.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Application Key ID</label>
                <input 
                  type="text" 
                  name="accessKeyId"
                  value={b2Config.accessKeyId} 
                  onChange={handleInputChange} 
                  placeholder="Standard Application Key ID (25 chars)"
                />
              </div>
              <div className="form-group">
                <label>Application Key</label>
                <input 
                  type="password" 
                  name="secretAccessKey"
                  value={b2Config.secretAccessKey} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="enableB2"
                name="enabled"
                checked={b2Config.enabled} 
                onChange={handleInputChange} 
              />
              <label htmlFor="enableB2">Enable Backblaze B2 Cloud Storage</label>
            </div>

            <div className="admin-actions b2-actions">
              <button 
                className="btn secondary" 
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !b2Config.enabled}
              >
                {testStatus === 'testing' ? <RefreshCw className="spin" size={16} /> : <Server size={16} />}
                Test Connection
              </button>
              <button className="btn danger-outline" onClick={handleClear}>
                Reset Fields
              </button>
            </div>

            {testStatus && testStatus !== 'idle' && testStatus !== 'testing' && (
              <div className={`connection-status ${testStatus}`}>
                {testStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{testMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Save */}
        <div className="admin-footer-actions">
          <button className="btn primary large" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
