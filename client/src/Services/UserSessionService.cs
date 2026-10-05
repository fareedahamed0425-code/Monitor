using System.Security.Principal;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;
using CollegeMonitor.Shared.DTOs;
using CollegeMonitor.Shared.Models;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for user session tracking service
/// </summary>
public interface IUserSessionService
{
    event EventHandler<SessionStartPayload>? SessionStarted;
    event EventHandler<SessionEndPayload>? SessionEnded;
    event EventHandler<string>? ActiveUserChanged;
    
    Task StartTrackingAsync();
    Task StopTrackingAsync();
    SessionStartPayload? GetCurrentSession();
    string GetCurrentUsername();
    string GetCurrentStudentId();
    bool IsUserLoggedIn();
}

/// <summary>
/// Service for tracking user sessions
/// </summary>
public class UserSessionService : IUserSessionService, IDisposable
{
    private readonly ILogger<UserSessionService> _logger;
    private readonly MonitoringConfig _monitoringConfig;
    private readonly ILocalStorageService _localStorage;
    private readonly ISystemInfoService _systemInfo;
    
    private SessionStartPayload? _currentSession;
    private Timer? _sessionCheckTimer;
    private string? _lastKnownUser;
    private bool _isTracking = false;
    private readonly object _lock = new();
    
    public event EventHandler<SessionStartPayload>? SessionStarted;
    public event EventHandler<SessionEndPayload>? SessionEnded;
    public event EventHandler<string>? ActiveUserChanged;
    
    public UserSessionService(
        ILogger<UserSessionService> logger,
        IOptions<MonitoringConfig> monitoringConfig,
        ILocalStorageService localStorage,
        ISystemInfoService systemInfo)
    {
        _logger = logger;
        _monitoringConfig = monitoringConfig.Value;
        _localStorage = localStorage;
        _systemInfo = systemInfo;
    }
    
    public async Task StartTrackingAsync()
    {
        lock (_lock)
        {
            if (_isTracking) return;
            _isTracking = true;
        }
        
        _logger.LogInformation("Starting user session tracking");
        
        // Initial check
        await CheckSessionAsync();
        
        // Periodic check every 10 seconds
        _sessionCheckTimer = new Timer(async _ => await CheckSessionAsync(), null, TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(10));
        
        // Also listen for session change events
        SystemEvents.SessionSwitch += OnSessionSwitch;
    }
    
    public async Task StopTrackingAsync()
    {
        lock (_lock)
        {
            if (!_isTracking) return;
            _isTracking = false;
        }
        
        _logger.LogInformation("Stopping user session tracking");
        
        _sessionCheckTimer?.Dispose();
        _sessionCheckTimer = null;
        
        SystemEvents.SessionSwitch -= OnSessionSwitch;
        
        // End current session if any
        if (_currentSession != null)
        {
            await EndCurrentSessionAsync("ServiceStop");
        }
    }
    
    public SessionStartPayload? GetCurrentSession()
    {
        return _currentSession;
    }
    
    public string GetCurrentUsername()
    {
        return _currentSession?.Username ?? GetInteractiveUsername();
    }
    
    public string GetCurrentStudentId()
    {
        return _currentSession?.StudentId ?? string.Empty;
    }
    
    public bool IsUserLoggedIn()
    {
        return _currentSession != null && !string.IsNullOrEmpty(_currentSession.Username);
    }
    
    private async Task CheckSessionAsync()
    {
        try
        {
            var currentUser = GetInteractiveUsername();
            
            if (string.IsNullOrEmpty(currentUser))
            {
                // No user logged in
                if (_currentSession != null)
                {
                    await EndCurrentSessionAsync("Logoff");
                }
                return;
            }
            
            // Check if user changed
            if (_currentSession == null || !string.Equals(_currentSession.Username, currentUser, StringComparison.OrdinalIgnoreCase))
            {
                // User changed or new session
                if (_currentSession != null)
                {
                    await EndCurrentSessionAsync("UserSwitch");
                }
                
                await StartNewSessionAsync(currentUser);
            }
            
            _lastKnownUser = currentUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking session");
        }
    }
    
