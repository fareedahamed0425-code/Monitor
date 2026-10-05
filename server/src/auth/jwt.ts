import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { logger, createChildLogger } from '../utils/logger';
import { adminUserRepository } from '../models/Repositories';
import { AdminUser } from '../models/Entities';

const authLogger = createChildLogger({ module: 'Auth' });

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  permissions: Record<string, any>;
  iat?: number;
  exp?: number;
}

export interface ClientJWTPayload {
  workstationId: string;
  hostname: string;
  clientVersion: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;
const CLIENT_TOKEN_EXPIRES_IN = '365d';

export function generateToken(user: AdminUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions || {},
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateClientToken(workstationId: string, hostname: string, clientVersion: string): string {
  const payload: ClientJWTPayload = {
    workstationId,
    hostname,
    clientVersion,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: CLIENT_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    authLogger.debug('Token verification failed', { error: (error as Error).message });
    return null;
  }
}

export function verifyClientToken(token: string): ClientJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as ClientJWTPayload;
  } catch (error) {
    authLogger.debug('Client token verification failed', { error: (error as Error).message });
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | ClientJWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload | ClientJWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateAdmin(username: string, password: string): Promise<{ user: AdminUser; token: string } | null> {
  const user = await adminUserRepository.findByUsername(username);
  if (!user || !user.isActive) {
    authLogger.warn('Authentication failed: user not found or inactive', { username });
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    authLogger.warn('Authentication failed: invalid password', { username });
    return null;
  }

  await adminUserRepository.updateLastLogin(user.id);
  const token = generateToken(user);

  authLogger.info('Admin authenticated', { userId: user.id, username });
  return { user, token };
}

export async function createAdminUser(data: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
  permissions?: Record<string, any>;
}): Promise<AdminUser> {
  const existing = await adminUserRepository.findByUsername(data.username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const existingEmail = await adminUserRepository.findByEmail(data.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const user = await adminUserRepository.create({
    username: data.username,
    email: data.email,
    passwordHash,
    fullName: data.fullName,
    role: data.role || 'admin',
    permissions: data.permissions || {},
    isActive: true,
  });

  authLogger.info('Admin user created', { userId: user.id, username: user.username });
  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await adminUserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await adminUserRepository.update(userId, { passwordHash: newHash });

  authLogger.info('Password changed', { userId });
  return true;
}

export async function resetPassword(userId: string, newPassword: string): Promise<boolean> {
  const user = await adminUserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const newHash = await hashPassword(newPassword);
  await adminUserRepository.update(userId, { passwordHash: newHash });

  authLogger.info('Password reset', { userId });
  return true;
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

export function requirePermission(permission: string) {
  return (payload: JWTPayload): boolean => {
    if (payload.role === 'superadmin') return true;
    if (!payload.permissions) return false;
    return payload.permissions[permission] === true;
  };
}

export const PERMISSIONS = {
  WORKSTATIONS_VIEW: 'workstations.view',
  WORKSTATIONS_MANAGE: 'workstations.manage',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  SESSIONS_VIEW: 'sessions.view',
  ACTIVITIES_VIEW: 'activities.view',
  SCREENSHOTS_VIEW: 'screenshots.view',
  SCREENSHOTS_DOWNLOAD: 'screenshots.download',
  ALERTS_VIEW: 'alerts.view',
  ALERTS_MANAGE: 'alerts.manage',
  POLICIES_VIEW: 'policies.view',
  POLICIES_MANAGE: 'policies.manage',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_VIEW: 'audit.view',
  ADMIN_USERS_MANAGE: 'admin_users.manage',
} as const;