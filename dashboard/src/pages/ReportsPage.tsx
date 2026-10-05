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
  Tabs,
  Tab,
  Divider,
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
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface ReportData {
  overview: {
    totalWorkstations: number;
    onlineWorkstations: number;
    totalUsers: number;
    activeSessions: number;
    totalActivities: number;
    totalAlerts: number;
    totalScreenshots: number;
    avgRiskScore: number;
  };
  trends: {
    activities: { date: string; count: number }[];
    alerts: { date: string; count: number }[];
    sessions: { date: string; count: number }[];
    riskScores: { date: string; avg: number }[];
  };
  topUsers: { userId: string; username: string; studentId: string; activityCount: number; alertCount: number; riskScore: number }[];
  topWorkstations: { workstationId: string; hostname: string; activityCount: number; alertCount: number; uptime: number }[];
  topApplications: { name: string; count: number }[];
  topUrls: { url: string; count: number }[];
  alertTypes: { type: string; count: number }[];
  riskDistribution: { range: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
}

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportSections, setExportSections] = useState<string[]>(['overview', 'trends', 'topUsers', 'topWorkstations', 'applications', 'alerts']);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await api.getReports({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        });
        setReportData(response.data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
        setSnackbar({ open: true, message: 'Failed to load report data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [dateRange]);

  const handleExport = async () => {
    try {
      const response = await api.exportReport({
        format: exportFormat,
        sections: exportSections,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });
      const blob = new Blob([response.data], { type: exportFormat === 'pdf' ? 'application/pdf' : exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: `Report exported as ${exportFormat.toUpperCase()}`, severity: 'success' });
      setExportDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to export report', severity: 'error' });
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
  };

  const lineChartData = reportData?.trends ? {
    labels: reportData.trends.activities.map(t => format(parseISO(t.date), 'MMM d')),
    datasets: [
      {
        label: 'Activities',
        data: reportData.trends.activities.map(t => t.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Alerts',
        data: reportData.trends.alerts.map(t => t.count),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Sessions',
        data: reportData.trends.sessions.map(t => t.count),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : { labels: [], datasets: [] };

  const riskChartData = reportData?.riskDistribution ? {
    labels: reportData.riskDistribution.map(r => r.range),
    datasets: [{
      label: 'Sessions',
      data: reportData.riskDistribution.map(r => r.count),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(234, 179, 8)',
        'rgb(239, 68, 68)',
      ],
      borderWidth: 1,
    }],
  } : { labels: [], datasets: [] };

  const alertTypeChartData = reportData?.alertTypes ? {
    labels: reportData.alertTypes.map(a => a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [{
      data: reportData.alertTypes.map(a => a.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
      ],
    }],
  } : { labels: [], datasets: [] };

  const hourlyChartData = reportData?.hourlyActivity ? {
    labels: reportData.hourlyActivity.map(h => `${h.hour}:00`),
    datasets: [{
      label: 'Activities',
      data: reportData.hourlyActivity.map(h => h.count),
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  } : { labels: [], datasets: [] };

  const topAppsChartData = reportData?.topApplications ? {
    labels: reportData.topApplications.slice(0, 10).map(a => a.name.length > 20 ? a.name.substring(0, 20) + '...' : a.name),
    datasets: [{
      label: 'Usage Count',
      data: reportData.topApplications.slice(0, 10).map(a => a.count),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }],
  } : { labels: [], datasets: [] };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!reportData) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <AnalyticsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">No report data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive security and usage analytics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="date-range-label">Date Range</InputLabel>
            <Select
              labelId="date-range-label"
              value={`${dateRange.start.toISOString()}|${dateRange.end.toISOString()}`}
              onChange={(e) => {
                const [start, end] = e.target.value.split('|');
                setDateRange({ start: new Date(start), end: new Date(end) });
              }}
            >
              <MenuItem value={`${subDays(new Date(), 1).toISOString()}|${new Date().toISOString()}`}>Last 24 Hours</MenuItem>
              <MenuItem value={`${subDays(new Date(), 7).toISOString()}|${new Date().toISOString()}`}>Last 7 Days</MenuItem>
              <MenuItem value={`${subDays(new Date(), 30).toISOString()}|${new Date().toISOString()}`}>Last 30 Days</MenuItem>
              <MenuItem value={`${subDays(new Date(), 90).toISOString()}|${new Date().toISOString()}`}>Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton onClick={() => setExportDialogOpen(true)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={() => window.print()}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Workstations</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {reportData.overview.onlineWorkstations} / {reportData.overview.totalWorkstations}
                  </Typography>
                  <Typography variant="caption" color={reportData.overview.onlineWorkstations === reportData.overview.totalWorkstations ? 'success.main' : 'warning.main'}>
                    {Math.round((reportData.overview.onlineWorkstations / reportData.overview.totalWorkstations) * 100)}% Online
                  </Typography>
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
                  <Typography variant="caption" color="text.secondary">Active Users</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {reportData.overview.activeSessions} / {reportData.overview.totalUsers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reportData.overview.activeSessions} active sessions
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
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
                  <Typography variant="caption" color="text.secondary">Total Activities</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {reportData.overview.totalActivities.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reportData.overview.totalAlerts} alerts generated
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <AnalyticsIcon />
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
                  <Typography variant="caption" color="text.secondary">Avg Risk Score</Typography>
                  <Typography variant="h4" fontWeight={700} color={reportData.overview.avgRiskScore > 50 ? 'error.main' : reportData.overview.avgRiskScore > 20 ? 'warning.main' : 'success.main'}>
                    {reportData.overview.avgRiskScore.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reportData.overview.totalScreenshots} screenshots captured
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: reportData.overview.avgRiskScore > 50 ? 'error.light' : reportData.overview.avgRiskScore > 20 ? 'warning.light' : 'success.light', color: reportData.overview.avgRiskScore > 50 ? 'error.contrastText' : reportData.overview.avgRiskScore > 20 ? 'warning.contrastText' : 'success.contrastText' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trends Chart */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Activity Trends" subheader="Daily activities, alerts, and sessions over time" action={
              <Tooltip title="Download Chart Data">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent sx={{ height: 350 }}>
              <Line data={lineChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Risk Distribution" subheader="Sessions by risk level" action={
              <Tooltip title="Download Chart Data">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent sx={{ height: 350 }}>
              <Doughnut data={riskChartData} options={{ ...chartOptions, cutout: '60%' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second Row Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Alert Types" subheader="Distribution of alert types" action={
              <Tooltip title="Download Chart Data">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent sx={{ height: 350 }}>
              <Pie data={alertTypeChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Hourly Activity Pattern" subheader="Activity volume by hour of day" action={
              <Tooltip title="Download Chart Data">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent sx={{ height: 350 }}>
              <Line data={hourlyChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Third Row Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Top Applications" subheader="Most used applications" action={
              <Tooltip title="Download Chart Data">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent sx={{ height: 350 }}>
              <Bar data={topAppsChartData} options={{ ...chartOptions, indexAxis: 'y' as const } } />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Top URLs Visited" subheader="Most visited websites" action={
              <Tooltip title="Download Chart Data">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent sx={{ height: 350 }}>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>URL</TableCell>
                      <TableCell align="right">Visits</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.topUrls.slice(0, 15).map((url, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {url.url}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={url.count.toString()} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Users & Workstations Tables */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Users by Activity" subheader="Users with highest activity and risk" action={
              <Tooltip title="Export">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell align="right">Activities</TableCell>
                    <TableCell align="right">Alerts</TableCell>
                    <TableCell align="right">Risk Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.topUsers.slice(0, 10).map((user, index) => (
                    <TableRow key={user.userId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{user.username}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">{user.studentId}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{user.activityCount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={user.alertCount.toString()} size="small" color={user.alertCount > 10 ? 'error' : user.alertCount > 5 ? 'warning' : 'success'} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={user.riskScore.toFixed(1)} size="small" color={user.riskScore > 50 ? 'error' : user.riskScore > 20 ? 'warning' : 'success'} variant="filled" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Workstations" subheader="Workstations with highest activity" action={
              <Tooltip title="Export">
                <IconButton size="small"><DownloadIcon /></IconButton>
              </Tooltip>
            } />
            <CardContent>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Workstation</TableCell>
                    <TableCell align="right">Activities</TableCell>
                    <TableCell align="right">Alerts</TableCell>
                    <TableCell align="right">Uptime %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.topWorkstations.slice(0, 10).map((ws, index) => (
                    <TableRow key={ws.workstationId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <DesktopMacIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{ws.hostname}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{ws.activityCount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={ws.alertCount.toString()} size="small" color={ws.alertCount > 20 ? 'error' : ws.alertCount > 10 ? 'warning' : 'success'} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={ws.uptime > 95 ? 'success.main' : ws.uptime > 80 ? 'warning.main' : 'error.main'}>
                          {ws.uptime.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Format</Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} row>
                <FormControlLabel value="pdf" control={<Radio color="primary" />} label="PDF Report" labelPlacement="end" />
                <FormControlLabel value="excel" control={<Radio color="primary" />} label="Excel Spreadsheet" labelPlacement="end" />
                <FormControlLabel value="csv" control={<Radio color="primary" />} label="CSV Data" labelPlacement="end" />
              </RadioGroup>
            </FormControl>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>Sections to Include</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { id: 'overview', label: 'Overview Statistics' },
                { id: 'trends', label: 'Trend Charts' },
                { id: 'topUsers', label: 'Top Users' },
                { id: 'topWorkstations', label: 'Top Workstations' },
                { id: 'applications', label: 'Applications & URLs' },
                { id: 'alerts', label: 'Alert Analysis' },
              ].map(section => (
                <FormControlLabel
                  key={section.id}
                  control={
                    <Checkbox
                      checked={exportSections.includes(section.id)}
                      onChange={(e) => setExportSections(prev => e.target.checked ? [...prev, section.id] : prev.filter(s => s !== section.id))}
                      color="primary"
                    />
                  }
                  label={section.label}
                />
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Date Range: {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export Report
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
  );
};

// Icons
const RefreshIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const DesktopMacIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>;
const PersonIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const AnalyticsIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const AssessmentIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const PrintIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>;
const ExpandMoreIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg>;
const ExpandLessIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>;

export default ReportsPage;