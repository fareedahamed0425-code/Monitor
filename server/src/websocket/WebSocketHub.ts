import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';
import { logger, createChildLogger } from '../utils/logger';
import { workstationRepository } from './Repositories';
import { verifyClientToken, generateClientToken } from '../auth/jwt';
import { handleClientMessage } from './MessageHandlers';

const wsLogger = createChildLogger({ module: 'WebSocketHub' });

interface ConnectedClient {
  socket: Socket;
  workstationId: string;
  hostname: string;
  authenticated: boolean;
  lastHeartbeat: Date;
  currentUser?: string;
  currentSessionId?: string;
}

export class WebSocketHub {
  private io: SocketIOServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private staleCheckInterval: NodeJS.Timeout | null = null;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeat();
    this.startStaleCheck();

    wsLogger.info('WebSocket hub initialized');
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          wsLogger.warn('Connection attempt without token', { socketId: socket.id });
          return next(new Error('Authentication required'));
        }

        const payload = verifyClientToken(token as string);
        if (!payload) {
          wsLogger.warn('Invalid token', { socketId: socket.id });
          return next(new Error('Invalid token'));
        }

        (socket as any).clientPayload = payload;
        next();
      } catch (error) {
        wsLogger.error('Authentication error', { error, socketId: socket.id });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const payload = (socket as any).clientPayload;
      const workstationId = payload.workstationId;
      const hostname = payload.hostname;

      wsLogger.info('Client connected', { socketId: socket.id, workstationId, hostname });

      const client: ConnectedClient = {
        socket,
        workstationId,
        hostname,
        authenticated: true,
        lastHeartbeat: new Date(),
      };

      this.clients.set(socket.id, client);
      this.updateWorkstationStatus(workstationId, 'online');

      socket.on('heartbeat', (data) => this.handleHeartbeat(socket, data));
      socket.on('activity_log', (data) => this.handleActivityLog(socket, data));
      socket.on('screenshot_upload', (data) => this.handleScreenshotUpload(socket, data));
      socket.on('session_start', (data) => this.handleSessionStart(socket, data));
      socket.on('session_end', (data) => this.handleSessionEnd(socket, data));
      socket.on('alert_triggered', (data) => this.handleAlertTriggered(socket, data));
      socket.on('system_info', (data) => this.handleSystemInfo(socket, data));
      socket.on('command_response', (data) => this.handleCommandResponse(socket, data));
      socket.on('policy_ack', (data) => this.handlePolicyAck(socket, data));
      socket.on('sync_request', (data) => this.handleSyncRequest(socket, data));
      socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));
      socket.on('error', (error) => this.handleError(socket, error));
    });
  }

  private async handleHeartbeat(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    client.lastHeartbeat = new Date();
    client.currentUser = data.currentUser;
    client.currentSessionId = data.sessionId;

    await workstationRepository.updateLastSeen(client.workstationId);

    socket.emit('heartbeat_ack', {
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    });
  }

  private async handleActivityLog(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    try {
      await handleClientMessage('activity_log', client.workstationId, data);
      socket.emit('activity_ack', { messageId: data.messageId, status: 'received' });
    } catch (error) {
      wsLogger.error('Activity log error', { error, workstationId: client.workstationId });
      socket.emit('activity_ack', { messageId: data.messageId, status: 'error', error: 'Processing failed' });
    }
  }

  private async handleScreenshotUpload(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    try {
      await handleClientMessage('screenshot_upload', client.workstationId, data);
      socket.emit('screenshot_ack', { messageId: data.messageId, status: 'received' });
    } catch (error) {
      wsLogger.error('Screenshot upload error', { error, workstationId: client.workstationId });
      socket.emit('screenshot_ack', { messageId: data.messageId, status: 'error', error: 'Upload failed' });
    }
  }

  private async handleSessionStart(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    client.currentUser = data.username;
    client.currentSessionId = data.sessionId;

    try {
      await handleClientMessage('session_start', client.workstationId, data);
      socket.emit('session_ack', { messageId: data.messageId, status: 'received' });
    } catch (error) {
      wsLogger.error('Session start error', { error, workstationId: client.workstationId });
      socket.emit('session_ack', { messageId: data.messageId, status: 'error', error: 'Processing failed' });
    }
  }

  private async handleSessionEnd(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    client.currentUser = undefined;
    client.currentSessionId = undefined;

    try {
      await handleClientMessage('session_end', client.workstationId, data);
      socket.emit('session_ack', { messageId: data.messageId, status: 'received' });
    } catch (error) {
      wsLogger.error('Session end error', { error, workstationId: client.workstationId });
      socket.emit('session_ack', { messageId: data.messageId, status: 'error', error: 'Processing failed' });
    }
  }

  private async handleAlertTriggered(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    try {
      await handleClientMessage('alert_triggered', client.workstationId, data);
      this.broadcastToAdmins('new_alert', {
        workstationId: client.workstationId,
        hostname: client.hostname,
        alert: data,
      });
      socket.emit('alert_ack', { messageId: data.messageId, status: 'received' });
    } catch (error) {
      wsLogger.error('Alert triggered error', { error, workstationId: client.workstationId });
      socket.emit('alert_ack', { messageId: data.messageId, status: 'error', error: 'Processing failed' });
    }
  }

  private async handleSystemInfo(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    try {
      await handleClientMessage('system_info', client.workstationId, data);
    } catch (error) {
      wsLogger.error('System info error', { error, workstationId: client.workstationId });
    }
  }

  private handleCommandResponse(socket: Socket, data: any): void {
    wsLogger.debug('Command response received', { 
      workstationId: this.clients.get(socket.id)?.workstationId,
      commandId: data.commandId,
      success: data.success 
    });
  }

  private handlePolicyAck(socket: Socket, data: any): void {
    wsLogger.debug('Policy acknowledgment', { 
      workstationId: this.clients.get(socket.id)?.workstationId,
      policyVersion: data.policyVersion 
    });
  }

  private async handleSyncRequest(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;

    wsLogger.info('Sync requested', { workstationId: client.workstationId, types: data.types });
    socket.emit('sync_response', { 
      messageId: data.messageId,
      status: 'queued',
      message: 'Sync initiated' 
    });
  }

  private async handleDisconnect(socket: Socket, reason: string): Promise<void> {
    const client = this.clients.get(socket.id);
    if (client) {
      wsLogger.info('Client disconnected', { 
        socketId: socket.id, 
        workstationId: client.workstationId, 
        hostname: client.hostname,
        reason 
      });
      
      this.clients.delete(socket.id);
      await this.updateWorkstationStatus(client.workstationId, 'offline');
    }
  }

  private handleError(socket: Socket, error: Error): void {
    const client = this.clients.get(socket.id);
    wsLogger.error('Socket error', { 
      error: error.message, 
      workstationId: client?.workstationId,
      socketId: socket.id 
    });
  }

  private async updateWorkstationStatus(workstationId: string, status: string): Promise<void> {
    try {
      await workstationRepository.updateStatus(workstationId, status);
      this.broadcastToAdmins('workstation_status', { workstationId, status });
    } catch (error) {
      wsLogger.error('Failed to update workstation status', { error, workstationId, status });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleThreshold = 90000;

      for (const [socketId, client] of this.clients.entries()) {
        if (now.getTime() - client.lastHeartbeat.getTime() > staleThreshold) {
          wsLogger.warn('Client heartbeat timeout', { 
            socketId, 
            workstationId: client.workstationId,
            lastHeartbeat: client.lastHeartbeat 
          });
          
          client.socket.disconnect(true);
          this.clients.delete(socketId);
          this.updateWorkstationStatus(client.workstationId, 'offline');
        }
      }
    }, 30000);
  }

  private startStaleCheck(): void {
    this.staleCheckInterval = setInterval(async () => {
      try {
        const staleWorkstations = await workstationRepository.findStale(5);
        for (const ws of staleWorkstations) {
          wsLogger.warn('Workstation marked stale', { workstationId: ws.id, hostname: ws.hostname });
          await workstationRepository.updateStatus(ws.id, 'offline');
          this.broadcastToAdmins('workstation_status', { workstationId: ws.id, status: 'offline' });
        }
      } catch (error) {
        wsLogger.error('Stale check error', { error });
      }
    }, 60000);
  }

  public sendCommand(workstationId: string, command: any): boolean {
    for (const [, client] of this.clients.entries()) {
      if (client.workstationId === workstationId && client.authenticated) {
        client.socket.emit('command', command);
        wsLogger.debug('Command sent', { workstationId, commandType: command.type });
        return true;
      }
    }
    return false;
  }

  public broadcastToWorkstations(event: string, data: any, filter?: (client: ConnectedClient) => boolean): void {
    for (const [, client] of this.clients.entries()) {
      if (client.authenticated && (!filter || filter(client))) {
        client.socket.emit(event, data);
      }
    }
  }

  public broadcastToAdmins(event: string, data: any): void {
    this.io.to('admins').emit(event, data);
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }

  public getConnectedWorkstations(): Array<{ workstationId: string; hostname: string; currentUser?: string }> {
    return Array.from(this.clients.values()).map(c => ({
      workstationId: c.workstationId,
      hostname: c.hostname,
      currentUser: c.currentUser,
    }));
  }

  public isWorkstationOnline(workstationId: string): boolean {
    for (const client of this.clients.values()) {
      if (client.workstationId === workstationId && client.authenticated) {
        return true;
      }
    }
    return false;
  }

  public async shutdown(): Promise<void> {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.staleCheckInterval) clearInterval(this.staleCheckInterval);

    for (const [, client] of this.clients.entries()) {
      client.socket.disconnect(true);
    }
    this.clients.clear();

    await this.io.close();
    wsLogger.info('WebSocket hub shut down');
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let hubInstance: WebSocketHub | null = null;

export const initializeWebSocketHub = (httpServer: HTTPServer): WebSocketHub => {
  if (!hubInstance) {
    hubInstance = new WebSocketHub(httpServer);
  }
  return hubInstance;
};

export const getWebSocketHub = (): WebSocketHub | null => {
  return hubInstance;
};