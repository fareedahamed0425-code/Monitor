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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  FormControlLabel,
  Switch,
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
  Autocomplete,
  Slider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepIcon,
  FormGroup,
  FormControlLabel as FormControlLabelMui,
  Checkbox,
  RadioGroup,
  Radio,
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
} from '@mui/icons-material';
import { api } from '../services/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  rules: PolicyRule[];
  targets: PolicyTarget[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

interface PolicyRule {
  id: string;
  type: 'keyword' | 'url' | 'process' | 'usb' | 'time' | 'network' | 'risk_threshold' | 'sequence';
  field: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'in_list' | 'not_in_list' | 'greater_than' | 'less_than';
  value: string | string[] | number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'alert' | 'screenshot' | 'lock' | 'logoff' | 'block';
  enabled: boolean;
  description?: string;
}

interface PolicyTarget {
  type: 'all' | 'workstation' | 'user' | 'group' | 'lab';
  values: string[];
}

const ruleTypeOptions = [
  { value: 'keyword', label: 'Window Title Keyword' },
  { value: 'url', label: 'URL Pattern' },
  { value: 'process', label: 'Process Name' },
  { value: 'usb', label: 'USB Device' },
  { value: 'time', label: 'Time/Schedule' },
  { value: 'network', label: 'Network Connection' },
  { value: 'risk_threshold', label: 'Risk Score Threshold' },
  { value: 'sequence', label: 'Event Sequence' },
];

const operatorOptions: Record<string, { value: string; label: string }[]> = {
  keyword: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'regex', label: 'Regex Match' },
  ],
  url: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'regex', label: 'Regex Match' },
    { value: 'in_list', label: 'In Blocklist' },
    { value: 'not_in_list', label: 'Not In Allowlist' },
  ],
  process: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'in_list', label: 'In Blocklist' },
    { value: 'not_in_list', label: 'Not In Allowlist' },
  ],
  usb: [
    { value: 'equals', label: 'Device ID Equals' },
    { value: 'in_list', label: 'In Blocklist' },
  ],
  time: [
    { value: 'greater_than', label: 'After Time' },
    { value: 'less_than', label: 'Before Time' },
  ],
  network: [
    { value: 'in_list', label: 'IP In Blocklist' },
    { value: 'not_in_list', label: 'IP Not In Allowlist' },
  ],
  risk_threshold: [
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
  ],
  sequence: [
    { value: 'equals', label: 'Sequence Matches' },
  ],
};

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const actionOptions = [
  { value: 'alert', label: 'Generate Alert' },
  { value: 'screenshot', label: 'Capture Screenshot' },
  { value: 'lock', label: 'Lock Workstation' },
  { value: 'logoff', label: 'Force Logoff' },
  { value: 'block', label: 'Block Action' },
];

const PoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({ field: 'updatedAt', sort: 'desc' });
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Policy>>({
    name: '',
    description: '',
    enabled: true,
    priority: 100,
    rules: [],
    targets: [{ type: 'all', values: [] }],
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      try {
        const response = await api.getPolicies({ 
          search: searchTerm, 
          page: page + 1, 
          limit: rowsPerPage 
        });
        setPolicies(response.data.policies || response.data);
        setTotalCount(response.data.total || response.data.length);
      } catch (error) {
        console.error('Failed to fetch policies:', error);
        setSnackbar({ open: true, message: 'Failed to load policies', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, [searchTerm, page, rowsPerPage]);

  const handleSort = (field: string) => {
    setSortModel(prev => ({
      field,
      sort: prev.field === field && prev.sort === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleNewPolicy = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      description: '',
      enabled: true,
      priority: 100,
      rules: [],
      targets: [{ type: 'all', values: [] }],
    });
    setFormStep(0);
    setDialogOpen(true);
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({ ...policy });
    setFormStep(0);
    setDialogOpen(true);
  };

  const handleDeletePolicy = async (policy: Policy) => {
    if (!window.confirm(`Delete policy "${policy.name}"? This cannot be undone.`)) return;
    try {
      await api.deletePolicy(policy.id);
      setPolicies(prev => prev.filter(p => p.id !== policy.id));
      setSnackbar({ open: true, message: 'Policy deleted', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete policy', severity: 'error' });
    }
  };

  const handleDuplicatePolicy = async (policy: Policy) => {
    try {
      const newPolicy = { ...policy, id: '', name: `${policy.name} (Copy)`, version: 1 };
      const response = await api.createPolicy(newPolicy);
      setPolicies(prev => [response.data, ...prev]);
      setSnackbar({ open: true, message: 'Policy duplicated', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to duplicate policy', severity: 'error' });
    }
  };

  const handleFormSubmit = async () => {
    try {
      if (editingPolicy) {
        await api.updatePolicy(editingPolicy.id, formData);
        setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? { ...p, ...formData } as Policy : p));
        setSnackbar({ open: true, message: 'Policy updated', severity: 'success' });
      } else {
        const response = await api.createPolicy(formData);
        setPolicies(prev => [response.data, ...prev]);
        setSnackbar({ open: true, message: 'Policy created', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: editingPolicy ? 'Failed to update policy' : 'Failed to create policy', severity: 'error' });
    }
  };

  const handleNextStep = () => setFormStep(prev => Math.min(prev + 1, 2));
  const handleBackStep = () => setFormStep(prev => Math.max(prev - 1, 0));

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...(prev.rules || []), {
        id: `rule_${Date.now()}`,
        type: 'keyword',
        field: 'window_title',
        operator: 'contains',
        value: '',
        severity: 'medium',
        action: 'alert',
        enabled: true,
      }],
    }));
  };

  const updateRule = (index: number, updates: Partial<PolicyRule>) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules?.map((r, i) => i === index ? { ...r, ...updates } : r) || [],
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules?.filter((_, i) => i !== index) || [],
    }));
  };

  const addTarget = () => {
    setFormData(prev => ({
      ...prev,
      targets: [...(prev.targets || []), { type: 'workstation', values: [] }],
    }));
  };

  const updateTarget = (index: number, updates: Partial<PolicyTarget>) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets?.map((t, i) => i === index ? { ...t, ...updates } : t) || [],
    }));
  };

  const removeTarget = (index: number) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets?.filter((_, i) => i !== index) || [],
    }));
  };

  const deployPolicy = async (policy: Policy) => {
    try {
      await api.deployPolicy(policy.id);
      setSnackbar({ open: true, message: 'Policy deployed to all targets', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to deploy policy', severity: 'error' });
    }
  };

  const exportPolicy = async (policy: Policy) => {
    try {
      const response = await api.exportPolicy(policy.id);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${policy.name.replace(/\s+/g, '_')}_policy.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Policy exported', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to export policy', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const activePolicies = policies.filter(p => p.enabled).length;
  const totalRules = policies.reduce((sum, p) => sum + (p.rules?.length || 0), 0);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Policy Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure monitoring rules, detection policies, and deployment targets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Import Policy">
            <IconButton>
              <CloudDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewPolicy}>
            New Policy
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Policies</Typography>
                  <Typography variant="h5" fontWeight={700}>{totalCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <PolicyIcon />
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
                  <Typography variant="caption" color="text.secondary">Active Policies</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">{activePolicies}</Typography>
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
                  <Typography variant="caption" color="text.secondary">Total Rules</Typography>
                  <Typography variant="h5" fontWeight={700}>{totalRules}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <RuleIcon />
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
                  <Typography variant="caption" color="text.secondary">Inactive Policies</Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">{totalCount - activePolicies}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <HighlightOffIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                placeholder="Search policies (name, description, rules)..."
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
            <Typography variant="caption" color="text.secondary">
              Showing {policies.length} of {totalCount} policies
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'name'}
                    direction={sortModel.field === 'name' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Policy Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'enabled'}
                    direction={sortModel.field === 'enabled' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('enabled')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Rules</TableCell>
                <TableCell>Targets</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortModel.field === 'updatedAt'}
                    direction={sortModel.field === 'updatedAt' ? sortModel.sort : 'asc'}
                    onClick={() => handleSort('updatedAt')}
                  >
                    Last Modified
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{policy.name}</Typography>
                    <Typography variant="caption" color="text.secondary">v{policy.version} • by {policy.createdBy}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {policy.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={policy.enabled}
                          onChange={() => { /* toggle enabled */ }}
                          size="small"
                          disabled
                        />
                      }
                      label={policy.enabled ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {policy.rules?.slice(0, 3).map((rule, i) => (
                        <Chip key={i} label={ruleTypeOptions.find(o => o.value === rule.type)?.label || rule.type} size="small" variant="outlined" color={rule.enabled ? 'primary' : 'default'} />
                      ))}
                      {(policy.rules?.length || 0) > 3 && (
                        <Chip label={`+${(policy.rules?.length || 0) - 3} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {policy.targets?.map((target, i) => (
                        <Chip key={i} label={target.type === 'all' ? 'All' : `${target.type}: ${target.values.join(', ')}`} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={policy.priority.toString()} size="small" variant="outlined" color={policy.priority < 50 ? 'error' : policy.priority < 100 ? 'warning' : 'info'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(policy.updatedAt), 'MMM d, yyyy HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleEditPolicy(policy)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditPolicy(policy)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => handleDuplicatePolicy(policy)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Deploy">
                      <IconButton size="small" onClick={() => deployPolicy(policy)} disabled={!policy.enabled}>
                        <CloudUploadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export">
                      <IconButton size="small" onClick={() => exportPolicy(policy)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeletePolicy(policy)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {policies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PolicyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">No policies configured</Typography>
                      <Typography variant="body2" color="text.secondary">Create your first monitoring policy</Typography>
                      <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewPolicy} sx={{ mt: 2 }}>
                        Create Policy
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Card>

      {/* Policy Editor Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="h6">{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</Typography>
            <Stepper activeStep={formStep} alternativeLabel sx={{ flexGrow: 1, ml: 2 }}>
              <Step>
                <StepLabel>Basic Info</StepLabel>
              </Step>
              <Step>
                <StepLabel>Rules</StepLabel>
              </Step>
              <Step>
                <StepLabel>Targets & Deploy</StepLabel>
              </Step>
            </Stepper>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {formStep === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Policy Name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Priority"
                    type="number"
                    value={formData.priority || 100}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) })}
                    inputProps={{ min: 1, max: 1000 }}
                    helperText="Lower numbers = higher priority"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} />}
                    label="Enable this policy immediately"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          {formStep === 1 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Detection Rules</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addRule} size="small">Add Rule</Button>
              </Box>
              {(formData.rules || []).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <RuleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No rules defined</Typography>
                  <Typography variant="body2" color="text.secondary">Add detection rules to define what triggers alerts</Typography>
                </Box>
              ) : (
                <Box>
                  {(formData.rules || []).map((rule, index) => (
                    <Card key={rule.id} sx={{ mb: 2 }}>
                      <CardHeader
                        title={ruleTypeOptions.find(o => o.value === rule.type)?.label || rule.type}
                        subheader={rule.description}
                        action={
                          <IconButton onClick={() => removeRule(index)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel id="rule-type-label">Rule Type</InputLabel>
                              <Select
                                value={rule.type}
                                label="Rule Type"
                                onChange={(e) => updateRule(index, { type: e.target.value as any, operator: operatorOptions[e.target.value]?.[0]?.value || 'contains' })}
                              >
                                {ruleTypeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel id="rule-operator-label">Operator</InputLabel>
                              <Select
                                value={rule.operator}
                                label="Operator"
                                onChange={(e) => updateRule(index, { operator: e.target.value as any })}
                              >
                                {operatorOptions[rule.type]?.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Field"
                              value={rule.field}
                              onChange={(e) => updateRule(index, { field: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Value"
                              value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                              onChange={(e) => updateRule(index, { value: e.target.value.split(',').map(v => v.trim()) })}
                              placeholder="Comma-separated values"
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                              <InputLabel id="rule-severity-label">Severity</InputLabel>
                              <Select
                                value={rule.severity}
                                label="Severity"
                                onChange={(e) => updateRule(index, { severity: e.target.value as any })}
                              >
                                {severityOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                              <InputLabel id="rule-action-label">Action</InputLabel>
                              <Select
                                value={rule.action}
                                label="Action"
                                onChange={(e) => updateRule(index, { action: e.target.value as any })}
                              >
                                {actionOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControlLabel
                              control={<Switch checked={rule.enabled} onChange={(e) => updateRule(index, { enabled: e.target.checked })} />}
                              label="Enabled"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Description (optional)"
                              value={rule.description || ''}
                              onChange={(e) => updateRule(index, { description: e.target.value })}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {formStep === 2 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Deployment Targets</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addTarget} size="small">Add Target</Button>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Define which workstations, users, or groups this policy applies to
              </Typography>
              {(formData.targets || []).map((target, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel id="target-type-label">Target Type</InputLabel>
                          <Select
                            value={target.type}
                            label="Target Type"
                            onChange={(e) => updateTarget(index, { type: e.target.value as any })}
                          >
                            <MenuItem value="all">All Workstations</MenuItem>
                            <MenuItem value="workstation">Specific Workstations</MenuItem>
                            <MenuItem value="user">Specific Users</MenuItem>
                            <MenuItem value="group">User Groups</MenuItem>
                            <MenuItem value="lab">Computer Labs</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={target.type === 'all' ? 'N/A (applies to all)' : `Values (comma-separated ${target.type}s)`}
                          value={target.values.join(', ')}
                          onChange={(e) => updateTarget(index, { values: e.target.value.split(',').map(v => v.trim()) })}
                          disabled={target.type === 'all'}
                          placeholder={target.type === 'all' ? 'Applies to all' : 'e.g., WS-001, WS-002'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <IconButton onClick={() => removeTarget(index)} color="error" size="small" disabled={(formData.targets || []).length <= 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>Deployment</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => editingPolicy && deployPolicy(editingPolicy)} disabled={!editingPolicy || !formData.enabled} size="large" fullWidth>
                    Deploy Policy
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={() => editingPolicy && exportPolicy(editingPolicy)} disabled={!editingPolicy} size="large" fullWidth>
                    Export Policy
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {formStep > 0 && (
            <Button onClick={handleBackStep} startIcon={<ExpandLessIcon />}>Back</Button>
          )}
          {formStep < 2 && (
            <Button onClick={handleNextStep} endIcon={<ExpandMoreIcon />}>Next</Button>
          )}
          {formStep === 2 && (
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleFormSubmit}>
              {editingPolicy ? 'Save Changes' : 'Create Policy'}
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
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
const AddIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const VisibilityIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const RefreshIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const PolicyIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const RuleIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>;
const CheckCircleIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const HighlightOffIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>;
const CloudUploadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>;
const CloudDownloadIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>;
const ContentCopyIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>;
const CancelIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>;
const ExpandMoreIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg>;
const ExpandLessIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>;

export default PoliciesPage;