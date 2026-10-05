import { Repository, FindOptionsWhere, FindManyOptions, Between, In, ILike } from 'typeorm';
import { db } from './Database';
import {
  Workstation,
  User,
  Session,
  Activity,
  Screenshot,
  Alert,
  Policy,
  AdminUser,
  AuditLog,
  SystemSetting,
} from './Entities';

export class BaseRepository<T> {
  protected repository: Repository<T>;

  constructor(entity: new () => T) {
    this.repository = db.getRepository(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(options: FindManyOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }
}

export class WorkstationRepository extends BaseRepository<Workstation> {
  constructor() {
    super(Workstation);
  }

  async findByHostname(hostname: string): Promise<Workstation | null> {
    return this.repository.findOne({ where: { hostname } });
  }

  async findByStatus(status: string): Promise<Workstation[]> {
    return this.repository.find({ where: { status } });
  }

  async findByLabLocation(labLocation: string): Promise<Workstation[]> {
    return this.repository.find({ where: { labLocation } });
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.repository.update(id, { lastSeen: new Date() });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.repository.update(id, { status, lastSeen: new Date() });
  }

  async getOnlineCount(): Promise<number> {
    return this.repository.count({ where: { status: 'online' } });
  }

  async getOfflineCount(): Promise<number> {
    return this.repository.count({ where: { status: 'offline' } });
  }

  async findStale(thresholdMinutes: number = 5): Promise<Workstation[]> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    return this.repository
      .createQueryBuilder('w')
      .where('w.status = :status', { status: 'online' })
      .andWhere('w.lastSeen < :threshold', { threshold })
      .getMany();
  }
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  async findByStudentId(studentId: string): Promise<User | null> {
    return this.repository.findOne({ where: { studentId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByDepartment(department: string): Promise<User[]> {
    return this.repository.find({ where: { department } });
  }

  async search(query: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder('u')
      .where('u.username ILIKE :query', { query: `%${query}%` })
      .orWhere('u.fullName ILIKE :query', { query: `%${query}%` })
      .orWhere('u.studentId ILIKE :query', { query: `%${query}%` })
      .orWhere('u.email ILIKE :query', { query: `%${query}%` })
      .limit(50)
      .getMany();
  }
}

export class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super(Session);
  }

  async findBySessionId(sessionId: string): Promise<Session | null> {
    return this.repository.findOne({ where: { sessionId } });
  }

  async findByWorkstation(workstationId: string, limit: number = 50): Promise<Session[]> {
    return this.repository.find({
      where: { workstationId },
      order: { loginTime: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit: number = 50): Promise<Session[]> {
    return this.repository.find({
      where: { userId },
      order: { loginTime: 'DESC' },
      take: limit,
    });
  }

  async findActiveByWorkstation(workstationId: string): Promise<Session | null> {
    return this.repository.findOne({
      where: { workstationId, logoutTime: null },
      order: { loginTime: 'DESC' },
    });
  }

  async findActiveByUser(userId: string): Promise<Session[]> {
    return this.repository.find({
      where: { userId, logoutTime: null },
      order: { loginTime: 'DESC' },
    });
  }

  async findByDateRange(start: Date, end: Date): Promise<Session[]> {
    return this.repository.find({
      where: { loginTime: Between(start, end) },
      order: { loginTime: 'DESC' },
    });
  }

  async endSession(sessionId: string, logoutTime: Date, reason: string): Promise<void> {
    const session = await this.findBySessionId(sessionId);
    if (session) {
      const duration = Math.floor((logoutTime.getTime() - session.loginTime.getTime()) / 1000);
      await this.repository.update(session.id, {
        logoutTime,
        durationSeconds: duration,
        logoutReason: reason,
      });
    }
  }
}

export class ActivityRepository extends BaseRepository<Activity> {
  constructor() {
    super(Activity);
  }

  async findBySession(sessionId: string, limit: number = 100): Promise<Activity[]> {
    return this.repository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByWorkstation(workstationId: string, limit: number = 100): Promise<Activity[]> {
    return this.repository.find({
      where: { workstationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit: number = 100): Promise<Activity[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByRiskLevel(riskLevel: string, limit: number = 100): Promise<Activity[]> {
    return this.repository.find({
      where: { riskLevel },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByType(activityType: string, limit: number = 100): Promise<Activity[]> {
    return this.repository.find({
      where: { activityType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByDateRange(start: Date, end: Date, workstationId?: string): Promise<Activity[]> {
    const query = this.repository
      .createQueryBuilder('a')
      .where('a.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('a.createdAt', 'DESC');

    if (workstationId) {
      query.andWhere('a.workstationId = :workstationId', { workstationId });
    }

    return query.limit(500).getMany();
  }

  async getRiskDistribution(workstationId?: string, userId?: string): Promise<Record<string, number>> {
    const query = this.repository
      .createQueryBuilder('a')
      .select('a.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.riskLevel');

    if (workstationId) {
      query.andWhere('a.workstationId = :workstationId', { workstationId });
    }
    if (userId) {
      query.andWhere('a.userId = :userId', { userId });
    }

    const results = await query.getRawMany();
    const distribution: Record<string, number> = {};
    results.forEach(r => {
      distribution[r.riskLevel] = parseInt(r.count, 10);
    });
    return distribution;
  }
}

export class ScreenshotRepository extends BaseRepository<Screenshot> {
  constructor() {
    super(Screenshot);
  }

  async findBySession(sessionId: string, limit: number = 50): Promise<Screenshot[]> {
    return this.repository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByWorkstation(workstationId: string, limit: number = 50): Promise<Screenshot[]> {
    return this.repository.find({
      where: { workstationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit: number = 50): Promise<Screenshot[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByTriggerReason(triggerReason: string, limit: number = 50): Promise<Screenshot[]> {
    return this.repository.find({
      where: { triggerReason },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByDateRange(start: Date, end: Date, workstationId?: string): Promise<Screenshot[]> {
    const query = this.repository
      .createQueryBuilder('s')
      .where('s.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('s.createdAt', 'DESC');

    if (workstationId) {
      query.andWhere('s.workstationId = :workstationId', { workstationId });
    }

    return query.limit(200).getMany();
  }

  async markUploaded(id: string, storagePath: string): Promise<void> {
    await this.repository.update(id, {
      uploaded: true,
      uploadedAt: new Date(),
      storagePath,
    });
  }

  async getTotalSize(workstationId?: string): Promise<number> {
    const query = this.repository
      .createQueryBuilder('s')
      .select('SUM(s.fileSize)', 'totalSize');

    if (workstationId) {
      query.where('s.workstationId = :workstationId', { workstationId });
    }

    const result = await query.getRawOne();
    return parseInt(result?.totalSize || '0', 10);
  }
}

export class AlertRepository extends BaseRepository<Alert> {
  constructor() {
    super(Alert);
  }

  async findByWorkstation(workstationId: string, limit: number = 100): Promise<Alert[]> {
    return this.repository.find({
      where: { workstationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit: number = 100): Promise<Alert[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findBySession(sessionId: string): Promise<Alert[]> {
    return this.repository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnresolved(limit: number = 100): Promise<Alert[]> {
    return this.repository.find({
      where: { resolved: false },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findBySeverity(severity: string, limit: number = 100): Promise<Alert[]> {
    return this.repository.find({
      where: { severity },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByType(alertType: string, limit: number = 100): Promise<Alert[]> {
    return this.repository.find({
      where: { alertType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByDateRange(start: Date, end: Date, workstationId?: string): Promise<Alert[]> {
    const query = this.repository
      .createQueryBuilder('a')
      .where('a.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('a.createdAt', 'DESC');

    if (workstationId) {
      query.andWhere('a.workstationId = :workstationId', { workstationId });
    }

    return query.limit(500).getMany();
  }

  async resolve(id: string, resolvedBy: string, notes?: string): Promise<void> {
    await this.repository.update(id, {
      resolved: true,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes: notes,
    });
  }

  async getSeverityDistribution(workstationId?: string): Promise<Record<string, number>> {
    const query = this.repository
      .createQueryBuilder('a')
      .select('a.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.severity');

    if (workstationId) {
      query.andWhere('a.workstationId = :workstationId', { workstationId });
    }

    const results = await query.getRawMany();
    const distribution: Record<string, number> = {};
    results.forEach(r => {
      distribution[r.severity] = parseInt(r.count, 10);
    });
    return distribution;
  }

  async getAlertTrends(days: number = 7): Promise<Array<{ date: string; count: number }>> {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const results = await this.repository
      .createQueryBuilder('a')
      .select("DATE_TRUNC('day', a.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('a.createdAt >= :start', { start })
      .groupBy("DATE_TRUNC('day', a.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map(r => ({
      date: r.date,
      count: parseInt(r.count, 10),
    }));
  }
}

export class PolicyRepository extends BaseRepository<Policy> {
  constructor() {
    super(Policy);
  }

  async findByPolicyId(policyId: string): Promise<Policy | null> {
    return this.repository.findOne({ where: { policyId } });
  }

  async findActive(): Promise<Policy | null> {
    return this.repository.findOne({
      where: { isActive: true },
      order: { version: 'DESC' },
    });
  }

  async findLatest(): Promise<Policy | null> {
    return this.repository.findOne({
      order: { version: 'DESC' },
    });
  }

  async setActive(policyId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Policy)
      .set({ isActive: false })
      .execute();

    await this.repository.update({ policyId }, { isActive: true });
  }
}

export class AdminUserRepository extends BaseRepository<AdminUser> {
  constructor() {
    super(AdminUser);
  }

  async findByUsername(username: string): Promise<AdminUser | null> {
    return this.repository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.repository.findOne({ where: { email } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLogin: new Date() });
  }
}

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super(AuditLog);
  }

  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    return this.create(data);
  }

  async findByAdminUser(adminUserId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { adminUserId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByResource(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
    });
  }
}

export class SystemSettingRepository extends BaseRepository<SystemSetting> {
  constructor() {
    super(SystemSetting);
  }

  async get(key: string): Promise<any> {
    const setting = await this.repository.findOne({ where: { key } });
    return setting?.value;
  }

  async set(key: string, value: any, description?: string, updatedBy?: string): Promise<SystemSetting> {
    const existing = await this.repository.findOne({ where: { key } });
    if (existing) {
      return this.repository.save({
        ...existing,
        value,
        description: description ?? existing.description,
        updatedBy,
      });
    }
    return this.repository.save({ key, value, description, updatedBy });
  }

  async getAll(): Promise<SystemSetting[]> {
    return this.repository.find();
  }
}

export const workstationRepository = new WorkstationRepository();
export const userRepository = new UserRepository();
export const sessionRepository = new SessionRepository();
export const activityRepository = new ActivityRepository();
export const screenshotRepository = new ScreenshotRepository();
export const alertRepository = new AlertRepository();
export const policyRepository = new PolicyRepository();
export const adminUserRepository = new AdminUserRepository();
export const auditLogRepository = new AuditLogRepository();
export const systemSettingRepository = new SystemSettingRepository();