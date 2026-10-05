using System;
using System.Collections.Generic;
using CollegeMonitor.Shared.Models;

namespace CollegeMonitor.Shared.DTOs;

/// <summary>
/// Base message envelope for all communications
/// </summary>
public class MessageEnvelope
{
    public MessageType Type { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Payload { get; set; } = string.Empty;
    public string CorrelationId { get; set; } = Guid.NewGuid().ToString();
}

/// <summary>
/// Heartbeat message from client
/// </summary>
public class HeartbeatPayload
{
    public string Hostname { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
    public string CurrentUser { get; set; } = string.Empty;
    public string ActiveWindowTitle { get; set; } = string.Empty;
    public string ActiveProcessName { get; set; } = string.Empty;
    public RiskLevel CurrentRiskLevel { get; set; }
    public long UptimeSeconds { get; set; }
    public Dictionary<string, object> SystemMetrics { get; set; } = new();
}

/// <summary>
/// Activity log entry
/// </summary>
public class ActivityLogPayload
{
    public string SessionId { get; set; } = string.Empty;
    public ActivityType ActivityType { get; set; }
    public string Details { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public string? ScreenshotPath { get; set; }
}

/// <summary>
/// Screenshot upload payload
/// </summary>
public class ScreenshotUploadPayload
{
    public string SessionId { get; set; } = string.Empty;
    public string TriggerReason { get; set; } = string.Empty;
    public byte[] ImageData { get; set; } = Array.Empty<byte>();
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
    public string Format { get; set; } = "PNG";
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Session start payload
/// </summary>
public class SessionStartPayload
{
    public string SessionId { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public DateTime LoginTime { get; set; } = DateTime.UtcNow;
    public string SessionType { get; set; } = "Interactive"; // Interactive, Remote, Service
}

/// <summary>
/// Session end payload
/// </summary>
public class SessionEndPayload
{
    public string SessionId { get; set; } = string.Empty;
    public DateTime LogoutTime { get; set; } = DateTime.UtcNow;
    public TimeSpan Duration { get; set; }
    public string LogoutReason { get; set; } = string.Empty; // Logoff, Shutdown, Disconnect, Lock
}

/// <summary>
/// System information payload
/// </summary>
public class SystemInfoPayload
{
    public string OsVersion { get; set; } = string.Empty;
    public string OsBuild { get; set; } = string.Empty;
    public string ProcessorInfo { get; set; } = string.Empty;
    public long TotalMemory { get; set; }
    public long AvailableMemory { get; set; }
    public List<DiskInfo> Disks { get; set; } = new();
    public List<NetworkAdapterInfo> NetworkAdapters { get; set; } = new();
    public string ClientVersion { get; set; } = string.Empty;
    public DateTime BootTime { get; set; }
}

public class DiskInfo
{
    public string DriveLetter { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public long TotalSize { get; set; }
    public long FreeSpace { get; set; }
    public string FileSystem { get; set; } = string.Empty;
}

public class NetworkAdapterInfo
{
    public string Name { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
    public List<string> IpAddresses { get; set; } = new();
    public bool IsUp { get; set; }
}

/// <summary>
/// Alert triggered payload
/// </summary>
public class AlertTriggeredPayload
{
    public string SessionId { get; set; } = string.Empty;
    public AlertType AlertType { get; set; }
    public RiskLevel Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ScreenshotId { get; set; }
    public Dictionary<string, object> Context { get; set; } = new();
}

/// <summary>
/// Server command to client
/// </summary>
public class ServerCommand
{
    public CommandType Command { get; set; }
    public string CommandId { get; set; } = Guid.NewGuid().ToString();
    public Dictionary<string, object> Parameters { get; set; } = new();
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public int TimeoutSeconds { get; set; } = 30;
}

/// <summary>
/// Policy configuration from server
/// </summary>
public class MonitoringPolicy
{
    public string PolicyId { get; set; } = Guid.NewGuid().ToString();
    public int Version { get; set; }
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    
    // Screenshot settings
    public int ScreenshotIntervalSeconds { get; set; } = 300; // 5 minutes default
    public int MaxScreenshotsPerHour { get; set; } = 50;
    public bool CaptureOnWindowChange { get; set; } = true;
    public bool CaptureOnTrigger { get; set; } = true;
    
    // Monitoring settings
    public List<string> SuspiciousKeywords { get; set; } = new();
    public List<string> BlockedProcesses { get; set; } = new();
    public List<string> BlockedUrls { get; set; } = new();
    public List<string> AllowedProcesses { get; set; } = new(); // Whitelist mode
    public bool MonitorUsb { get; set; } = true;
    public bool MonitorClipboard { get; set; } = false;
    public bool MonitorPrintJobs { get; set; } = false;
    public bool MonitorNetworkConnections { get; set; } = true;
    
    // Alert thresholds
    public int FailedLoginThreshold { get; set; } = 3;
    public int FailedLoginWindowMinutes { get; set; } = 15;
    public int RiskScoreAlertThreshold { get; set; } = 50;
    
    // Storage settings
    public int ScreenshotRetentionDays { get; set; } = 30;
    public int ActivityLogRetentionDays { get; set; } = 90;
    public long MaxLocalStorageMB { get; set; } = 500;
    
    // Network settings
    public int HeartbeatIntervalSeconds { get; set; } = 30;
    public int CommandTimeoutSeconds { get; set; } = 30;
    public bool UseCompression { get; set; } = true;
    public bool EncryptPayloads { get; set; } = true;
}