import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  Link,
  Grid,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email, Security, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setError('');
    setLoading(true);
    
    const credentials = {
      superadmin: { username: 'admin', password: 'admin123' },
      admin: { username: 'admin', password: 'admin123' },
      analyst: { username: 'analyst', password: 'analyst123' },
      viewer: { username: 'viewer', password: 'viewer123' },
    };

    try {
      await login(credentials[role as keyof typeof credentials].username, credentials[role as keyof typeof credentials].password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo login failed. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8eaf6 100%)',
        p: 2,
      }}
    >
      <Grid container spacing={3} alignItems="center" justifyContent="center">
        {/* Login Card */}
        <Grid item xs={12} sm={8} md={5} lg={4}>
          <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '2rem',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  CM
                </Box>
                <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
                  College Monitor
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  PC Security & Monitoring System
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="username"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </form>

              <Divider sx={{ my: 3 }} variant="inset" />

              {/* Demo Accounts */}
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" gutterBottom>
                Demo Accounts (for testing)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin('superadmin')}
                  disabled={loading}
                  startIcon={<SecurityIcon fontSize="small" />}
                >
                  Super Admin
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  startIcon={<SecurityIcon fontSize="small" />}
                >
                  Admin
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin('analyst')}
                  disabled={loading}
                  startIcon={<VisibilityIcon fontSize="small" />}
                >
                  Analyst
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin('viewer')}
                  disabled={loading}
                  startIcon={<VisibilityIcon fontSize="small" />}
                >
                  Viewer
                </Button>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Default credentials: admin / admin123
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Make sure the backend server is running on port 3000
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Features */}
          <Paper elevation={1} sx={{ mt: 3, p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              System Features
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption">Real-time Monitoring</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption">Automated Alerts</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption">Evidence Capture</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption">Remote Control</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} sm={8} md={7} lg={8} style={{ display: { xs: 'none', md: 'block' } }}>
          <Paper elevation={0} sx={{ p: 4, background: 'transparent' }}>
            <Typography variant="h3" fontWeight={700} color="primary.dark" gutterBottom>
              Comprehensive Security Monitoring
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom paragraph>
              Protect your educational institution's computer labs with enterprise-grade monitoring,
              real-time threat detection, and automated evidence collection.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <SecurityIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Stealth Client Service</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Runs as a Windows Service before user login, invisible to Task Manager, 
                    tamper-proof with watchdog protection and integrity verification.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <VisibilityIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Intelligent Activity Monitoring</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Tracks active windows, processes, URLs, file access, USB devices, and clipboard 
                    with configurable risk scoring and automated screenshot triggers.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <PhotoCameraIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Evidence Collection</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Watermarked screenshots with metadata (user, timestamp, machine) captured on 
                    suspicious activity, stored securely with chain-of-custody integrity.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <BuildIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Remote Administration</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Real-time dashboard with live PC grid, remote commands (lock, logoff, screenshot), 
                    policy management, and comprehensive reporting with export capabilities.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;