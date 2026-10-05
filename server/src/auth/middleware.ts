import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload, PERMISSIONS } from './jwt';
import { logger, createChildLogger } from '../utils/logger';

const authLogger = createChildLogger({ module: 'AuthMiddleware' });

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  
  next();
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role === 'superadmin') {
      next();
      return;
    }

    if (!req.user.permissions || req.user.permissions[permission] !== true) {
      authLogger.warn('Permission denied', { 
        userId: req.user.userId, 
        permission,
        userPermissions: req.user.permissions 
      });
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      authLogger.warn('Role access denied', { 
        userId: req.user.userId, 
        userRole: req.user.role,
        requiredRoles: roles 
      });
      res.status(403).json({ error: 'Insufficient role' });
      return;
    }

    next();
  };
}

export const requireWorkstationsView = requirePermission(PERMISSIONS.WORKSTATIONS_VIEW);
export const requireWorkstationsManage = requirePermission(PERMISSIONS.WORKSTATIONS_MANAGE);
export const requireUsersView = requirePermission(PERMISSIONS.USERS_VIEW);
export const requireUsersManage = requirePermission(PERMISSIONS.USERS_MANAGE);
export const requireSessionsView = requirePermission(PERMISSIONS.SESSIONS_VIEW);
export const requireActivitiesView = requirePermission(PERMISSIONS.ACTIVITIES_VIEW);
export const requireScreenshotsView = requirePermission(PERMISSIONS.SCREENSHOTS_VIEW);
export const requireScreenshotsDownload = requirePermission(PERMISSIONS.SCREENSHOTS_DOWNLOAD);
export const requireAlertsView = requirePermission(PERMISSIONS.ALERTS_VIEW);
export const requireAlertsManage = requirePermission(PERMISSIONS.ALERTS_MANAGE);
export const requirePoliciesView = requirePermission(PERMISSIONS.POLICIES_VIEW);
export const requirePoliciesManage = requirePermission(PERMISSIONS.POLICIES_MANAGE);
export const requireReportsView = requirePermission(PERMISSIONS.REPORTS_VIEW);
export const requireReportsExport = requirePermission(PERMISSIONS.REPORTS_EXPORT);
export const requireSettingsView = requirePermission(PERMISSIONS.SETTINGS_VIEW);
export const requireSettingsManage = requirePermission(PERMISSIONS.SETTINGS_MANAGE);
export const requireAuditView = requirePermission(PERMISSIONS.AUDIT_VIEW);
export const requireAdminUsersManage = requirePermission(PERMISSIONS.ADMIN_USERS_MANAGE);