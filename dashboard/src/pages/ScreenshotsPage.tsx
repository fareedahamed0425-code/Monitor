import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
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
  Pagination,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Slider,
} from '@mui/material';
import {
  Image,
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
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  Delete,
  ContentCopy,
  PictureInPicture,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface Screenshot {
  id: string;
  sessionId: string;
  workstationId: string;
  workstationHostname: string;
  userId: string;
  username: string;
  studentId: string;
  timestamp: string;
  triggerReason: string;
  filePath: string;
  fileSize: number;
  width: number;
  height: number;
  thumbnailUrl?: string;
  fullUrl?: string;
  metadata?: Record<string, any>;
}

const triggerReasonLabels: Record<string, string> = {
  manual: 'Manual Request',
  keyword_match: 'Keyword Match',
  blocked_url: 'Blocked URL',
  unauthorized_app: 'Unauthorized App',
  usb_connect: 'USB Connected',
  failed_login: 'Failed Login',
  time_change: 'System Time Change',
  process_injection: 'Process Injection',
  suspicious_network: 'Suspicious Network',
  interval: 'Scheduled Interval',
  risk_threshold: 'Risk Threshold',
};

const ScreenshotsPage: React.FC = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [workstationFilter, setWorkstationFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'timestamp', sort: 'desc' });
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchScreenshots = async () => {
      setLoading(true);
      try {
        const response = await api.getScreenshots({ 
          search: searchTerm, 
          trigger: triggerFilter !== 'all' ? triggerFilter : undefined,
          workstationId: workstationFilter !== 'all' ? workstationFilter : undefined,
          userId: userFilter !== 'all' ? userFilter : undefined,
          page: page + 1, 
          limit: rowsPerPage 
        });
        setScreenshots(response.data.screenshots || response.data);
        setTotalCount(response.data.total || response.data.length);
      } catch (error) {
        console.error('Failed to fetch screenshots:', error);
        setSnackbar({ open: true, message: 'Failed to load screenshots', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchScreenshots();
  }, [searchTerm, triggerFilter, workstationFilter, userFilter, page, rowsPerPage]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const openViewer = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot);
    setViewerOpen(true);
    setZoom(1);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedScreenshot(null);
    setZoom(1);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTriggerLabel = (trigger: string) => triggerReasonLabels[trigger] || trigger;

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
            Evidence Vault
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Searchable archive of all captured screenshots with metadata
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Grid View" disabled={viewMode === 'grid'}>
            <IconButton onClick={() => setViewMode('grid')}>
              <GridViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table View" disabled={viewMode === 'table'}>
            <IconButton onClick={() => setViewMode('table')}>
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bulk Download">
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
                  <Typography variant="caption" color="text.secondary">Total Screenshots</Typography>
                  <Typography variant="h5" fontWeight={700}>{totalCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
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
                  <Typography variant="caption" color="text.secondary">Total Size</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatFileSize(screenshots.reduce((a, b) => a + b.fileSize, 0))}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <ContentCopyIcon />
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
                  <Typography variant="caption" color="text.secondary">Unique Triggers</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {new Set(screenshots.map(s => s.triggerReason)).size}
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
                  <Typography variant="caption" color="text.secondary">Workstations</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {new Set(screenshots.map(s => s.workstationId)).size}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
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
                placeholder="Search screenshots (user, workstation, trigger, student ID)..."
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
                value={triggerFilter}
                onChange={(e) => { setTriggerFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 200 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Triggers</option>
                <option value="manual">Manual Request</option>
                <option value="keyword_match">Keyword Match</option>
                <option value="blocked_url">Blocked URL</option>
                <option value="unauthorized_app">Unauthorized App</option>
                <option value="usb_connect">USB Connected</option>
                <option value="failed_login">Failed Login</option>
                <option value="time_change">System Time Change</option>
                <option value="process_injection">Process Injection</option>
                <option value="suspicious_network">Suspicious Network</option>
                <option value="interval">Scheduled Interval</option>
                <option value="risk_threshold">Risk Threshold</option>
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
              <TextField
                select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
                size="small"
                sx={{ minWidth: 180 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All Users</option>
              </TextField>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Showing {screenshots.length} of {totalCount} screenshots
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <Box>
          <Grid container spacing={2}>
            {screenshots.map((screenshot) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={screenshot.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onClick={() => openViewer(screenshot)}
                  sx={{ '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}
                >
                  <CardMedia
                    component="img"
                    image={screenshot.thumbnailUrl || screenshot.fullUrl || `/api/screenshots/${screenshot.id}/thumbnail`}
                    alt={`Screenshot ${screenshot.id}`}
                    sx={{ height: 180, objectFit: 'cover', position: 'relative' }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-screenshot.png';
                    }}
                  />
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                    <Tooltip title="View Full Size">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openViewer(screenshot); }} sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* download */ }} sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {screenshot.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" fontWeight={600} noWrap>{screenshot.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{screenshot.studentId}</Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={getTriggerLabel(screenshot.triggerReason)}
                        size="small"
                        variant="outlined"
                        color={screenshot.triggerReason === 'manual' ? 'primary' : 'warning'}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DesktopMacIcon fontSize="small" /> {screenshot.workstationHostname}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimerIcon fontSize="small" /> {format(parseISO(screenshot.timestamp), 'MMM d, HH:mm:ss')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PictureInPictureIcon fontSize="small" /> {screenshot.width}x{screenshot.height} • {formatFileSize(screenshot.fileSize)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {screenshots.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ImageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No screenshots found</Typography>
                  <Typography variant="body2" color="text.secondary">Try adjusting your filters or search terms</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(totalCount / rowsPerPage)}
              page={page + 1}
              onChange={(_, value) => setPage(value - 1)}
              color="primary"
              showFirstButton
              showLastButton
              boundaryCount={1}
              siblingCount={1}
            />
          </Box>
        </Box>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <TableContainer sx={{ maxHeight: 600 }}>
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
                  <TableCell>Thumbnail</TableCell>
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
                  <TableCell>Trigger</TableCell>
                  <TableCell>Resolution</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {screenshots.map((screenshot) => (
                  <TableRow key={screenshot.id} hover onClick={() => openViewer(screenshot)} style={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(parseISO(screenshot.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 80, height: 50, borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={screenshot.thumbnailUrl || screenshot.fullUrl || `/api/screenshots/${screenshot.id}/thumbnail`}
                          alt=""
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = '/placeholder-screenshot.png'; }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {screenshot.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{screenshot.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{screenshot.studentId}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <DesktopMacIcon fontSize="small" />
                        </Avatar>
                        {screenshot.workstationHostname}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={getTriggerLabel(screenshot.triggerReason)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{screenshot.width} × {screenshot.height}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatFileSize(screenshot.fileSize)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Full Size">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openViewer(screenshot); }}>
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* download */ }}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {screenshots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No screenshots found matching criteria</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[12, 24, 48, 96]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Card>
      )}

      {/* Full Screen Viewer Dialog */}
      <Dialog open={viewerOpen} onClose={closeViewer} maxWidth={false} fullScreen PaperProps={{ sx: { bgcolor: 'black' } }}>
        {selectedScreenshot && (
          <>
            <DialogTitle sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1301, bgcolor: 'rgba(0,0,0,0.8)', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={closeViewer} color="inherit">
                  <FullscreenExitIcon />
                </IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {getTriggerLabel(selectedScreenshot.triggerReason)} • {selectedScreenshot.username} @ {selectedScreenshot.workstationHostname}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Zoom In">
                    <IconButton onClick={() => setZoom(z => Math.min(z + 0.25, 4))} disabled={zoom >= 4} color="inherit">
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom Out">
                    <IconButton onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} disabled={zoom <= 0.25} color="inherit">
                      <ZoomOutIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset Zoom">
                    <IconButton onClick={() => setZoom(1)} color="inherit">
                      <FullscreenIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton color="inherit">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
              <Box sx={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.1s', maxWidth: '100%', maxHeight: '100%' }}>
                <img
                  src={selectedScreenshot.fullUrl || `/api/screenshots/${selectedScreenshot.id}/full`}
                  alt={`Screenshot ${selectedScreenshot.id}`}
                  style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder-screenshot.png'; }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1301, bgcolor: 'rgba(0,0,0,0.8)', p: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
                <Typography variant="body2">{selectedScreenshot.width} × {selectedScreenshot.height}</Typography>
                <Typography variant="body2">{formatFileSize(selectedScreenshot.fileSize)}</Typography>
                <Typography variant="body2">{format(parseISO(selectedScreenshot.timestamp), 'MMMM d, yyyy HH:mm:ss')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" color="inherit" startIcon={<PersonIcon />} onClick={() => { /* navigate to user */ }}>
                  View User
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<DesktopMacIcon />} onClick={() => { /* navigate to workstation */ }}>
                  View Workstation
                </Button>
                <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={() => { /* download */ }}>
                  Download
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
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

// Missing icons - using available ones
const GridViewIcon = () => <PictureInPictureIcon />;
const ListIcon = () => <ListIconComponent />;
const RefreshIcon = () => <RefreshIconComponent />;
const DownloadIcon = () => <DownloadIconComponent />;
const SearchIcon = () => <SearchIconComponent />;
const DesktopMacIcon = () => <DesktopMacIconComponent />;
const TimerIcon = () => <TimerIconComponent />;
const WarningIcon = () => <WarningIconComponent />;
const PersonIcon = () => <PersonIconComponent />;
const VisibilityIcon = () => <VisibilityIconComponent />;
const PictureInPictureIcon = () => <PictureInPictureIconComponent />;
const ZoomInIcon = () => <ZoomInIconComponent />;
const ZoomOutIcon = () => <ZoomOutIconComponent />;
const FullscreenIcon = () => <FullscreenIconComponent />;
const FullscreenExitIcon = () => <FullscreenExitIconComponent />;
const ContentCopyIcon = () => <ContentCopyIconComponent />;
const ImageIcon = () => <ImageIconComponent />;
const ExpandMoreIcon = () => <ExpandMoreIconComponent />;
const ExpandLessIcon = () => <ExpandLessIconComponent />;

const ListIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zm0-5h4v-4H4v4zM4 5v4h4V5H4zm5 14h12v-4H9v4zm0 5h12v-4H9v4zm0-5h12v-4H9v4zm0-5h12V5H9v4z"/></svg>;
const RefreshIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const DownloadIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const SearchIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const DesktopMacIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>;
const TimerIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>;
const WarningIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;
const PersonIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const VisibilityIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const PictureInPictureIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>;
const ZoomInIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 9h4V7h-4v2zm0 4h4v-2h-4v2z"/></svg>;
const ZoomOutIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h10v2H7V9z"/></svg>;
const FullscreenIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const FullscreenExitIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>;
const ContentCopyIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>;
const ImageIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
const ExpandMoreIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg>;
const ExpandLessIconComponent = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>;

export default ScreenshotsPage;