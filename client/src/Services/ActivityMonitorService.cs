using System.Diagnostics;
using System.Management;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;
using CollegeMonitor.Shared.DTOs;
using CollegeMonitor.Shared.Models;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for activity monitoring service
/// </summary>
public interface IActivityMonitorService
{
    event EventHandler<ActivityLogPayload>? ActivityDetected;
    event EventHandler<AlertTriggeredPayload>? AlertTriggered;
    
    Task StartMonitoringAsync();
    Task StopMonitoringAsync();
    Task<ActivityLogPayload?> GetCurrentActivityAsync();
}

/// <summary>
/// Service for monitoring user activity
/// </summary>
public class ActivityMonitorService : IActivityMonitorService, IDisposable
{
    private readonly ILogger<ActivityMonitorService> _logger;
    private readonly MonitoringConfig _monitoringConfig;
    private readonly IUserSessionService _userSession;
    private readonly ILocalStorageService _localStorage;
    
    private Timer? _windowCheckTimer;
    private Timer? _processCheckTimer;
    private Timer? _usbCheckTimer;
    private Timer? _networkCheckTimer;
    private Timer? _clipboardCheckTimer;
    
    private string? _lastWindowTitle;
    private string? _lastProcessName;
    private IntPtr _lastWindowHandle;
    private HashSet<int> _knownProcessIds = new();
    private HashSet<string> _knownUsbDevices = new();
    private string? _lastClipboardText;
    private bool _isMonitoring = false;
    private readonly object _lock = new();
    
