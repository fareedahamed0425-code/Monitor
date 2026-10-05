using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CollegeMonitor.Shared.DTOs;
using CollegeMonitor.Shared.Models;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Main hosted service that coordinates all client services
/// </summary>
public class ClientHostedService : BackgroundService
{
    private readonly ILogger<ClientHostedService> _logger;
    private readonly IConfigurationService _configService;
    private readonly ILocalStorageService _localStorage;
    private readonly ISystemInfoService _systemInfo;
    private readonly IUserSessionService _userSession;
    private readonly IActivityMonitorService _activityMonitor;
    private readonly IScreenshotService _screenshotService;
    private readonly INetworkService _networkService;
    private readonly IStealthService _stealthService;
    private readonly IWatchdogService _watchdogService;
    private readonly IIntegrityService _integrityService;
    
    private bool _isInitialized = false;
    
    public ClientHostedService(
        ILogger<ClientHostedService> logger,
        IConfigurationService configService,
        ILocalStorageService localStorage,
        ISystemInfoService systemInfo,
        IUserSessionService userSession,
        IActivityMonitorService activityMonitor,
        IScreenshotService screenshotService,
        INetworkService networkService,
        IStealthService stealthService,
        IWatchdogService watchdogService,
        IIntegrityService integrityService)
    {
        _logger = logger;
        _configService = configService;
        _localStorage = localStorage;
        _systemInfo = systemInfo;
        _userSession = userSession;
        _activityMonitor = activityMonitor;
        _screenshotService = screenshotService;
        _networkService = networkService;
        _stealthService = stealthService;
        _watchdogService = watchdogService;
        _integrityService = integrityService;
    }
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CollegeMonitor Client Service starting...");
        
