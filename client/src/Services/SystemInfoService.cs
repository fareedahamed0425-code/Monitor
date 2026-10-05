using System.Management;
using System.Diagnostics;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using CollegeMonitor.Client.Configuration;
using CollegeMonitor.Shared.DTOs;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for system information service
/// </summary>
public interface ISystemInfoService
{
    Task<SystemInfoPayload> GetSystemInfoAsync();
    Task<string> GetClientIdAsync();
    Task<Dictionary<string, object>> GetSystemMetricsAsync();
}

/// <summary>
/// Service for collecting system information
/// </summary>
public class SystemInfoService : ISystemInfoService
{
    private readonly ILogger<SystemInfoService> _logger;
    private readonly string _clientVersion;
    private string? _cachedClientId;
    
    public SystemInfoService(ILogger<SystemInfoService> logger)
    {
        _logger = logger;
        _clientVersion = typeof(Program).Assembly.GetName().Version?.ToString() ?? "1.0.0";
    }
    
    public async Task<SystemInfoPayload> GetSystemInfoAsync()
    {
        try
        {
            var payload = new SystemInfoPayload
            {
                ClientVersion = _clientVersion,
                BootTime = GetBootTime()
            };
            
            // OS Information
            payload.OsVersion = Environment.OSVersion.Version.ToString();
            payload.OsBuild = GetOsBuildNumber();
            
            // Processor Information
            payload.ProcessorInfo = GetProcessorInfo();
            
            // Memory Information
            var memoryInfo = GetMemoryInfo();
            payload.TotalMemory = memoryInfo.Total;
            payload.AvailableMemory = memoryInfo.Available;
            
            // Disk Information
            payload.Disks = GetDiskInfo();
            
            // Network Adapters
            payload.NetworkAdapters = GetNetworkAdapters();
            
            return payload;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get system info");
            return new SystemInfoPayload { ClientVersion = _clientVersion };
        }
    }
    
