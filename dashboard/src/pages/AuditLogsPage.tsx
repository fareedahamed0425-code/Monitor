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
  Collapse,
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
  Person,
  PersonAdd,
  PersonRemove,
  AdminPanelSettings,
  ManageAccounts,
  VerifiedUser,
  Security as SecurityIcon,
  Backup,
  Restore,
  Cloud,
  Storage,
  Database,
  Wifi,
  Lan,
  VpnKey,
  Fingerprint as FingerprintIcon,
  TwoFactorAuthentication,
  PrivacyTip,
  Policy as PolicyIcon,
  Description as DescriptionIcon,
  Article,
  Receipt,
  Assignment,
  Gavel as GavelIcon,
  Balance,
  AccountTree,
  Hub,
  Router,
  Dns,
  CloudQueue,
  CloudSync,
  CloudOff,
  CloudDone,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Sync,
  SyncDisabled,
  SyncProblem,
  Lock as LockIcon,
  LockOpen,
  Key,
  VpnKey as VpnKeyIcon,
  Shield as ShieldIcon,
  VerifiedUser as VerifiedUserIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ManageAccounts as ManageAccountsIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Group,
  GroupAdd,
  GroupRemove,
  SupervisorAccount,
  ContactSupport,
  Help,
  Info,
  BugReport as BugReportIcon,
  Feedback,
  Star,
  StarBorder,
  Language,
  Translate,
  AccessTime,
  Schedule,
  Timer as TimerIcon,
  Alarm,
  AlarmOff,
  Notifications,
  NotificationsOff,
  NotificationsActive,
  VolumeUp,
  VolumeOff,
  Vibration,
  PhoneAndroid,
  Computer,
  Tablet,
  Tv,
  Watch,
  Print as PrintIcon,
  Fax,
  Scanner,
  Keyboard,
  Mouse,
  Monitor,
  Speaker,
  Headset,
  Mic,
  Videocam,
  Camera,
  PhotoCamera,
  VideoCamera,
  InsertDriveFile,
  Folder,
  FolderOpen,
  Description as DescriptionIcon2,
  PictureAsPdf as PictureAsPdfIcon,
  PictureInPicture as PictureInPictureIcon,
  Image,
  PhotoLibrary,
  MusicNote,
  VideoLibrary,
  Games,
  SportsEsports,
  FitnessCenter,
  DirectionsRun,
  DirectionsBike,
  DirectionsWalk,
  DirectionsCar,
  DirectionsBus,
  DirectionsTrain,
  DirectionsSubway,
  DirectionsBoat,
  DirectionsPlane,
  Flight,
  Hotel,
  Restaurant,
  LocalBar,
  LocalCafe,
  LocalRestaurant,
  LocalHotel,
  LocalHospital,
  LocalPharmacy,
  LocalPolice,
  LocalFireDepartment,
  LocalPostOffice,
  LocalLibrary,
  LocalMall,
  LocalMovies,
  LocalParking,
  LocalGasStation,
  LocalAtm,
  LocalBank,
  LocalConvenienceStore,
  LocalDepartmentStore,
  LocalFlorist,
  LocalGroceryStore,
  LocalLaundry,
  LocalCarWash,
  LocalPark,
  LocalPlayground,
  LocalStadium,
  LocalTheater,
  LocalZoo,
  LocalMuseum,
  LocalUniversity,
  LocalSchool,
  LocalLibrary as LocalLibraryIcon,
  LocalHospital as LocalHospitalIcon,
  LocalPharmacy as LocalPharmacyIcon,
  LocalPolice as LocalPoliceIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  LocalPostOffice as LocalPostOfficeIcon,
  LocalMall as LocalMallIcon,
  LocalMovies as LocalMoviesIcon,
  LocalParking as LocalParkingIcon,
  LocalGasStation as LocalGasStationIcon,
  LocalAtm as LocalAtmIcon,
  LocalBank as LocalBankIcon,
  LocalConvenienceStore as LocalConvenienceStoreIcon,
  LocalDepartmentStore as LocalDepartmentStoreIcon,
  LocalFlorist as LocalFloristIcon,
  LocalGroceryStore as LocalGroceryStoreIcon,
  LocalLaundry as LocalLaundryIcon,
  LocalCarWash as LocalCarWashIcon,
  LocalPark as LocalParkIcon,
  LocalPlayground as LocalPlaygroundIcon,
  LocalStadium as LocalStadiumIcon,
  LocalTheater as LocalTheaterIcon,
  LocalZoo as LocalZooIcon,
  LocalMuseum as LocalMuseumIcon,
  LocalUniversity as LocalUniversityIcon,
  LocalSchool as LocalSchoolIcon,
  ExpandMore as ExpandMoreIcon2,
  ChevronRight,
  ChevronLeft,
  Close,
  ArrowDropDown,
  ArrowDropUp,
  FileDownload,
  FileCopy,
  ContentCopy,
  FindInPage,
  Highlight,
  RemoveRedEye,
  VisibilityOff,
  BugReport as BugReportIcon2,
  Terminal,
  Code,
  Storage as StorageIcon,
  Dns as DnsIcon,
  VpnKey as VpnKeyIcon2,
  Security as SecurityIcon2,
  Shield as ShieldIcon2,
  VerifiedUser as VerifiedUserIcon2,
  AdminPanelSettings as AdminPanelSettingsIcon2,
  ManageAccounts as ManageAccountsIcon2,
  Person as PersonIcon2,
  PersonAdd as PersonAddIcon2,
  PersonRemove as PersonRemoveIcon2,
  Group as GroupIcon,
  GroupAdd as GroupAddIcon,
  GroupRemove as GroupRemoveIcon,
  SupervisorAccount as SupervisorAccountIcon,
  ContactSupport as ContactSupportIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  BugReport as BugReportIcon3,
  Feedback as FeedbackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Language as LanguageIcon,
  Translate as TranslateIcon,
  AccessTime as AccessTimeIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon2,
  Alarm as AlarmIcon,
  AlarmOff as AlarmOffIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  NotificationsActive as NotificationsActiveIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Vibration as VibrationIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Computer as ComputerIcon,
  Tablet as TabletIcon,
  Tv as TvIcon,
  Watch as WatchIcon,
  Print as PrintIcon2,
  Fax as FaxIcon,
  Scanner as ScannerIcon,
  Keyboard as KeyboardIcon,
  Mouse as MouseIcon,
  Monitor as MonitorIcon,
  Speaker as SpeakerIcon,
  Headset as HeadsetIcon,
  Mic as MicIcon,
  Videocam as VideocamIcon,
  Camera as CameraIcon,
  PhotoCamera as PhotoCameraIcon,
  VideoCamera as VideoCameraIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon3,
  PictureAsPdf as PictureAsPdfIcon2,
  PictureInPicture as PictureInPictureIcon2,
  Image as ImageIcon,
  PhotoLibrary as PhotoLibraryIcon,
  MusicNote as MusicNoteIcon,
  VideoLibrary as VideoLibraryIcon,
  Games as GamesIcon,
  SportsEsports as SportsEsportsIcon,
  FitnessCenter as FitnessCenterIcon,
  DirectionsRun as DirectionsRunIcon,
  DirectionsBike as DirectionsBikeIcon,
  DirectionsWalk as DirectionsWalkIcon,
  DirectionsCar as DirectionsCarIcon,
  DirectionsBus as DirectionsBusIcon,
  DirectionsTrain as DirectionsTrainIcon,
  DirectionsSubway as DirectionsSubwayIcon,
  DirectionsBoat as DirectionsBoatIcon,
  DirectionsPlane as DirectionsPlaneIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  LocalBar as LocalBarIcon,
  LocalCafe as LocalCafeIcon,
  LocalRestaurant as LocalRestaurantIcon,
  LocalHotel as LocalHotelIcon,
  LocalHospital as LocalHospitalIcon2,
  LocalPharmacy as LocalPharmacyIcon2,
  LocalPolice as LocalPoliceIcon2,
  LocalFireDepartment as LocalFireDepartmentIcon2,
  LocalPostOffice as LocalPostOfficeIcon2,
  LocalLibrary as LocalLibraryIcon2,
  LocalMall as LocalMallIcon2,
  LocalMovies as LocalMoviesIcon2,
  LocalParking as LocalParkingIcon2,
  LocalGasStation as LocalGasStationIcon2,
  LocalAtm as LocalAtmIcon2,
  LocalBank as LocalBankIcon2,
  LocalConvenienceStore as LocalConvenienceStoreIcon2,
  LocalDepartmentStore as LocalDepartmentStoreIcon2,
  LocalFlorist as LocalFloristIcon2,
  LocalGroceryStore as LocalGroceryStoreIcon2,
  LocalLaundry as LocalLaundryIcon2,
  LocalCarWash as LocalCarWashIcon2,
  LocalPark as LocalParkIcon2,
  LocalPlayground as LocalPlaygroundIcon2,
  LocalStadium as LocalStadiumIcon2,
  LocalTheater as LocalTheaterIcon2,
  LocalZoo as LocalZooIcon2,
  LocalMuseum as LocalMuseumIcon2,
  LocalUniversity as LocalUniversityIcon2,
  LocalSchool as LocalSchoolIcon2,
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format, subDays } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';

interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  adminFullName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  sessionId?: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  topActions: { action: string; count: number }[];
  topAdmins: { adminId: string; adminUsername: string; count: number }[];
  topResources: { resource: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

const AuditLogsPage: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'timestamp', sort: 'desc' });
  const [filters, setFilters] = useState({
    search: '',
    adminId: '',
    action: '',
    resource: '',
    severity: '',
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    ipAddress: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [admins, setAdmins] = useState<{ id: string; username: string; fullName: string }[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        sortBy: sortModel.field,
        sortOrder: sortModel.sort,
        search: filters.search || undefined,
        adminId: filters.adminId || undefined,
        action: filters.action || undefined,
        resource: filters.resource || undefined,
        severity: filters.severity || undefined,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ipAddress: filters.ipAddress || undefined,
      };
      const response = await api.getAuditLogs(params);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setSnackbar({ open: true, message: 'Failed to load audit logs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortModel, filters]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.getAuditStats({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [adminsRes, actionsRes, resourcesRes] = await Promise.all([
        api.getAdmins({ pageSize: 1000 }),
        api.getAuditActions(),
        api.getAuditResources(),
      ]);
      setAdmins(adminsRes.data.admins.map((a: any) => ({ id: a.id, username: a.username, fullName: a.fullName })));
      setActions(actionsRes.data);
      setResources(resourcesRes.data);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleExpand = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  const handleExport = async () => {
    try {
      const response = await api.exportAuditLogs({
        format: exportFormat,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        filters: {
          adminId: filters.adminId,
          action: filters.action,
          resource: filters.resource,
          severity: filters.severity,
          search: filters.search,
          ipAddress: filters.ipAddress,
        },
      });
      
      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(filters.startDate, 'yyyy-MM-dd')}-to-${format(filters.endDate, 'yyyy-MM-dd')}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: `Audit logs exported as ${exportFormat.toUpperCase()}`, severity: 'success' });
      setExportDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to export audit logs', severity: 'error' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon fontSize="small" />;
      case 'error': return <ErrorIcon fontSize="small" />;
      case 'warning': return <WarningIcon fontSize="small" />;
      case 'info': return <InfoIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatResource = (resource: string) => {
    return resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) {
      return <Typography variant="body2" color="text.secondary">No additional details</Typography>;
    }
    return (
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        <Table size="small">
          <TableBody>
            {Object.entries(details).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ fontWeight: 600, width: '30%', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {key}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const statCards = stats ? [
    { title: 'Total Logs', value: stats.totalLogs.toLocaleString(), icon: <DescriptionIcon />, color: 'primary' },
    { title: 'Today', value: stats.todayLogs.toLocaleString(), icon: <TodayIcon />, color: 'info' },
    { title: 'Critical', value: stats.criticalCount.toLocaleString(), icon: <ErrorIcon />, color: 'error' },
    { title: 'Errors', value: stats.errorCount.toLocaleString(), icon: <WarningIcon />, color: 'warning' },
    { title: 'Warnings', value: stats.warningCount.toLocaleString(), icon: <ReportProblemIcon />, color: 'warning' },
    { title: 'Info', value: stats.infoCount.toLocaleString(), icon: <InfoIcon />, color: 'success' },
  ] : [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Audit Logs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track all administrative actions and system changes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchLogs} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Logs">
              <IconButton onClick={() => setExportDialogOpen(true)}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{stat.title}</Typography>
                      <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${stat.color}.light`, color: `${stat.color}.contrastText` }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

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
                  <InputLabel>Admin</InputLabel>
                  <Select
                    value={filters.adminId}
                    label="Admin"
                    onChange={(e) => setFilters(prev => ({ ...prev, adminId: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Admins</MenuItem>
                    {admins.map(admin => (
                      <MenuItem key={admin.id} value={admin.id}>{admin.fullName} (@{admin.username})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.action}
                    label="Action"
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    {actions.map(action => (
                      <MenuItem key={action} value={action}>{formatAction(action)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource</InputLabel>
                  <Select
                    value={filters.resource}
                    label="Resource"
                    onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Resources</MenuItem>
                    {resources.map(resource => (
                      <MenuItem key={resource} value={resource}>{formatResource(resource)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Severity"
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value, page: 0 }))}
                  >
                    <MenuItem value="">All Severities</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
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
                <TextField
                  fullWidth
                  size="small"
                  label="IP Address"
                  value={filters.ipAddress}
                  onChange={(e) => setFilters(prev => ({ ...prev, ipAddress: e.target.value, page: 0 }))}
                  placeholder="192.168.1.1"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {total} log{total !== 1 ? 's' : ''} found • Page {page + 1} of {Math.ceil(total / pageSize)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setFilters({
                search: '',
                adminId: '',
                action: '',
                resource: '',
                severity: '',
                startDate: subDays(new Date(), 7),
                endDate: new Date(),
                ipAddress: '',
              })}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Logs Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel active={sortModel.field === 'timestamp'} direction={sortModel.field === 'timestamp' ? sortModel.sort : 'asc'} onClick={() => handleSort('timestamp')}>
                        Timestamp
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortModel.field === 'adminUsername'} direction={sortModel.field === 'adminUsername' ? sortModel.sort : 'asc'} onClick={() => handleSort('adminUsername')}>
                        Admin
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortModel.field === 'action'} direction={sortModel.field === 'action' ? sortModel.sort : 'asc'} onClick={() => handleSort('action')}>
                        Action
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortModel.field === 'resource'} direction={sortModel.field === 'resource' ? sortModel.sort : 'asc'} onClick={() => handleSort('resource')}>
                        Resource
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Resource ID</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map(log => (
                    <TableRow
                      key={log.id}
                      hover
                      onClick={() => handleRowClick(log)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2">{format(parseISO(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            {log.adminFullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{log.adminFullName}</Typography>
                            <Typography variant="caption" color="text.secondary">@{log.adminUsername}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatAction(log.action)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatResource(log.resource)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {log.resourceId ? (
                          <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                            {log.resourceId.length > 20 ? log.resourceId.substring(0, 20) + '...' : log.resourceId}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(log.severity)}
                          label={log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                          size="small"
                          color={getSeverityColor(log.severity)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick(log); }} aria-label="View Details">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(log.details, null, 2)); setSnackbar({ open: true, message: 'Details copied to clipboard', severity: 'success' }); }} aria-label="Copy Details">
                          <ContentCopyIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={total}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              />
            </TableContainer>
          </Card>
        )}

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No audit logs found</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting your filters or date range</Typography>
          </Box>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography variant="h6">Audit Log Details</Typography>
              <Chip
                icon={getSeverityIcon(selectedLog?.severity || 'info')}
                label={selectedLog?.severity.charAt(0).toUpperCase() + selectedLog?.severity.slice(1)}
                size="small"
                color={getSeverityColor(selectedLog?.severity || 'info')}
                variant="filled"
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedLog && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Log ID</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>{selectedLog.id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                    <Typography variant="body2">{format(parseISO(selectedLog.timestamp), 'MMMM d, yyyy HH:mm:ss')}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Admin</Typography>
                    <Typography variant="body2">{selectedLog.adminFullName} (@{selectedLog.adminUsername})</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Admin ID</Typography>
                    <Typography variant="body2" fontFamily="monospace">{selectedLog.adminId}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Action</Typography>
                    <Typography variant="body2">{formatAction(selectedLog.action)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Resource</Typography>
                    <Typography variant="body2">{formatResource(selectedLog.resource)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Resource ID</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {selectedLog.resourceId || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">IP Address</Typography>
                    <Typography variant="body2" fontFamily="monospace">{selectedLog.ipAddress}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Session ID</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {selectedLog.sessionId || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">User Agent</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {selectedLog.userAgent}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Details</Typography>
                    {renderDetails(selectedLog.details)}
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => {
              if (selectedLog) {
                navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                setSnackbar({ open: true, message: 'Full log copied to clipboard', severity: 'success' });
              }
            }}>
              Copy Full Log
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Audit Logs</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Export {total} log{total !== 1 ? 's' : ''} for the selected date range
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Format</Typography>
                <RadioGroup value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} row>
                  <FormControlLabel value="csv" control={<Radio color="primary" />} label="CSV" labelPlacement="end" />
                  <FormControlLabel value="json" control={<Radio color="primary" />} label="JSON" labelPlacement="end" />
                  <FormControlLabel value="pdf" control={<Radio color="primary" />} label="PDF Report" labelPlacement="end" />
                </RadioGroup>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Date Range: {format(filters.startDate, 'MMM d, yyyy')} - {format(filters.endDate, 'MMM d, yyyy')}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
              Export
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
const DescriptionIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>;
const TodayIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>;
const ErrorIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const WarningIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;
const ReportProblemIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 5.99L19.53 19H4.47L12 5.99zM12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/></svg>;
const InfoIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const FilterListIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>;
const VisibilityIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const ContentCopyIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>;

export default AuditLogsPage;