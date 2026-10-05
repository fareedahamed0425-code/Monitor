import { config } from '../config';
import { logger, createChildLogger } from '../utils/logger';
import { alertRepository, activityRepository, sessionRepository, workstationRepository, userRepository, policyRepository } from '../models/Repositories';
import { Alert, Activity, Session, Workstation, User, Policy } from '../models/Entities';
import { getWebSocketHub } from '../websocket/WebSocketHub';

const alertLogger = createChildLogger({ module: 'AlertEngine' });

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
  actions: AlertAction[];
}

export interface AlertCondition {
  type: 'keyword' | 'pattern' | 'threshold' | 'sequence' | 'anomaly';
  parameters: Record<string, any>;
}

export interface AlertAction {
  type: 'screenshot' | 'notify' | 'lock' | 'logoff' | 'command' | 'webhook';
  parameters: Record<string, any>;
}

export interface AlertContext {
  workstationId: string;
  sessionId?: string;
  userId?: string;
  activity?: Activity;
  metadata?: Record<string, any>;
}

class AlertEngine {
  private rules: Map<string, AlertRule> = new Map();
  private cooldowns: Map<string, Date> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadDefaultRules();
    await this.loadCustomRules();
    this.startPeriodicEvaluation();
    this.initialized = true;
    alertLogger.info('Alert engine initialized', { rulesCount: this.rules.size });
  }

  private async loadDefaultRules(): Promise<void> {
    const defaultRules: AlertRule[] = [
      {
        id: 'suspicious_keyword',
        name: 'Suspicious Keyword Detection',
        description: 'Triggers when window title contains suspicious keywords',
        enabled: true,
        condition: {
          type: 'keyword',
          parameters: {
            keywords: config.monitoring.suspiciousKeywords || [
              'hack', 'crack', 'serial key', 'password stealer', 'keylogger',
              'ransomware', 'exploit', 'vulnerability', 'backdoor', 'rootkit',
              'botnet', 'ddos', 'phishing', 'malware', 'trojan', 'virus',
              'inject', 'bypass', 'crack', 'patch', 'keygen', 'activator'
            ],
            fields: ['windowTitle', 'processName', 'url', 'filePath'],
            caseSensitive: false,
          },
        },
        severity: 'high',
        cooldownMinutes: 5,
        actions: [
          { type: 'screenshot', parameters: { reason: 'suspicious_keyword' } },
          { type: 'notify', parameters: { priority: 'high' } },
        ],
      },
      {
        id: 'blocked_website',
        name: 'Blocked Website Access',
        description: 'Triggers when user accesses a blocked website',
        enabled: true,
        condition: {
          type: 'pattern',
          parameters: {
            patterns: config.monitoring.blockedUrls || [],
            field: 'url',
          },
        },
        severity: 'high',
        cooldownMinutes: 10,
        actions: [
          { type: 'screenshot', parameters: { reason: 'blocked_website' } },
          { type: 'notify', parameters: { priority: 'high' } },
        ],
      },
      {
        id: 'unauthorized_software',
        name: 'Unauthorized Software Execution',
        description: 'Triggers when unauthorized software is executed',
        enabled: true,
        condition: {
          type: 'pattern',
          parameters: {
            patterns: config.monitoring.blockedApplications || [],
            field: 'processName',
          },
        },
        severity: 'medium',
        cooldownMinutes: 5,
        actions: [
          { type: 'screenshot', parameters: { reason: 'unauthorized_software' } },
          { type: 'notify', parameters: { priority: 'medium' } },
        ],
      },
      {
        id: 'usb_connected',
        name: 'USB Device Connected',
        description: 'Triggers when a USB device is connected',
        enabled: true,
        condition: {
          type: 'keyword',
          parameters: {
            keywords: ['usb', 'mass storage', 'flash drive', 'external drive'],
            fields: ['activityType', 'details'],
            caseSensitive: false,
          },
        },
        severity: 'medium',
        cooldownMinutes: 2,
        actions: [
          { type: 'screenshot', parameters: { reason: 'usb_connected', delay: 3000 } },
          { type: 'notify', parameters: { priority: 'medium' } },
        ],
      },
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        description: 'Triggers on multiple failed login attempts',
        enabled: true,
        condition: {
          type: 'threshold',
          parameters: {
            activityType: 'failed_login',
            threshold: 3,
            windowMinutes: 10,
          },
        },
        severity: 'high',
        cooldownMinutes: 15,
        actions: [
          { type: 'screenshot', parameters: { reason: 'failed_logins' } },
          { type: 'notify', parameters: { priority: 'high' } },
          { type: 'lock', parameters: { durationMinutes: 15 } },
        ],
      },
      {
        id: 'system_time_change',
        name: 'System Time Change Attempt',
        description: 'Triggers when system time is changed',
        enabled: true,
        condition: {
          type: 'keyword',
          parameters: {
            keywords: ['time change', 'date change', 'system time'],
            fields: ['activityType', 'details'],
            caseSensitive: false,
          },
        },
        severity: 'critical',
        cooldownMinutes: 60,
        actions: [
          { type: 'screenshot', parameters: { reason: 'time_change' } },
          { type: 'notify', parameters: { priority: 'critical' } },
          { type: 'lock', parameters: { durationMinutes: 30 } },
        ],
      },
      {
        id: 'process_termination_attempt',
        name: 'Monitoring Process Termination Attempt',
        description: 'Triggers when user attempts to terminate monitoring processes',
        enabled: true,
        condition: {
          type: 'keyword',
          parameters: {
            keywords: ['taskkill', 'taskmgr', 'processhacker', 'procexp', 'kill process', 'end task'],
            fields: ['windowTitle', 'processName', 'commandLine'],
            caseSensitive: false,
          },
        },
        severity: 'critical',
        cooldownMinutes: 10,
        actions: [
          { type: 'screenshot', parameters: { reason: 'process_termination_attempt' } },
          { type: 'notify', parameters: { priority: 'critical' } },
          { type: 'lock', parameters: { durationMinutes: 30 } },
        ],
      },
      {
        id: 'high_risk_sequence',
        name: 'High Risk Activity Sequence',
        description: 'Triggers on sequence of high-risk activities in short timeframe',
        enabled: true,
        condition: {
          type: 'sequence',
          parameters: {
            riskLevels: ['high', 'critical'],
            count: 3,
            windowMinutes: 5,
          },
        },
        severity: 'critical',
        cooldownMinutes: 30,
        actions: [
          { type: 'screenshot', parameters: { reason: 'high_risk_sequence' } },
          { type: 'notify', parameters: { priority: 'critical' } },
          { type: 'lock', parameters: { durationMinutes: 60 } },
        ],
      },
      {
        id: 'suspicious_network',
        name: 'Suspicious Network Activity',
        description: 'Triggers on connections to known malicious IPs or unusual ports',
        enabled: true,
        condition: {
          type: 'pattern',
          parameters: {
            patterns: config.monitoring.maliciousIps || [],
            field: 'remoteAddress',
          },
        },
        severity: 'high',
        cooldownMinutes: 5,
        actions: [
          { type: 'screenshot', parameters: { reason: 'suspicious_network' } },
          { type: 'notify', parameters: { priority: 'high' } },
        ],
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  private async loadCustomRules(): Promise<void> {
    try {
      const policy = await policyRepository.findActive();
      if (policy && policy.config.customAlertRules) {
        for (const rule of policy.config.customAlertRules) {
          this.rules.set(rule.id, rule);
        }
        alertLogger.info('Custom alert rules loaded', { count: policy.config.customAlertRules.length });
      }
    } catch (error) {
      alertLogger.error('Failed to load custom rules', { error });
    }
  }

  private startPeriodicEvaluation(): void {
    this.evaluationInterval = setInterval(async () => {
      await this.evaluateThresholdRules();
      await this.evaluateSequenceRules();
      await this.evaluateAnomalyRules();
    }, 60000);
  }

  async evaluateActivity(activity: Activity, context: AlertContext): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.isInCooldown(rule.id, context.workstationId)) continue;

      const matched = await this.evaluateRule(rule, activity, context);
      if (matched) {
        await this.triggerAlert(rule, context);
        this.setCooldown(rule.id, context.workstationId, rule.cooldownMinutes);
      }
    }
  }

  private async evaluateRule(rule: AlertRule, activity: Activity, context: AlertContext): Promise<boolean> {
    switch (rule.condition.type) {
      case 'keyword':
        return this.evaluateKeywordCondition(rule.condition, activity);
      case 'pattern':
        return this.evaluatePatternCondition(rule.condition, activity);
      case 'threshold':
        return await this.evaluateThresholdCondition(rule.condition, context);
      case 'sequence':
        return await this.evaluateSequenceCondition(rule.condition, context);
      case 'anomaly':
        return await this.evaluateAnomalyCondition(rule.condition, context);
      default:
        return false;
    }
  }

  private evaluateKeywordCondition(condition: AlertCondition, activity: Activity): boolean {
    const { keywords, fields, caseSensitive } = condition.parameters;
    const searchText = this.extractFields(activity, fields).join(' ').toLowerCase();
    
    for (const keyword of keywords) {
      const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
      if (searchText.includes(searchKeyword)) {
        return true;
      }
    }
    return false;
  }

  private evaluatePatternCondition(condition: AlertCondition, activity: Activity): boolean {
    const { patterns, field } = condition.parameters;
    const value = this.getFieldValue(activity, field);
    
    if (!value) return false;

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(value)) {
          return true;
        }
      } catch {
        if (value.toLowerCase().includes(pattern.toLowerCase())) {
          return true;
        }
      }
    }
    return false;
  }

  private async evaluateThresholdCondition(condition: AlertCondition, context: AlertContext): Promise<boolean> {
    const { activityType, threshold, windowMinutes } = condition.parameters;
    const startTime = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const count = await activityRepository.count({
      where: {
        workstationId: context.workstationId,
        activityType,
        createdAt: { $gte: startTime } as any,
      },
    });

    return count >= threshold;
  }

  private async evaluateSequenceCondition(condition: AlertCondition, context: AlertContext): Promise<boolean> {
    const { riskLevels, count, windowMinutes } = condition.parameters;
    const startTime = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const activities = await activityRepository.findByWorkstation(context.workstationId, 100);
    const recentHighRisk = activities
      .filter(a => a.createdAt >= startTime && riskLevels.includes(a.riskLevel))
      .length;

    return recentHighRisk >= count;
  }

  private async evaluateAnomalyCondition(condition: AlertCondition, context: AlertContext): Promise<boolean> {
    return false;
  }

  private async evaluateThresholdRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.condition.type !== 'threshold') continue;

      const workstations = await workstationRepository.findByStatus('online');
      for (const ws of workstations) {
        if (this.isInCooldown(rule.id, ws.id)) continue;

        const context: AlertContext = { workstationId: ws.id };
        const matched = await this.evaluateThresholdCondition(rule.condition, context);
        if (matched) {
          await this.triggerAlert(rule, context);
          this.setCooldown(rule.id, ws.id, rule.cooldownMinutes);
        }
      }
    }
  }

  private async evaluateSequenceRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.condition.type !== 'sequence') continue;

      const workstations = await workstationRepository.findByStatus('online');
      for (const ws of workstations) {
        if (this.isInCooldown(rule.id, ws.id)) continue;

        const context: AlertContext = { workstationId: ws.id };
        const matched = await this.evaluateSequenceCondition(rule.condition, context);
        if (matched) {
          await this.triggerAlert(rule, context);
          this.setCooldown(rule.id, ws.id, rule.cooldownMinutes);
        }
      }
    }
  }

  private async evaluateAnomalyRules(): Promise<void> {
  }

  private async triggerAlert(rule: AlertRule, context: AlertContext): Promise<void> {
    const description = `${rule.name}: ${rule.description}`;
    
    const alert = await alertRepository.create({
      workstationId: context.workstationId,
      userId: context.userId,
      sessionId: context.sessionId,
      alertType: rule.id,
      severity: rule.severity,
      description,
      context: {
        ruleId: rule.id,
        ruleName: rule.name,
        activity: context.activity ? {
          type: context.activity.activityType,
          details: context.activity.details,
          riskLevel: context.activity.riskLevel,
        } : undefined,
        ...context.metadata,
      },
    });

    alertLogger.warn('Alert triggered', { 
      alertId: alert.id, 
      ruleId: rule.id, 
      workstationId: context.workstationId,
      severity: rule.severity 
    });

    for (const action of rule.actions) {
      await this.executeAction(action, context, alert);
    }

    const hub = getWebSocketHub();
    if (hub) {
      hub.broadcastToAdmins('new_alert', {
        alert: {
          id: alert.id,
          workstationId: context.workstationId,
          alertType: rule.id,
          severity: rule.severity,
          description,
          createdAt: alert.createdAt,
        },
      });
    }
  }

  private async executeAction(action: AlertAction, context: AlertContext, alert: Alert): Promise<void> {
    const hub = getWebSocketHub();
    if (!hub) return;

    switch (action.type) {
      case 'screenshot': {
        const delay = action.parameters.delay || 0;
        const reason = action.parameters.reason || 'alert_triggered';
        
        setTimeout(() => {
          hub.sendCommand(context.workstationId, {
            type: 'request_screenshot',
            commandId: `screenshot_${alert.id}`,
            parameters: { reason, quality: 80 },
          });
        }, delay);
        break;
      }
      case 'notify':
        break;
      case 'lock': {
        const duration = action.parameters.durationMinutes || 15;
        hub.sendCommand(context.workstationId, {
          type: 'lock_workstation',
          commandId: `lock_${alert.id}`,
          parameters: { durationMinutes: duration, reason: alert.alertType },
        });
        break;
      }
      case 'logoff': {
        hub.sendCommand(context.workstationId, {
          type: 'logoff_user',
          commandId: `logoff_${alert.id}`,
          parameters: { reason: alert.alertType },
        });
        break;
      }
      case 'command': {
        hub.sendCommand(context.workstationId, {
          type: action.parameters.commandType,
          commandId: `cmd_${alert.id}`,
          parameters: action.parameters.parameters || {},
        });
        break;
      }
      case 'webhook':
        break;
    }
  }

  private extractFields(activity: Activity, fields: string[]): string[] {
    const values: string[] = [];
    const metadata = activity.metadata || {};
    
    for (const field of fields) {
      switch (field) {
        case 'windowTitle':
          values.push(metadata.windowTitle || '');
          break;
        case 'processName':
          values.push(metadata.processName || '');
          break;
        case 'url':
          values.push(metadata.url || '');
          break;
        case 'filePath':
          values.push(metadata.filePath || '');
          break;
        case 'commandLine':
          values.push(metadata.commandLine || '');
          break;
        case 'activityType':
          values.push(activity.activityType);
          break;
        case 'details':
          values.push(activity.details || '');
          break;
        default:
          values.push(metadata[field] || '');
      }
    }
    return values;
  }

  private getFieldValue(activity: Activity, field: string): string {
    const metadata = activity.metadata || {};
    
    switch (field) {
      case 'windowTitle': return metadata.windowTitle || '';
      case 'processName': return metadata.processName || '';
      case 'url': return metadata.url || '';
      case 'filePath': return metadata.filePath || '';
      case 'commandLine': return metadata.commandLine || '';
      case 'activityType': return activity.activityType;
      case 'details': return activity.details || '';
      case 'remoteAddress': return metadata.remoteAddress || '';
      default: return metadata[field] || '';
    }
  }

  private isInCooldown(ruleId: string, workstationId: string): boolean {
    const key = `${ruleId}:${workstationId}`;
    const cooldownUntil = this.cooldowns.get(key);
    if (!cooldownUntil) return false;
    return new Date() < cooldownUntil;
  }

  private setCooldown(ruleId: string, workstationId: string, minutes: number): void {
    const key = `${ruleId}:${workstationId}`;
    this.cooldowns.set(key, new Date(Date.now() + minutes * 60 * 1000));
  }

  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    alertLogger.info('Alert rule added', { ruleId: rule.id, name: rule.name });
  }

  public removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      alertLogger.info('Alert rule removed', { ruleId });
    }
    return deleted;
  }

  public getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  public getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  public async shutdown(): Promise<void> {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
    this.cooldowns.clear();
    alertLogger.info('Alert engine shut down');
  }
}

export const alertEngine = new AlertEngine();