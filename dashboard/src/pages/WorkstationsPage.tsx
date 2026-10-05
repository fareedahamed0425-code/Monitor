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

const WorkstationsPage: React.FC = () => {
  const { workstations: workstationsMap, connected } = useSocket();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'hostname', sort: 'asc' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const workstationsArray = Array.from(workstationsMap.values());
  
  const filteredWorkstations = workstationsArray.filter(ws => {
    const matchesSearch = ws.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.ipAddress.includes(searchTerm) ||
      ws.macAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.currentUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.labLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ws.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || ws.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

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

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getRiskColor = (risk: string) => riskLevelConfig[risk as keyof typeof riskLevelConfig]?.color || 'default';
  const getStatusColor = (status: string) => statusConfig[status as keyof typeof statusConfig]?.color || 'default';

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Workstations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and monitor all registered workstations
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

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Registered</Typography>
                  <Typography variant="h5" fontWeight={700}>{workstationsArray.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
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
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {workstationsArray.filter(w => w.status === 'online').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
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
                  <Typography variant="caption" color="text.secondary">Needs Attention</Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {workstationsArray.filter(w => w.riskLevel === 'attention' || w.riskLevel === 'alert').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
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
                  <Typography variant="caption" color="text.secondary">Offline</Typography>
                  <Typography variant="h5" fontWeight={700} color="text.disabled">
                    {workstationsArray.filter(w => w.status === 'offline').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'grey.light', color: 'grey.contrastText' }}>
                  <DesktopMacIcon />
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
                placeholder="Search workstations (hostname, IP, MAC, user, location)..."
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
              {filteredWorkstations.length} of {workstationsArray.length} workstations
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Workstations Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 700 }}>
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
                    active={sortModel.field === 'ipAddress'}
                    direction={sortModel.field === 'ipAddress' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('ipAddress')}
                  >
                    IP Address
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'macAddress'}
                    direction={sortModel.field === 'macAddress' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('macAddress')}
                  >
                    MAC Address
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
                    active={sortModel.field === 'osVersion'}
                    direction={sortModel.field === 'osVersion' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('osVersion')}
                  >
                    OS Version
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'lastHeartbeat'}
                    direction={sortModel.field === 'lastHeartbeat' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('lastHeartbeat')}
                  >
                    Last Heartbeat
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
                        {ws.cpuUsage !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            CPU: {ws.cpuUsage}% | RAM: {ws.memoryUsage}% | Disk: {ws.diskUsage}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">{ws.ipAddress}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">{ws.macAddress}</Typography>
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
                      <Typography variant="body2" color="text.secondary">No user</Typography>
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
                    <Typography variant="body2">{ws.osVersion || 'Unknown'}</Typography>
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
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* request screenshot */ }}>
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {ws.status === 'online' && ws.currentUser && (
                      <>
                        <Tooltip title="Lock Workstation">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* lock */ }} color="warning">
                            <LockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Logoff User">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* logoff */ }} color="error">
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
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
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

export default WorkstationsPage;