    public async Task<string> GetClientIdAsync()
    {
        if (!string.IsNullOrEmpty(_cachedClientId))
            return _cachedClientId;
        
        try
        {
            // Generate a unique client ID based on hardware
            var cpuId = GetCpuId();
            var motherboardSerial = GetMotherboardSerial();
            var macAddress = GetPrimaryMacAddress();
            
            var combined = $"{cpuId}{motherboardSerial}{macAddress}";
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var hash = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(combined));
            _cachedClientId = Convert.ToHexString(hash)[..32].ToLowerInvariant();
            
            return _cachedClientId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate client ID, falling back to hostname");
            _cachedClientId = Environment.MachineName.ToLowerInvariant();
            return _cachedClientId;
        }
    }
    
    public async Task<Dictionary<string, object>> GetSystemMetricsAsync()
    {
        var metrics = new Dictionary<string, object>();
        
        try
        {
            // CPU Usage
            using var cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            cpuCounter.NextValue(); // First call returns 0
            await Task.Delay(100);
            metrics["cpu_usage"] = Math.Round(cpuCounter.NextValue(), 2);
            
            // Memory Usage
            var memoryInfo = GetMemoryInfo();
            metrics["memory_total_mb"] = memoryInfo.Total / (1024 * 1024);
            metrics["memory_available_mb"] = memoryInfo.Available / (1024 * 1024);
            metrics["memory_usage_percent"] = Math.Round(
                (double)(memoryInfo.Total - memoryInfo.Available) / memoryInfo.Total * 100, 2);
            
            // Disk Usage (C: drive)
            var cDrive = new DriveInfo("C");
            if (cDrive.IsReady)
            {
                metrics["disk_c_total_gb"] = Math.Round(cDrive.TotalSize / (1024.0 * 1024 * 1024), 2);
                metrics["disk_c_free_gb"] = Math.Round(cDrive.AvailableFreeSpace / (1024.0 * 1024 * 1024), 2);
                metrics["disk_c_usage_percent"] = Math.Round(
                    (double)(cDrive.TotalSize - cDrive.AvailableFreeSpace) / cDrive.TotalSize * 100, 2);
            }
            
            // Network
            var networkInfo = GetNetworkAdapters();
            metrics["network_adapters_count"] = networkInfo.Count;
            metrics["network_adapters_up"] = networkInfo.Count(n => n.IsUp);
            
            // Process count
            metrics["process_count"] = Process.GetProcesses().Length;
            
            // Thread count
            metrics["thread_count"] = Process.GetCurrentProcess().Threads.Count;
            
            // Handle count
            metrics["handle_count"] = Process.GetCurrentProcess().HandleCount;
            
            // Uptime
            metrics["uptime_seconds"] = (long)(DateTime.UtcNow - GetBootTime()).TotalSeconds;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get system metrics");
        }
        
        return metrics;
    }
    
    private DateTime GetBootTime()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT LastBootUpTime FROM Win32_OperatingSystem");
            foreach (ManagementObject obj in searcher.Get())
            {
                var bootTimeStr = obj["LastBootUpTime"]?.ToString();
                if (!string.IsNullOrEmpty(bootTimeStr))
                {
                    return ManagementDateTimeConverter.ToDateTime(bootTimeStr).ToUniversalTime();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get boot time from WMI");
        }
        
        // Fallback: calculate from tick count
        return DateTime.UtcNow.AddMilliseconds(-Environment.TickCount64);
    }
    
    private string GetOsBuildNumber()
    {
        try
        {
            using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion");
            return key?.GetValue("CurrentBuildNumber")?.ToString() ?? "Unknown";
        }
        catch
        {
            return "Unknown";
        }
    }
    
    private string GetProcessorInfo()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed FROM Win32_Processor");
            foreach (ManagementObject obj in searcher.Get())
            {
                var name = obj["Name"]?.ToString() ?? "Unknown";
                var cores = obj["NumberOfCores"]?.ToString() ?? "?";
                var logical = obj["NumberOfLogicalProcessors"]?.ToString() ?? "?";
                var speed = obj["MaxClockSpeed"]?.ToString() ?? "?";
                return $"{name} ({cores}C/{logical}T @ {speed}MHz)";
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get processor info from WMI");
        }
        
        return $"Unknown ({Environment.ProcessorCount} cores)";
    }
    
    private (long Total, long Available) GetMemoryInfo()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT TotalVisibleMemorySize, FreePhysicalMemory FROM Win32_OperatingSystem");
            foreach (ManagementObject obj in searcher.Get())
            {
                var totalKb = Convert.ToInt64(obj["TotalVisibleMemorySize"] ?? 0);
                var freeKb = Convert.ToInt64(obj["FreePhysicalMemory"] ?? 0);
                return (totalKb * 1024, freeKb * 1024);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get memory info from WMI");
        }
        
        // Fallback
        var total = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes;
        return (total, total); // Approximate
    }
    
    private List<DiskInfo> GetDiskInfo()
    {
        var disks = new List<DiskInfo>();
        
        try
        {
            foreach (var drive in DriveInfo.GetDrives())
            {
                if (drive.IsReady && drive.DriveType == DriveType.Fixed)
                {
                    disks.Add(new DiskInfo
                    {
                        DriveLetter = drive.Name.TrimEnd('\\'),
                        Label = drive.VolumeLabel,
                        TotalSize = drive.TotalSize,
                        FreeSpace = drive.AvailableFreeSpace,
                        FileSystem = drive.DriveFormat
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get disk info");
        }
        
        return disks;
    }
    
    private List<NetworkAdapterInfo> GetNetworkAdapters()
    {
        var adapters = new List<NetworkAdapterInfo>();
        
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT NetConnectionID, MACAddress, IPAddress, NetEnabled FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = TRUE");
            
            foreach (ManagementObject obj in searcher.Get())
            {
                var ips = obj["IPAddress"] as string[];
                adapters.Add(new NetworkAdapterInfo
                {
                    Name = obj["NetConnectionID"]?.ToString() ?? "Unknown",
                    MacAddress = obj["MACAddress"]?.ToString() ?? "Unknown",
                    IpAddresses = ips?.ToList() ?? new List<string>(),
                    IsUp = Convert.ToBoolean(obj["NetEnabled"] ?? false)
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get network adapters from WMI");
        }
        
        return adapters;
    }
    
    private string GetCpuId()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
            foreach (ManagementObject obj in searcher.Get())
            {
                return obj["ProcessorId"]?.ToString() ?? "Unknown";
            }
        }
        catch { }
        return "Unknown";
    }
    
    private string GetMotherboardSerial()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
            foreach (ManagementObject obj in searcher.Get())
            {
                return obj["SerialNumber"]?.ToString() ?? "Unknown";
            }
        }
        catch { }
        return "Unknown";
    }
    
    private string GetPrimaryMacAddress()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = TRUE AND MACAddress IS NOT NULL");
            foreach (ManagementObject obj in searcher.Get())
            {
                return obj["MACAddress"]?.ToString() ?? "Unknown";
            }
        }
        catch { }
        return "Unknown";
    }
}