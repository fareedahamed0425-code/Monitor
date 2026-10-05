import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface WorkstationStatus {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  labLocation: string;
  osVersion: string;
  status: 'online' | 'offline' | 'warning';
  currentUser?: string;
  activeWindow?: string;
  riskLevel: 'normal' | 'attention' | 'alert';
  lastSeen: string;
  lastHeartbeat: string;
}

interface Alert {
  id: string;
  workstationId: string;
  workstationHostname: string;
  userId?: string;
  username?: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  screenshotId?: string;
  timestamp: string;
  resolved: boolean;
  acknowledged: boolean;
}

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  workstations: Map<string, WorkstationStatus>;
  alerts: Alert[];
  connect: () => void;
  disconnect: () => void;
  sendCommand: (workstationId: string, command: string, params?: Record<string, unknown>) => void;
  requestScreenshot: (workstationId: string) => void;
  lockWorkstation: (workstationId: string) => void;
  logoffUser: (workstationId: string) => void;
  updatePolicy: (workstationId: string, policy: Record<string, unknown>) => void;
}

const SocketContext = createContext<SocketState | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [workstations, setWorkstations] = useState<Map<string, WorkstationStatus>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || '', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      
      // Request initial data
      newSocket.emit('get_workstations');
      newSocket.emit('get_recent_alerts', { limit: 50 });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Workstation updates
    newSocket.on('workstation_status', (data: WorkstationStatus) => {
      setWorkstations(prev => {
        const next = new Map(prev);
        next.set(data.id, data);
        return next;
      });
    });

    newSocket.on('workstation_list', (data: WorkstationStatus[]) => {
      const map = new Map<string, WorkstationStatus>();
      data.forEach(ws => map.set(ws.id, ws));
      setWorkstations(map);
    });

    newSocket.on('workstation_offline', (data: { id: string; timestamp: string }) => {
      setWorkstations(prev => {
        const next = new Map(prev);
        const ws = next.get(data.id);
        if (ws) {
          next.set(data.id, { ...ws, status: 'offline', lastSeen: data.timestamp });
        }
        return next;
      });
    });

    // Alert events
    newSocket.on('new_alert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 100));
      // Play notification sound for high/critical alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        playNotificationSound();
      }
    });

    newSocket.on('alert_list', (data: Alert[]) => {
      setAlerts(data);
    });

    newSocket.on('alert_acknowledged', (data: { alertId: string; acknowledgedBy: string }) => {
      setAlerts(prev => prev.map(a => 
        a.id === data.alertId ? { ...a, acknowledged: true } : a
      ));
    });

    newSocket.on('alert_resolved', (data: { alertId: string; resolvedBy: string }) => {
      setAlerts(prev => prev.map(a => 
        a.id === data.alertId ? { ...a, resolved: true } : a
      ));
    });

    // Screenshot events
    newSocket.on('screenshot_captured', (data: { workstationId: string; screenshotId: string; timestamp: string }) => {
      console.log('Screenshot captured:', data);
    });

    // Command responses
    newSocket.on('command_response', (data: { commandId: string; success: boolean; result?: unknown; error?: string }) => {
      console.log('Command response:', data);
    });

    setSocket(newSocket);
  }, [socket, isAuthenticated]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);

  const sendCommand = useCallback((workstationId: string, command: string, params?: Record<string, unknown>) => {
    if (socket?.connected) {
      socket.emit('send_command', { workstationId, command, params });
    }
  }, [socket]);

  const requestScreenshot = useCallback((workstationId: string) => {
    sendCommand(workstationId, 'request_screenshot');
  }, [sendCommand]);

  const lockWorkstation = useCallback((workstationId: string) => {
    sendCommand(workstationId, 'lock_workstation');
  }, [sendCommand]);

  const logoffUser = useCallback((workstationId: string) => {
    sendCommand(workstationId, 'logoff_user');
  }, [sendCommand]);

  const updatePolicy = useCallback((workstationId: string, policy: Record<string, unknown>) => {
    sendCommand(workstationId, 'update_policy', policy);
  }, [sendCommand]);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => disconnect();
  }, [isAuthenticated, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('workstation_status');
        socket.off('workstation_list');
        socket.off('workstation_offline');
        socket.off('new_alert');
        socket.off('alert_list');
        socket.off('alert_acknowledged');
        socket.off('alert_resolved');
        socket.off('screenshot_captured');
        socket.off('command_response');
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      workstations,
      alerts,
      connect,
      disconnect,
      sendCommand,
      requestScreenshot,
      lockWorkstation,
      logoffUser,
      updatePolicy,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Simple notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {
    // Ignore audio errors
  }
};