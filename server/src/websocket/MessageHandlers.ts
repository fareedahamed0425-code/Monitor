import { workstationRepository, userRepository, sessionRepository, activityRepository, screenshotRepository, alertRepository } from '../models/Repositories';
import { Workstation, User, Session, Activity, Screenshot, Alert } from '../models/Entities';
import { logger, createChildLogger } from '../utils/logger';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const msgLogger = createChildLogger({ module: 'MessageHandlers' });

interface ClientMessage {
  messageId: string;
  timestamp: string;
  workstationId: string;
  sessionId?: string;
  [key: string]: any;
}

export async function handleClientMessage(type: string, workstationId: string, data: ClientMessage): Promise<void> {
  try {
    switch (type) {
      case 'activity_log':
        await handleActivityLog(workstationId, data);
        break;
      case 'screenshot_upload':
        await handleScreenshotUpload(workstationId, data);
        break;
      case 'session_start':
        await handleSessionStart(workstationId, data);
        break;
      case 'session_end':
        await handleSessionEnd(workstationId, data);
        break;
      case 'alert_triggered':
        await handleAlertTriggered(workstationId, data);
        break;
      case 'system_info':
        await handleSystemInfo(workstationId, data);
        break;
      default:
        msgLogger.warn('Unknown message type', { type, workstationId });
    }
  } catch (error) {
    msgLogger.error('Message handling error', { type, workstationId, error });
    throw error;
  }
}

async function handleActivityLog(workstationId: string, data: ClientMessage): Promise<void> {
  const { sessionId, activityType, details, riskLevel, metadata } = data;

  let session: Session | null = null;
  if (sessionId) {
    session = await sessionRepository.findBySessionId(sessionId);
  }

  if (!session) {
    session = await sessionRepository.findActiveByWorkstation(workstationId);
  }

  if (!session) {
    msgLogger.warn('No active session for activity log', { workstationId, sessionId });
    return;
  }

  let user: User | null = null;
  if (session.userId) {
    user = await userRepository.findById(session.userId);
  }

  const activity = await activityRepository.create({
    sessionId: session.id,
    workstationId,
    userId: session.userId,
    activityType,
    details,
    riskLevel: riskLevel || 'normal',
    metadata,
    screenshotId: data.screenshotId,
  });

  if (riskLevel === 'alert' || riskLevel === 'critical') {
    await checkAndCreateAlert(workstationId, session.id, session.userId, activity);
  }

  msgLogger.debug('Activity logged', { 
    workstationId, 
    sessionId: session.id, 
    activityType, 
    riskLevel: riskLevel || 'normal' 
  });
}

async function handleScreenshotUpload(workstationId: string, data: ClientMessage): Promise<void> {
  const { sessionId, filePath, triggerReason, width, height, fileSize, format, metadata } = data;

  let session: Session | null = null;
  if (sessionId) {
    session = await sessionRepository.findBySessionId(sessionId);
  }

  if (!session) {
    session = await sessionRepository.findActiveByWorkstation(workstationId);
  }

  if (!session) {
    msgLogger.warn('No active session for screenshot', { workstationId, sessionId });
    return;
  }

  const screenshot = await screenshotRepository.create({
    sessionId: session.id,
    workstationId,
    userId: session.userId,
    filePath,
    triggerReason,
    width,
    height,
    fileSize,
    format: format || 'PNG',
    metadata,
    uploaded: true,
    uploadedAt: new Date(),
  });

  if (data.activityId) {
    await activityRepository.update(data.activityId, { screenshotId: screenshot.id });
  }

  msgLogger.info('Screenshot uploaded', { 
    workstationId, 
    sessionId: session.id, 
    screenshotId: screenshot.id,
    triggerReason,
    fileSize 
  });
}

async function handleSessionStart(workstationId: string, data: ClientMessage): Promise<void> {
  const { sessionId, username, studentId, domain, loginTime, sessionType } = data;

  let workstation = await workstationRepository.findById(workstationId);
  if (!workstation) {
    workstation = await workstationRepository.create({
      id: workstationId,
      hostname: data.hostname || 'unknown',
      ipAddress: data.ipAddress,
      macAddress: data.macAddress,
      labLocation: data.labLocation,
      osVersion: data.osVersion,
      osBuild: data.osBuild,
      processorInfo: data.processorInfo,
      totalMemory: data.totalMemory,
      clientVersion: data.clientVersion,
      status: 'online',
    });
  } else {
    await workstationRepository.updateStatus(workstationId, 'online');
  }

  let user: User | null = null;
  if (studentId) {
    user = await userRepository.findByStudentId(studentId);
  }
  if (!user && username) {
    user = await userRepository.findByUsername(username);
  }

  if (!user) {
    user = await userRepository.create({
      username,
      studentId,
      fullName: data.fullName,
      email: data.email,
      department: data.department,
      domain,
      role: 'student',
      isActive: true,
    });
  } else {
    await userRepository.update(user.id, {
      fullName: data.fullName || user.fullName,
      email: data.email || user.email,
      department: data.department || user.department,
      domain: domain || user.domain,
    });
  }

  const session = await sessionRepository.create({
    sessionId,
    workstationId,
    userId: user.id,
    username,
    studentId,
    domain,
    loginTime: new Date(loginTime),
    sessionType: sessionType || 'interactive',
  });

  await workstationRepository.update(workstationId, { lastSeen: new Date() });

  msgLogger.info('Session started', { 
    workstationId, 
    sessionId: session.id, 
    userId: user.id, 
    username 
  });
}

