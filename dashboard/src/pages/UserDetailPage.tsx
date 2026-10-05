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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  LinearProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Person,
  Visibility,
  Warning,
  Error,
  CheckCircle,
  Refresh,
  FilterList,
  Download,
  MoreVert,
  ArrowBack,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  TimelineDot,
  History,
  PhotoLibrary,
  BugReport,
  Assessment,
  TrendingUp,
  School,
  Lock,
  ExitToApp,
  PhotoCamera,
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface User {
  id: string;
  studentId: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  role: string;
  lastLogin?: string;
  totalSessions: number;
  totalDuration: number;
  riskScore: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Session {
  id: string;
  workstationId: string;
  workstationHostname: string;
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
  workstationId: string;
  workstationHostname: string;
  screenshotId?: string;
}

interface Screenshot {
  id: string;
  timestamp: string;
  triggerReason: string;
  fileSize: number;
  workstationId: string;
  workstationHostname: string;
  thumbnailUrl?: string;
}

const riskLevelConfig = {
  normal: { color: 'success', label: 'Normal', icon: <CheckCircleIcon fontSize="small" /> },
  attention: { color: 'warning', label: 'Attention', icon: <WarningIcon fontSize="small" color="warning" /> },
  alert: { color: 'error', label: 'Alert', icon: <ErrorIcon fontSize="small" color="error" /> },
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

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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
        const [userData, sessionsData, activitiesData, screenshotsData] = await Promise.all([
          api.getUser(id!),
          api.getUserSessions(id!, { limit: 50 }),
          api.getUserActivities(id!, { limit: 100 }),
          api.getScreenshots({ userId: id!, limit: 50 }),
        ]);

        setUser(userData.data);
        setSessions(sessionsData.data.sessions || sessionsData.data);
        setActivities(activitiesData.data.activities || activitiesData.data);
        setScreenshots(screenshotsData.data.screenshots || screenshotsData.data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        setSnackbar({ open: true, message: 'Failed to load user details', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setScreenshotDialog({ open: true, screenshot });
  };

  const getRiskConfig = (score: number) => {
    if (score > 50) return riskLevelConfig.alert;
    if (score > 20) return riskLevelConfig.attention;
    return riskLevelConfig.normal;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography variant="h6" color="text.secondary">User not found</Typography>
      </Box>
    );
  }

  const riskConfig = getRiskConfig(user.riskScore);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/users')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h4" fontWeight={700}>{user.fullName || user.username}</Typography>
              <Chip
                label={user.status === 'active' ? 'Active' : 'Inactive'}
                size="small"
                color={user.status === 'active' ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              @{user.username} • {user.studentId} • {user.department || 'No department'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                  <Typography variant="h4" fontWeight={700} color={riskConfig.color}>
                    {user.riskScore}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${riskConfig.color}.light`, color: `${riskConfig.color}.contrastText` }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(user.riskScore, 100)} color={riskConfig.color as any} size="thin" sx={{ mt: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {riskConfig.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Sessions</Typography>
                  <Typography variant="h5" fontWeight={700}>{user.totalSessions}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <HistoryIcon />
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
                  <Typography variant="caption" color="text.secondary">Total Duration</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {Math.floor(user.totalDuration / 3600)}h {Math.floor((user.totalDuration % 3600) / 60)}m
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <TrendingUpIcon />
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
                  <Typography variant="caption" color="text.secondary">Last Login</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.lastLogin ? formatDistanceToNow(parseISO(user.lastLogin), { addSuffix: true }) : 'Never'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  <LockIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Profile Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Full Name</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.fullName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Username</Typography>
                  <Typography variant="body2" fontWeight={500}>@{user.username}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Student ID</Typography>
                  <Typography variant="body2" fontWeight={500} fontFamily="monospace">{user.studentId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.department || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.role}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Account Created</Typography>
                  <Typography variant="body2" fontWeight={500}>{format(parseISO(user.createdAt), 'MMM d, yyyy')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Risk Assessment</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Overall Risk Score</Typography>
                    <Typography variant="body2" fontWeight={600} color={riskConfig.color}>{user.riskScore}/100</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(user.riskScore, 100)} color={riskConfig.color as any} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{riskConfig.label}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" fontWeight={500} gutterBottom>Risk Factors</Typography>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
                      <ListItemText primary="No critical alerts in last 30 days" secondary="Low risk indicator" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon><WarningIcon fontSize="small" color="warning" /></ListItemIcon>
                      <ListItemText primary="Multiple attention-level activities" secondary="Monitor for escalation" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon><InfoIcon fontSize="small" color="info" /></ListItemIcon>
                      <ListItemText primary="Regular lab usage pattern" secondary="Normal student behavior" />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
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
                  {activities.slice(0, 50).map((activity) => (
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
                            <Typography variant="caption" color="text.secondary">
                              On {activity.workstationHostname}
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
                    <TableCell>Workstation</TableCell>
                    <TableCell>Login Time</TableCell>
                    <TableCell>Logout Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risk Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} hover onClick={() => navigate(`/workstations/${session.workstationId}`)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <DesktopMacIcon fontSize="small" />
                          </Avatar>
                          {session.workstationHostname}
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
                        On {screenshot.workstationHostname}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}

          {activeTab === 3 && (
            <Typography variant="body2" color="text.secondary">Alerts tab - integrate with alerts API for user-specific alerts</Typography>
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
                <Typography variant="body2" color="text.secondary">
                  {screenshotDialog.screenshot.workstationHostname}
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

export default UserDetailPage;