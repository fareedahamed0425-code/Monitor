import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'college_monitor',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // API
  api: {
    prefix: '/api/v1',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
  
  // WebSocket
  websocket: {
    path: '/ws',
    pingInterval: 25000,
    pingTimeout: 20000,
  },
  
  // File Storage (MinIO/S3)
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || 'localhost:9000',
    accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
    bucket: process.env.STORAGE_BUCKET || 'college-monitor',
    useSSL: process.env.STORAGE_USE_SSL === 'true',
    region: process.env.STORAGE_REGION || 'us-east-1',
  },
  
  // Monitoring
  monitoring: {
    heartbeatTimeout: parseInt(process.env.HEARTBEAT_TIMEOUT || '90000', 10), // 90 seconds
    screenshotMaxSize: parseInt(process.env.SCREENSHOT_MAX_SIZE || '10485760', 10), // 10MB
    alertRetentionDays: parseInt(process.env.ALERT_RETENTION_DAYS || '90', 10),
    activityRetentionDays: parseInt(process.env.ACTIVITY_RETENTION_DAYS || '180', 10),
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    },
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/server.log',
  },
};