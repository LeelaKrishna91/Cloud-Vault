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
  region: import.meta.env.VITE_B2_REGION || "us-east-005",
  bucketName: import.meta.env.VITE_B2_BUCKET_NAME || "cloud-vault-aiml",
  accessKeyId: import.meta.env.VITE_B2_KEY_ID || "00531c6a49375c90000000001",
  secretAccessKey: import.meta.env.VITE_B2_APPLICATION_KEY || "K005kqVi3ivabTIWJdULwLw4n45WLXE",
  enabled: true,
};

export function getB2Config() {
  try {
    const saved = localStorage.getItem(B2_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
    return DEFAULT_CONFIG;
  } catch (err) {
    console.error("Failed to parse B2 config:", err);
    return DEFAULT_CONFIG;
  }
}

export function saveB2Config(config) {
  const normalized = {
    endpoint: config.endpoint?.trim().replace(/^https?:\/\//, '') || '',
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

function createS3Client(config = getB2Config()) {
  if (!config || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("Backblaze B2 credentials are not fully configured.");
  }

  // Clean endpoint string (remove trailing slashes, bucket names if mistakenly entered)
  let cleanEndpoint = config.endpoint.trim().replace(/^https?:\/\//, '').split('/')[0];

  const endpointUrl = `https://${cleanEndpoint}`;

  return new S3Client({
    endpoint: endpointUrl,
    region: config.region || "us-west-004",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Enables path-style S3 URLs required for Backblaze B2 CORS stability
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
      throw new Error(`Network / CORS Error (${rawMsg}). Ensure Endpoint is correct (e.g. s3.us-west-004.backblazeb2.com) and CORS allows http://localhost:5173.`);
    } else {
      throw new Error(`Connection Error: ${rawMsg}`);
    }
  }
}

export async function uploadFileToB2(file, options = {}) {
  const config = getB2Config();
  if (!config) throw new Error("Backblaze B2 is not configured.");

  const client = createS3Client(config);
  const fileId = 'b2_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `cloudvault/${fileId}_${cleanName}`;
  const category = determineCategory(file.type, file.name);
  const shareCode = generateShareCode();

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fileKey,
    Body: file,
    ContentType: file.type || 'application/octet-stream',
    Metadata: {
      originalName: encodeURIComponent(file.name),
      category: category,
      shareCode: shareCode,
      uploadedAt: new Date().toISOString(),
    },
  });

  await client.send(command);

  // Construct direct download/view URLs (both path-style and virtual-host style)
  const pathStyleUrl = `https://${config.endpoint}/${config.bucketName}/${fileKey}`;
  const vhostStyleUrl = `https://${config.bucketName}.${config.endpoint}/${fileKey}`;

  const fileRecord = {
    id: fileId,
    key: fileKey,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    category,
    url: pathStyleUrl,
    fallbackUrl: vhostStyleUrl,
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
        url: pathStyleUrl,
        fallbackUrl: vhostStyleUrl,
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
