import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import { determineCategory, generateShareCode } from "./storage";

const B2_CONFIG_KEY = "cloudvault_b2_config";

export function getB2Config() {
  try {
    const saved = localStorage.getItem(B2_CONFIG_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (err) {
    console.error("Failed to parse B2 config:", err);
    return null;
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

  const endpointUrl = config.endpoint.startsWith("http")
    ? config.endpoint
    : `https://${config.endpoint}`;

  return new S3Client({
    endpoint: endpointUrl,
    region: config.region || "us-west-004",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
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
    let message = err.message || "Failed to connect to Backblaze B2.";
    if (err.name === "TypeError" || message.includes("Failed to fetch") || message.includes("NetworkError")) {
      message = "Network / CORS Error. Ensure you have set CORS rules on your Backblaze bucket to allow requests from your browser domain.";
    } else if (err.name === "NoSuchBucket") {
      message = `Bucket "${config.bucketName}" does not exist in Backblaze B2. Check the bucket name.`;
    } else if (err.name === "InvalidAccessKeyId" || message.includes("403") || message.includes("AccessDenied")) {
      message = "Access Denied. Please double-check your keyID and applicationKey.";
    }
    throw new Error(message);
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

  // Construct direct download/view URL
  const publicUrl = `https://${config.bucketName}.${config.endpoint}/${fileKey}`;

  const fileRecord = {
    id: fileId,
    key: fileKey,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    category,
    url: publicUrl,
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
      const originalName = firstUnderscore !== -1 ? keyFileName.substring(firstUnderscore + 1) : keyFileName;

      const publicUrl = `https://${config.bucketName}.${config.endpoint}/${obj.Key}`;
      const category = determineCategory('', originalName);

      return {
        id: fileId || obj.Key,
        key: obj.Key,
        name: originalName,
        size: obj.Size || 0,
        type: 'application/octet-stream',
        category,
        url: publicUrl,
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
