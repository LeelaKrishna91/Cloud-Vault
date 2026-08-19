import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import { determineCategory, generateShareCode } from "./storage";

const B2_CONFIG_KEY = "cloudvault_b2_config";

const DEFAULT_CONFIG = {
  endpoint: (import.meta.env.VITE_B2_ENDPOINT || "s3.us-east-005.backblazeb2.com").replace(/^https?:\/\//, ''),
  customDomain: (import.meta.env.VITE_B2_CUSTOM_DOMAIN || "").replace(/^https?:\/\//, '').replace(/\/+$/, ''),
  region: import.meta.env.VITE_B2_REGION || "us-east-005",
  bucketName: import.meta.env.VITE_B2_BUCKET_NAME || "",
  accessKeyId: import.meta.env.VITE_B2_KEY_ID || "",
  secretAccessKey: import.meta.env.VITE_B2_APPLICATION_KEY || "",
  enabled: true,
};

export function getB2Config() {
  try {
    const saved = localStorage.getItem(B2_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
    return DEFAULT_CONFIG;
  } catch (err) {
    console.error("Failed to parse B2 config:", err);
    return DEFAULT_CONFIG;
  }
}

export function saveB2Config(config) {
  const normalized = {
    endpoint: config.endpoint?.trim().replace(/^https?:\/\//, '') || '',
    customDomain: config.customDomain?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') || '',
    region: config.region?.trim() || '',
    bucketName: config.bucketName?.trim() || '',
    accessKeyId: config.accessKeyId?.trim() || '',
    secretAccessKey: config.secretAccessKey?.trim() || '',
    enabled: config.enabled ?? true,
  };
  localStorage.setItem(B2_CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearB2Config() {
  localStorage.removeItem(B2_CONFIG_KEY);
}

export function isB2Configured() {
  const config = getB2Config();
  return !!(
    config &&
    config.enabled &&
    config.endpoint &&
    config.region &&
    config.bucketName &&
    config.accessKeyId &&
    config.secretAccessKey
  );
}

function createS3Client(config = getB2Config(), forcePathStyle = true) {
  if (!config || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("Backblaze B2 credentials are not fully configured.");
  }

  let accessKeyId = config.accessKeyId.trim();
  if (accessKeyId.length === 12) {
    throw new Error("Master Application Keys cannot be used with the S3 Compatible API. Please create a new standard Application Key in your Backblaze B2 account.");
  }

  let cleanEndpoint = config.endpoint.trim().replace(/^https?:\/\//, '').split('/')[0];
  const endpointUrl = `https://${cleanEndpoint}`;

  return new S3Client({
    endpoint: endpointUrl,
    region: config.region || "us-east-005",
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: config.secretAccessKey.trim(),
    },
    forcePathStyle,
  });
}

export async function testB2Connection(config) {
  const client = createS3Client(config);
  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      MaxKeys: 1,
    });
    await client.send(command);
    return { success: true };
  } catch (err) {
    console.error("B2 Connection test failed:", err);
    const rawMsg = err.message || err.toString() || "";

    if (err.name === "NoSuchBucket" || rawMsg.includes("NoSuchBucket")) {
      throw new Error(`Bucket "${config.bucketName}" not found. Verify your Bucket Name and Endpoint region.`);
    } else if (err.name === "InvalidAccessKeyId" || rawMsg.includes("403") || rawMsg.includes("AccessDenied") || rawMsg.includes("Unauthorized")) {
      throw new Error(`Access Denied (403). Verify your Application Key ID and Application Key.`);
    } else if (err.name === "TypeError" || rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError")) {
      throw new Error(`CORS Propagation in progress or block. Ensure CORS rules on bucket "${config.bucketName}" allow origin '*'.`);
    } else {
      throw new Error(`Connection Error: ${rawMsg}`);
    }
  }
}

async function computeBase64Sha256(uint8Array) {
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
    let binary = "";
    const bytes = new Uint8Array(hashBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.warn("SHA-256 checksum calculation skipped:", e);
    return null;
  }
}

export async function uploadFileToB2(file, options = {}) {
  const config = getB2Config();
  if (!config) throw new Error("Backblaze B2 is not configured.");

  const client = createS3Client(config, true);
  const fileId = 'b2_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `cloudvault/${fileId}_${cleanName}`;
  const category = determineCategory(file.type, file.name);
  const shareCode = generateShareCode();

  // Convert File to Uint8Array to prevent 'e.getReader is not a function' in AWS SDK browser environments
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  const checksumSha256 = await computeBase64Sha256(fileBytes);

  const commandParams = {
    Bucket: config.bucketName,
    Key: fileKey,
    Body: fileBytes,
    ContentType: file.type || 'application/octet-stream',
    Metadata: {
      originalName: encodeURIComponent(file.name),
      category: category,
      shareCode: shareCode,
      uploadedAt: new Date().toISOString(),
    },
  };

  if (checksumSha256) {
    commandParams.ChecksumSHA256 = checksumSha256;
  }

  const command = new PutObjectCommand(commandParams);

  try {
    await client.send(command);
  } catch (err) {
    console.error("B2 PutObject Primary Error:", err);
    try {
      const altClient = createS3Client(config, false);
      await altClient.send(command);
    } catch (altErr) {
      console.error("B2 PutObject Alt Error:", altErr);
      const rawErrorMsg = err.message || err.toString() || altErr.message || altErr.toString();
      const errorName = err.name || altErr.name || "Error";
      throw new Error(`Cloud Storage Error [${errorName}]: ${rawErrorMsg}`);
    }
  }

  // Construct direct download/view URLs (custom domain, path-style and virtual-host style)
  const cleanCustomDomain = config.customDomain ? config.customDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') : '';
  const customDomainUrl = cleanCustomDomain ? `https://${cleanCustomDomain}/${fileKey}` : null;
  const pathStyleUrl = `https://${config.endpoint}/${config.bucketName}/${fileKey}`;
  const vhostStyleUrl = `https://${config.bucketName}.${config.endpoint}/${fileKey}`;

  const fileRecord = {
    id: fileId,
    key: fileKey,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    category,
    url: customDomainUrl || pathStyleUrl,
    fallbackUrl: vhostStyleUrl,
    customDomainUrl: customDomainUrl,
    blob: file, // Keep in memory for instant local previews
    uploadDate: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    isFavorite: false,
    isTrash: false,
    downloadCount: 0,
    shareCode,
    password: options.password || null,
    expiresAt: options.expiresAt || null,
    tags: options.tags || [],
    isB2: true,
  };

  return fileRecord;
}

export async function getAllFilesFromB2() {
  const config = getB2Config();
  if (!config) return [];

  const client = createS3Client(config);
  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: "cloudvault/",
    });
    const response = await client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    const files = response.Contents.map((obj) => {
      const parts = obj.Key.split('/');
      const keyFileName = parts[parts.length - 1] || obj.Key;
      const firstUnderscore = keyFileName.indexOf('_');
      const fileId = firstUnderscore !== -1 ? keyFileName.substring(0, firstUnderscore) : obj.Key;
      let originalName = firstUnderscore !== -1 ? keyFileName.substring(firstUnderscore + 1) : keyFileName;

      try {
        originalName = decodeURIComponent(originalName);
      } catch (e) {
        // Keep clean name if decode fails
      }

      const cleanCustomDomain = config.customDomain ? config.customDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') : '';
      const customDomainUrl = cleanCustomDomain ? `https://${cleanCustomDomain}/${obj.Key}` : null;
      const pathStyleUrl = `https://${config.endpoint}/${config.bucketName}/${obj.Key}`;
      const vhostStyleUrl = `https://${config.bucketName}.${config.endpoint}/${obj.Key}`;
      const category = determineCategory('', originalName);

      return {
        id: fileId || obj.Key,
        key: obj.Key,
        name: originalName,
        size: obj.Size || 0,
        type: 'application/octet-stream',
        category,
        url: customDomainUrl || pathStyleUrl,
        fallbackUrl: vhostStyleUrl,
        customDomainUrl: customDomainUrl,
        uploadDate: obj.LastModified ? new Date(obj.LastModified).toISOString() : new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        isFavorite: false,
        isTrash: false,
        downloadCount: 0,
        shareCode: fileId.replace('b2_', ''),
        isB2: true,
      };
    });

    return files;
  } catch (err) {
    console.error("Failed to list files from Backblaze B2:", err);
    throw err;
  }
}

export async function deleteFileFromB2(fileKey) {
  const config = getB2Config();
  if (!config) return;

  const client = createS3Client(config);
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: fileKey,
  });
  await client.send(command);
}
