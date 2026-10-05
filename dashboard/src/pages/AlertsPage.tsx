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
  Badge,
  Popover,
  MenuItem,
} from '@mui/material';
import {
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
  Visibility,
  Check,
  Close,
  Flag,
  PriorityHigh,
  Notifications,
  ExpandMore,
  ExpandLess,
  Person,
  BugReport,
  History,
  Assignment,
  Verified,
  Cancel,
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface Alert {
  id: string;
  workstationId: string;
  workstationHostname: string;
  userId: string;
  username: string;
  studentId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  screenshotId?: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

const alertTypeLabels: Record<string, string> = {
  keyword_match: 'Keyword Match',
  blocked_url: 'Blocked URL Access',
  unauthorized_app: 'Unauthorized Application',
  usb_connect: 'USB Device Connected',
  failed_login: 'Failed Login Attempts',
  time_change: 'System Time Changed',
  process_injection: 'Process Injection Attempt',
  suspicious_network: 'Suspicious Network Activity',
  risk_threshold: 'Risk Threshold Exceeded',
  service_stopped: 'Monitoring Service Stopped',
  tamper_attempt: 'Tampering Attempt',
};

const alertTypeIcons: Record<string, React.ReactNode> = {
  keyword_match: <BugReportIcon fontSize="small" />,
  blocked_url: <WebIcon fontSize="small" />,
  unauthorized_app: <TerminalIcon fontSize="small" />,
  usb_connect: <UsbIcon fontSize="small" />,
  failed_login: <LockIcon fontSize="small" />,
  time_change: <TimerIcon fontSize="small" />,
  process_injection: <BugReportIcon fontSize="small" />,
  suspicious_network: <SmartphoneIcon fontSize="small" />,
  risk_threshold: <AssessmentIcon fontSize="small" />,
  service_stopped: <ErrorIcon fontSize="small" />,
  tamper_attempt: <WarningIcon fontSize="small" />,
};

const severityConfig = {
  low: { color: 'success', label: 'Low', icon: <CheckCircleIcon fontSize="small" /> },
  medium: { color: 'warning', label: 'Medium', icon: <WarningIcon fontSize="small" /> },
  high: { color: 'error', label: 'High', icon: <ErrorIcon fontSize="small" /> },
  critical: { color: 'error', label: 'Critical', icon: <PriorityHighIcon fontSize="small" /> },
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [workstationFilter, setWorkstationFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'timestamp', sort: 'desc' });
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuAlert, setActionMenuAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await api.getAlerts({ 
          search: searchTerm, 
          severity: severityFilter !== 'all' ? severityFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          workstationId: workstationFilter !== 'all' ? workstationFilter : undefined,
          page: page + 1, 
          limit: rowsPerPage 
        });
        setAlerts(response.data.alerts || response.data);
        setTotalCount(response.data.total || response.data.length);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
        setSnackbar({ open: true, message: 'Failed to load alerts', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [searchTerm, severityFilter, statusFilter, typeFilter, workstationFilter, page, rowsPerPage]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, alert: Alert) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuAlert(alert);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuAlert(null);
  };

  const handleAcknowledge = async (alert: Alert) => {
    try {
      await api.acknowledgeAlert(alert.id);
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged: true, acknowledgedBy: 'Current Admin', acknowledgedAt: new Date().toISOString() } : a));
      setSnackbar({ open: true, message: 'Alert acknowledged', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to acknowledge alert', severity: 'error' });
    }
    handleActionMenuClose();
  };

  const handleResolve = async (alert: Alert) => {
    try {
      await api.resolveAlert(alert.id);
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, resolved: true, resolvedBy: 'Current Admin', resolvedAt: new Date().toISOString() } : a));
      setSnackbar({ open: true, message: 'Alert resolved', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to resolve alert', severity: 'error' });
    }
    handleActionMenuClose();
  };

  const handleUnacknowledge = async (alert: Alert) => {
    try {
      await api.unacknowledgeAlert(alert.id);
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged: false, acknowledgedBy: undefined, acknowledgedAt: undefined } : a));
      setSnackbar({ open: true, message: 'Alert unacknowledged', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to unacknowledge alert', severity: 'error' });
    }
    handleActionMenuClose();
  };

  const getStatusChip = (alert: Alert) => {
    if (alert.resolved) {
      return <Chip label="Resolved" size="small" color="success" variant="filled" icon={<CheckIcon fontSize="small" />} />;
    }
    if (alert.acknowledged) {
      return <Chip label="Acknowledged" size="small" color="info" variant="filled" icon={<AssignmentIcon fontSize="small" />} />;
    }
    return <Chip label="New" size="small" color="warning" variant="filled" icon={<FlagIcon fontSize="small" />} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged && !a.resolved).length;
  const acknowledgedCount = alerts.filter(a => a.acknowledged && !a.resolved).length;
  const resolvedCount = alerts.filter(a => a.resolved).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Alert Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time feed of flagged activities requiring attention
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
                  <Typography variant="caption" color="text.secondary">Total Alerts</Typography>
                  <Typography variant="h5" fontWeight={700}>{totalCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <NotificationsIcon />
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
                  <Typography variant="caption" color="text.secondary">New Alerts</Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {unacknowledgedCount}
                    <Badge badgeContent={unacknowledgedCount} color="error" size="small" sx={{ ml: 1 }} />
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <FlagIcon />
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
                  <Typography variant="caption" color="text.secondary">Acknowledged</Typography>
                  <Typography variant="h5" fontWeight={700} color="info.main">{acknowledgedCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <AssignmentIcon />
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
                  <Typography variant="caption" color="text.secondary">Critical</Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">{criticalCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <PriorityHighIcon />
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
                placeholder="Search alerts (description, user, workstation, type)..."
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
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 140 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </TextField>
              <TextField
                select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 140 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </TextField>
              <TextField
                select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 200 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Types</option>
                <option value="keyword_match">Keyword Match</option>
                <option value="blocked_url">Blocked URL</option>
                <option value="unauthorized_app">Unauthorized App</option>
                <option value="usb_connect">USB Connected</option>
                <option value="failed_login">Failed Login</option>
                <option value="time_change">Time Change</option>
                <option value="process_injection">Process Injection</option>
                <option value="suspicious_network">Suspicious Network</option>
                <option value="risk_threshold">Risk Threshold</option>
                <option value="service_stopped">Service Stopped</option>
                <option value="tamper_attempt">Tamper Attempt</option>
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
              </TextField>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Showing {alerts.length} of {totalCount} alerts
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts Table */}
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
                <TableCell>Severity</TableCell>
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
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => {
                const severity = severityConfig[alert.severity];
                const typeIcon = alertTypeIcons[alert.alertType] || <BugReportIcon fontSize="small" />;
                const typeLabel = alertTypeLabels[alert.alertType] || alert.alertType;
                
                return (
                  <TableRow
                    key={alert.id}
                    hover
                    onClick={() => handleRowClick(alert)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: !alert.acknowledged && !alert.resolved ? 'rgba(255, 193, 7, 0.05)' : 'transparent',
                      fontWeight: !alert.acknowledged && !alert.resolved ? 600 : 400,
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(parseISO(alert.timestamp), 'MMM d, HH:mm:ss')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: `${severity.color}.light`, color: `${severity.color}.main` }}>
                          {severity.icon}
                        </Avatar>
                        <Chip
                          label={severity.label}
                          size="small"
                          color={severity.color as any}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {alert.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{alert.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{alert.studentId}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <DesktopMacIcon fontSize="small" />
                        </Avatar>
                        {alert.workstationHostname}
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
                        {alert.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(alert)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick(alert); }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {alert.screenshotId && (
                        <Tooltip title="View Screenshot">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* view screenshot */ }}>
                            <PictureInPictureIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="More Actions">
                        <IconButton size="small" onClick={(e) => handleActionMenuOpen(e, alert)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">No alerts found</Typography>
                      <Typography variant="body2" color="text.secondary">Try adjusting your filters or search terms</Typography>
                    </Box>
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

      {/* Action Menu */}
      <Popover
        open={Boolean(actionMenuAnchor)}
        anchorEl={actionMenuAnchor}
        onClose={handleActionMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actionMenuAlert && (
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
              {alertTypeLabels[actionMenuAlert.alertType] || actionMenuAlert.alertType}
            </Typography>
            <Divider />
            {!actionMenuAlert.acknowledged && !actionMenuAlert.resolved && (
              <MenuItem onClick={() => handleAcknowledge(actionMenuAlert)}>
                <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Acknowledge" />
              </MenuItem>
            )}
            {!actionMenuAlert.resolved && (
              <MenuItem onClick={() => handleResolve(actionMenuAlert)}>
                <ListItemIcon><VerifiedIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Resolve" />
              </MenuItem>
            )}
            {actionMenuAlert.acknowledged && !actionMenuAlert.resolved && (
              <MenuItem onClick={() => handleUnacknowledge(actionMenuAlert)}>
                <ListItemIcon><CancelIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Unacknowledge" />
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={() => { handleRowClick(actionMenuAlert); handleActionMenuClose(); }}>
              <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="View Details" />
            </MenuItem>
            {actionMenuAlert.screenshotId && (
              <MenuItem onClick={() => { /* view screenshot */ handleActionMenuClose(); }}>
                <ListItemIcon><PictureInPictureIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="View Screenshot" />
              </MenuItem>
            )}
          </Box>
        )}
      </Popover>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedAlert ? `Alert Details - ${alertTypeLabels[selectedAlert.alertType] || selectedAlert.alertType}` : 'Alert Details'}</DialogTitle>
        <DialogContent dividers>
          {selectedAlert && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Severity</Typography>
                  <Chip label={severityConfig[selectedAlert.severity].label} color={severityConfig[selectedAlert.severity].color as any} size="small" variant="filled" icon={severityConfig[selectedAlert.severity].icon} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  {getStatusChip(selectedAlert)}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">User</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedAlert.username} ({selectedAlert.studentId})</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Workstation</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedAlert.workstationHostname}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Alert Type</Typography>
                  <Typography variant="body1">{alertTypeLabels[selectedAlert.alertType] || selectedAlert.alertType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{format(parseISO(selectedAlert.timestamp), 'MMMM d, yyyy HH:mm:ss')}</Typography>
                </Grid>
                {selectedAlert.acknowledged && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Acknowledged By</Typography>
                    <Typography variant="body1">{selectedAlert.acknowledgedBy}</Typography>
                  </Grid>
                )}
                {selectedAlert.acknowledgedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Acknowledged At</Typography>
                    <Typography variant="body1">{format(parseISO(selectedAlert.acknowledgedAt), 'MMMM d, yyyy HH:mm:ss')}</Typography>
                  </Grid>
                )}
                {selectedAlert.resolved && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Resolved By</Typography>
                    <Typography variant="body1">{selectedAlert.resolvedBy}</Typography>
                  </Grid>
                )}
                {selectedAlert.resolvedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Resolved At</Typography>
                    <Typography variant="body1">{format(parseISO(selectedAlert.resolvedAt), 'MMMM d, yyyy HH:mm:ss')}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{selectedAlert.description}</Typography>
                </Grid>
                {selectedAlert.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Metadata</Typography>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: 200, overflow: 'auto', mt: 1 }}>
                      <pre>{JSON.stringify(selectedAlert.metadata, null, 2)}</pre>
                    </Box>
                  </Grid>
                )}
                {selectedAlert.screenshotId && (
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
          {selectedAlert && !selectedAlert.acknowledged && !selectedAlert.resolved && (
            <Button variant="contained" color="warning" startIcon={<CheckIcon />} onClick={() => handleAcknowledge(selectedAlert)}>
              Acknowledge
            </Button>
          )}
          {selectedAlert && !selectedAlert.resolved && (
            <Button variant="contained" color="success" startIcon={<VerifiedIcon />} onClick={() => handleResolve(selectedAlert)}>
              Resolve
            </Button>
          )}
          {selectedAlert && selectedAlert.acknowledged && !selectedAlert.resolved && (
            <Button variant="outlined" color="warning" startIcon={<CancelIcon />} onClick={() => handleUnacknowledge(selectedAlert)}>
              Unacknowledge
            </Button>
          )}
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

// Missing icons
const CheckCircleIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const WarningIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;
const ErrorIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const PriorityHighIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const NotificationsIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>;
const FlagIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6zM12 3c1.66 0 3 1.34 3 3V5h-2V6H9V5H7V6c0-1.66 1.34-3 3-3zm5 15H7v-2h10v2z"/></svg>;
const AssignmentIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>;
const VerifiedIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const CancelIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>;
const PictureInPictureIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>;
const VisibilityIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const MoreVertIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;
const RefreshIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const DesktopMacIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>;
const TimerIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>;
const AssessmentIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const BugReportIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.14 12.97c.39-.72.6-1.5.6-2.32 0-2.61-2.11-4.72-4.72-4.72S7.88 8.04 7.88 10.65c0 .82.21 1.6.6 2.32.09.19.09.41.09.63 0 3.87-3.13 7-7 7s-7-3.13-7-7c0-.22.09-.44.09-.63.39-.72.6-1.5.6-2.32 0-3.87 3.13-7 7-7s7 3.13 7 7c0 .22-.09.44-.09.63zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>;
const WebIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>;
const TerminalIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4 17h16v-2H4v2zm0-5h16v-2H4v2zm0-5h16V5H4v2z"/></svg>;
const UsbIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>;
const SmartphoneIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>;
const ExpandMoreIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg>;
const ExpandLessIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>;

export default AlertsPage;