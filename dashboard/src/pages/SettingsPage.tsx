import React, { useEffect, useState } from 'react';
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
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  Slider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepperContext,
  StepConnector,
  StepIcon,
  Avatar as MuiAvatar,
  TextareaAutosize,
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
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface SystemSettings {
  general: {
    siteName: string;
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    passwordHistory: number;
    passwordExpiryDays: number;
    twoFactorEnabled: boolean;
    twoFactorRequired: boolean;
    apiRateLimit: number;
    corsOrigins: string[];
    allowedIpRanges: string[];
  };
  monitoring: {
    defaultScreenshotInterval: number;
    maxScreenshotSize: number;
    screenshotQuality: number;
    retentionDays: number;
    autoDeleteScreenshots: boolean;
    alertCooldownMinutes: number;
    maxAlertsPerHour: number;
    enableRealTimeAlerts: boolean;
    enableEmailNotifications: boolean;
    enableWebhookNotifications: boolean;
    webhookUrl: string;
  };
  storage: {
    provider: 'minio' | 's3' | 'azure' | 'gcs';
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    endpoint: string;
    useSSL: boolean;
    cdnUrl: string;
    maxFileSize: number;
    allowedExtensions: string[];
  };
  network: {
    serverHost: string;
    serverPort: number;
    websocketPort: number;
    useTLS: boolean;
    certPath: string;
    keyPath: string;
    caPath: string;
    clientCertRequired: boolean;
    heartbeatInterval: number;
    connectionTimeout: number;
    maxReconnectAttempts: number;
    reconnectDelay: number;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    poolSize: number;
    connectionTimeout: number;
    queryTimeout: number;
    migrationsPath: string;
    autoMigrate: boolean;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
    tls: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'analyst' | 'viewer';
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
  isActive: boolean;
  mfaEnabled: boolean;
}

interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'analyst' as AdminUser['role'],
    password: '',
    confirmPassword: '',
    isActive: true,
  });
  const [testConnectionDialogOpen, setTestConnectionDialogOpen] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await api.getSystemSettings();
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setSnackbar({ open: true, message: 'Failed to load settings', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      setAdminsLoading(true);
      try {
        const response = await api.getAdmins();
        setAdmins(response.data);
      } catch (error) {
        console.error('Failed to fetch admins:', error);
      } finally {
        setAdminsLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section as keyof SystemSettings],
        [key]: value,
      },
    } : null);
  };

  const handleSaveSettings = async (section: string) => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateSystemSettings({ [section]: settings[section as keyof SystemSettings] });
      setSnackbar({ open: true, message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdminDialogOpen = (admin?: AdminUser) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        password: '',
        confirmPassword: '',
        isActive: admin.isActive,
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({
        username: '',
        email: '',
        fullName: '',
        role: 'analyst',
        password: '',
        confirmPassword: '',
        isActive: true,
      });
    }
    setAdminDialogOpen(true);
  };

  const handleAdminSave = async () => {
    if (adminForm.password !== adminForm.confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }
    if (editingAdmin && !adminForm.password) {
      // Keep existing password
    } else if (!editingAdmin && !adminForm.password) {
      setSnackbar({ open: true, message: 'Password is required for new admin', severity: 'error' });
      return;
    }
    try {
      if (editingAdmin) {
        await api.updateAdmin(editingAdmin.id, adminForm);
      } else {
        await api.createAdmin(adminForm);
      }
      setSnackbar({ open: true, message: editingAdmin ? 'Admin updated' : 'Admin created', severity: 'success' });
      setAdminDialogOpen(false);
      const response = await api.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save admin', severity: 'error' });
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await api.deleteAdmin(id);
      setSnackbar({ open: true, message: 'Admin deleted', severity: 'success' });
      const response = await api.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete admin', severity: 'error' });
    }
  };

  const handleTestConnection = async (type: string) => {
    setTestConnectionResult(null);
    setTestConnectionDialogOpen(true);
    try {
      const response = await api.testConnection(type);
      setTestConnectionResult({ success: true, message: response.data.message });
    } catch (error: any) {
      setTestConnectionResult({ success: false, message: error.response?.data?.message || 'Connection test failed' });
    }
  };

  const tabs = [
    { label: 'General', icon: <SettingsIcon /> },
    { label: 'Security', icon: <SecurityIcon /> },
    { label: 'Monitoring', icon: <AssessmentIcon /> },
    { label: 'Storage', icon: <StorageIcon /> },
    { label: 'Network', icon: <WifiIcon /> },
    { label: 'Database', icon: <DatabaseIcon /> },
    { label: 'Redis', icon: <CloudQueueIcon /> },
    { label: 'Admins', icon: <AdminPanelSettingsIcon /> },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure system-wide settings and preferences
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Backup Configuration">
            <IconButton onClick={async () => {
              try {
                const response = await api.backupSettings();
                const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `settings-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
                a.click();
                URL.revokeObjectURL(url);
                setSnackbar({ open: true, message: 'Settings backed up', severity: 'success' });
              } catch (error) {
                setSnackbar({ open: true, message: 'Backup failed', severity: 'error' });
              }
            }}>
              <BackupIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restore Configuration">
            <IconButton onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const text = await file.text();
                  try {
                    const config = JSON.parse(text);
                    await api.restoreSettings(config);
                    setSnackbar({ open: true, message: 'Settings restored', severity: 'success' });
                    window.location.reload();
                  } catch (error) {
                    setSnackbar({ open: true, message: 'Invalid backup file', severity: 'error' });
                  }
                }
              };
              input.click();
            }}>
              <RestoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
        {tabs.map((tab, index) => (
          <Tab key={index} icon={tab.icon} label={tab.label} />
        ))}
      </Tabs>

      {activeTab === 7 ? (
        // Admins Tab
        <Card>
          <CardHeader
            title="Administrator Management"
            subheader="Manage admin accounts and permissions"
            action={
              <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleAdminDialogOpen()}>
                Add Admin
              </Button>
            }
          />
          <CardContent>
            {adminsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Admin</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>MFA</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.map(admin => (
                      <TableRow key={admin.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: admin.role === 'superadmin' ? 'warning.light' : admin.role === 'admin' ? 'primary.light' : admin.role === 'analyst' ? 'info.light' : 'secondary.light', color: admin.role === 'superadmin' ? 'warning.contrastText' : 'primary.contrastText' }}>
                              {admin.fullName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{admin.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">@{admin.username}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                            size="small"
                            color={admin.role === 'superadmin' ? 'warning' : admin.role === 'admin' ? 'primary' : admin.role === 'analyst' ? 'info' : 'secondary'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {admin.permissions.map(p => (
                              <Chip key={p} label={p.replace(/_/g, ' ')} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={admin.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={admin.isActive ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={admin.mfaEnabled ? 'Enabled' : 'Disabled'}
                            size="small"
                            color={admin.mfaEnabled ? 'success' : 'warning'}
                            variant="outlined"
                            icon={admin.mfaEnabled ? <VerifiedUserIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          />
                        </TableCell>
                        <TableCell>
                          {admin.lastLogin ? format(parseISO(admin.lastLogin), 'MMM d, yyyy HH:mm') : 'Never'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleAdminDialogOpen(admin)} aria-label="Edit">
                            <EditIcon />
                          </IconButton>
                          {admin.id !== '1' && (
                            <IconButton size="small" color="error" onClick={() => handleAdminDelete(admin.id)} aria-label="Delete">
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      ) : (
        // Settings Tabs
        <Card>
          <CardHeader title={tabs[activeTab].label} subheader={`Configure ${tabs[activeTab].label.toLowerCase()} settings`} />
          <CardContent>
            {activeTab === 0 && settings && (
              // General Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Site Name"
                    value={settings.general.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.general.timezone}
                      label="Timezone"
                      onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    >
                      {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'].map(tz => (
                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.general.language}
                      label="Language"
                      onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                    >
                      {['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar'].map(lang => (
                        <MenuItem key={lang} value={lang}>{lang.toUpperCase()}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date Format"
                    value={settings.general.dateFormat}
                    onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                    helperText="e.g., YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time Format"
                    value={settings.general.timeFormat}
                    onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                    helperText="e.g., HH:mm:ss, hh:mm A"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Maintenance Mode"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.debugMode}
                        onChange={(e) => handleSettingChange('general', 'debugMode', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Debug Mode"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('general')} disabled={saving}>
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Save General Settings'}
                  </Button>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && settings && (
              // Security Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Session Timeout (minutes)"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 5, max: 1440 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Login Attempts"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 20 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Lockout Duration (minutes)"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => handleSettingChange('security', 'lockoutDuration', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 1440 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Password Min Length"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 8, max: 128 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Password History"
                    value={settings.security.passwordHistory}
                    onChange={(e) => handleSettingChange('security', 'passwordHistory', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, max: 50 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Password Expiry (days)"
                    value={settings.security.passwordExpiryDays}
                    onChange={(e) => handleSettingChange('security', 'passwordExpiryDays', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, max: 365 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="API Rate Limit (req/min)"
                    value={settings.security.apiRateLimit}
                    onChange={(e) => handleSettingChange('security', 'apiRateLimit', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 10, max: 10000 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Password Requirements</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.security.passwordRequireUppercase} onChange={(e) => handleSettingChange('security', 'passwordRequireUppercase', e.target.checked)} color="primary" />}
                    label="Require Uppercase"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.security.passwordRequireLowercase} onChange={(e) => handleSettingChange('security', 'passwordRequireLowercase', e.target.checked)} color="primary" />}
                    label="Require Lowercase"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.security.passwordRequireNumbers} onChange={(e) => handleSettingChange('security', 'passwordRequireNumbers', e.target.checked)} color="primary" />}
                    label="Require Numbers"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.security.passwordRequireSymbols} onChange={(e) => handleSettingChange('security', 'passwordRequireSymbols', e.target.checked)} color="primary" />}
                    label="Require Symbols"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Two-Factor Authentication</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.security.twoFactorEnabled} onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)} color="primary" />}
                    label="Enable 2FA"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.security.twoFactorRequired} onChange={(e) => handleSettingChange('security', 'twoFactorRequired', e.target.checked)} color="primary" disabled={!settings.security.twoFactorEnabled} />}
                    label="Require 2FA for All Admins"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>CORS Allowed Origins</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextareaAutosize
                    fullWidth
                    rows={3}
                    value={settings.security.corsOrigins.join('\n')}
                    onChange={(e) => handleSettingChange('security', 'corsOrigins', e.target.value.split('\n').filter(Boolean))}
                    placeholder="One origin per line (e.g., https://dashboard.example.com)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Allowed IP Ranges (CIDR)</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextareaAutosize
                    fullWidth
                    rows={3}
                    value={settings.security.allowedIpRanges.join('\n')}
                    onChange={(e) => handleSettingChange('security', 'allowedIpRanges', e.target.value.split('\n').filter(Boolean))}
                    placeholder="One CIDR per line (e.g., 192.168.1.0/24, 10.0.0.0/8)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('security')} disabled={saving}>
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Security Settings'}
                  </Button>
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && settings && (
              // Monitoring Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Default Screenshot Interval (seconds)"
                    value={settings.monitoring.defaultScreenshotInterval}
                    onChange={(e) => handleSettingChange('monitoring', 'defaultScreenshotInterval', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 10, max: 3600 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Screenshot Size (MB)"
                    value={settings.monitoring.maxScreenshotSize}
                    onChange={(e) => handleSettingChange('monitoring', 'maxScreenshotSize', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 50 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Screenshot Quality (1-100)"
                    value={settings.monitoring.screenshotQuality}
                    onChange={(e) => handleSettingChange('monitoring', 'screenshotQuality', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 10, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retention Days"
                    value={settings.monitoring.retentionDays}
                    onChange={(e) => handleSettingChange('monitoring', 'retentionDays', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 2555 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Alert Cooldown (minutes)"
                    value={settings.monitoring.alertCooldownMinutes}
                    onChange={(e) => handleSettingChange('monitoring', 'alertCooldownMinutes', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, max: 1440 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Alerts Per Hour"
                    value={settings.monitoring.maxAlertsPerHour}
                    onChange={(e) => handleSettingChange('monitoring', 'maxAlertsPerHour', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 1000 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.monitoring.autoDeleteScreenshots} onChange={(e) => handleSettingChange('monitoring', 'autoDeleteScreenshots', e.target.checked)} color="primary" />}
                    label="Auto-delete Screenshots After Retention"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.monitoring.enableRealTimeAlerts} onChange={(e) => handleSettingChange('monitoring', 'enableRealTimeAlerts', e.target.checked)} color="primary" />}
                    label="Enable Real-time Alerts"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.monitoring.enableEmailNotifications} onChange={(e) => handleSettingChange('monitoring', 'enableEmailNotifications', e.target.checked)} color="primary" />}
                    label="Enable Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.monitoring.enableWebhookNotifications} onChange={(e) => handleSettingChange('monitoring', 'enableWebhookNotifications', e.target.checked)} color="primary" />}
                    label="Enable Webhook Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={settings.monitoring.webhookUrl}
                    onChange={(e) => handleSettingChange('monitoring', 'webhookUrl', e.target.value)}
                    placeholder="https://your-webhook-endpoint.com/alerts"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('monitoring')} disabled={saving}>
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Monitoring Settings'}
                  </Button>
                </Grid>
              </Grid>
            )}

            {activeTab === 3 && settings && (
              // Storage Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Storage Provider</InputLabel>
                    <Select
                      value={settings.storage.provider}
                      label="Storage Provider"
                      onChange={(e) => handleSettingChange('storage', 'provider', e.target.value as any)}
                    >
                      <MenuItem value="minio">MinIO (Self-hosted S3)</MenuItem>
                      <MenuItem value="s3">AWS S3</MenuItem>
                      <MenuItem value="azure">Azure Blob Storage</MenuItem>
                      <MenuItem value="gcs">Google Cloud Storage</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bucket Name"
                    value={settings.storage.bucket}
                    onChange={(e) => handleSettingChange('storage', 'bucket', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Region"
                    value={settings.storage.region}
                    onChange={(e) => handleSettingChange('storage', 'region', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Endpoint URL"
                    value={settings.storage.endpoint}
                    onChange={(e) => handleSettingChange('storage', 'endpoint', e.target.value)}
                    placeholder="https://minio.example.com:9000"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Access Key"
                    value={settings.storage.accessKey}
                    onChange={(e) => handleSettingChange('storage', 'accessKey', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Secret Key"
                    value={settings.storage.secretKey}
                    onChange={(e) => handleSettingChange('storage', 'secretKey', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.storage.useSSL} onChange={(e) => handleSettingChange('storage', 'useSSL', e.target.checked)} color="primary" />}
                    label="Use SSL/TLS"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CDN URL (optional)"
                    value={settings.storage.cdnUrl}
                    onChange={(e) => handleSettingChange('storage', 'cdnUrl', e.target.value)}
                    placeholder="https://cdn.example.com"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max File Size (MB)"
                    value={settings.storage.maxFileSize}
                    onChange={(e) => handleSettingChange('storage', 'maxFileSize', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 500 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Allowed File Extensions</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextareaAutosize
                    fullWidth
                    rows={2}
                    value={settings.storage.allowedExtensions.join(', ')}
                    onChange={(e) => handleSettingChange('storage', 'allowedExtensions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="png, jpg, jpeg, webp"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('storage')} disabled={saving}>
                      {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Storage Settings'}
                    </Button>
                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => handleTestConnection('storage')}>
                      Test Connection
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}

            {activeTab === 4 && settings && (
              // Network Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Server Host"
                    value={settings.network.serverHost}
                    onChange={(e) => handleSettingChange('network', 'serverHost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Server Port"
                    value={settings.network.serverPort}
                    onChange={(e) => handleSettingChange('network', 'serverPort', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 65535 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="WebSocket Port"
                    value={settings.network.websocketPort}
                    onChange={(e) => handleSettingChange('network', 'websocketPort', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 65535 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.network.useTLS} onChange={(e) => handleSettingChange('network', 'useTLS', e.target.checked)} color="primary" />}
                    label="Use TLS/SSL"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Certificate Path"
                    value={settings.network.certPath}
                    onChange={(e) => handleSettingChange('network', 'certPath', e.target.value)}
                    placeholder="/etc/ssl/certs/server.crt"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Private Key Path"
                    value={settings.network.keyPath}
                    onChange={(e) => handleSettingChange('network', 'keyPath', e.target.value)}
                    placeholder="/etc/ssl/private/server.key"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CA Certificate Path"
                    value={settings.network.caPath}
                    onChange={(e) => handleSettingChange('network', 'caPath', e.target.value)}
                    placeholder="/etc/ssl/certs/ca.crt"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.network.clientCertRequired} onChange={(e) => handleSettingChange('network', 'clientCertRequired', e.target.checked)} color="primary" />}
                    label="Require Client Certificates"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Heartbeat Interval (seconds)"
                    value={settings.network.heartbeatInterval}
                    onChange={(e) => handleSettingChange('network', 'heartbeatInterval', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 5, max: 300 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Connection Timeout (seconds)"
                    value={settings.network.connectionTimeout}
                    onChange={(e) => handleSettingChange('network', 'connectionTimeout', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 60 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Reconnect Attempts"
                    value={settings.network.maxReconnectAttempts}
                    onChange={(e) => handleSettingChange('network', 'maxReconnectAttempts', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Reconnect Delay (seconds)"
                    value={settings.network.reconnectDelay}
                    onChange={(e) => handleSettingChange('network', 'reconnectDelay', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 60 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('network')} disabled={saving}>
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Network Settings'}
                  </Button>
                </Grid>
              </Grid>
            )}

            {activeTab === 5 && settings && (
              // Database Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Database Host"
                    value={settings.database.host}
                    onChange={(e) => handleSettingChange('database', 'host', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Database Port"
                    value={settings.database.port}
                    onChange={(e) => handleSettingChange('database', 'port', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 65535 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Database Name"
                    value={settings.database.name}
                    onChange={(e) => handleSettingChange('database', 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Database User"
                    value={settings.database.user}
                    onChange={(e) => handleSettingChange('database', 'user', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Database Password"
                    value={settings.database.password}
                    onChange={(e) => handleSettingChange('database', 'password', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.database.ssl} onChange={(e) => handleSettingChange('database', 'ssl', e.target.checked)} color="primary" />}
                    label="Use SSL"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Connection Pool Size"
                    value={settings.database.poolSize}
                    onChange={(e) => handleSettingChange('database', 'poolSize', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Connection Timeout (ms)"
                    value={settings.database.connectionTimeout}
                    onChange={(e) => handleSettingChange('database', 'connectionTimeout', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1000, max: 60000 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Query Timeout (ms)"
                    value={settings.database.queryTimeout}
                    onChange={(e) => handleSettingChange('database', 'queryTimeout', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1000, max: 300000 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Migrations Path"
                    value={settings.database.migrationsPath}
                    onChange={(e) => handleSettingChange('database', 'migrationsPath', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.database.autoMigrate} onChange={(e) => handleSettingChange('database', 'autoMigrate', e.target.checked)} color="primary" />}
                    label="Auto-run Migrations on Startup"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('database')} disabled={saving}>
                      {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Database Settings'}
                    </Button>
                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => handleTestConnection('database')}>
                      Test Connection
                    </Button>
                    <Button variant="outlined" startIcon={<SyncIcon />} onClick={async () => {
                      try {
                        await api.runMigrations();
                        setSnackbar({ open: true, message: 'Migrations completed', severity: 'success' });
                      } catch (error) {
                        setSnackbar({ open: true, message: 'Migration failed', severity: 'error' });
                      }
                    }}>
                      Run Migrations
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}

            {activeTab === 6 && settings && (
              // Redis Settings
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Redis Host"
                    value={settings.redis.host}
                    onChange={(e) => handleSettingChange('redis', 'host', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Redis Port"
                    value={settings.redis.port}
                    onChange={(e) => handleSettingChange('redis', 'port', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 65535 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Redis Password (optional)"
                    value={settings.redis.password}
                    onChange={(e) => handleSettingChange('redis', 'password', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Database Number"
                    value={settings.redis.db}
                    onChange={(e) => handleSettingChange('redis', 'db', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, max: 15 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Key Prefix"
                    value={settings.redis.keyPrefix}
                    onChange={(e) => handleSettingChange('redis', 'keyPrefix', e.target.value)}
                    placeholder="collegemonitor:"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={settings.redis.tls} onChange={(e) => handleSettingChange('redis', 'tls', e.target.checked)} color="primary" />}
                    label="Use TLS"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Retries"
                    value={settings.redis.maxRetries}
                    onChange={(e) => handleSettingChange('redis', 'maxRetries', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, max: 10 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retry Delay (ms)"
                    value={settings.redis.retryDelay}
                    onChange={(e) => handleSettingChange('redis', 'retryDelay', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 10, max: 5000 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSettings('redis')} disabled={saving}>
                      {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Redis Settings'}
                    </Button>
                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => handleTestConnection('redis')}>
                      Test Connection
                    </Button>
                    <Button variant="outlined" startIcon={<SyncDisabledIcon />} onClick={async () => {
                      try {
                        await api.flushRedis();
                        setSnackbar({ open: true, message: 'Redis cache flushed', severity: 'success' });
                      } catch (error) {
                        setSnackbar({ open: true, message: 'Failed to flush Redis', severity: 'error' });
                      }
                    }}>
                      Flush Cache
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Create Admin'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2, minWidth: 400 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                  disabled={!!editingAdmin}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={adminForm.role}
                    label="Role"
                    onChange={(e) => setAdminForm(prev => ({ ...prev, role: e.target.value as any }))}
                  >
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="analyst">Analyst</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label={editingAdmin ? 'New Password (leave blank to keep current)' : 'Password'}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={adminForm.isActive} onChange={(e) => setAdminForm(prev => ({ ...prev, isActive: e.target.checked }))} color="primary" />}
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleAdminSave}>
            {editingAdmin ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Connection Dialog */}
      <Dialog open={testConnectionDialogOpen} onClose={() => setTestConnectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connection Test Result</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            {testConnectionResult && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <MuiAvatar sx={{ width: 64, height: 64, bgcolor: testConnectionResult.success ? 'success.light' : 'error.light', color: testConnectionResult.success ? 'success.contrastText' : 'error.contrastText' }}>
                  {testConnectionResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                </MuiAvatar>
                <Typography variant="h6" color={testConnectionResult.success ? 'success.main' : 'error.main'}>
                  {testConnectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                </Typography>
                <Typography variant="body1">{testConnectionResult.message}</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestConnectionDialogOpen(false)}>Close</Button>
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

// Icons
const SettingsIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>;
const SecurityIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>;
const AssessmentIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const StorageIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>;
const WifiIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4C7.31 4 3.07 5.9 1 8.44L0 9.53C1.39 11.36 3.31 13 5.7 14.5L6.6 15.4C5.01 16.81 4 18.64 4 20.5V22h16v-1.5c0-1.86-1.01-3.69-2.6-4.5L17.4 14.5C19.79 13 21.71 11.36 23.1 9.53L22 8.44C19.93 5.9 15.69 4 12 4zm0 2c2.42 0 4.61.87 6.24 2.3L21 9.53C19.64 8.36 17.55 7.5 15 7.5c-2.55 0-4.64.86-6.24 2.3L3 9.53C4.36 8.36 6.45 7.5 9 7.5c2.55 0 4.64.86 6.24 2.3L12 11.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const DatabaseIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const CloudQueueIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>;
const BackupIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>;
const RestoreIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>;
const CheckCircleIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const ErrorIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const LockOpenIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H6V8h12v10z"/></svg>;

export default SettingsPage;