using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for watchdog service
/// </summary>
public interface IWatchdogService
{
    Task StartAsync();
    Task StopAsync();
    event EventHandler? ServiceRestartRequired;
}

/// <summary>
/// Watchdog service to monitor and restart the main service if needed
/// </summary>
public class WatchdogService : IWatchdogService, IDisposable
{
    private readonly ILogger<WatchdogService> _logger;
    private readonly SecurityConfig _securityConfig;
    private readonly ServiceConfig _serviceConfig;
    
    private Timer? _checkTimer;
    private bool _isRunning = false;
    private Process? _mainProcess;
    private readonly object _lock = new();
    
    public event EventHandler? ServiceRestartRequired;
    
    public WatchdogService(
        ILogger<WatchdogService> logger,
        IOptions<SecurityConfig> securityConfig,
        IOptions<ServiceConfig> serviceConfig)
    {
        _logger = logger;
        _securityConfig = securityConfig.Value;
        _serviceConfig = serviceConfig.Value;
    }
    
    public async Task StartAsync()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }
        
        if (!_securityConfig.WatchdogEnabled)
        {
            _logger.LogInformation("Watchdog disabled by configuration");
            return;
        }
        
        _logger.LogInformation("Starting watchdog service");
        
        // Get current process as the main process to monitor
        _mainProcess = Process.GetCurrentProcess();
        
        // Start periodic health checks
        _checkTimer = new Timer(CheckServiceHealth, null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));
        
        await Task.CompletedTask;
    }
    
    public async Task StopAsync()
    {
        lock (_lock)
        {
            if (!_isRunning) return;
            _isRunning = false;
        }
        
        _logger.LogInformation("Stopping watchdog service");
        
        _checkTimer?.Dispose();
        _checkTimer = null;
        
        await Task.CompletedTask;
    }
    
    private void CheckServiceHealth(object? state)
    {
        if (!_isRunning) return;
        
        try
        {
            // Check if main process is still responsive
            if (_mainProcess != null && _mainProcess.HasExited)
            {
                _logger.LogError("Main process has exited unexpectedly!");
                ServiceRestartRequired?.Invoke(this, EventArgs.Empty);
                return;
            }
            
            // Check memory usage (restart if too high - potential memory leak)
            if (_mainProcess != null)
            {
                var memoryMB = _mainProcess.WorkingSet64 / (1024 * 1024);
                if (memoryMB > 500) // 500MB threshold
                {
                    _logger.LogWarning("High memory usage detected: {Memory}MB, requesting restart", memoryMB);
                    ServiceRestartRequired?.Invoke(this, EventArgs.Empty);
                    return;
                }
                
                // Check handle count
                if (_mainProcess.HandleCount > 10000)
                {
                    _logger.LogWarning("High handle count detected: {Handles}, requesting restart", _mainProcess.HandleCount);
                    ServiceRestartRequired?.Invoke(this, EventArgs.Empty);
                    return;
                }
                
                // Check thread count
                if (_mainProcess.Threads.Count > 200)
                {
                    _logger.LogWarning("High thread count detected: {Threads}, requesting restart", _mainProcess.Threads.Count);
                    ServiceRestartRequired?.Invoke(this, EventArgs.Empty);
                    return;
                }
            }
            
            // Check if service is still registered and running
            CheckServiceRegistration();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in watchdog health check");
        }
    }
    
    private void CheckServiceRegistration()
    {
        try
        {
            using var sc = new ServiceController(_serviceConfig.ServiceName);
            if (sc.Status != ServiceControllerStatus.Running)
            {
                _logger.LogWarning("Service status is {Status}, attempting to start", sc.Status);
                
                try
                {
                    sc.Start();
                    sc.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(30));
                    _logger.LogInformation("Service restarted successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to restart service");
                    ServiceRestartRequired?.Invoke(this, EventArgs.Empty);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check service registration");
        }
    }
    
    public void Dispose()
    {
        _checkTimer?.Dispose();
    }
}