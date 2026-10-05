namespace CollegeMonitor.Shared.Models;

/// <summary>
/// Message types for client-server communication
/// </summary>
public enum MessageType
{
    // Client -> Server
    Heartbeat = 1,
    ActivityLog = 2,
    ScreenshotUpload = 3,
    SessionStart = 4,
    SessionEnd = 5,
    SystemInfo = 6,
    AlertTriggered = 7,
    
    // Server -> Client
    RequestScreenshot = 100,
    UpdatePolicy = 101,
    LockWorkstation = 102,
    LogoffUser = 103,
    Ping = 104,
    PolicyUpdate = 105,
    CommandAck = 106
}

/// <summary>
/// Activity types for logging
/// </summary>
public enum ActivityType
{
    WindowChange = 1,
    ProcessStart = 2,
    ProcessEnd = 3,
    UrlVisited = 4,
    FileAccess = 5,
    UsbConnected = 6,
    UsbDisconnected = 7,
    LoginAttempt = 8,
    SystemTimeChange = 9,
    NetworkConnection = 10,
    ClipboardChange = 11,
    PrintJob = 12
}

/// <summary>
/// Risk levels for activities and alerts
/// </summary>
public enum RiskLevel
{
    Normal = 0,      // Green
    Attention = 1,   // Yellow
    Alert = 2        // Red
}

/// <summary>
/// Alert types
/// </summary>
public enum AlertType
{
    SuspiciousKeyword = 1,
    BlockedWebsite = 2,
    UnauthorizedSoftware = 3,
    UsbDevice = 4,
    FailedLogin = 5,
    SystemTimeChange = 6,
    ProcessInjection = 7,
    MaliciousNetwork = 8,
    ServiceTermination = 9,
    PolicyViolation = 10
}

/// <summary>
/// Command types from server to client
/// </summary>
public enum CommandType
{
    RequestScreenshot = 1,
    UpdatePolicy = 2,
    LockWorkstation = 3,
    LogoffUser = 4,
    RestartService = 5,
    UpdateConfig = 6
}