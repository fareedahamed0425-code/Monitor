import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  DatePicker,
  LocalizationProvider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  FormControlLabel,
  Switch,
  Slider,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Popover,
  Menu,
  MenuItem as MenuItemComponent,
  Skeleton,
  LinearProgress,
  Stack,
  Drawer,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
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
  Rule,
  Security,
  Web,
  Apps,
  Usb,
  Lock,
  History,
  BugReport,
  Smartphone,
  PictureInPicture,
  ExpandMore,
  ExpandLess,
  Save,
  Cancel,
  ContentCopy,
  CloudUpload,
  CloudDownload,
  Description,
  Build,
  Settings,
  Policy,
  Gavel,
  Shield,
  Block,
  Fingerprint,
  Verified,
  HighlightOff,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  ShowChart,
  CalendarMonth,
  DateRange,
  Print,
  PictureAsPdf,
  TableChart,
  Analytics,
  Insights,
  Leaderboard,
  QueryStats,
  Folder,
  Image,
  FileDownload,
  FileCopy,
  Archive,
  FolderOpen,
  PhotoLibrary,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  ChevronLeft,
  ChevronRight,
  Close,
  Info,
  Label,
  Tag,
  Flag,
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format, subDays, startOfDay, endOfDay } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';

interface Screenshot {
  id: string;
  workstationId: string;
  workstationHostname: string;
  sessionId: string;
  userId: string;
  username: string;
  studentId: string;
  timestamp: string;
  filePath: string;
  triggerReason: string;
  fileSize: number;
  width: number;
  height: number;
  thumbnailPath?: string;
  metadata: {
    activeWindow?: string;
    processName?: string;
    url?: string;
    riskScore?: number;
    alertId?: string;
  };
}

interface ScreenshotsResponse {
  screenshots: Screenshot[];
  total: number;
  page: number;
  pageSize: number;
}

