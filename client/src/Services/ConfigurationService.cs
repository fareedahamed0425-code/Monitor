using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for configuration service
/// </summary>
public interface IConfigurationService
{
    ServiceConfig Service { get; }
    ServerConfig Server { get; }
    MonitoringConfig Monitoring { get; }
    StorageConfig Storage { get; }
    SecurityConfig Security { get; }
    LoggingConfig Logging { get; }
    
    event EventHandler<ConfigurationChangedEventArgs>? ConfigurationChanged;
    Task ReloadAsync();
    Task UpdateMonitoringPolicyAsync(MonitoringConfig newPolicy);
}

/// <summary>
/// Event args for configuration changes
/// </summary>
public class ConfigurationChangedEventArgs : EventArgs
{
    public string SectionName { get; set; } = string.Empty;
    public object? OldValue { get; set; }
    public object? NewValue { get; set; }
}

/// <summary>
/// Implementation of configuration service
/// </summary>
public class ConfigurationService : IConfigurationService
{
    private readonly IOptionsMonitor<ServiceConfig> _serviceOptions;
    private readonly IOptionsMonitor<ServerConfig> _serverOptions;
    private readonly IOptionsMonitor<MonitoringConfig> _monitoringOptions;
    private readonly IOptionsMonitor<StorageConfig> _storageOptions;
    private readonly IOptionsMonitor<SecurityConfig> _securityOptions;
    private readonly IOptionsMonitor<LoggingConfig> _loggingOptions;
    private readonly ILogger<ConfigurationService> _logger;
    
    public ServiceConfig Service => _serviceOptions.CurrentValue;
    public ServerConfig Server => _serverOptions.CurrentValue;
    public MonitoringConfig Monitoring => _monitoringOptions.CurrentValue;
    public StorageConfig Storage => _storageOptions.CurrentValue;
    public SecurityConfig Security => _securityOptions.CurrentValue;
    public LoggingConfig Logging => _loggingOptions.CurrentValue;
    
    public event EventHandler<ConfigurationChangedEventArgs>? ConfigurationChanged;
    
    public ConfigurationService(
        IOptionsMonitor<ServiceConfig> serviceOptions,
        IOptionsMonitor<ServerConfig> serverOptions,
        IOptionsMonitor<MonitoringConfig> monitoringOptions,
        IOptionsMonitor<StorageConfig> storageOptions,
        IOptionsMonitor<SecurityConfig> securityOptions,
        IOptionsMonitor<LoggingConfig> loggingOptions,
        ILogger<ConfigurationService> logger)
    {
        _serviceOptions = serviceOptions;
        _serverOptions = serverOptions;
        _monitoringOptions = monitoringOptions;
        _storageOptions = storageOptions;
        _securityOptions = securityOptions;
        _loggingOptions = loggingOptions;
        _logger = logger;
        
        // Register change callbacks
        _serviceOptions.OnChange(OnServiceConfigChanged);
        _serverOptions.OnChange(OnServerConfigChanged);
        _monitoringOptions.OnChange(OnMonitoringConfigChanged);
        _storageOptions.OnChange(OnStorageConfigChanged);
        _securityOptions.OnChange(OnSecurityConfigChanged);
        _loggingOptions.OnChange(OnLoggingConfigChanged);
    }
    
    private void OnServiceConfigChanged(ServiceConfig newConfig, string? sectionName)
    {
        _logger.LogInformation("Service configuration changed");
        ConfigurationChanged?.Invoke(this, new ConfigurationChangedEventArgs
        {
            SectionName = "Service",
            NewValue = newConfig
        });
    }
    
    private void OnServerConfigChanged(ServerConfig newConfig, string? sectionName)
    {
        _logger.LogInformation("Server configuration changed");
        ConfigurationChanged?.Invoke(this, new ConfigurationChangedEventArgs
        {
            SectionName = "Server",
            NewValue = newConfig
        });
    }
    
    private void OnMonitoringConfigChanged(MonitoringConfig newConfig, string? sectionName)
    {
        _logger.LogInformation("Monitoring configuration changed");
        ConfigurationChanged?.Invoke(this, new ConfigurationChangedEventArgs
        {
            SectionName = "Monitoring",
            NewValue = newConfig
        });
    }
    
    private void OnStorageConfigChanged(StorageConfig newConfig, string? sectionName)
    {
        _logger.LogInformation("Storage configuration changed");
        ConfigurationChanged?.Invoke(this, new ConfigurationChangedEventArgs
        {
            SectionName = "Storage",
            NewValue = newConfig
        });
    }
    
    private void OnSecurityConfigChanged(SecurityConfig newConfig, string? sectionName)
    {
        _logger.LogInformation("Security configuration changed");
        ConfigurationChanged?.Invoke(this, new ConfigurationChangedEventArgs
        {
            SectionName = "Security",
            NewValue = newConfig
        });
    }
    
    private void OnLoggingConfigChanged(LoggingConfig newConfig, string? sectionName)
    {
        _logger.LogInformation("Logging configuration changed");
        ConfigurationChanged?.Invoke(this, new ConfigurationChangedEventArgs
        {
            SectionName = "Logging",
            NewValue = newConfig
        });
    }
    
    public Task ReloadAsync()
    {
        // OptionsMonitor automatically reloads when config files change
        // This method can be used to force a reload if needed
        _logger.LogDebug("Configuration reload requested");
        return Task.CompletedTask;
    }
    
    public async Task UpdateMonitoringPolicyAsync(MonitoringConfig newPolicy)
    {
        // In a real implementation, this would update the configuration source
        // For now, we'll log the change
        _logger.LogInformation("Monitoring policy update requested: {@Policy}", newPolicy);
        
        // The actual implementation would depend on the configuration provider
        // For file-based config, we'd write to appsettings.json
        // For centralized config, we'd call an API
        
        await Task.CompletedTask;
    }
}