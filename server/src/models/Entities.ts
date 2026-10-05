import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('workstations')
@Index(['status'])
@Index(['labLocation'])
@Index(['lastSeen'])
export class Workstation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  hostname: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'macaddr', nullable: true })
  macAddress: string;

  @Column({ length: 255, nullable: true })
  labLocation: string;

  @Column({ length: 100, nullable: true })
  osVersion: string;

  @Column({ length: 50, nullable: true })
  osBuild: string;

  @Column({ type: 'text', nullable: true })
  processorInfo: string;

  @Column({ type: 'bigint', nullable: true })
  totalMemory: number;

  @Column({ length: 50, nullable: true })
  clientVersion: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  lastSeen: Date;

  @Column({ length: 20, default: 'offline' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeen: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Session, session => session.workstation)
  sessions: Session[];

  @OneToMany(() => Activity, activity => activity.workstation)
  activities: Activity[];

  @OneToMany(() => Screenshot, screenshot => screenshot.workstation)
  screenshots: Screenshot[];

  @OneToMany(() => Alert, alert => alert.workstation)
  alerts: Alert[];
}

@Entity('users')
@Index(['studentId'])
@Index(['department'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, nullable: true })
  studentId: string;

  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 255, nullable: true })
  fullName: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ length: 20, default: 'student' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Session, session => session.user)
  sessions: Session[];

  @OneToMany(() => Activity, activity => activity.user)
  activities: Activity[];

  @OneToMany(() => Screenshot, screenshot => screenshot.user)
  screenshots: Screenshot[];

  @OneToMany(() => Alert, alert => alert.user)
  alerts: Alert[];
}

@Entity('sessions')
@Index(['workstationId'])
@Index(['userId'])
@Index(['loginTime'])
@Index(['sessionId'], { unique: true })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  sessionId: string;

  @Column({ type: 'uuid' })
  workstationId: string;

  @ManyToOne(() => Workstation, workstation => workstation.sessions)
  @JoinColumn({ name: 'workstation_id' })
  workstation: Workstation;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 50, nullable: true })
  studentId: string;

  @Column({ length: 100, nullable: true })
  domain: string;

  @Column({ type: 'timestamptz' })
  loginTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  logoutTime: Date;

  @Column({ type: 'bigint', nullable: true })
  durationSeconds: number;

  @Column({ length: 50, nullable: true })
  logoutReason: string;

  @Column({ length: 20, default: 'interactive' })
  sessionType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Activity, activity => activity.session)
  activities: Activity[];

  @OneToMany(() => Screenshot, screenshot => screenshot.session)
  screenshots: Screenshot[];

  @OneToMany(() => Alert, alert => alert.session)
  alerts: Alert[];
}

@Entity('activities')
@Index(['sessionId'])
@Index(['workstationId'])
@Index(['userId'])
@Index(['activityType'])
@Index(['riskLevel'])
@Index(['createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, session => session.activities)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ type: 'uuid' })
  workstationId: string;

  @ManyToOne(() => Workstation, workstation => workstation.activities)
  @JoinColumn({ name: 'workstation_id' })
  workstation: Workstation;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.activities)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50 })
  activityType: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ length: 20, default: 'normal' })
  riskLevel: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  screenshotId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('screenshots')
@Index(['sessionId'])
@Index(['workstationId'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['triggerReason'])
export class Screenshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, session => session.screenshots)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ type: 'uuid' })
  workstationId: string;

  @ManyToOne(() => Workstation, workstation => workstation.screenshots)
  @JoinColumn({ name: 'workstation_id' })
  workstation: Workstation;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.screenshots)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 500, nullable: true })
  storagePath: string;

  @Column({ length: 100 })
  triggerReason: string;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ length: 20, default: 'PNG' })
  format: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  uploaded: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('alerts')
@Index(['workstationId'])
@Index(['userId'])
@Index(['sessionId'])
@Index(['alertType'])
@Index(['severity'])
@Index(['resolved'])
@Index(['createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workstationId: string;

  @ManyToOne(() => Workstation, workstation => workstation.alerts)
  @JoinColumn({ name: 'workstation_id' })
  workstation: Workstation;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.alerts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @ManyToOne(() => Session, session => session.alerts)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ type: 'uuid', nullable: true })
  screenshotId: string;

  @ManyToOne(() => Screenshot)
  @JoinColumn({ name: 'screenshot_id' })
  screenshot: Screenshot;

  @Column({ length: 50 })
  alertType: string;

  @Column({ length: 20 })
  severity: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  @Column({ default: false })
  resolved: boolean;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('policies')
@Index(['isActive'])
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  policyId: string;

  @Column()
  version: number;

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('admin_users')
@Index(['email'], { unique: true })
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 255, nullable: true })
  fullName: string;

  @Column({ length: 50, default: 'admin' })
  role: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('audit_logs')
@Index(['adminUserId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  adminUserId: string;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;

  @Column({ length: 100 })
  action: string;

  @Column({ length: 50, nullable: true })
  resourceType: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: 'jsonb' })
  value: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}