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
  Pagination,
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
  Search,
  PersonAdd,
  Assessment,
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
}

const riskLevelConfig = {
  normal: { color: 'success', label: 'Low Risk' },
  attention: { color: 'warning', label: 'Medium Risk' },
  alert: { color: 'error', label: 'High Risk' },
};

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'fullName', sort: 'asc' });
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.getUsers({ search: searchTerm, page: page + 1, limit: rowsPerPage });
        setUsers(response.data.users || response.data);
        setTotalCount(response.data.total || response.data.length);
        
        // Extract unique departments
        const depts = [...new Set((response.data.users || response.data).map((u: User) => u.department).filter(Boolean))];
        setDepartments(depts);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [searchTerm, departmentFilter, riskFilter, page, rowsPerPage]);

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
            Users & Students
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor student activity and risk profiles across all workstations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Add User">
            <IconButton>
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
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
                  <Typography variant="caption" color="text.secondary">Total Users</Typography>
                  <Typography variant="h5" fontWeight={700}>{totalCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
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
                  <Typography variant="caption" color="text.secondary">High Risk</Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {users.filter(u => u.riskScore > 50).length}
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
                  <Typography variant="caption" color="text.secondary">Medium Risk</Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {users.filter(u => u.riskScore > 20 && u.riskScore <= 50).length}
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
                  <Typography variant="caption" color="text.secondary">Low Risk</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {users.filter(u => u.riskScore <= 20).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CheckCircleIcon />
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
            <Box sx={{ flex: 1, minWidth: 250, position: 'relative' }}>
              <InputAdornment position="start">
                <SearchIcon color="action" sx={{ mr: 1 }} />
              </InputAdornment>
              <TextField
                placeholder="Search users (name, ID, email, department)..."
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
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 180 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
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
                <option value="low">Low Risk (0-20)</option>
                <option value="medium">Medium Risk (21-50)</option>
                <option value="high">High Risk (51+)</option>
              </TextField>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Showing {users.length} of {totalCount} users
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'fullName'}
                    direction={sortModel.field === 'fullName' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('fullName')}
                  >
                    Student
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
                    active={sortModel.field === 'department'}
                    direction={sortModel.field === 'department' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('department')}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'email'}
                    direction={sortModel.field === 'email' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'totalSessions'}
                    direction={sortModel.field === 'totalSessions' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('totalSessions')}
                  >
                    Sessions
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'lastLogin'}
                    direction={sortModel.field === 'lastLogin' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('lastLogin')}
                  >
                    Last Login
                  </TableSortLabel>
                </TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const riskConfig = getRiskConfig(user.riskScore);
                return (
                  <TableRow
                    key={user.id}
                    hover
                    onClick={() => navigate(`/users/${user.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText', width: 36, height: 36 }}>
                          {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{user.fullName || user.username}</Typography>
                          <Typography variant="caption" color="text.secondary">@{user.username}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{user.studentId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.department || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.totalSessions}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastLogin ? formatDistanceToNow(parseISO(user.lastLogin), { addSuffix: true }) : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.riskScore.toString()}
                        size="small"
                        color={riskConfig.color as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status === 'active' ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/users/${user.id}`); }}>
                          <VisibilityIcon fontSize="small" />
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
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found matching criteria</Typography>
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

export default UsersPage;