import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { db } from './models/Database';
import { initializeWebSocketHub, getWebSocketHub } from './websocket/WebSocketHub';
import { alertEngine } from './alerts/AlertEngine';
import { storageService } from './storage/StorageService';
import { authMiddleware, AuthenticatedRequest } from './auth/middleware';
import { workstationRepository, userRepository, sessionRepository, activityRepository, screenshotRepository, alertRepository, policyRepository, adminUserRepository, auditLogRepository, systemSettingRepository } from './models/Repositories';
import { authenticateAdmin, createAdminUser, generateClientToken, hashPassword } from './auth/jwt';
import { PERMISSIONS } from './auth/jwt';

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);

app.get('/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  const storageHealthy = await storageService.healthCheck();
  const wsHub = getWebSocketHub();
  
  res.json({
    status: dbHealthy && storageHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      storage: storageHealthy ? 'up' : 'down',
      websocket: wsHub ? 'up' : 'down',
      connectedClients: wsHub?.getConnectedCount() || 0,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await authenticateAdmin(username, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        permissions: result.user.permissions,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can create users' });
    }

    const { username, email, password, fullName, role, permissions } = req.body;
    const user = await createAdminUser({ username, email, password, fullName, role, permissions });
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    logger.error('Register error', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.json({
    id: req.user!.userId,
    username: req.user!.username,
    email: req.user!.email,
    role: req.user!.role,
    permissions: req.user!.permissions,
  });
});

app.get('/api/workstations', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, labLocation, page = 1, limit = 50, search } = req.query;
    const where: any = {};
    
    if (status) where.status = status;
    if (labLocation) where.labLocation = labLocation;
    
    let workstations = await workstationRepository.findAll({
      where,
      order: { lastSeen: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    if (search) {
      workstations = workstations.filter(w => 
        w.hostname.toLowerCase().includes((search as string).toLowerCase()) ||
        w.ipAddress?.includes(search as string) ||
        w.labLocation?.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    const total = await workstationRepository.count({ where });
    
    res.json({
      data: workstations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get workstations error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/workstations/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const workstation = await workstationRepository.findById(req.params.id);
    if (!workstation) {
      return res.status(404).json({ error: 'Workstation not found' });
    }

    const summary = await import('./websocket/MessageHandlers').then(m => m.getWorkstationSummary(workstation.id));
    res.json(summary);
  } catch (error) {
    logger.error('Get workstation error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/workstations/:id/command', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { type, parameters } = req.body;
    const hub = getWebSocketHub();
    
    if (!hub) {
      return res.status(503).json({ error: 'WebSocket hub not available' });
    }

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sent = hub.sendCommand(req.params.id, {
      type,
      commandId,
      parameters,
    });

    if (!sent) {
      return res.status(404).json({ error: 'Workstation not connected' });
    }

    await auditLogRepository.log({
      adminUserId: req.user!.userId,
      action: 'send_command',
      resourceType: 'workstation',
      resourceId: req.params.id,
      details: { commandType: type, commandId, parameters },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, commandId });
  } catch (error) {
    logger.error('Send command error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { department, role, page = 1, limit = 50, search } = req.query;
    const where: any = { isActive: true };
    
    if (department) where.department = department;
    if (role) where.role = role;
    
    let users = await userRepository.findAll({
      where,
      order: { username: 'ASC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    if (search) {
      users = await userRepository.search(search as string);
    }

    const total = await userRepository.count({ where });
    
    res.json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get users error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await import('./websocket/MessageHandlers').then(m => m.getUserSummary(req.params.id));
    if (!summary) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(summary);
  } catch (error) {
    logger.error('Get user error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sessions', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { workstationId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where: any = {};
    
    if (workstationId) where.workstationId = workstationId;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.loginTime = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } as any;
    }
    
    const sessions = await sessionRepository.findAll({
      where,
      order: { loginTime: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await sessionRepository.count({ where });
    
    res.json({
      data: sessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get sessions error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/activities', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId, workstationId, userId, activityType, riskLevel, startDate, endDate, page = 1, limit = 100 } = req.query;
    const where: any = {};
    
    if (sessionId) where.sessionId = sessionId;
    if (workstationId) where.workstationId = workstationId;
    if (userId) where.userId = userId;
    if (activityType) where.activityType = activityType;
    if (riskLevel) where.riskLevel = riskLevel;
    if (startDate && endDate) {
      where.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } as any;
    }
    
    const activities = await activityRepository.findAll({
      where,
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await activityRepository.count({ where });
    
    res.json({
      data: activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get activities error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/screenshots', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId, workstationId, userId, triggerReason, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where: any = {};
    
    if (sessionId) where.sessionId = sessionId;
    if (workstationId) where.workstationId = workstationId;
    if (userId) where.userId = userId;
    if (triggerReason) where.triggerReason = triggerReason;
    if (startDate && endDate) {
      where.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } as any;
    }
    
    const screenshots = await screenshotRepository.findAll({
      where,
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await screenshotRepository.count({ where });
    
    const screenshotsWithUrls = await Promise.all(screenshots.map(async (s) => {
      const url = await storageService.getPresignedUrl(s.filePath, { expirySeconds: 3600 });
      return { ...s, url };
    }));
    
    res.json({
      data: screenshotsWithUrls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get screenshots error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/screenshots/:id/download', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const screenshot = await screenshotRepository.findById(req.params.id);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const buffer = await storageService.downloadFile(screenshot.filePath);
    
    await auditLogRepository.log({
      adminUserId: req.user!.userId,
      action: 'download_screenshot',
      resourceType: 'screenshot',
      resourceId: screenshot.id,
      details: { workstationId: screenshot.workstationId, sessionId: screenshot.sessionId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', `image/${screenshot.format.toLowerCase()}`);
    res.setHeader('Content-Disposition', `attachment; filename="screenshot_${screenshot.id}.${screenshot.format.toLowerCase()}"`);
    res.send(buffer);
  } catch (error) {
    logger.error('Download screenshot error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { workstationId, userId, sessionId, alertType, severity, resolved, startDate, endDate, page = 1, limit = 100 } = req.query;
    const where: any = {};
    
    if (workstationId) where.workstationId = workstationId;
    if (userId) where.userId = userId;
    if (sessionId) where.sessionId = sessionId;
    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (resolved !== undefined) where.resolved = resolved === 'true';
    if (startDate && endDate) {
      where.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } as any;
    }
    
    const alerts = await alertRepository.findAll({
      where,
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await alertRepository.count({ where });
    
    res.json({
      data: alerts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get alerts error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/alerts/:id/resolve', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { notes } = req.body;
    const alert = await alertRepository.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alertRepository.resolve(req.params.id, req.user!.userId, notes);
    
    await auditLogRepository.log({
      adminUserId: req.user!.userId,
      action: 'resolve_alert',
      resourceType: 'alert',
      resourceId: alert.id,
      details: { notes },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const hub = getWebSocketHub();
    if (hub) {
      hub.broadcastToAdmins('alert_resolved', { alertId: alert.id, resolvedBy: req.user!.username });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Resolve alert error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/policies', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const policies = await policyRepository.findAll({ order: { version: 'DESC' } });
    res.json({ data: policies });
  } catch (error) {
    logger.error('Get policies error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/policies/active', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const policy = await policyRepository.findActive();
    if (!policy) {
      return res.status(404).json({ error: 'No active policy' });
    }
    res.json(policy);
  } catch (error) {
    logger.error('Get active policy error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/policies', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { policyId, name, description, config: policyConfig, isActive } = req.body;
    
    const latest = await policyRepository.findLatest();
    const version = (latest?.version || 0) + 1;
    
    const policy = await policyRepository.create({
      policyId,
      version,
      name,
      description,
      config: policyConfig,
      isActive: isActive || false,
      createdBy: req.user!.userId,
    });

    if (isActive) {
      await policyRepository.setActive(policyId);
    }

    await auditLogRepository.log({
      adminUserId: req.user!.userId,
      action: 'create_policy',
      resourceType: 'policy',
      resourceId: policy.id,
      details: { policyId, version, name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const hub = getWebSocketHub();
    if (hub) {
      hub.broadcastToWorkstations('policy_update', { policyId, version, config: policyConfig });
    }

    res.status(201).json(policy);
  } catch (error) {
    logger.error('Create policy error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/policies/:id/activate', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const policy = await policyRepository.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    await policyRepository.setActive(policy.policyId);
    
    await auditLogRepository.log({
      adminUserId: req.user!.userId,
      action: 'activate_policy',
      resourceType: 'policy',
      resourceId: policy.id,
      details: { policyId: policy.policyId, version: policy.version },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const hub = getWebSocketHub();
    if (hub) {
      hub.broadcastToWorkstations('policy_update', { policyId: policy.policyId, version: policy.version, config: policy.config });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Activate policy error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await import('./websocket/MessageHandlers').then(m => m.getDashboardStats());
    res.json(stats);
  } catch (error) {
    logger.error('Get dashboard stats error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/alert-trends', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await alertRepository.getAlertTrends(Number(days));
    res.json({ data: trends });
  } catch (error) {
    logger.error('Get alert trends error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/audit-logs', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { adminUserId, action, resourceType, startDate, endDate, page = 1, limit = 100 } = req.query;
    const where: any = {};
    
    if (adminUserId) where.adminUserId = adminUserId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (startDate && endDate) {
      where.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } as any;
    }
    
    const logs = await auditLogRepository.findAll({
      where,
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await auditLogRepository.count({ where });
    
    res.json({
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get audit logs error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/settings', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await systemSettingRepository.getAll();
    res.json({ data: settings });
  } catch (error) {
    logger.error('Get settings error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/settings/:key', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { value, description } = req.body;
    const setting = await systemSettingRepository.set(req.params.key, value, description, req.user!.userId);
    
    await auditLogRepository.log({
      adminUserId: req.user!.userId,
      action: 'update_setting',
      resourceType: 'setting',
      resourceId: req.params.key,
      details: { value },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(setting);
  } catch (error) {
    logger.error('Update setting error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/client/token', async (req, res) => {
  try {
    const { workstationId, hostname, clientVersion } = req.body;
    if (!workstationId || !hostname) {
      return res.status(400).json({ error: 'workstationId and hostname required' });
    }

    const token = generateClientToken(workstationId, hostname, clientVersion || '1.0.0');
    res.json({ token, expiresIn: '365d' });
  } catch (error) {
    logger.error('Generate client token error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer(): Promise<void> {
  try {
    await db.initializeSchema();
    logger.info('Database schema initialized');

    await storageService.initialize();
    logger.info('Storage service initialized');

    await alertEngine.initialize();
    logger.info('Alert engine initialized');

    initializeWebSocketHub(httpServer);
    logger.info('WebSocket hub initialized');

    const adminExists = await adminUserRepository.count({});
    if (adminExists === 0) {
      const defaultPassword = config.admin.defaultPassword || 'ChangeMe123!';
      await createAdminUser({
        username: 'admin',
        email: config.admin.defaultEmail || 'admin@localhost',
        password: defaultPassword,
        fullName: 'System Administrator',
        role: 'superadmin',
        permissions: Object.values(PERMISSIONS).reduce((acc, p) => ({ ...acc, [p]: true }), {}),
      });
      logger.warn('Default admin user created', { username: 'admin', email: config.admin.defaultEmail });
    }

    httpServer.listen(config.server.port, config.server.host, () => {
      logger.info(`Server started on ${config.server.host}:${config.server.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await alertEngine.shutdown();
  const hub = getWebSocketHub();
  if (hub) await hub.shutdown();
  await db.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await alertEngine.shutdown();
  const hub = getWebSocketHub();
  if (hub) await hub.shutdown();
  await db.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

export { app, httpServer };