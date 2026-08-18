// IndexedDB Storage Service for CloudVault

const DB_NAME = 'CloudVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('uploadDate', 'uploadDate', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('isTrash', 'isTrash', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export function determineCategory(mimeType = '', fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'sh', 'sql', 'yaml', 'yml', 'xml', 'md'];
  if (codeExts.includes(ext) || mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) {
    return 'code';
  }

  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv'];
  if (docExts.includes(ext) || mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('spreadsheet') || mimeType.includes('text')) {
    return 'documents';
  }

  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  if (archiveExts.includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'archives';
  }

  return 'other';
}

export function generateShareCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function saveFileToDB(file, options = {}) {
  const db = await openDB();
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const category = determineCategory(file.type, file.name);
  const shareCode = generateShareCode();

  const fileRecord = {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    category,
    blob: file,
    uploadDate: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    isFavorite: false,
    isTrash: false,
    downloadCount: 0,
    shareCode,
    password: options.password || null,
    expiresAt: options.expiresAt || null,
    tags: options.tags || [],
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(fileRecord);

    request.onsuccess = () => resolve(fileRecord);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllFilesFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function updateFileInDB(fileId, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(fileId);

    getReq.onsuccess = () => {
      const data = getReq.result;
      if (!data) return reject(new Error('File not found'));
      
      const updatedRecord = { ...data, ...updates };
      const putReq = store.put(updatedRecord);
      putReq.onsuccess = () => resolve(updatedRecord);
      putReq.onerror = (e) => reject(e.target.error);
    };
    getReq.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteFileFromDB(fileId, permanent = false) {
  const db = await openDB();
  if (!permanent) {
    return updateFileInDB(fileId, { isTrash: true, trashedAt: new Date().toISOString() });
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(fileId);

    request.onsuccess = () => resolve(fileId);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function restoreFileFromDB(fileId) {
  return updateFileInDB(fileId, { isTrash: false, trashedAt: null });
}

export async function toggleFavoriteFile(fileId, currentState) {
  return updateFileInDB(fileId, { isFavorite: !currentState });
}

export async function clearTrashInDB() {
  const files = await getAllFilesFromDB();
  const trashedFiles = files.filter(f => f.isTrash);
  for (const f of trashedFiles) {
    await deleteFileFromDB(f.id, true);
  }
  return true;
}

export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
