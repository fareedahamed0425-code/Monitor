import { config } from '../config';
import { logger, createChildLogger } from '../utils/logger';
import { MinioClient, BucketItem } from 'minio';

const storageLogger = createChildLogger({ module: 'Storage' });

export interface UploadResult {
  path: string;
  size: number;
  etag: string;
}

export interface PresignedUrlOptions {
  expirySeconds?: number;
  responseHeaders?: Record<string, string>;
}

class StorageService {
  private client: MinioClient | null = null;
  private initialized = false;
  private bucketName: string;

  constructor() {
    this.bucketName = config.storage.bucket;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.client = new MinioClient({
        endPoint: config.storage.endpoint,
        port: config.storage.port,
        useSSL: config.storage.useSSL,
        accessKey: config.storage.accessKey,
        secretKey: config.storage.secretKey,
        region: config.storage.region,
      });

      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName, config.storage.region);
        storageLogger.info('Bucket created', { bucket: this.bucketName });
      }

      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));

      this.initialized = true;
      storageLogger.info('Storage service initialized', { bucket: this.bucketName });
    } catch (error) {
      storageLogger.error('Storage initialization failed', { error });
      throw error;
    }
  }

  async uploadScreenshot(
    workstationId: string,
    sessionId: string,
    userId: string | undefined,
    buffer: Buffer,
    filename: string,
    metadata: Record<string, string> = {}
  ): Promise<UploadResult> {
    if (!this.client) await this.initialize();

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const objectName = `screenshots/${workstationId}/${year}/${month}/${day}/${sessionId}/${filename}`;

    const customMetadata = {
      'x-amz-meta-workstation-id': workstationId,
      'x-amz-meta-session-id': sessionId,
      'x-amz-meta-user-id': userId || 'unknown',
      'x-amz-meta-uploaded-at': date.toISOString(),
      ...metadata,
    };

    const result = await this.client!.putObject(this.bucketName, objectName, buffer, buffer.length, customMetadata);

    storageLogger.debug('Screenshot uploaded', { objectName, size: buffer.length, etag: result.etag });

    return {
      path: objectName,
      size: buffer.length,
      etag: result.etag,
    };
  }

  async uploadFile(
    bucket: string,
    objectName: string,
    buffer: Buffer,
    metadata: Record<string, string> = {}
  ): Promise<UploadResult> {
    if (!this.client) await this.initialize();

    const result = await this.client!.putObject(bucket, objectName, buffer, buffer.length, metadata);

    return {
      path: objectName,
      size: buffer.length,
      etag: result.etag,
    };
  }

  async getPresignedUrl(objectName: string, options: PresignedUrlOptions = {}): Promise<string> {
    if (!this.client) await this.initialize();

    const expiry = options.expirySeconds || 3600;
    const url = await this.client!.presignedGetObject(this.bucketName, objectName, expiry, options.responseHeaders);
    return url;
  }

  async getPresignedPutUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
    if (!this.client) await this.initialize();

    return this.client!.presignedPutObject(this.bucketName, objectName, expirySeconds);
  }

  async downloadFile(objectName: string): Promise<Buffer> {
    if (!this.client) await this.initialize();

    const stream = await this.client!.getObject(this.bucketName, objectName);
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteFile(objectName: string): Promise<void> {
    if (!this.client) await this.initialize();

    await this.client!.removeObject(this.bucketName, objectName);
    storageLogger.debug('File deleted', { objectName });
  }

  async deleteFiles(objectNames: string[]): Promise<void> {
    if (!this.client) await this.initialize();

    await this.client!.removeObjects(this.bucketName, objectNames);
    storageLogger.debug('Files deleted', { count: objectNames.length });
  }

  async listFiles(prefix: string, recursive: boolean = true): Promise<BucketItem[]> {
    if (!this.client) await this.initialize();

    const objects: BucketItem[] = [];
    const stream = this.client!.listObjects(this.bucketName, prefix, recursive);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => objects.push(obj));
      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }

  async getFileInfo(objectName: string): Promise<BucketItem | null> {
    if (!this.client) await this.initialize();

    try {
      return await this.client!.statObject(this.bucketName, objectName);
    } catch (error) {
      if ((error as any).code === 'NotFound') return null;
      throw error;
    }
  }

  async copyFile(sourceObject: string, destObject: string): Promise<void> {
    if (!this.client) await this.initialize();

    await this.client!.copyObject(this.bucketName, destObject, `/${this.bucketName}/${sourceObject}`, {});
    storageLogger.debug('File copied', { sourceObject, destObject });
  }

  async createFolder(folderPath: string): Promise<void> {
    if (!this.client) await this.initialize();

    await this.client!.putObject(this.bucketName, folderPath, Buffer.alloc(0), 0);
  }

  async getBucketUsage(): Promise<{ size: number; objectCount: number }> {
    if (!this.client) await this.initialize();

    let totalSize = 0;
    let objectCount = 0;

    const stream = this.client!.listObjects(this.bucketName, '', true);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        totalSize += obj.size;
        objectCount++;
      });
      stream.on('end', () => resolve({ size: totalSize, objectCount }));
      stream.on('error', reject);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) await this.initialize();
      await this.client!.bucketExists(this.bucketName);
      return true;
    } catch {
      return false;
    }
  }

  getClient(): MinioClient | null {
    return this.client;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}

export const storageService = new StorageService();