const EvidenceVaultPage: React.FC = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'timestamp', sort: 'desc' });
  const [filters, setFilters] = useState({
    search: '',
    workstationId: '',
    userId: '',
    triggerReason: '',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    minRiskScore: 0,
    maxRiskScore: 100,
    hasAlert: false,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'zip' | 'individual'>('zip');
  const [downloadIncludeMetadata, setDownloadIncludeMetadata] = useState(true);
  const [workstations, setWorkstations] = useState<{ id: string; hostname: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; username: string; studentId: string }[]>([]);
  const [triggerReasons, setTriggerReasons] = useState<string[]>([]);

  const fetchScreenshots = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        sortBy: sortModel.field,
        sortOrder: sortModel.sort,
        search: filters.search || undefined,
        workstationId: filters.workstationId || undefined,
        userId: filters.userId || undefined,
        triggerReason: filters.triggerReason || undefined,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        minRiskScore: filters.minRiskScore,
        maxRiskScore: filters.maxRiskScore,
        hasAlert: filters.hasAlert,
      };
      const response = await api.getScreenshots(params);
      setScreenshots(response.data.screenshots);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch screenshots:', error);
      setSnackbar({ open: true, message: 'Failed to load screenshots', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortModel, filters]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [wsRes, usersRes, triggersRes] = await Promise.all([
        api.getWorkstations({ pageSize: 1000 }),
        api.getUsers({ pageSize: 1000 }),
        api.getTriggerReasons(),
      ]);
      setWorkstations(wsRes.data.workstations.map((w: any) => ({ id: w.id, hostname: w.hostname })));
      setUsers(usersRes.data.users.map((u: any) => ({ id: u.id, username: u.username, studentId: u.studentId })));
      setTriggerReasons(triggersRes.data);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedScreenshots(prev => selected ? [...prev, id] : prev.filter(s => s !== id));
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedScreenshots(screenshots.map(s => s.id));
    } else {
      setSelectedScreenshots([]);
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
    setZoom(1);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerIndex(0);
    setZoom(1);
  };

  const handleDownload = async () => {
    if (selectedScreenshots.length === 0) return;
    
    try {
      const response = await api.downloadScreenshots({
        screenshotIds: selectedScreenshots,
        format: downloadFormat,
        includeMetadata: downloadIncludeMetadata,
      });
      
      const blob = new Blob([response.data], { 
        type: downloadFormat === 'zip' ? 'application/zip' : 'application/octet-stream' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.${downloadFormat === 'zip' ? 'zip' : 'png'}`;
      a.click();
      URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: `${selectedScreenshots.length} screenshot(s) downloaded`, severity: 'success' });
      setDownloadDialogOpen(false);
      setSelectedScreenshots([]);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to download screenshots', severity: 'error' });
    }
  };

  const getTriggerReasonColor = (reason: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      'manual': 'primary',
      'keyword_match': 'error',
      'blocked_url': 'error',
      'unauthorized_software': 'warning',
      'usb_connected': 'info',
      'failed_login': 'warning',
      'time_change': 'error',
      'process_injection': 'error',
      'network_anomaly': 'warning',
      'scheduled': 'success',
      'admin_request': 'info',
    };
    return colors[reason] || 'default';
  };

  const getRiskColor = (score: number) => {
    if (score >= 50) return 'error';
    if (score >= 20) return 'warning';
    return 'success';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderGridView = () => (
    <Grid container spacing={2}>
      {screenshots.map((screenshot, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={screenshot.id}>
          <Card
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: selectedScreenshots.includes(screenshot.id) ? '2px solid' : '1px solid',
              borderColor: selectedScreenshots.includes(screenshot.id) ? 'primary.main' : 'divider',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onClick={() => openViewer(index)}
            onKeyDown={(e) => e.key === 'Enter' && openViewer(index)}
            tabIndex={0}
          >
            <Box sx={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
              <img
                src={`${api.defaults.baseURL}/api/screenshots/${screenshot.id}/thumbnail`}
                alt={`Screenshot ${screenshot.id}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'opacity 0.2s' }}
                loading="lazy"
              />
              <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 1 }}>
                <Chip
                  icon={<FlagIcon fontSize="small" />}
                  label={screenshot.triggerReason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  size="small"
                  color={getTriggerReasonColor(screenshot.triggerReason)}
                  variant="filled"
                  sx={{ fontSize: '0.65rem' }}
                />
                {screenshot.metadata.alertId && (
                  <Chip
                    icon={<ErrorIcon fontSize="small" />}
                    label="Alert"
                    size="small"
                    color="error"
                    variant="filled"
                    sx={{ fontSize: '0.65rem' }}
                  />
                )}
              </Box>
              <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                <Chip
                  icon={<AssessmentIcon fontSize="small" />}
                  label={`${screenshot.metadata.riskScore || 0}`}
                  size="small"
                  color={getRiskColor(screenshot.metadata.riskScore || 0)}
                  variant="filled"
                  sx={{ fontSize: '0.65rem' }}
                />
              </Box>
              {selectedScreenshots.includes(screenshot.id) && (
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', p: 0.5 }}>
                    <CheckCircleIcon fontSize="small" />
                  </Box>
                </Box>
              )}
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  {screenshot.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap overflow="hidden" textOverflow="ellipsis">
                    {screenshot.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {screenshot.studentId}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                {format(parseISO(screenshot.timestamp), 'MMM d, yyyy HH:mm:ss')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {screenshot.workstationHostname}
              </Typography>
              {screenshot.metadata.activeWindow && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                  {screenshot.metadata.activeWindow.length > 40 ? screenshot.metadata.activeWindow.substring(0, 40) + '...' : screenshot.metadata.activeWindow}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Tooltip title="View Fullscreen">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); openViewer(index); }}>
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedScreenshots([screenshot.id]); setDownloadDialogOpen(true); }}>
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy URL">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${api.defaults.baseURL}/api/screenshots/${screenshot.id}`); setSnackbar({ open: true, message: 'URL copied to clipboard', severity: 'success' }); }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {screenshots.length === 0 && !loading && (
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PhotoLibraryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No screenshots found</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting your filters or date range</Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  const renderTableView = () => (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedScreenshots.length === screenshots.length && screenshots.length > 0}
                indeterminate={selectedScreenshots.length > 0 && selectedScreenshots.length < screenshots.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                color="primary"
              />
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortModel.field === 'timestamp'} direction={sortModel.field === 'timestamp' ? sortModel.sort : 'asc'} onClick={() => handleSort('timestamp')}>
                Date & Time
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortModel.field === 'workstationHostname'} direction={sortModel.field === 'workstationHostname' ? sortModel.sort : 'asc'} onClick={() => handleSort('workstationHostname')}>
                Workstation
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortModel.field === 'username'} direction={sortModel.field === 'username' ? sortModel.sort : 'asc'} onClick={() => handleSort('username')}>
                User
              </TableSortLabel>
            </TableCell>
            <TableCell>Trigger</TableCell>
            <TableCell>Risk</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Dimensions</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {screenshots.map((screenshot, index) => (
            <TableRow
              key={screenshot.id}
              hover
              selected={selectedScreenshots.includes(screenshot.id)}
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
                  openViewer(index);
                }
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedScreenshots.includes(screenshot.id)}
                  onChange={(e) => handleSelectionChange(screenshot.id, e.target.checked)}
                  color="primary"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{format(parseISO(screenshot.timestamp), 'MMM d, yyyy HH:mm:ss')}</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <DesktopMacIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" fontWeight={500}>{screenshot.workstationHostname}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    {screenshot.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{screenshot.username}</Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">{screenshot.studentId}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={screenshot.triggerReason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  size="small"
                  color={getTriggerReasonColor(screenshot.triggerReason)}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={`${screenshot.metadata.riskScore || 0}`}
                  size="small"
                  color={getRiskColor(screenshot.metadata.riskScore || 0)}
                  variant="filled"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">{formatFileSize(screenshot.fileSize)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">{screenshot.width}×{screenshot.height}</Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openViewer(index); }} aria-label="View">
                  <VisibilityIcon />
                </IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedScreenshots([screenshot.id]); setDownloadDialogOpen(true); }} aria-label="Download">
                  <FileDownloadIcon />
                </IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${api.defaults.baseURL}/api/screenshots/${screenshot.id}`); setSnackbar({ open: true, message: 'URL copied', severity: 'success' }); }} aria-label="Copy URL">
                  <ContentCopyIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
      />
    </TableContainer>
  );

  const currentScreenshot = screenshots[viewerIndex];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Evidence Vault
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Searchable archive of all captured screenshots with metadata
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchScreenshots} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View'}>
              <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
                {viewMode === 'grid' ? <TableChartIcon /> : <PhotoLibraryIcon />}
              </IconButton>
            </Tooltip>
            {selectedScreenshots.length > 0 && (
              <Tooltip title="Download Selected">
                <IconButton color="primary" onClick={() => setDownloadDialogOpen(true)}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 0 }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Workstation</InputLabel>
                  <Select
                    value={filters.workstationId}
                    label="Workstation"
                    onChange={(e) => setFilters(prev => ({ ...prev, workstationId: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Workstations</MenuItem>
                    {workstations.map(ws => (
                      <MenuItem key={ws.id} value={ws.id}>{ws.hostname}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>User</InputLabel>
                  <Select
                    value={filters.userId}
                    label="User"
                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Users</MenuItem>
                    {users.map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.username} ({u.studentId})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trigger Reason</InputLabel>
                  <Select
                    value={filters.triggerReason}
                    label="Trigger Reason"
                    onChange={(e) => setFilters(prev => ({ ...prev, triggerReason: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Triggers</MenuItem>
                    {triggerReasons.map(reason => (
                      <MenuItem key={reason} value={reason}>{reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <MuiDatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(v) => v && setFilters(prev => ({ ...prev, startDate: v, page: 0 }))}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <MuiDatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(v) => v && setFilters(prev => ({ ...prev, endDate: v, page: 0 }))}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.hasAlert}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasAlert: e.target.checked, page: 0 }))}
                      color="primary"
                    />
                  }
                  label="Has Associated Alert"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Risk Score:</Typography>
                  <Slider
                    value={[filters.minRiskScore, filters.maxRiskScore]}
                    onChange={(_, v) => setFilters(prev => ({ ...prev, minRiskScore: v[0], maxRiskScore: v[1], page: 0 }))}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    step={5}
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                    {filters.minRiskScore} - {filters.maxRiskScore}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {total} screenshot{total !== 1 ? 's' : ''} found • Page {page + 1} of {Math.ceil(total / pageSize)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setFilters({
                search: '',
                workstationId: '',
                userId: '',
                triggerReason: '',
                startDate: subDays(new Date(), 30),
                endDate: new Date(),
                minRiskScore: 0,
                maxRiskScore: 100,
                hasAlert: false,
              })}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* View */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'grid' ? (
          renderGridView()
        ) : (
          renderTableView()
        )}

        {/* Fullscreen Viewer */}
        <Dialog open={viewerOpen} onClose={closeViewer} fullScreen maxWidth="xl">
          <AppBar sx={{ position: 'relative', zIndex: 1301 }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={closeViewer} aria-label="Close">
                <CloseIcon />
              </IconButton>
              {currentScreenshot && (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" noWrap>
                    {currentScreenshot.workstationHostname} • {currentScreenshot.username} ({currentScreenshot.studentId})
                  </Typography>
                  <Chip
                    label={currentScreenshot.triggerReason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    size="small"
                    color={getTriggerReasonColor(currentScreenshot.triggerReason)}
                    variant="filled"
                  />
                  <Chip
                    label={`Risk: ${currentScreenshot.metadata.riskScore || 0}`}
                    size="small"
                    color={getRiskColor(currentScreenshot.metadata.riskScore || 0)}
                    variant="filled"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {format(parseISO(currentScreenshot.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => setZoom(Math.min(3, zoom + 0.25))} aria-label="Zoom In" disabled={zoom >= 3}>
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} aria-label="Zoom Out" disabled={zoom <= 0.25}>
                  <ZoomOutIcon />
                </IconButton>
                <IconButton onClick={() => setZoom(1)} aria-label="Reset Zoom">
                  <Typography variant="caption" sx={{ px: 1 }}>{Math.round(zoom * 100)}%</Typography>
                </IconButton>
                <IconButton onClick={() => { if (currentScreenshot) { setSelectedScreenshots([currentScreenshot.id]); setDownloadDialogOpen(true); } }} aria-label="Download">
                  <FileDownloadIcon />
                </IconButton>
                <IconButton onClick={() => setViewerIndex(prev => Math.max(0, prev - 1))} disabled={viewerIndex === 0} aria-label="Previous">
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={() => setViewerIndex(prev => Math.min(screenshots.length - 1, prev + 1))} disabled={viewerIndex === screenshots.length - 1} aria-label="Next">
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>
          {currentScreenshot && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)', backgroundColor: '#000', overflow: 'auto', p: 2 }}>
              <img
                src={`${api.defaults.baseURL}/api/screenshots/${currentScreenshot.id}`}
                alt={`Screenshot ${currentScreenshot.id}`}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', maxWidth: 'none' }}
              />
            </Box>
          )}
        </Dialog>

        {/* Download Dialog */}
        <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Download Screenshots</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedScreenshots.length} screenshot{selectedScreenshots.length !== 1 ? 's' : ''} selected
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Format</Typography>
                <RadioGroup value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value as any)} row>
                  <FormControlLabel value="zip" control={<Radio color="primary" />} label="ZIP Archive (all in one file)" labelPlacement="end" />
                  <FormControlLabel value="individual" control={<Radio color="primary" />} label="Individual Files" labelPlacement="end" />
                </RadioGroup>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox checked={downloadIncludeMetadata} onChange={(e) => setDownloadIncludeMetadata(e.target.checked)} color="primary" />
                }
                label="Include metadata JSON file"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
              Download
            </Button>
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
    </LocalizationProvider>
  );
};

// Icons
const RefreshIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const DesktopMacIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>;
const PhotoLibraryIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M22 16V4c0-1.1-.9-2-2-2H8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zm-11-7l2 2 4-4-2-2-4 4zm-2 9l-2-2-4 4-2-2-4 4h12z"/></svg>;
const TableChartIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M22 3H2v18h20V3zm-2 16H4V5h16v14zm-7-7h5v5h-5v-5zm-7 0h5v5h-5v-5zm0-7h5v5h-5V7zm7 0h5v5h-5V7zm7 0h5v5h-5V7z"/></svg>;
const FullscreenIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const ZoomInIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2h2v-2zm0-4h-2v2h2V6z"/></svg>;
const ZoomOutIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM19 13H5v-2h14v2z"/></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const ChevronLeftIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>;
const ChevronRightIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>;
const FlagIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6zM12 12l-2 2 2 2 2-2-2-2z"/></svg>;
const ErrorIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const AssessmentIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const CheckCircleIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const ContentCopyIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>;
const FileDownloadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const FilterListIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>;
const VisibilityIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;

export default EvidenceVaultPage;