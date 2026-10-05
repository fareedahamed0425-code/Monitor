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
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface Session {
  id: string;
  workstationId: string;
  workstationHostname: string;
  userId: string;
  username: string;
  studentId: string;
  loginTime: string;
  logoutTime?: string;
  duration?: number;
  status: 'active' | 'ended';
  riskScore: number;
}

const riskLevelConfig = {
  normal: { color: 'success', label: 'Low' },
  attention: { color: 'warning', label: 'Medium' },
  alert: { color: 'error', label: 'High' },
};

const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'loginTime', sort: 'desc' });
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const response = await api.getSessions({ 
          search: searchTerm, 
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: page + 1, 
          limit: rowsPerPage 
        });
        setSessions(response.data.sessions || response.data);
        setTotalCount(response.data.total || response.data.length);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setSnackbar({ open: true, message: 'Failed to load sessions', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [searchTerm, statusFilter, riskFilter, page, rowsPerPage]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getRiskConfig = (score: number) => {
    if (score > 50) return riskLevelConfig.alert;
    if (score > 20) return riskLevelConfig.attention;
    return riskLevelConfig.normal;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Active';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
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
            Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all user sessions across workstations
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
                  <Typography variant="caption" color="text.secondary">Total Sessions</Typography>
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
                  <Typography variant="caption" color="text.secondary">Active Sessions</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {sessions.filter(s => s.status === 'active').length}
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
                  <Typography variant="caption" color="text.secondary">High Risk Sessions</Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {sessions.filter(s => s.riskScore > 50).length}
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
                  <Typography variant="caption" color="text.secondary">Avg Duration</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {sessions.length > 0 
                      ? formatDuration(Math.round(sessions.reduce((a, b) => a + (b.duration || 0), 0) / sessions.length))
                      : 'N/A'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <TimerIcon />
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
                placeholder="Search sessions (user, workstation, student ID)..."
                value={searchTerm}
                onChange={handleSearch}
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
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
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
                <option value="low">Low (0-20)</option>
                <option value="medium">Medium (21-50)</option>
                <option value="high">High (51+)</option>
              </TextField>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Showing {sessions.length} of {totalCount} sessions
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
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
                    active={sortModel.field === 'studentId'}
                    direction={sortModel.field === 'studentId' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('studentId')}
                  >
                    Student ID
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
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'loginTime'}
                    direction={sortModel.field === 'loginTime' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('loginTime')}
                  >
                    Login Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'logoutTime'}
                    direction={sortModel.field === 'logoutTime' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('logoutTime')}
                  >
                    Logout Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'duration'}
                    direction={sortModel.field === 'duration' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('duration')}
                  >
                    Duration
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
                <TableCell>Risk Score</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => {
                const riskConfig = getRiskConfig(session.riskScore);
                return (
                  <TableRow
                    key={session.id}
                    hover
                    onClick={() => navigate(`/users/${session.userId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {session.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{session.username}</Typography>
                          <Typography variant="caption" color="text.secondary">@{session.username}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{session.studentId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <DesktopMacIcon fontSize="small" />
                        </Avatar>
                        {session.workstationHostname}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{format(parseISO(session.loginTime), 'MMM d, yyyy HH:mm:ss')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={session.logoutTime ? 'inherit' : 'text.secondary'}>
                        {session.logoutTime ? format(parseISO(session.logoutTime), 'MMM d, yyyy HH:mm:ss') : 'Active'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDuration(session.duration)}</Typography>
                    </TableCell>
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
                        color={riskConfig.color as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View User">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/users/${session.userId}`); }}>
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Workstation">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/workstations/${session.workstationId}`); }}>
                          <DesktopMacIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Risk Assessment">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* view risk */ }}>
                          <AssessmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No sessions found matching criteria</Typography>
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

export default SessionsPage;