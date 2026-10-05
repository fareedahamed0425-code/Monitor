using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for integrity checking service
/// </summary>
public interface IIntegrityService
{
    Task StartAsync();
    Task StopAsync();
    Task<bool> VerifyIntegrityAsync();
    event EventHandler<string>? IntegrityViolationDetected;
}

/// <summary>
/// Service for file integrity monitoring
/// </summary>
public class IntegrityService : IIntegrityService, IDisposable
{
    private readonly ILogger<IntegrityService> _logger;
    private readonly SecurityConfig _securityConfig;
    private readonly ServiceConfig _serviceConfig;
    
    private Timer? _checkTimer;
    private bool _isRunning = false;
    private Dictionary<string, string> _fileHashes = new();
    private readonly object _lock = new();
    
    public event EventHandler<string>? IntegrityViolationDetected;
    
    public IntegrityService(
        ILogger<IntegrityService> logger,
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
        
        _logger.LogInformation("Starting integrity service");
        
        // Calculate initial hashes
        await CalculateInitialHashesAsync();
        
        // Start periodic integrity checks
        _checkTimer = new Timer(async _ => await CheckIntegrityAsync(), null,
            TimeSpan.FromMinutes(_securityConfig.IntegrityCheckIntervalMinutes),
            TimeSpan.FromMinutes(_securityConfig.IntegrityCheckIntervalMinutes));
        
        await Task.CompletedTask;
    }
    
    public async Task StopAsync()
    {
        lock (_lock)
        {
            if (!_isRunning) return;
            _isRunning = false;
        }
        
        _logger.LogInformation("Stopping integrity service");
        
        _checkTimer?.Dispose();
        _checkTimer = null;
        
        await Task.CompletedTask;
    }
    
    public async Task<bool> VerifyIntegrityAsync()
    {
        return await CheckIntegrityAsync();
    }
    
    private async Task CalculateInitialHashesAsync()
    {
        try
        {
            var filesToCheck = GetFilesToMonitor();
            
            foreach (var file in filesToCheck)
            {
                if (File.Exists(file))
                {
                    var hash = await CalculateFileHashAsync(file);
                    _fileHashes[file] = hash;
                }
            }
            
            _logger.LogDebug("Calculated initial hashes for {Count} files", _fileHashes.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate initial hashes");
        }
    }
    
    private async Task<bool> CheckIntegrityAsync()
    {
        if (!_isRunning) return true;
        
        try
        {
            var filesToCheck = GetFilesToMonitor();
            var violations = new List<string>();
            
            foreach (var file in filesToCheck)
            {
                if (!File.Exists(file))
                {
                    if (_fileHashes.ContainsKey(file))
                    {
                        violations.Add($"File deleted: {file}");
                    }
                    continue;
                }
                
                var currentHash = await CalculateFileHashAsync(file);
                
                if (_fileHashes.TryGetValue(file, out var originalHash))
                {
                    if (!string.Equals(currentHash, originalHash, StringComparison.OrdinalIgnoreCase))
                    {
                        violations.Add($"File modified: {file}");
                    }
                }
                else
                {
                    // New file, record its hash
                    _fileHashes[file] = currentHash;
                }
            }
            
            // Check for new files in monitored directories
            var monitoredDirs = GetMonitoredDirectories();
            foreach (var dir in monitoredDirs)
            {
                if (Directory.Exists(dir))
                {
                    var files = Directory.GetFiles(dir, "*.*", SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        if (!_fileHashes.ContainsKey(file))
                        {
                            var hash = await CalculateFileHashAsync(file);
                            _fileHashes[file] = hash;
                            _logger.LogDebug("New file detected, hash recorded: {File}", file);
                        }
                    }
                }
            }
            
            if (violations.Count > 0)
            {
                foreach (var violation in violations)
                {
                    _logger.LogError("Integrity violation: {Violation}", violation);
                    IntegrityViolationDetected?.Invoke(this, violation);
                }
                return false;
            }
            
            _logger.LogDebug("Integrity check passed for {Count} files", filesToCheck.Count);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check integrity");
            return false;
        }
    }
    
    private List<string> GetFilesToMonitor()
    {
        var files = new List<string>();
        
        // Main executable
        var assembly = System.Reflection.Assembly.GetEntryAssembly() ?? System.Reflection.Assembly.GetExecutingAssembly();
        var exePath = assembly.Location;
        if (!string.IsNullOrEmpty(exePath))
        {
            files.Add(exePath);
        }
        
        // Configuration files
        var configPath = Path.Combine(Path.GetDirectoryName(exePath) ?? "", "appsettings.json");
        if (File.Exists(configPath))
        {
            files.Add(configPath);
        }
        
        // Service installation script
        var installScript = Path.Combine(Path.GetDirectoryName(exePath) ?? "", "install_service.ps1");
        if (File.Exists(installScript))
        {
            files.Add(installScript);
        }
        
        return files;
    }
    
    private List<string> GetMonitoredDirectories()
    {
        var dirs = new List<string>();
        
        var assembly = System.Reflection.Assembly.GetEntryAssembly() ?? System.Reflection.Assembly.GetExecutingAssembly();
        var exeDir = Path.GetDirectoryName(assembly.Location);
        if (!string.IsNullOrEmpty(exeDir))
        {
            dirs.Add(exeDir);
        }
        
        return dirs;
    }
    
    private async Task<string> CalculateFileHashAsync(string filePath)
    {
        using var sha256 = SHA256.Create();
        using var stream = File.OpenRead(filePath);
        var hash = await sha256.ComputeHashAsync(stream);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
    
    public void Dispose()
    {
        _checkTimer?.Dispose();
    }
}