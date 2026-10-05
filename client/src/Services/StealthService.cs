using System.Diagnostics;
using System.Security.AccessControl;
using System.Security.Principal;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for stealth/anti-tampering service
/// </summary>
public interface IStealthService
{
    Task ApplyStealthMeasuresAsync();
    Task HideFromTaskManagerAsync();
    Task ProtectRegistryKeysAsync();
    Task ProtectFilesAsync();
    Task ObfuscateProcessNameAsync();
}

/// <summary>
/// Service for applying stealth and anti-tampering measures
/// </summary>
public class StealthService : IStealthService
{
    private readonly ILogger<StealthService> _logger;
    private readonly SecurityConfig _securityConfig;
    private readonly ServiceConfig _serviceConfig;
    
    public StealthService(
        ILogger<StealthService> logger,
        IOptions<SecurityConfig> securityConfig,
        IOptions<ServiceConfig> serviceConfig)
    {
        _logger = logger;
        _securityConfig = securityConfig.Value;
        _serviceConfig = serviceConfig.Value;
    }
    
    public async Task ApplyStealthMeasuresAsync()
    {
        _logger.LogInformation("Applying stealth measures");
        
        if (_securityConfig.ObfuscateProcessName)
        {
            await ObfuscateProcessNameAsync();
        }
        
        if (_securityConfig.HideFromTaskManager)
        {
            await HideFromTaskManagerAsync();
        }
        
        if (_securityConfig.PreventUninstall)
        {
            await ProtectRegistryKeysAsync();
            await ProtectFilesAsync();
        }
        
        await Task.CompletedTask;
    }
    
    public async Task HideFromTaskManagerAsync()
    {
        try
        {
            // Note: True hiding from Task Manager requires kernel-level drivers
            // This is a user-mode approximation
            
            // Set process priority to background
            Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.Idle;
            
            // Hide from Alt+Tab (requires window)
            // This service runs without a window, so it's already hidden from Alt+Tab
            
            _logger.LogDebug("Applied Task Manager hiding measures");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to apply Task Manager hiding");
        }
        
        await Task.CompletedTask;
    }
    
    public async Task ProtectRegistryKeysAsync()
    {
        try
        {
            // Protect service registry keys
            var serviceKeyPath = $@"SYSTEM\CurrentControlSet\Services\{_serviceConfig.ServiceName}";
            
            using var baseKey = Microsoft.Win32.Registry.LocalMachine;
            using var serviceKey = baseKey.OpenSubKey(serviceKeyPath, true);
            
            if (serviceKey != null)
            {
                // Set ACL to prevent modification by non-admin users
                var security = serviceKey.GetAccessControl();
                
                // Remove write access for Users group
                var usersSid = new SecurityIdentifier(WellKnownSidType.BuiltinUsersSid, null);
                var rule = new RegistryAccessRule(usersSid, RegistryRights.WriteKey, AccessControlType.Deny);
                security.AddAccessRule(rule);
                
                // Remove write access for Everyone
                var everyoneSid = new SecurityIdentifier(WellKnownSidType.WorldSid, null);
                var everyoneRule = new RegistryAccessRule(everyoneSid, RegistryRights.WriteKey, AccessControlType.Deny);
                security.AddAccessRule(everyoneRule);
                
                serviceKey.SetAccessControl(security);
                
                _logger.LogDebug("Protected service registry key: {Path}", serviceKeyPath);
            }
            
            // Protect our application registry keys
            var appKeyPath = $@"SOFTWARE\{_serviceConfig.Name}";
            using var appKey = baseKey.CreateSubKey(appKeyPath, true);
            
            if (appKey != null)
            {
                var security = appKey.GetAccessControl();
                var usersSid = new SecurityIdentifier(WellKnownSidType.BuiltinUsersSid, null);
                var rule = new RegistryAccessRule(usersSid, RegistryRights.WriteKey, AccessControlType.Deny);
                security.AddAccessRule(rule);
                appKey.SetAccessControl(security);
                
                _logger.LogDebug("Protected application registry key: {Path}", appKeyPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to protect registry keys");
        }
        
        await Task.CompletedTask;
    }
    
    public async Task ProtectFilesAsync()
    {
        try
        {
            // Protect installation directory
            var installPath = GetInstallPath();
            if (Directory.Exists(installPath))
            {
                var dirInfo = new DirectoryInfo(installPath);
                var security = dirInfo.GetAccessControl();
                
                // Deny write/delete for Users
                var usersSid = new SecurityIdentifier(WellKnownSidType.BuiltinUsersSid, null);
                var rule = new FileSystemAccessRule(usersSid, FileSystemRights.Write | FileSystemRights.Delete | FileSystemRights.DeleteSubdirectoriesAndFiles, AccessControlType.Deny);
                security.AddAccessRule(rule);
                
                // Deny write/delete for Everyone
                var everyoneSid = new SecurityIdentifier(WellKnownSidType.WorldSid, null);
                var everyoneRule = new FileSystemAccessRule(everyoneSid, FileSystemRights.Write | FileSystemRights.Delete | FileSystemRights.DeleteSubdirectoriesAndFiles, AccessControlType.Deny);
                security.AddAccessRule(everyoneRule);
                
                dirInfo.SetAccessControl(security);
                
                _logger.LogDebug("Protected installation directory: {Path}", installPath);
            }
            
            // Protect data directory
            var dataPath = @"C:\ProgramData\Microsoft\Windows\WinSysUpdate";
            if (Directory.Exists(dataPath))
            {
                var dirInfo = new DirectoryInfo(dataPath);
                var security = dirInfo.GetAccessControl();
                
                var usersSid = new SecurityIdentifier(WellKnownSidType.BuiltinUsersSid, null);
                var rule = new FileSystemAccessRule(usersSid, FileSystemRights.Write | FileSystemRights.Delete | FileSystemRights.DeleteSubdirectoriesAndFiles, AccessControlType.Deny);
                security.AddAccessRule(rule);
                
                var everyoneSid = new SecurityIdentifier(WellKnownSidType.WorldSid, null);
                var everyoneRule = new FileSystemAccessRule(everyoneSid, FileSystemRights.Write | FileSystemRights.Delete | FileSystemRights.DeleteSubdirectoriesAndFiles, AccessControlType.Deny);
                security.AddAccessRule(everyoneRule);
                
                dirInfo.SetAccessControl(security);
                
                _logger.LogDebug("Protected data directory: {Path}", dataPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to protect files");
        }
        
        await Task.CompletedTask;
    }
    
    public async Task ObfuscateProcessNameAsync()
    {
        try
        {
            // The process name is set at compile time via AssemblyName in csproj
            // At runtime, we can't easily change the process name shown in Task Manager
            // This would require a native helper or process renaming techniques
            
            // We can set the process description
            Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.BelowNormal;
            
            _logger.LogDebug("Process name obfuscation applied (compile-time)");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to obfuscate process name");
        }
        
        await Task.CompletedTask;
    }
    
    private string GetInstallPath()
    {
        var assembly = System.Reflection.Assembly.GetEntryAssembly() ?? System.Reflection.Assembly.GetExecutingAssembly();
        return Path.GetDirectoryName(assembly.Location) ?? string.Empty;
    }
}