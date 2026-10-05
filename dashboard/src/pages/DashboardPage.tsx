import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO } from 'date-fns';

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
}

interface DashboardStats {
  totalWorkstations: number;
  onlineWorkstations: number;
  offlineWorkstations: number;
  warningWorkstations: number;
  activeUsers: number;
  totalAlerts: number;
  criticalAlerts: number;
  screenshotsToday: number;
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

const DashboardPage: React.FC = () => {
  const { workstations: workstationsMap, alerts, connected, requestScreenshot, lockWorkstation, logoffUser } = useSocket();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'lastHeartbeat', sort: 'desc' });
  const [selectedWorkstation, setSelectedWorkstation] = useState<Workstation | null>(null);
  const [commandDialog, setCommandDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Convert Map to array and apply filters
  const workstationsArray = Array.from(workstationsMap.values());
  
  const filteredWorkstations = workstationsArray.filter(ws => {
    const matchesSearch = ws.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.ipAddress.includes(searchTerm) ||
      ws.currentUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.labLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ws.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || ws.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Sort workstations
  const sortedWorkstations = [...filteredWorkstations].sort((a, b) => {
    const field = sortModel.field;
    const direction = sortModel.sort === 'asc' ? 1 : -1;
    
    let aVal = a[field as keyof Workstation];
    let bVal = b[field as keyof Workstation];
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return -1 * direction;
    if (aVal > bVal) return 1 * direction;
    return 0;
  });

  const paginatedWorkstations = sortedWorkstations.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCommand = async (workstation: Workstation, action: string) => {
    setSelectedWorkstation(workstation);
    setCommandDialog({ open: true, action });
  };

  const executeCommand = async () => {
    if (!selectedWorkstation) return;
    
    try {
      switch (commandDialog.action) {
        case 'screenshot':
          await requestScreenshot(selectedWorkstation.id);
          break;
        case 'lock':
          await lockWorkstation(selectedWorkstation.id);
          break;
        case 'logoff':
          await logoffUser(selectedWorkstation.id);
          break;
      }
      setSnackbar({ open: true, message: `Command sent successfully`, severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Command failed', severity: 'error' });
    } finally {
      setCommandDialog({ open: false, action: '' });
      setSelectedWorkstation(null);
    }
  };

  const getRiskColor = (risk: string) => riskLevelConfig[risk as keyof typeof riskLevelConfig]?.color || 'default';
  const getStatusColor = (status: string) => statusConfig[status as keyof typeof statusConfig]?.color || 'default';

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
            Live Workstation Grid
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time monitoring of all connected workstations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to Excel">
            <IconButton onClick={() => { /* export logic */ }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Workstations</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats?.totalWorkstations || workstationsArray.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 48, height: 48 }}>
                  <DesktopMacIcon />
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
                  <Typography variant="caption" color="text.secondary">Online</Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats?.onlineWorkstations || workstationsArray.filter(w => w.status === 'online').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText', width: 48, height: 48 }}>
                  <CheckCircleIcon />
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
                  <Typography variant="caption" color="text.secondary">Active Alerts</Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {stats?.totalAlerts || alerts.filter(a => !a.resolved).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText', width: 48, height: 48 }}>
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
                  <Typography variant="caption" color="text.secondary">Critical Alerts</Typography>
                  <Typography variant="h4" fontWeight={700} color="error.dark">
                    {stats?.criticalAlerts || alerts.filter(a => a.severity === 'critical' && !a.resolved).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.dark', color: 'white', width: 48, height: 48 }}>
                  <WarningIcon />
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
                placeholder="Search workstations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="warning">Warning</option>
              </TextField>
              <TextField
                select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Risk Levels</option>
                <option value="normal">Normal</option>
                <option value="attention">Attention</option>
                <option value="alert">Alert</option>
              </TextField>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Showing {paginatedWorkstations.length} of {filteredWorkstations.length} workstations
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Workstations Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'hostname'}
                    direction={sortModel.field === 'hostname' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('hostname')}
                  >
                    Workstation
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'status'}
                    direction={sortModel.field === 'status' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'currentUser'}
                    direction={sortModel.field === 'currentUser' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('currentUser')}
                  >
                    Current User
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'activeWindow'}
                    direction={sortModel.field === 'activeWindow' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('activeWindow')}
                  >
                    Active Window
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'riskLevel'}
                    direction={sortModel.field === 'riskLevel' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('riskLevel')}
                  >
                    Risk Level
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'labLocation'}
                    direction={sortModel.field === 'labLocation' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('labLocation')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'lastHeartbeat'}
                    direction={sortModel.field === 'lastHeartbeat' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('lastHeartbeat')}
                  >
                    Last Seen
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedWorkstations.map((ws) => (
                <TableRow
                  key={ws.id}
                  hover
                  onClick={() => navigate(`/workstations/${ws.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 36, height: 36 }}>
                        <DesktopMacIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{ws.hostname}</Typography>
                        <Typography variant="caption" color="text.secondary">{ws.ipAddress}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusConfig[ws.status].icon}
                      label={statusConfig[ws.status].label}
                      color={statusConfig[ws.status].color as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {ws.currentUser ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {ws.currentUser.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{ws.currentUser}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No user logged in</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {ws.activeWindow ? (
                      <Typography variant="body2" noWrap title={ws.activeWindow}>
                        {ws.activeWindow}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Desktop</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={riskLevelConfig[ws.riskLevel].icon}
                      label={riskLevelConfig[ws.riskLevel].label}
                      color={riskLevelConfig[ws.riskLevel].color as any}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ws.labLocation || 'Unknown'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {ws.lastHeartbeat ? formatDistanceToNow(parseISO(ws.lastHeartbeat), { addSuffix: true }) : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/workstations/${ws.id}`); }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Request Screenshot">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCommand(ws, 'screenshot'); }}>
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {ws.status === 'online' && ws.currentUser && (
                      <>
                        <Tooltip title="Lock Workstation">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCommand(ws, 'lock'); }} color="warning">
                            <LockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Logoff User">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCommand(ws, 'logoff'); }} color="error">
                            <ExitToAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedWorkstations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No workstations found matching criteria</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredWorkstations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Card>

      {/* Command Confirmation Dialog */}
      <Dialog open={commandDialog.open} onClose={() => setCommandDialog({ open: false, action: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {commandDialog.action === 'screenshot' && 'Request Screenshot'}
          {commandDialog.action === 'lock' && 'Lock Workstation'}
          {commandDialog.action === 'logoff' && 'Logoff User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {commandDialog.action === 'screenshot' ? 'request a screenshot from' : commandDialog.action === 'lock' ? 'lock' : 'log off user from'} 
            <strong>{selectedWorkstation?.hostname}</strong>?
          </Typography>
          {commandDialog.action === 'logoff' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will forcefully log off the current user. Any unsaved work will be lost.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommandDialog({ open: false, action: '' })}>Cancel</Button>
          <Button 
            variant="contained" 
            color={commandDialog.action === 'logoff' ? 'error' : 'primary'}
            onClick={executeCommand}
            disabled={!selectedWorkstation}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default DashboardPage;