    private string GetInteractiveUsername()
    {
        try
        {
            // Get the username of the interactive user (not service accounts)
            var currentUser = WindowsIdentity.GetCurrent().Name;
            
            // Filter out system accounts
            if (string.IsNullOrEmpty(currentUser) || 
                currentUser.StartsWith("NT AUTHORITY\\", StringComparison.OrdinalIgnoreCase) ||
                currentUser.StartsWith("SYSTEM", StringComparison.OrdinalIgnoreCase) ||
                currentUser.EndsWith("$", StringComparison.Ordinal))
            {
                // Try to get the interactive user from WMI
                return GetInteractiveUserFromWmi();
            }
            
            // Extract username without domain
            var parts = currentUser.Split('\\');
            return parts.Length > 1 ? parts[1] : currentUser;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get current username");
            return string.Empty;
        }
    }
    
    private string GetInteractiveUserFromWmi()
    {
        try
        {
            using var searcher = new System.Management.ManagementObjectSearcher(
                "SELECT UserName FROM Win32_ComputerSystem");
            foreach (System.Management.ManagementObject obj in searcher.Get())
            {
                var userName = obj["UserName"]?.ToString();
                if (!string.IsNullOrEmpty(userName))
                {
                    var parts = userName.Split('\\');
                    return parts.Length > 1 ? parts[1] : userName;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get interactive user from WMI");
        }
        
        return string.Empty;
    }
    
    private async Task StartNewSessionAsync(string username)
    {
        try
        {
            var studentId = await LookupStudentIdAsync(username);
            var domain = GetUserDomain(username);
            
            var session = new SessionStartPayload
            {
                SessionId = Guid.NewGuid().ToString(),
                Username = username,
                StudentId = studentId,
                Domain = domain,
                LoginTime = DateTime.UtcNow,
                SessionType = "Interactive"
            };
            
            _currentSession = session;
            
            // Save to local storage
            await _localStorage.SaveSessionStartAsync(session);
            
            // Notify subscribers
            SessionStarted?.Invoke(this, session);
            ActiveUserChanged?.Invoke(this, username);
            
            _logger.LogInformation("New session started for user: {Username} (StudentId: {StudentId})", username, studentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start new session for user: {Username}", username);
        }
    }
    
    private async Task EndCurrentSessionAsync(string reason)
    {
        if (_currentSession == null) return;
        
        try
        {
            var sessionEnd = new SessionEndPayload
            {
                SessionId = _currentSession.SessionId,
                LogoutTime = DateTime.UtcNow,
                Duration = DateTime.UtcNow - _currentSession.LoginTime,
                LogoutReason = reason
            };
            
            // Save to local storage
            await _localStorage.SaveSessionEndAsync(sessionEnd);
            
            // Notify subscribers
            SessionEnded?.Invoke(this, sessionEnd);
            ActiveUserChanged?.Invoke(this, string.Empty);
            
            _logger.LogInformation("Session ended for user: {Username}, Reason: {Reason}, Duration: {Duration}",
                _currentSession.Username, reason, sessionEnd.Duration);
            
            _currentSession = null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to end session");
        }
    }
    
    private async Task<string> LookupStudentIdAsync(string username)
    {
        // In a real implementation, this would query Active Directory or a student database
        // For now, we'll try to extract from username pattern or return empty
        
        // Common patterns: student ID might be in username (e.g., "s123456", "std123456", "2021001")
        var patterns = new[]
        {
            @"^s(\d{6,})$",           // s123456
            @"^std(\d{6,})$",         // std123456
            @"^student(\d{6,})$",     // student123456
            @"^(\d{7,})$",            // 2021001
            @"^(\d{4}\d{3,})$"        // 2021001
        };
        
        foreach (var pattern in patterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(username, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (match.Success && match.Groups.Count > 1)
            {
                return match.Groups[1].Value;
            }
        }
        
        return string.Empty;
    }
    
    private string GetUserDomain(string username)
    {
        try
        {
            var identity = WindowsIdentity.GetCurrent();
            return identity.User?.AccountDomainSid?.ToString() ?? Environment.UserDomainName;
        }
        catch
        {
            return Environment.UserDomainName;
        }
    }
    
    private void OnSessionSwitch(object sender, SessionSwitchEventArgs e)
    {
        _logger.LogDebug("Session switch event: {Reason}", e.Reason);
        
        // Trigger immediate check
        _ = Task.Run(async () => await CheckSessionAsync());
    }
    
    public void Dispose()
    {
        _sessionCheckTimer?.Dispose();
        SystemEvents.SessionSwitch -= OnSessionSwitch;
    }
}