    // P/Invoke for window tracking
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();
    
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
    
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern int GetWindowTextLength(IntPtr hWnd);
    
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);
    
    public event EventHandler<ActivityLogPayload>? ActivityDetected;
    public event EventHandler<AlertTriggeredPayload>? AlertTriggered;
    
    public ActivityMonitorService(
        ILogger<ActivityMonitorService> logger,
        IOptions<MonitoringConfig> monitoringConfig,
        IUserSessionService userSession,
        ILocalStorageService localStorage)
    {
        _logger = logger;
        _monitoringConfig = monitoringConfig.Value;
        _userSession = userSession;
        _localStorage = localStorage;
    }
    
    public async Task StartMonitoringAsync()
    {
        lock (_lock)
        {
            if (_isMonitoring) return;
            _isMonitoring = true;
        }
        
        _logger.LogInformation("Starting activity monitoring");
        
        // Subscribe to session events
        _userSession.SessionStarted += OnSessionStarted;
        _userSession.SessionEnded += OnSessionEnded;
        
        // Start monitoring timers
        _windowCheckTimer = new Timer(CheckActiveWindow, null, TimeSpan.Zero, TimeSpan.FromSeconds(2));
        _processCheckTimer = new Timer(CheckProcesses, null, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
        
        if (_monitoringConfig.MonitorUsb)
        {
            _usbCheckTimer = new Timer(CheckUsbDevices, null, TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(10));
        }
        
        if (_monitoringConfig.MonitorNetworkConnections)
        {
            _networkCheckTimer = new Timer(CheckNetworkConnections, null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));
        }
        
        if (_monitoringConfig.MonitorClipboard)
        {
            _clipboardCheckTimer = new Timer(CheckClipboard, null, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
        }
        
        // Initial checks
        await CheckActiveWindow(null);
        await CheckProcesses(null);
    }
    
    public async Task StopMonitoringAsync()
    {
        lock (_lock)
        {
            if (!_isMonitoring) return;
            _isMonitoring = false;
        }
        
        _logger.LogInformation("Stopping activity monitoring");
        
        _userSession.SessionStarted -= OnSessionStarted;
        _userSession.SessionEnded -= OnSessionEnded;
        
        _windowCheckTimer?.Dispose();
        _processCheckTimer?.Dispose();
        _usbCheckTimer?.Dispose();
        _networkCheckTimer?.Dispose();
        _clipboardCheckTimer?.Dispose();
        
        _windowCheckTimer = null;
        _processCheckTimer = null;
        _usbCheckTimer = null;
        _networkCheckTimer = null;
        _clipboardCheckTimer = null;
    }
    
    public async Task<ActivityLogPayload?> GetCurrentActivityAsync()
    {
        try
        {
            var windowTitle = GetActiveWindowTitle();
            var processName = GetActiveProcessName();
            
            if (string.IsNullOrEmpty(windowTitle) || string.IsNullOrEmpty(processName))
                return null;
            
            return new ActivityLogPayload
            {
                SessionId = _userSession.GetCurrentSession()?.SessionId ?? string.Empty,
                ActivityType = ActivityType.WindowChange,
                Details = $"Window: {windowTitle} | Process: {processName}",
                RiskLevel = AssessRiskLevel(windowTitle, processName, string.Empty),
                Metadata = new Dictionary<string, object>
                {
                    ["window_title"] = windowTitle,
                    ["process_name"] = processName
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current activity");
            return null;
        }
    }
    
    private void OnSessionStarted(object? sender, SessionStartPayload session)
    {
        _logger.LogDebug("Session started, resetting activity tracking state");
        _lastWindowTitle = null;
        _lastProcessName = null;
        _lastWindowHandle = IntPtr.Zero;
        _knownProcessIds.Clear();
    }
    
    private void OnSessionEnded(object? sender, SessionEndPayload session)
    {
        _logger.LogDebug("Session ended, clearing activity tracking state");
        _lastWindowTitle = null;
        _lastProcessName = null;
        _lastWindowHandle = IntPtr.Zero;
        _knownProcessIds.Clear();
    }
    
    private async void CheckActiveWindow(object? state)
    {
        if (!_isMonitoring || !_userSession.IsUserLoggedIn()) return;
        
        try
        {
            var foregroundWindow = GetForegroundWindow();
            
            if (foregroundWindow == IntPtr.Zero || foregroundWindow == _lastWindowHandle)
                return;
            
            if (!IsWindowVisible(foregroundWindow))
                return;
            
            var windowTitle = GetWindowTitle(foregroundWindow);
            var processName = GetProcessNameFromWindow(foregroundWindow);
            
            if (string.IsNullOrEmpty(windowTitle) || string.IsNullOrEmpty(processName))
                return;
            
            // Check if window actually changed
            if (string.Equals(windowTitle, _lastWindowTitle, StringComparison.Ordinal) &&
                string.Equals(processName, _lastProcessName, StringComparison.Ordinal))
            {
                return;
            }
            
            _lastWindowHandle = foregroundWindow;
            _lastWindowTitle = windowTitle;
            _lastProcessName = processName;
            
            var session = _userSession.GetCurrentSession();
            if (session == null) return;
            
            var riskLevel = AssessRiskLevel(windowTitle, processName, string.Empty);
            
            var activity = new ActivityLogPayload
            {
                SessionId = session.SessionId,
                ActivityType = ActivityType.WindowChange,
                Details = $"Window: {windowTitle} | Process: {processName}",
                RiskLevel = riskLevel,
                Metadata = new Dictionary<string, object>
                {
                    ["window_title"] = windowTitle,
                    ["process_name"] = processName,
                    ["window_handle"] = foregroundWindow.ToString()
                }
            };
            
            // Save to local storage
            await _localStorage.SaveActivityLogAsync(activity);
            
            // Notify subscribers
            ActivityDetected?.Invoke(this, activity);
            
            // Check for alerts
            await CheckForAlertsAsync(activity, windowTitle, processName, string.Empty);
            
            // Trigger screenshot if configured
            if (_monitoringConfig.CaptureOnWindowChange && riskLevel >= RiskLevel.Attention)
            {
                // Screenshot will be triggered by the screenshot service
                _logger.LogDebug("Window change with risk level {RiskLevel}, screenshot may be triggered", riskLevel);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking active window");
        }
    }
    
    private async void CheckProcesses(object? state)
    {
        if (!_isMonitoring || !_userSession.IsUserLoggedIn()) return;
        
        try
        {
            var currentProcesses = Process.GetProcesses()
                .Where(p => !IsSystemProcess(p.ProcessName))
                .Select(p => new { p.Id, p.ProcessName, p.MainWindowTitle })
                .ToList();
            
            var currentProcessIds = currentProcesses.Select(p => p.Id).ToHashSet();
            
            // Detect new processes
            var newProcessIds = currentProcessIds.Except(_knownProcessIds).ToList();
            foreach (var pid in newProcessIds)
            {
                var proc = currentProcesses.First(p => p.Id == pid);
                await LogProcessActivityAsync(proc.ProcessName, proc.MainWindowTitle, ActivityType.ProcessStart);
            }
            
            // Detect ended processes
            var endedProcessIds = _knownProcessIds.Except(currentProcessIds).ToList();
            foreach (var pid in endedProcessIds)
            {
                // We don't have the process name anymore, but we can log the event
                await LogProcessActivityAsync($"PID:{pid}", string.Empty, ActivityType.ProcessEnd);
            }
            
            _knownProcessIds = currentProcessIds;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking processes");
        }
    }
    
    private async void CheckUsbDevices(object? state)
    {
        if (!_isMonitoring || !_userSession.IsUserLoggedIn()) return;
        
        try
        {
            var currentUsbDevices = GetUsbDevices();
            var currentDeviceIds = currentUsbDevices.Select(d => d.DeviceId).ToHashSet();
            
            // Detect new USB devices
            var newDevices = currentDeviceIds.Except(_knownUsbDevices).ToList();
            foreach (var deviceId in newDevices)
            {
                var device = currentUsbDevices.First(d => d.DeviceId == deviceId);
                await LogUsbActivityAsync(device, true);
            }
            
            // Detect removed USB devices
            var removedDevices = _knownUsbDevices.Except(currentDeviceIds).ToList();
            foreach (var deviceId in removedDevices)
            {
                await LogUsbActivityAsync(new UsbDeviceInfo { DeviceId = deviceId }, false);
            }
            
            _knownUsbDevices = currentDeviceIds;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking USB devices");
        }
    }
    
    private async void CheckNetworkConnections(object? state)
    {
        if (!_isMonitoring || !_userSession.IsUserLoggedIn()) return;
        
        try
        {
            // Get active network connections
            var connections = GetActiveNetworkConnections();
            
            foreach (var conn in connections)
            {
                // Check for suspicious connections
                if (IsSuspiciousConnection(conn.RemoteAddress, conn.RemotePort))
                {
                    var session = _userSession.GetCurrentSession();
                    if (session == null) continue;
                    
                    var activity = new ActivityLogPayload
                    {
                        SessionId = session.SessionId,
                        ActivityType = ActivityType.NetworkConnection,
                        Details = $"Network connection to {conn.RemoteAddress}:{conn.RemotePort} from {conn.LocalAddress}:{conn.LocalPort} (PID: {conn.ProcessId})",
                        RiskLevel = RiskLevel.Alert,
                        Metadata = new Dictionary<string, object>
                        {
                            ["local_address"] = conn.LocalAddress,
                            ["local_port"] = conn.LocalPort,
                            ["remote_address"] = conn.RemoteAddress,
                            ["remote_port"] = conn.RemotePort,
                            ["process_id"] = conn.ProcessId,
                            ["protocol"] = conn.Protocol
                        }
                    };
                    
                    await _localStorage.SaveActivityLogAsync(activity);
                    ActivityDetected?.Invoke(this, activity);
                    
                    // Trigger alert
                    var alert = new AlertTriggeredPayload
                    {
                        SessionId = session.SessionId,
                        AlertType = AlertType.MaliciousNetwork,
                        Severity = RiskLevel.Alert,
                        Description = $"Suspicious network connection to {conn.RemoteAddress}:{conn.RemotePort}",
                        Context = new Dictionary<string, object>
                        {
                            ["remote_address"] = conn.RemoteAddress,
                            ["remote_port"] = conn.RemotePort,
                            ["process_id"] = conn.ProcessId
                        }
                    };
                    
                    await _localStorage.SaveAlertAsync(alert);
                    AlertTriggered?.Invoke(this, alert);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking network connections");
        }
    }
    
    private async void CheckClipboard(object? state)
    {
        if (!_isMonitoring || !_userSession.IsUserLoggedIn()) return;
        
        try
        {
            // Note: Accessing clipboard from a service requires special handling
            // This is a simplified version - in production, you'd need a separate UI-accessible process
            if (System.Windows.Forms.Clipboard.ContainsText())
            {
                var text = System.Windows.Forms.Clipboard.GetText();
                
                if (!string.Equals(text, _lastClipboardText, StringComparison.Ordinal))
                {
                    _lastClipboardText = text;
                    
                    // Check for sensitive data patterns
                    if (ContainsSensitiveData(text))
                    {
                        var session = _userSession.GetCurrentSession();
                        if (session == null) return;
                        
                        var activity = new ActivityLogPayload
                        {
                            SessionId = session.SessionId,
                            ActivityType = ActivityType.ClipboardChange,
                            Details = "Clipboard content changed (potential sensitive data detected)",
                            RiskLevel = RiskLevel.Attention,
                            Metadata = new Dictionary<string, object>
                            {
                                ["content_length"] = text.Length,
                                ["content_preview"] = text.Length > 100 ? text[..100] + "..." : text
                            }
                        };
                        
                        await _localStorage.SaveActivityLogAsync(activity);
                        ActivityDetected?.Invoke(this, activity);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking clipboard");
        }
    }
    
    private async Task LogProcessActivityAsync(string processName, string windowTitle, ActivityType activityType)
    {
        var session = _userSession.GetCurrentSession();
        if (session == null) return;
        
        var riskLevel = AssessRiskLevel(windowTitle, processName, string.Empty);
        
        var activity = new ActivityLogPayload
        {
            SessionId = session.SessionId,
            ActivityType = activityType,
            Details = $"Process: {processName} | Window: {windowTitle}",
            RiskLevel = riskLevel,
            Metadata = new Dictionary<string, object>
            {
                ["process_name"] = processName,
                ["window_title"] = windowTitle
            }
        };
        
        await _localStorage.SaveActivityLogAsync(activity);
        ActivityDetected?.Invoke(this, activity);
        
        await CheckForAlertsAsync(activity, windowTitle, processName, string.Empty);
    }
    
    private async Task LogUsbActivityAsync(UsbDeviceInfo device, bool connected)
    {
        var session = _userSession.GetCurrentSession();
        if (session == null) return;
        
        var activity = new ActivityLogPayload
        {
            SessionId = session.SessionId,
            ActivityType = connected ? ActivityType.UsbConnected : ActivityType.UsbDisconnected,
            Details = $"USB {(connected ? "connected" : "disconnected")}: {device.Description} ({device.DeviceId})",
            RiskLevel = connected ? RiskLevel.Attention : RiskLevel.Normal,
            Metadata = new Dictionary<string, object>
            {
                ["device_id"] = device.DeviceId,
                ["description"] = device.Description,
                ["manufacturer"] = device.Manufacturer,
                ["connected"] = connected
            }
        };
        
        await _localStorage.SaveActivityLogAsync(activity);
        ActivityDetected?.Invoke(this, activity);
        
        if (connected)
        {
            var alert = new AlertTriggeredPayload
            {
                SessionId = session.SessionId,
                AlertType = AlertType.UsbDevice,
                Severity = RiskLevel.Attention,
                Description = $"USB device connected: {device.Description}",
                Context = new Dictionary<string, object>
                {
                    ["device_id"] = device.DeviceId,
                    ["description"] = device.Description,
                    ["manufacturer"] = device.Manufacturer
                }
            };
            
            await _localStorage.SaveAlertAsync(alert);
            AlertTriggered?.Invoke(this, alert);
        }
    }
    
    private RiskLevel AssessRiskLevel(string windowTitle, string processName, string url)
    {
        var score = 0;
        
        // Check suspicious keywords in window title
        var lowerTitle = windowTitle.ToLowerInvariant();
        foreach (var keyword in _monitoringConfig.SuspiciousKeywords)
        {
            if (lowerTitle.Contains(keyword.ToLowerInvariant()))
            {
                score += 40;
                break; // Only count once
            }
        }
        
        // Check blocked processes
        var lowerProcess = processName.ToLowerInvariant();
        foreach (var blocked in _monitoringConfig.BlockedProcesses)
        {
            if (lowerProcess.Contains(blocked.ToLowerInvariant()))
            {
                score += 50;
                break;
            }
        }
        
        // Check blocked URLs
        if (!string.IsNullOrEmpty(url))
        {
            var lowerUrl = url.ToLowerInvariant();
            foreach (var blocked in _monitoringConfig.BlockedUrls)
            {
                var pattern = blocked.Replace("*", ".*");
                if (System.Text.RegularExpressions.Regex.IsMatch(lowerUrl, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                {
                    score += 50;
                    break;
                }
            }
        }
        
        // Check for system folders access
        if (lowerTitle.Contains("system32") || lowerTitle.Contains("syswow64") || 
            lowerTitle.Contains("windows\\") || lowerTitle.Contains("program files"))
        {
            score += 20;
        }
        
        // Check for admin tools
        var adminTools = new[] { "cmd", "powershell", "regedit", "msconfig", "services.msc", "gpedit.msc", "mmc", "compmgmt.msc" };
        foreach (var tool in adminTools)
        {
            if (lowerProcess.Contains(tool) || lowerTitle.Contains(tool))
            {
                score += 30;
                break;
            }
        }
        
        return score switch
        {
            >= 50 => RiskLevel.Alert,
            >= 21 => RiskLevel.Attention,
            _ => RiskLevel.Normal
        };
    }
    
    private async Task CheckForAlertsAsync(ActivityLogPayload activity, string windowTitle, string processName, string url)
    {
        if (activity.RiskLevel < RiskLevel.Alert) return;
        
        var session = _userSession.GetCurrentSession();
        if (session == null) return;
        
        AlertType alertType;
        string description;
        
        // Determine alert type based on what triggered it
        var lowerTitle = windowTitle.ToLowerInvariant();
        var lowerProcess = processName.ToLowerInvariant();
        
        if (_monitoringConfig.SuspiciousKeywords.Any(k => lowerTitle.Contains(k.ToLowerInvariant())))
        {
            alertType = AlertType.SuspiciousKeyword;
            description = $"Suspicious keyword detected in window title: {windowTitle}";
        }
        else if (_monitoringConfig.BlockedProcesses.Any(p => lowerProcess.Contains(p.ToLowerInvariant())))
        {
            alertType = AlertType.UnauthorizedSoftware;
            description = $"Unauthorized software detected: {processName}";
        }
        else if (!string.IsNullOrEmpty(url) && _monitoringConfig.BlockedUrls.Any(b => 
            System.Text.RegularExpressions.Regex.IsMatch(url.ToLowerInvariant(), b.Replace("*", ".*"), System.Text.RegularExpressions.RegexOptions.IgnoreCase)))
        {
            alertType = AlertType.BlockedWebsite;
            description = $"Blocked website accessed: {url}";
        }
        else
        {
            alertType = AlertType.PolicyViolation;
            description = $"Policy violation detected: {activity.Details}";
        }
        
        var alert = new AlertTriggeredPayload
        {
            SessionId = session.SessionId,
            AlertType = alertType,
            Severity = RiskLevel.Alert,
            Description = description,
            Context = new Dictionary<string, object>
            {
                ["window_title"] = windowTitle,
                ["process_name"] = processName,
                ["activity_type"] = activity.ActivityType.ToString()
            }
        };
        
        await _localStorage.SaveAlertAsync(alert);
        AlertTriggered?.Invoke(this, alert);
    }
    
    private string GetActiveWindowTitle()
    {
        var hWnd = GetForegroundWindow();
        if (hWnd == IntPtr.Zero) return string.Empty;
        return GetWindowTitle(hWnd);
    }
    
    private string GetWindowTitle(IntPtr hWnd)
    {
        try
        {
            var length = GetWindowTextLength(hWnd);
            if (length == 0) return string.Empty;
            
            var sb = new System.Text.StringBuilder(length + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            return sb.ToString();
        }
        catch
        {
            return string.Empty;
        }
    }
    
    private string GetActiveProcessName()
    {
        var hWnd = GetForegroundWindow();
        if (hWnd == IntPtr.Zero) return string.Empty;
        return GetProcessNameFromWindow(hWnd);
    }
    
    private string GetProcessNameFromWindow(IntPtr hWnd)
    {
        try
        {
            GetWindowThreadProcessId(hWnd, out uint processId);
            var process = Process.GetProcessById((int)processId);
            return process.ProcessName;
        }
        catch
        {
            return string.Empty;
        }
    }
    
    private bool IsSystemProcess(string processName)
    {
        var systemProcesses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "system", "idle", "registry", "smss", "csrss", "wininit", "services",
            "lsass", "lsm", "svchost", "winlogon", "fontdrvhost", "dwm",
            "taskhostw", "explorer", "startmenuexperiencehost", "searchapp",
            "textinputhost", "runtimebroker", "settingssynchost", "sihost"
        };
        
        return systemProcesses.Contains(processName);
    }
    
    private List<UsbDeviceInfo> GetUsbDevices()
    {
        var devices = new List<UsbDeviceInfo>();
        
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT DeviceID, Description, Manufacturer FROM Win32_USBHub");
            
            foreach (ManagementObject obj in searcher.Get())
            {
                devices.Add(new UsbDeviceInfo
                {
                    DeviceId = obj["DeviceID"]?.ToString() ?? string.Empty,
                    Description = obj["Description"]?.ToString() ?? "Unknown USB Device",
                    Manufacturer = obj["Manufacturer"]?.ToString() ?? "Unknown"
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get USB devices from WMI");
        }
        
        return devices;
    }
    
    private List<NetworkConnectionInfo> GetActiveNetworkConnections()
    {
        var connections = new List<NetworkConnectionInfo>();
        
        try
        {
            // Use netstat or GetExtendedTcpTable/GetExtendedUdpTable for more detailed info
            // This is a simplified version using WMI
            using var searcher = new ManagementObjectSearcher(
                "SELECT LocalAddress, LocalPort, RemoteAddress, RemotePort, ProcessId, Protocol FROM Win32_NetworkConnection");
            
            foreach (ManagementObject obj in searcher.Get())
            {
                connections.Add(new NetworkConnectionInfo
                {
                    LocalAddress = obj["LocalAddress"]?.ToString() ?? string.Empty,
                    LocalPort = Convert.ToInt32(obj["LocalPort"] ?? 0),
                    RemoteAddress = obj["RemoteAddress"]?.ToString() ?? string.Empty,
                    RemotePort = Convert.ToInt32(obj["RemotePort"] ?? 0),
                    ProcessId = Convert.ToInt32(obj["ProcessId"] ?? 0),
                    Protocol = obj["Protocol"]?.ToString() ?? "TCP"
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get network connections from WMI");
        }
        
        return connections;
    }
    
    private bool IsSuspiciousConnection(string remoteAddress, int remotePort)
    {
        // Check for known malicious IPs (would be loaded from threat intelligence)
        var suspiciousPorts = new[] { 4444, 6667, 6668, 6669, 8080, 8443, 9999, 31337 };
        
        if (suspiciousPorts.Contains(remotePort))
            return true;
        
        // Check for Tor exit nodes, known C2 servers, etc.
        // This would integrate with threat intelligence feeds
        
        return false;
    }
    
    private bool ContainsSensitiveData(string text)
    {
        // Check for patterns like credit cards, SSNs, passwords, API keys
        var patterns = new[]
        {
            @"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", // Credit card
            @"\b\d{3}-\d{2}-\d{4}\b", // SSN
            @"(password|pwd|secret|key|token|api[_-]?key)\s*[:=]\s*\S+", // Credentials
            @"-----BEGIN (RSA |EC )?PRIVATE KEY-----", // Private keys
            @"[a-zA-Z0-9+/]{40,}={0,2}" // Base64 encoded secrets
        };
        
        foreach (var pattern in patterns)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(text, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;
        }
        
        return false;
    }
    
    public void Dispose()
    {
        _windowCheckTimer?.Dispose();
        _processCheckTimer?.Dispose();
        _usbCheckTimer?.Dispose();
        _networkCheckTimer?.Dispose();
        _clipboardCheckTimer?.Dispose();
        
        _userSession.SessionStarted -= OnSessionStarted;
        _userSession.SessionEnded -= OnSessionEnded;
    }
    
    private class UsbDeviceInfo
    {
        public string DeviceId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
    }
    
    private class NetworkConnectionInfo
    {
        public string LocalAddress { get; set; } = string.Empty;
        public int LocalPort { get; set; }
        public string RemoteAddress { get; set; } = string.Empty;
        public int RemotePort { get; set; }
        public int ProcessId { get; set; }
        public string Protocol { get; set; } = string.Empty;
    }
}