        try
        {
            // Initialize all services
            await InitializeServicesAsync(stoppingToken);
            
            _logger.LogInformation("CollegeMonitor Client Service started successfully");
            
            // Keep running until cancellation
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                
                // Periodic maintenance
                await PerformMaintenanceAsync();
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Service stopping due to cancellation");
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "Fatal error in client service");
            throw;
        }
        finally
        {
            await ShutdownServicesAsync();
        }
    }
    
    private async Task InitializeServicesAsync(CancellationToken cancellationToken)
    {
        _logger.LogDebug("Initializing services...");
        
        // Initialize local storage first
        await _localStorage.InitializeAsync();
        
        // Apply stealth measures
        await _stealthService.ApplyStealthMeasuresAsync();
        
        // Start integrity checking
        await _integrityService.StartAsync();
        
        // Start watchdog
        await _watchdogService.StartAsync();
        
        // Start network service
        await _networkService.StartAsync();
        
        // Start user session tracking
        await _userSession.StartTrackingAsync();
        
        // Start activity monitoring
        await _activityMonitor.StartMonitoringAsync();
        
        // Start screenshot service
        await _screenshotService.StartAsync();
        
        // Subscribe to events
        SubscribeToEvents();
        
        _isInitialized = true;
        _logger.LogDebug("All services initialized");
    }
    
    private void SubscribeToEvents()
    {
        // Network events
        _networkService.ConnectionStatusChanged += OnConnectionStatusChanged;
        _networkService.CommandReceived += OnCommandReceived;
        _networkService.PolicyUpdated += OnPolicyUpdated;
        
        // Activity monitor events
        _activityMonitor.ActivityDetected += OnActivityDetected;
        _activityMonitor.AlertTriggered += OnAlertTriggered;
        
        // Screenshot events
        _screenshotService.ScreenshotCaptured += OnScreenshotCaptured;
        
        // Watchdog events
        _watchdogService.ServiceRestartRequired += OnServiceRestartRequired;
        
        // Integrity events
        _integrityService.IntegrityViolationDetected += OnIntegrityViolation;
        
        // Config changes
        _configService.ConfigurationChanged += OnConfigurationChanged;
    }
    
    private void OnConnectionStatusChanged(object? sender, bool isConnected)
    {
        _logger.LogInformation("Network connection status changed: {Status}", isConnected ? "Connected" : "Disconnected");
    }
    
    private async void OnCommandReceived(object? sender, ServerCommand command)
    {
        _logger.LogInformation("Received command: {Command}", command.Command);
        
        try
        {
            switch (command.Command)
            {
                case CommandType.RequestScreenshot:
                    var reason = command.Parameters.GetValueOrDefault("reason", "AdminRequest").ToString();
                    var activeOnly = command.Parameters.GetValueOrDefault("activeWindowOnly", false);
                    if (bool.TryParse(activeOnly?.ToString(), out var activeWindowOnly))
                    {
                        await _screenshotService.CaptureScreenshotAsync(reason, activeWindowOnly);
                    }
                    else
                    {
                        await _screenshotService.CaptureScreenshotAsync(reason);
                    }
                    break;
                    
                case CommandType.LockWorkstation:
                    LockWorkstation();
                    break;
                    
                case CommandType.LogoffUser:
                    LogoffUser();
                    break;
                    
                case CommandType.UpdatePolicy:
                case CommandType.UpdateConfig:
                    if (command.Parameters.TryGetValue("policy", out var policyObj))
                    {
                        var policyJson = Newtonsoft.Json.JsonConvert.SerializeObject(policyObj);
                        var policy = Newtonsoft.Json.JsonConvert.DeserializeObject<MonitoringPolicy>(policyJson);
                        if (policy != null)
                        {
                            await _configService.UpdateMonitoringPolicyAsync(policy);
                        }
                    }
                    break;
                    
                case CommandType.Ping:
                    // Respond with pong (handled by network service)
                    break;
                    
                case CommandType.RestartService:
                    _logger.LogWarning("Restart command received, triggering restart");
                    OnServiceRestartRequired(this, EventArgs.Empty);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process command: {Command}", command.Command);
        }
    }
    
    private async void OnPolicyUpdated(object? sender, MonitoringPolicy policy)
    {
        _logger.LogInformation("Policy updated from server, version: {Version}", policy.Version);
        
        try
        {
            await _configService.UpdateMonitoringPolicyAsync(policy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to apply policy update");
        }
    }
    
    private async void OnActivityDetected(object? sender, ActivityLogPayload activity)
    {
        // Send to network service
        await _networkService.SendActivityLogAsync(activity);
    }
    
    private async void OnAlertTriggered(object? sender, AlertTriggeredPayload alert)
    {
        // Send alert to server immediately
        await _networkService.SendAlertAsync(alert);
        
        // Also capture screenshot for evidence
        if (_configService.Monitoring.CaptureOnTrigger)
        {
            await _screenshotService.CaptureScreenshotAsync($"Alert: {alert.AlertType}");
        }
    }
    
    private async void OnScreenshotCaptured(object? sender, ScreenshotUploadPayload screenshot)
    {
        // Send screenshot to server
        await _networkService.SendScreenshotAsync(screenshot);
    }
    
    private void OnServiceRestartRequired(object? sender, EventArgs e)
    {
        _logger.LogCritical("Service restart required by watchdog");
        // In a real scenario, this would trigger a service restart
        // For now, we'll log and continue
    }
    
    private void OnIntegrityViolation(object? sender, string violation)
    {
        _logger.LogCritical("Integrity violation detected: {Violation}", violation);
        
        // Alert server
        var alert = new AlertTriggeredPayload
        {
            SessionId = _userSession.GetCurrentSession()?.SessionId ?? "system",
            AlertType = AlertType.ServiceTermination,
            Severity = RiskLevel.Alert,
            Description = $"Integrity violation: {violation}",
            Context = new Dictionary<string, object>
            {
                ["violation"] = violation,
                ["timestamp"] = DateTime.UtcNow.ToString("O")
            }
        };
        
        _ = _networkService.SendAlertAsync(alert);
    }
    
    private void OnConfigurationChanged(object? sender, ConfigurationChangedEventArgs e)
    {
        _logger.LogInformation("Configuration changed: {Section}", e.SectionName);
        
        // Notify network service to send updated config to server
        // This would be implemented based on requirements
    }
    
    private void LockWorkstation()
    {
        try
        {
            // Lock workstation using Windows API
            var result = LockWorkStation();
            if (!result)
            {
                _logger.LogWarning("Failed to lock workstation, error: {Error}", Marshal.GetLastWin32Error());
            }
            else
            {
                _logger.LogInformation("Workstation locked successfully");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error locking workstation");
        }
    }
    
    private void LogoffUser()
    {
        try
        {
            // Logoff user using Windows API
            var result = ExitWindowsEx(0x00000000, 0); // EWX_LOGOFF
            if (!result)
            {
                _logger.LogWarning("Failed to logoff user, error: {Error}", Marshal.GetLastWin32Error());
            }
            else
            {
                _logger.LogInformation("User logoff initiated");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging off user");
        }
    }
    
    private async Task PerformMaintenanceAsync()
    {
        try
        {
            // Cleanup old data
            await _localStorage.CleanupOldDataAsync();
            
            // Check storage space
            if (await _localStorage.IsStorageFullAsync())
            {
                _logger.LogWarning("Local storage is full, cleanup may be needed");
            }
            
            // Verify integrity
            await _integrityService.VerifyIntegrityAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during maintenance");
        }
    }
    
    private async Task ShutdownServicesAsync()
    {
        _logger.LogInformation("Shutting down services...");
        
        try
        {
            await _screenshotService.StopAsync();
        }
        catch (Exception ex) { _logger.LogError(ex, "Error stopping screenshot service"); }
        
        try
        {
            await _activityMonitor.StopMonitoringAsync();
        }
        catch (Exception ex) { _logger.LogError(ex, "Error stopping activity monitor"); }
        
        try
        {
            await _userSession.StopTrackingAsync();
        }
        catch (Exception ex) { _logger.LogError(ex, "Error stopping user session tracking"); }
        
        try
        {
            await _networkService.StopAsync();
        }
        catch (Exception ex) { _logger.LogError(ex, "Error stopping network service"); }
        
        try
        {
            await _watchdogService.StopAsync();
        }
        catch (Exception ex) { _logger.LogError(ex, "Error stopping watchdog"); }
        
        try
        {
            await _integrityService.StopAsync();
        }
        catch (Exception ex) { _logger.LogError(ex, "Error stopping integrity service"); }
        
        _logger.LogInformation("All services stopped");
    }
    
    // P/Invoke for system commands
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool LockWorkStation();
    
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool ExitWindowsEx(uint uFlags, uint dwReason);
    
    [System.Runtime.InteropServices.DllImport("kernel32.dll")]
    private static extern int Marshal.GetLastWin32Error();
}