import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private pool: Pool;
  
  private constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.name,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      min: config.database.pool.min,
      max: config.database.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err.message });
    });
  }
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Query error', { text: text.substring(0, 100), error });
      throw error;
    }
  }
  
  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
  
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  public async initializeSchema(): Promise<void> {
    const schema = `
      -- Workstations table
      CREATE TABLE IF NOT EXISTS workstations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hostname VARCHAR(255) NOT NULL UNIQUE,
        ip_address INET,
        mac_address MACADDR,
        lab_location VARCHAR(255),
        os_version VARCHAR(100),
        os_build VARCHAR(50),
        processor_info TEXT,
        total_memory BIGINT,
        client_version VARCHAR(50),
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'offline',
        first_seen TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_workstations_status ON workstations(status);
      CREATE INDEX IF NOT EXISTS idx_workstations_lab ON workstations(lab_location);
      CREATE INDEX IF NOT EXISTS idx_workstations_last_seen ON workstations(last_seen);
      
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR(50) UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        full_name VARCHAR(255),
        email VARCHAR(255),
        department VARCHAR(100),
        role VARCHAR(20) DEFAULT 'student',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
      CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
      
      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(100) NOT NULL UNIQUE,
        workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        username VARCHAR(100) NOT NULL,
        student_id VARCHAR(50),
        domain VARCHAR(100),
        login_time TIMESTAMPTZ NOT NULL,
        logout_time TIMESTAMPTZ,
        duration_seconds BIGINT,
        logout_reason VARCHAR(50),
        session_type VARCHAR(20) DEFAULT 'interactive',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_workstation ON sessions(workstation_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_login_time ON sessions(login_time);
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
      
      -- Activities table
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        activity_type VARCHAR(50) NOT NULL,
        details TEXT,
        risk_level VARCHAR(20) DEFAULT 'normal',
        metadata JSONB,
        screenshot_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_activities_session ON activities(session_id);
      CREATE INDEX IF NOT EXISTS idx_activities_workstation ON activities(workstation_id);
      CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
      CREATE INDEX IF NOT EXISTS idx_activities_risk ON activities(risk_level);
      CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
      
      -- Screenshots table
      CREATE TABLE IF NOT EXISTS screenshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        file_path VARCHAR(500) NOT NULL,
        storage_path VARCHAR(500),
        trigger_reason VARCHAR(100) NOT NULL,
        width INTEGER,
        height INTEGER,
        file_size BIGINT,
        format VARCHAR(20) DEFAULT 'PNG',
        metadata JSONB,
        uploaded BOOLEAN DEFAULT false,
        uploaded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_screenshots_session ON screenshots(session_id);
      CREATE INDEX IF NOT EXISTS idx_screenshots_workstation ON screenshots(workstation_id);
      CREATE INDEX IF NOT EXISTS idx_screenshots_user ON screenshots(user_id);
      CREATE INDEX IF NOT EXISTS idx_screenshots_created ON screenshots(created_at);
      CREATE INDEX IF NOT EXISTS idx_screenshots_trigger ON screenshots(trigger_reason);
      
      -- Alerts table
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
        screenshot_id UUID REFERENCES screenshots(id) ON DELETE SET NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        context JSONB,
        resolved BOOLEAN DEFAULT false,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMPTZ,
        resolution_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_alerts_workstation ON alerts(workstation_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_session ON alerts(session_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
      CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
      
      -- Policies table
      CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id VARCHAR(100) NOT NULL UNIQUE,
        version INTEGER NOT NULL,
        name VARCHAR(100),
        description TEXT,
        config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(is_active);
      
      -- Admin users table
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        permissions JSONB,
        last_login TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
      
      -- Audit log table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
      
      -- System settings table
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      -- Triggers for updated_at
      DROP TRIGGER IF EXISTS update_workstations_updated_at ON workstations;
      CREATE TRIGGER update_workstations_updated_at
        BEFORE UPDATE ON workstations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
      CREATE TRIGGER update_policies_updated_at
        BEFORE UPDATE ON policies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
      CREATE TRIGGER update_admin_users_updated_at
        BEFORE UPDATE ON admin_users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
      CREATE TRIGGER update_system_settings_updated_at
        BEFORE UPDATE ON system_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    await this.query(schema);
    logger.info('Database schema initialized');
  }
  
  public async close(): Promise<void> {
    await this.pool.end();
  }
  
  public async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export const db = Database.getInstance();