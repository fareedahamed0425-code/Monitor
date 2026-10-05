import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  DesktopMac,
  Person,
  Visibility,
  Warning,
  Error,
  CheckCircle,
  Refresh,
  FilterList,
  Download,
  MoreVert,
  Lock,
  ExitToApp,
  PhotoCamera,
  Info,
  Settings,
  History,
  PhotoLibrary,
  BugReport,
  NetworkCheck,
  Storage,
  Memory,
  Speed,
  ArrowBack,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  TimelineDot,
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface Workstation {
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
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkIn?: number;
  networkOut?: number;
}

interface Session {
  id: string;
  userId: string;
  username: string;
  loginTime: string;
  logoutTime?: string;
  duration?: number;
  status: 'active' | 'ended';
  riskScore: number;
}

interface Activity {
  id: string;
  timestamp: string;
  activityType: string;
  details: string;
  riskLevel: 'normal' | 'attention' | 'alert';
  screenshotId?: string;
}

interface Screenshot {
  id: string;
  timestamp: string;
  triggerReason: string;
  fileSize: number;
  thumbnailUrl?: string;
}

const riskLevelConfig = {
  normal: { color: 'success', label: 'Normal', icon: <CheckCircleIcon fontSize="small" /> },
  attention: { color: 'warning', label: 'Attention', icon: <WarningIcon fontSize="small" color="warning" /> },
  alert: { color: 'error', label: 'Alert', icon: <ErrorIcon fontSize="small" color="error" /> },
};

const statusConfig = {
  online: { color: 'success', label: 'Online', icon: <CheckCircleIcon fontSize="small" /> },
  offline: { color: 'default', label: 'Offline', icon: <DesktopMacIcon fontSize="small" color="disabled" /> },
  warning: { color: 'warning', label: 'Warning', icon: <WarningIcon fontSize="small" color="warning" /> },
};

const activityTypeIcons: Record<string, React.ReactNode> = {
  window_change: <VisibilityIcon fontSize="small" />,
  process_start: <BugReportIcon fontSize="small" />,
  url_visit: <NetworkCheckIcon fontSize="small" />,
  file_access: <StorageIcon fontSize="small" />,
  usb_connect: <MemoryIcon fontSize="small" />,
  clipboard: <InfoIcon fontSize="small" />,
  screenshot: <PhotoCameraIcon fontSize="small" />,
  session_start: <PersonIcon fontSize="small" />,
  session_end: <ExitToAppIcon fontSize="small" />,
};

const WorkstationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workstations, requestScreenshot, lockWorkstation, logoffUser } = useSocket();
  const [workstation, setWorkstation] = useState<Workstation | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [screenshotDialog, setScreenshotDialog] = useState<{ open: boolean; screenshot: Screenshot | null }>({ open: false, screenshot: null });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get workstation from socket state
        const ws = workstations.get(id!);
        if (ws) {
          setWorkstation(ws);
        }

        // Fetch detailed data from API
        const [wsDetail, sessionsData, activitiesData, screenshotsData] = await Promise.all([
          api.getWorkstation(id!),
          api.getSessions({ workstationId: id!, limit: 50 }),
          api.getActivities({ workstationId: id!, limit: 100 }),
          api.getScreenshots({ workstationId: id!, limit: 50 }),
        ]);

        setWorkstation(wsDetail.data);
        setSessions(sessionsData.data.sessions || sessionsData.data);
        setActivities(activitiesData.data.activities || activitiesData.data);
        setScreenshots(screenshotsData.data.screenshots || screenshotsData.data);
      } catch (error) {
        console.error('Failed to fetch workstation details:', error);
        setSnackbar({ open: true, message: 'Failed to load workstation details', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, workstations]);

  const handleCommand = async (action: string) => {
    if (!workstation) return;
    
    try {
      switch (action) {
        case 'screenshot':
          await requestScreenshot(workstation.id);
          break;
        case 'lock':
          await lockWorkstation(workstation.id);
          break;
        case 'logoff':
          await logoffUser(workstation.id);
          break;
      }
      setSnackbar({ open: true, message: `Command sent successfully`, severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Command failed', severity: 'error' });
    }
  };

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setScreenshotDialog({ open: true, screenshot });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!workstation) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography variant="h6" color="text.secondary">Workstation not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/workstations')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h4" fontWeight={700}>{workstation.hostname}</Typography>
              <Chip
                icon={statusConfig[workstation.status].icon}
                label={statusConfig[workstation.status].label}
                color={statusConfig[workstation.status].color as any}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              {workstation.ipAddress} • {workstation.macAddress} • {workstation.labLocation || 'Unknown location'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {workstation.status === 'online' && workstation.currentUser && (
            <>
              <Tooltip title="Request Screenshot">
                <IconButton onClick={() => handleCommand('screenshot')}>
                  <PhotoCameraIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lock Workstation">
                <IconButton onClick={() => handleCommand('lock')} color="warning">
                  <LockIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logoff User">
                <IconButton onClick={() => handleCommand('logoff')} color="error">
                  <ExitToAppIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Current User</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {workstation.currentUser || 'No user logged in'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Risk Level</Typography>
                  <Chip
                    icon={riskLevelConfig[workstation.riskLevel].icon}
                    label={riskLevelConfig[workstation.riskLevel].label}
                    color={riskLevelConfig[workstation.riskLevel].color as any}
                    size="small"
                    variant="filled"
                  />
                </Box>
                <Avatar sx={{ bgcolor: `${riskLevelConfig[workstation.riskLevel].color}.light`, color: `${riskLevelConfig[workstation.riskLevel].color}.contrastText` }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Active Window</Typography>
                  <Typography variant="body2" noWrap title={workstation.activeWindow}>
                    {workstation.activeWindow || 'Desktop'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <VisibilityIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Heartbeat</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {workstation.lastHeartbeat ? formatDistanceToNow(parseISO(workstation.lastHeartbeat), { addSuffix: true }) : 'Never'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <SpeedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>System Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">OS Version</Typography>
                  <Typography variant="body2" fontWeight={500}>{workstation.osVersion || 'Unknown'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">IP Address</Typography>
                  <Typography variant="body2" fontWeight={500} fontFamily="monospace">{workstation.ipAddress}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">MAC Address</Typography>
                  <Typography variant="body2" fontWeight={500} fontFamily="monospace">{workstation.macAddress}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body2" fontWeight={500}>{workstation.labLocation || 'Unknown'}</Typography>
                </Box>
                {workstation.cpuUsage !== undefined && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>Resource Usage</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">CPU Usage</Typography>
                          <Typography variant="caption" fontWeight={500}>{workstation.cpuUsage}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={workstation.cpuUsage} color={workstation.cpuUsage > 80 ? 'error' : workstation.cpuUsage > 60 ? 'warning' : 'primary'} size="thin" />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Memory Usage</Typography>
                          <Typography variant="caption" fontWeight={500}>{workstation.memoryUsage}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={workstation.memoryUsage} color={workstation.memoryUsage > 80 ? 'error' : workstation.memoryUsage > 60 ? 'warning' : 'primary'} size="thin" />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Disk Usage</Typography>
                          <Typography variant="caption" fontWeight={500}>{workstation.diskUsage}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={workstation.diskUsage} color={workstation.diskUsage > 80 ? 'error' : workstation.diskUsage > 60 ? 'warning' : 'primary'} size="thin" />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recent Sessions</Typography>
              {sessions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No sessions found</Typography>
              ) : (
                <List dense>
                  {sessions.slice(0, 10).map((session) => (
                    <ListItem key={session.id} disablePadding sx={{ py: 1 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: session.status === 'active' ? 'success.light' : 'grey.light', color: session.status === 'active' ? 'success.contrastText' : 'grey.contrastText' }}>
                          {session.status === 'active' ? <CheckCircleIcon fontSize="small" /> : <HistoryIcon fontSize="small" />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={session.username}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="caption">
                              {format(parseISO(session.loginTime), 'MMM d, yyyy HH:mm')}
                            </Typography>
                            {session.logoutTime && (
                              <Typography variant="caption" color="text.secondary">
                                → {format(parseISO(session.logoutTime), 'HH:mm')}
                              </Typography>
                            )}
                            <Chip
                              label={session.status === 'active' ? 'Active' : 'Ended'}
                              size="small"
                              color={session.status === 'active' ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed views */}
      <Card>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Activity Timeline" icon={<TimelineIcon />} />
          <Tab label="Sessions" icon={<HistoryIcon />} />
          <Tab label="Screenshots" icon={<PhotoLibraryIcon />} />
          <Tab label="Alerts" icon={<BugReportIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            // Activity Timeline
            <Box>
              {activities.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No activities recorded
                </Typography>
              ) : (
                <Timeline>
                  {activities.slice(0, 50).map((activity, index) => (
                    <TimelineItem key={activity.id}>
                      <TimelineOppositeContent>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot
                          color={riskLevelConfig[activity.riskLevel].color as any}
                          variant="filled"
                        >
                          {activityTypeIcons[activity.activityType] || <InfoIcon fontSize="small" />}
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {activity.activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {activity.details}
                            </Typography>
                            {activity.screenshotId && (
                              <Button size="small" startIcon={<VisibilityIcon fontSize="small" />} onClick={() => { /* view screenshot */ }}>
                                View Screenshot
                              </Button>
                            )}
                          </Box>
                          <Chip
                            icon={riskLevelConfig[activity.riskLevel].icon}
                            label={riskLevelConfig[activity.riskLevel].label}
                            color={riskLevelConfig[activity.riskLevel].color as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            // Sessions Table
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Login Time</TableCell>
                    <TableCell>Logout Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risk Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} hover onClick={() => navigate(`/users/${session.userId}`)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            {session.username.charAt(0).toUpperCase()}
                          </Avatar>
                          {session.username}
                        </Box>
                      </TableCell>
                      <TableCell>{format(parseISO(session.loginTime), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                      <TableCell>{session.logoutTime ? format(parseISO(session.logoutTime), 'MMM d, yyyy HH:mm:ss') : 'Active'}</TableCell>
                      <TableCell>{session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : 'Active'}</TableCell>
                      <TableCell>
                        <Chip
                          label={session.status === 'active' ? 'Active' : 'Ended'}
                          size="small"
                          color={session.status === 'active' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.riskScore.toString()}
                          size="small"
                          color={session.riskScore > 50 ? 'error' : session.riskScore > 20 ? 'warning' : 'success'}
                          variant="filled"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 2 && (
            // Screenshots Grid
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {screenshots.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                  No screenshots captured
                </Typography>
              ) : (
                screenshots.slice(0, 20).map((screenshot) => (
                  <Card key={screenshot.id} sx={{ width: 200, cursor: 'pointer' }} onClick={() => handleViewScreenshot(screenshot)}>
                    <CardContent sx={{ p: 1 }}>
                      <Box
                        sx={{
                          width: '100%',
                          aspectRatio: '16/9',
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                        }}
                      >
                        {screenshot.thumbnailUrl ? (
                          <img src={screenshot.thumbnailUrl} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 1 }} />
                        ) : (
                          <PhotoCameraIcon fontSize="large" color="action" />
                        )}
                      </Box>
                      <Typography variant="caption" fontWeight={600} noWrap>{screenshot.triggerReason}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(parseISO(screenshot.timestamp), { addSuffix: true })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(screenshot.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}

          {activeTab === 3 && (
            // Alerts - would fetch from API
            <Typography variant="body2" color="text.secondary">Alerts tab - integrate with alerts API</Typography>
          )}
        </Box>
      </Card>

      {/* Screenshot Dialog */}
      <Dialog open={screenshotDialog.open} onClose={() => setScreenshotDialog({ open: false, screenshot: null })} maxWidth="lg" fullWidth>
        <DialogTitle>
          {screenshotDialog.screenshot?.triggerReason || 'Screenshot'}
          <IconButton onClick={() => setScreenshotDialog({ open: false, screenshot: null })} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <MoreVertIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {screenshotDialog.screenshot && (
            <Box sx={{ textAlign: 'center' }}>
              {screenshotDialog.screenshot.thumbnailUrl ? (
                <img src={screenshotDialog.screenshot.thumbnailUrl} alt="Screenshot" style={{ maxWidth: '100%', borderRadius: 1 }} />
              ) : (
                <Box sx={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#f5f5f5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhotoCameraIcon fontSize="large" color="action" />
                </Box>
              )}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  {format(parseISO(screenshotDialog.screenshot.timestamp), 'MMM d, yyyy HH:mm:ss')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(screenshotDialog.screenshot.fileSize / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreenshotDialog({ open: false, screenshot: null })}>Close</Button>
          <Button variant="contained" onClick={() => { /* download */ }}>Download</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkstationDetailPage;