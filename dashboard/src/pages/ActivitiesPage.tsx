import React, { useEffect, useState } from 'react';
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
  TableSortLabel,
  InputAdornment,
  TextField,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
} from '@mui/material';
import {
  History,
  Person,
  Visibility,
  Warning,
  Error,
  CheckCircle,
  Refresh,
  FilterList,
  Download,
  MoreVert,
  Search,
  DesktopMac,
  Timer,
  Assessment,
  Web,
  Folder,
  Usb,
  Lock,
  Unlock,
  BugReport,
  Terminal,
  Smartphone,
  PictureInPicture,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface Activity {
  id: string;
  sessionId: string;
  workstationId: string;
  workstationHostname: string;
  userId: string;
  username: string;
  studentId: string;
  timestamp: string;
  activityType: string;
  details: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  screenshotId?: string;
  metadata?: Record<string, any>;
}

const activityTypeIcons: Record<string, React.ReactNode> = {
  window_change: <WebIcon fontSize="small" />,
  process_start: <TerminalIcon fontSize="small" />,
  process_end: <TerminalIcon fontSize="small" />,
  url_visit: <WebIcon fontSize="small" />,
  file_access: <FolderIcon fontSize="small" />,
  usb_connect: <UsbIcon fontSize="small" />,
  usb_disconnect: <UsbIcon fontSize="small" />,
  screen_lock: <LockIcon fontSize="small" />,
  screen_unlock: <UnlockIcon fontSize="small" />,
  screenshot: <PictureInPictureIcon fontSize="small" />,
  command_exec: <BugReportIcon fontSize="small" />,
  network_connection: <SmartphoneIcon fontSize="small" />,
};

const activityTypeLabels: Record<string, string> = {
  window_change: 'Window Change',
  process_start: 'Process Started',
  process_end: 'Process Ended',
  url_visit: 'URL Visited',
  file_access: 'File Access',
  usb_connect: 'USB Connected',
  usb_disconnect: 'USB Disconnected',
  screen_lock: 'Screen Locked',
  screen_unlock: 'Screen Unlocked',
  screenshot: 'Screenshot Captured',
  command_exec: 'Command Executed',
  network_connection: 'Network Connection',
};

const riskLevelConfig = {
  low: { color: 'success', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'error', label: 'High' },
};

const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [workstationFilter, setWorkstationFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'timestamp', sort: 'desc' });
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await api.getActivities({ 
          search: searchTerm, 
          type: typeFilter !== 'all' ? typeFilter : undefined,
          riskLevel: riskFilter !== 'all' ? riskFilter : undefined,
          workstationId: workstationFilter !== 'all' ? workstationFilter : undefined,
          userId: userFilter !== 'all' ? userFilter : undefined,
          page: page + 1, 
          limit: rowsPerPage 
        });
        setActivities(response.data.activities || response.data);
        setTotalCount(response.data.total || response.data.length);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setSnackbar({ open: true, message: 'Failed to load activities', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [searchTerm, typeFilter, riskFilter, workstationFilter, userFilter, page, rowsPerPage]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };

  const handleExpandClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatDetails = (activity: Activity) => {
    try {
      if (activity.metadata) {
        return JSON.stringify(activity.metadata, null, 2);
      }
      return activity.details;
    } catch {
      return activity.details;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Activity Log
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor all user activities across workstations in real-time
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Activities</Typography>
                  <Typography variant="h5" fontWeight={700}>{totalCount}</Typography>
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
                  <Typography variant="caption" color="text.secondary">High Risk</Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {activities.filter(a => a.riskLevel === 'high').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <ErrorIcon />
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
                  <Typography variant="caption" color="text.secondary">Screenshots</Typography>
                  <Typography variant="h5" fontWeight={700} color="info.main">
                    {activities.filter(a => a.screenshotId).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <PictureInPictureIcon />
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
                  <Typography variant="caption" color="text.secondary">Unique Users</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {new Set(activities.map(a => a.userId)).size}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                placeholder="Search activities (details, user, workstation)..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 180 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Types</option>
                <option value="window_change">Window Change</option>
                <option value="process_start">Process Started</option>
                <option value="process_end">Process Ended</option>
                <option value="url_visit">URL Visited</option>
                <option value="file_access">File Access</option>
                <option value="usb_connect">USB Connected</option>
                <option value="usb_disconnect">USB Disconnected</option>
                <option value="screen_lock">Screen Locked</option>
                <option value="screen_unlock">Screen Unlocked</option>
                <option value="screenshot">Screenshot Captured</option>
                <option value="command_exec">Command Executed</option>
                <option value="network_connection">Network Connection</option>
              </TextField>
              <TextField
                select
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </TextField>
              <TextField
                select
                value={workstationFilter}
                onChange={(e) => { setWorkstationFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 180 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Workstations</option>
                {/* Would populate from API */}
              </TextField>
              <TextField
                select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 180 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Users</option>
                {/* Would populate from API */}
              </TextField>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Showing {activities.length} of {totalCount} activities
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'timestamp'}
                    direction={sortModel.field === 'timestamp' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('timestamp')}
                  >
                    Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'username'}
                    direction={sortModel.field === 'username' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('username')}
                  >
                    User
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'workstationHostname'}
                    direction={sortModel.field === 'workstationHostname' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('workstationHostname')}
                  >
                    Workstation
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => {
                const riskConfig = riskLevelConfig[activity.riskLevel];
                const typeIcon = activityTypeIcons[activity.activityType] || <BugReportIcon fontSize="small" />;
                const typeLabel = activityTypeLabels[activity.activityType] || activity.activityType;
                const isExpanded = expandedRow === activity.id;
                
                return (
                  <React.Fragment key={activity.id}>
                    <TableRow
                      hover
                      onClick={() => handleRowClick(activity)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(parseISO(activity.timestamp), 'MMM d, HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            {activity.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{activity.username}</Typography>
                            <Typography variant="caption" color="text.secondary">{activity.studentId}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <DesktopMacIcon fontSize="small" />
                          </Avatar>
                          {activity.workstationHostname}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.200' }}>
                            {typeIcon}
                          </Avatar>
                          <Typography variant="body2">{typeLabel}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activity.details}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={riskConfig.label}
                          size="small"
                          color={riskConfig.color as any}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.riskScore.toString()}
                          size="small"
                          color={riskConfig.color as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick(activity); }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {activity.screenshotId && (
                          <Tooltip title="View Screenshot">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* view screenshot */ }}>
                              <PictureInPictureIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleExpandClick(activity.id, e); }}>
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Accordion expanded={isExpanded} onChange={() => handleExpandClick(activity.id, { stopPropagation: () => {} } as any)} disableGutters square>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="caption" color="text.secondary">Click to expand details</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: 300, overflow: 'auto' }}>
                              <pre>{formatDetails(activity)}</pre>
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No activities found matching criteria</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedActivity ? `Activity Details - ${activityTypeLabels[selectedActivity.activityType] || selectedActivity.activityType}` : 'Activity Details'}</DialogTitle>
        <DialogContent dividers>
          {selectedActivity && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">User</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedActivity.username} ({selectedActivity.studentId})</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Workstation</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedActivity.workstationHostname}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{format(parseISO(selectedActivity.timestamp), 'MMMM d, yyyy HH:mm:ss')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Activity Type</Typography>
                  <Typography variant="body1">{activityTypeLabels[selectedActivity.activityType] || selectedActivity.activityType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Risk Level</Typography>
                  <Chip label={riskLevelConfig[selectedActivity.riskLevel].label} color={riskLevelConfig[selectedActivity.riskLevel].color as any} size="small" variant="filled" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedActivity.riskScore}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Details</Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: 300, overflow: 'auto', mt: 1 }}>
                    <pre>{formatDetails(selectedActivity)}</pre>
                  </Box>
                </Grid>
                {selectedActivity.screenshotId && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Screenshot</Typography>
                    <Button variant="outlined" startIcon={<PictureInPictureIcon />} size="small">View Screenshot</Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
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

export default ActivitiesPage;