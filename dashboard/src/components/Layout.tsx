import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse,
  ListItemButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DesktopMac as WorkstationIcon,
  People as UsersIcon,
  History as SessionsIcon,
  Visibility as ActivitiesIcon,
  PhotoCamera as ScreenshotsIcon,
  Warning as AlertsIcon,
  Settings as PoliciesIcon,
  Assessment as ReportsIcon,
  Folder as EvidenceIcon,
  Build as SettingsIcon,
  Security as AuditIcon,
  Logout,
  Person,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Notifications,
  Refresh,
  Help,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon />, permission: 'view_dashboard' },
  { path: '/workstations', label: 'Workstations', icon: <WorkstationIcon />, permission: 'view_workstations' },
  { path: '/users', label: 'Users', icon: <UsersIcon />, permission: 'view_users' },
  { path: '/sessions', label: 'Sessions', icon: <SessionsIcon />, permission: 'view_sessions' },
  { path: '/activities', label: 'Activities', icon: <ActivitiesIcon />, permission: 'view_activities' },
  { path: '/screenshots', label: 'Screenshots', icon: <ScreenshotsIcon />, permission: 'view_screenshots' },
  { path: '/alerts', label: 'Alerts', icon: <AlertsIcon />, permission: 'view_alerts' },
  { path: '/policies', label: 'Policies', icon: <PoliciesIcon />, permission: 'manage_policies' },
  { path: '/reports', label: 'Reports', icon: <ReportsIcon />, permission: 'view_reports' },
  { path: '/evidence-vault', label: 'Evidence Vault', icon: <EvidenceIcon />, permission: 'view_evidence' },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon />, permission: 'manage_settings' },
  { path: '/audit-logs', label: 'Audit Logs', icon: <AuditIcon />, permission: 'view_audit_logs' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { connected, alerts, workstations } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const unreadAlerts = alerts.filter(a => !a.acknowledged && !a.resolved).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;

  const drawerWidth = collapsed ? 72 : 260;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: 1100,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>
          
          <IconButton
            color="inherit"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ mr: 2, display: { md: 'flex' } }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>

          <Typography
            variant="h6"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' }, fontWeight: 700 }}
          >
            College Monitor
          </Typography>

          {/* Connection Status */}
          <Tooltip title={connected ? 'Connected to server' : 'Disconnected from server'}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: connected ? 'success.light' : 'error.light',
                color: connected ? 'success.dark' : 'error.dark',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: connected ? 'success.main' : 'error.main',
                  mr: 1,
                  animation: connected ? 'pulse 2s infinite' : 'none',
                }}
              />
              {connected ? 'Live' : 'Offline'}
            </Box>
          </Tooltip>

          {/* Alerts Badge */}
          <Tooltip title={`${unreadAlerts} unread alerts${criticalAlerts > 0 ? ` (${criticalAlerts} critical)` : ''}`}>
            <IconButton color="inherit" onClick={() => navigate('/alerts')}>
              <Badge
                badgeContent={unreadAlerts > 99 ? '99+' : unreadAlerts}
                color="error"
                invisible={unreadAlerts === 0}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Refresh Button */}
          <Tooltip title="Refresh data">
            <IconButton color="inherit" onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <IconButton
            size="small"
            aria-controls="user-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
              alt={user?.fullName || user?.username}
            >
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { mt: 1, minWidth: 200 } }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={600}>{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                <span
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {user?.role}
                </span>
              </Typography>
            </Box>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Profile" />
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        <Sidebar collapsed={false} onItemClick={handleDrawerToggle} />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: 'hidden',
          },
        }}
      >
        <Sidebar collapsed={collapsed} onItemClick={() => {}} />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

const Sidebar: React.FC<{ collapsed: boolean; onItemClick: () => void }> = ({ collapsed, onItemClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              CM
            </Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              College Monitor
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              CM
            </Box>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List component="nav" disablePadding>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? 'primary.main' : 'inherit',
                backgroundColor: isActive ? 'primary.light' : 'transparent',
                opacity: isActive ? 1 : 0.8,
                borderLeft: isActive ? '3px solid' : 'none',
                borderLeftColor: isActive ? 'primary.main' : 'transparent',
              })}
            >
              <ListItemButton
                sx={{
                  px: collapsed ? 1 : 2,
                  py: 1.25,
                  mx: collapsed ? 0.5 : 1,
                  borderRadius: 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  minHeight: 44,
                }}
                title={collapsed ? item.label : undefined}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 40,
                    color: ({ isActive }) => (isActive ? 'primary.main' : 'inherit'),
                    fontSize: collapsed ? '1.5rem' : '1.25rem',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
            </NavLink>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              alt={user?.fullName || user?.username}
            >
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={600} noWrap>{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              title={user?.fullName}
            >
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Layout;