async function handleSessionEnd(workstationId: string, data: ClientMessage): Promise<void> {
  const { sessionId, logoutTime, logoutReason } = data;

  const session = await sessionRepository.findBySessionId(sessionId);
  if (!session) {
    msgLogger.warn('Session not found for end', { workstationId, sessionId });
    return;
  }

  await sessionRepository.endSession(sessionId, new Date(logoutTime), logoutReason || 'user_logoff');

  msgLogger.info('Session ended', { 
    workstationId, 
    sessionId: session.id, 
    duration: session.durationSeconds,
    reason: logoutReason 
  });
}

async function handleAlertTriggered(workstationId: string, data: ClientMessage): Promise<void> {
  const { sessionId, alertType, severity, description, context, screenshotId } = data;

  let session: Session | null = null;
  if (sessionId) {
    session = await sessionRepository.findBySessionId(sessionId);
  }

  if (!session) {
    session = await sessionRepository.findActiveByWorkstation(workstationId);
  }

  const alert = await alertRepository.create({
    workstationId,
    userId: session?.userId,
    sessionId: session?.id,
    screenshotId,
    alertType,
    severity,
    description,
    context,
    resolved: false,
  });

  msgLogger.warn('Alert triggered', { 
    workstationId, 
    alertId: alert.id, 
    alertType, 
    severity,
    description 
  });
}

async function handleSystemInfo(workstationId: string, data: ClientMessage): Promise<void> {
  await workstationRepository.update(workstationId, {
    osVersion: data.osVersion,
    osBuild: data.osBuild,
    processorInfo: data.processorInfo,
    totalMemory: data.totalMemory,
    clientVersion: data.clientVersion,
    lastSeen: new Date(),
  });

  msgLogger.debug('System info updated', { workstationId });
}

async function checkAndCreateAlert(
  workstationId: string, 
  sessionId: string, 
  userId: string | undefined, 
  activity: Activity
): Promise<void> {
  const recentAlerts = await alertRepository.findBySession(sessionId);
  const recentHighRisk = recentAlerts.filter(a => 
    a.severity === 'high' || a.severity === 'critical'
  ).length;

  if (recentHighRisk >= 3) {
    await alertRepository.create({
      workstationId,
      userId,
      sessionId,
      alertType: 'repeated_high_risk',
      severity: 'critical',
      description: `Multiple high-risk activities detected in session (${recentHighRisk} alerts)`,
      context: { activityCount: recentHighRisk },
    });
  }
}

export async function processOfflineQueue(workstationId: string, messages: ClientMessage[]): Promise<void> {
  for (const msg of messages) {
    try {
      await handleClientMessage(msg.type || 'unknown', workstationId, msg);
    } catch (error) {
      msgLogger.error('Offline queue processing error', { workstationId, messageId: msg.messageId, error });
    }
  }
}

export async function getWorkstationSummary(workstationId: string): Promise<any> {
  const workstation = await workstationRepository.findById(workstationId);
  if (!workstation) return null;

  const activeSession = await sessionRepository.findActiveByWorkstation(workstationId);
  const recentActivities = await activityRepository.findByWorkstation(workstationId, 20);
  const recentScreenshots = await screenshotRepository.findByWorkstation(workstationId, 10);
  const unresolvedAlerts = await alertRepository.findByWorkstation(workstationId, 50);
  const alertCounts = await alertRepository.getSeverityDistribution(workstationId);

  return {
    workstation,
    activeSession,
    recentActivities,
    recentScreenshots,
    unresolvedAlerts: unresolvedAlerts.filter(a => !a.resolved),
    alertCounts,
  };
}

export async function getUserSummary(userId: string): Promise<any> {
  const user = await userRepository.findById(userId);
  if (!user) return null;

  const sessions = await sessionRepository.findByUser(userId, 20);
  const activities = await activityRepository.findByUser(userId, 50);
  const screenshots = await screenshotRepository.findByUser(userId, 20);
  const alerts = await alertRepository.findByUser(userId, 50);
  const riskDistribution = await activityRepository.getRiskDistribution(undefined, userId);

  return {
    user,
    sessions,
    recentActivities: activities,
    recentScreenshots: screenshots,
    alerts: alerts.filter(a => !a.resolved),
    riskDistribution,
  };
}

export async function getDashboardStats(): Promise<any> {
  const [onlineCount, offlineCount, totalUsers, totalAlerts, unresolvedAlerts] = await Promise.all([
    workstationRepository.getOnlineCount(),
    workstationRepository.getOfflineCount(),
    userRepository.count({ where: { isActive: true } }),
    alertRepository.count(),
    alertRepository.count({ where: { resolved: false } }),
  ]);

  const recentAlerts = await alertRepository.findUnresolved(10);
  const alertTrends = await alertRepository.getAlertTrends(7);

  return {
    workstations: { online: onlineCount, offline: offlineCount, total: onlineCount + offlineCount },
    users: { total: totalUsers },
    alerts: { total: totalAlerts, unresolved: unresolvedAlerts, recent: recentAlerts, trends: alertTrends },
  };
}