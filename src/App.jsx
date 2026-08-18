import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FileUploadZone from './components/FileUploadZone';
import FileBrowser from './components/FileBrowser';
import FilePreviewModal from './components/FilePreviewModal';
import ShareModal from './components/ShareModal';
import StorageStatsModal from './components/StorageStatsModal';
import { 
  getAllFilesFromDB, 
  saveFileToDB, 
  deleteFileFromDB, 
  restoreFileFromDB, 
  toggleFavoriteFile,
  clearTrashInDB
} from './services/storage';
import {
  isB2Configured,
  uploadFileToB2,
  getAllFilesFromB2,
  deleteFileFromB2
} from './services/b2Storage';

export default function App() {
  const [files, setFiles] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Storage Quota state (default: 10 GB = 10,737,418,240 bytes, editable by user)
  const [quotaBytes, setQuotaBytes] = useState(() => {
    const saved = localStorage.getItem('cloudvault_quota_bytes');
    return saved ? parseInt(saved, 10) : 10 * 1024 * 1024 * 1024;
  });

  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const loadFiles = async () => {
    setIsAppLoading(true);
    try {
      if (isB2Configured()) {
        // Load files automatically from Backblaze B2 cloud storage
        const b2Files = await getAllFilesFromB2();
        setFiles(b2Files);
      } else {
        const localFiles = await getAllFilesFromDB();
        setFiles(localFiles);
      }
    } catch (err) {
      console.error('Failed to load files from cloud storage:', err);
      const localFiles = await getAllFilesFromDB();
      setFiles(localFiles);
    } finally {
      setIsAppLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpdateQuota = (newBytes) => {
    setQuotaBytes(newBytes);
    localStorage.setItem('cloudvault_quota_bytes', newBytes.toString());
  };

  const handleUploadSuccess = async (fileBlob) => {
    if (isB2Configured()) {
      await uploadFileToB2(fileBlob);
    } else {
      await saveFileToDB(fileBlob);
    }
    await loadFiles();
  };

  const handleToggleFavorite = async (file) => {
    if (!file.isB2) {
      await toggleFavoriteFile(file.id, file.isFavorite);
    } else {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isFavorite: !f.isFavorite } : f));
    }
  };

  const handleDelete = async (fileId, permanent = false) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.isB2) {
      if (file.key) {
        await deleteFileFromB2(file.key);
      }
    } else {
      await deleteFileFromDB(fileId, permanent);
    }
    await loadFiles();
  };

  const handleRestore = async (fileId) => {
    await restoreFileFromDB(fileId);
    await loadFiles();
  };

  const handleClearTrash = async () => {
    await clearTrashInDB();
    await loadFiles();
  };

  const handleUpdateFile = (updated) => {
    setFiles(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  // Filter files based on Category & Search Query
  const filteredFiles = files.filter(file => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = file.name.toLowerCase().includes(q);
      const matchTag = file.tags?.some(t => t.toLowerCase().includes(q));
      const matchCat = file.category.toLowerCase().includes(q);
      if (!matchName && !matchTag && !matchCat) return false;
    }

    if (activeCategory === 'trash') {
      return file.isTrash;
    } else {
      if (file.isTrash) return false;
    }

    if (activeCategory === 'all') return true;
    if (activeCategory === 'favorites') return file.isFavorite;
    if (activeCategory === 'video') return file.category === 'videos';
    
    return file.category === activeCategory;
  });

  // Calculate storage stats
  const activeFiles = files.filter(f => !f.isTrash);
  const totalBytesUsed = activeFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  const categoryCounts = {
    all: activeFiles.length,
    favorites: activeFiles.filter(f => f.isFavorite).length,
    images: activeFiles.filter(f => f.category === 'images').length,
    documents: activeFiles.filter(f => f.category === 'documents').length,
    video: activeFiles.filter(f => f.category === 'videos').length,
    audio: activeFiles.filter(f => f.category === 'audio').length,
    code: activeFiles.filter(f => f.category === 'code').length,
    archives: activeFiles.filter(f => f.category === 'archives').length,
    trash: files.filter(f => f.isTrash).length,
  };

  const scrollToUpload = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onTriggerUpload={scrollToUpload}
        totalBytesUsed={totalBytesUsed}
        quotaBytes={quotaBytes}
        fileCount={activeFiles.length}
      />

      <div className="main-layout">
        <Sidebar 
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categoryCounts={categoryCounts}
          totalBytesUsed={totalBytesUsed}
          quotaBytes={quotaBytes}
          onOpenStats={() => setShowStats(true)}
        />

        <main className="content-area">
          {/* Mobile Category Navigation Bar */}
          <div className="mobile-category-bar">
            {[
              { id: 'all', label: 'All', count: categoryCounts.all },
              { id: 'favorites', label: 'Starred', count: categoryCounts.favorites },
              { id: 'images', label: 'Images', count: categoryCounts.images },
              { id: 'documents', label: 'Docs', count: categoryCounts.documents },
              { id: 'video', label: 'Videos', count: categoryCounts.video },
              { id: 'audio', label: 'Audio', count: categoryCounts.audio },
              { id: 'code', label: 'Code', count: categoryCounts.code },
              { id: 'archives', label: 'Zip', count: categoryCounts.archives },
              { id: 'trash', label: 'Trash', count: categoryCounts.trash },
            ].map(cat => (
              <button
                key={cat.id}
                className={`mobile-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="pill-count">{cat.count || 0}</span>
              </button>
            ))}
          </div>

          {activeCategory !== 'trash' && (
            <FileUploadZone onUploadSuccess={handleUploadSuccess} />
          )}

          <FileBrowser 
            files={filteredFiles}
            activeCategory={activeCategory}
            onPreview={(file) => setPreviewFile(file)}
            onShare={(file) => setShareFile(file)}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onClearTrash={handleClearTrash}
          />
        </main>
      </div>

      {previewFile && (
        <FilePreviewModal 
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {shareFile && (
        <ShareModal 
          file={shareFile}
          onClose={() => setShareFile(null)}
          onUpdateFile={handleUpdateFile}
        />
      )}

      {showStats && (
        <StorageStatsModal 
          files={files}
          totalBytesUsed={totalBytesUsed}
          quotaBytes={quotaBytes}
          onUpdateQuota={handleUpdateQuota}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

