using System.Net.WebSockets;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;
using CollegeMonitor.Shared.DTOs;
using CollegeMonitor.Shared.Models;
using Newtonsoft.Json;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for network communication service
/// </summary>
public interface INetworkService
{
    event EventHandler<ServerCommand>? CommandReceived;
    event EventHandler<MonitoringPolicy>? PolicyUpdated;
    event EventHandler<bool>? ConnectionStatusChanged;
    
    Task StartAsync();
    Task StopAsync();
    Task<bool> SendHeartbeatAsync(HeartbeatPayload heartbeat);
    Task<bool> SendActivityLogAsync(ActivityLogPayload activity);
    Task<bool> SendScreenshotAsync(ScreenshotUploadPayload screenshot);
    Task<bool> SendSessionStartAsync(SessionStartPayload session);
    Task<bool> SendSessionEndAsync(SessionEndPayload session);
    Task<bool> SendAlertAsync(AlertTriggeredPayload alert);
    Task<bool> SendSystemInfoAsync(SystemInfoPayload systemInfo);
    Task SyncPendingMessagesAsync();
    bool IsConnected { get; }
}

/// <summary>
/// Network service for communicating with the central server
/// </summary>
public class NetworkService : INetworkService, IDisposable
{
    private readonly ILogger<NetworkService> _logger;
    private readonly ServerConfig _serverConfig;
    private readonly SecurityConfig _securityConfig;
    private readonly MonitoringConfig _monitoringConfig;
    private readonly ILocalStorageService _localStorage;
    private readonly ISystemInfoService _systemInfo;
    private readonly IUserSessionService _userSession;
    
    private ClientWebSocket? _webSocket;
    private HttpClient? _httpClient;
    private Timer? _heartbeatTimer;
    private Timer? _reconnectTimer;
    private Timer? _syncTimer;
    private CancellationTokenSource? _cancellationTokenSource;
    private string _clientId = string.Empty;
    private bool _isRunning = false;
    private bool _isConnected = false;
    private int _reconnectAttempts = 0;
    private readonly object _lock = new();
    
    public event EventHandler<ServerCommand>? CommandReceived;
    public event EventHandler<MonitoringPolicy>? PolicyUpdated;
    public event EventHandler<bool>? ConnectionStatusChanged;
    
    public bool IsConnected => _isConnected;
    
    public NetworkService(
        ILogger<NetworkService> logger,
        IOptions<ServerConfig> serverConfig,
        IOptions<SecurityConfig> securityConfig,
        IOptions<MonitoringConfig> monitoringConfig,
        ILocalStorageService localStorage,
        ISystemInfoService systemInfo,
        IUserSessionService userSession)
    {
        _logger = logger;
        _serverConfig = serverConfig.Value;
        _securityConfig = securityConfig.Value;
        _monitoringConfig = monitoringConfig.Value;
        _localStorage = localStorage;
        _systemInfo = systemInfo;
        _userSession = userSession;
    }
    
    public async Task StartAsync()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }
        
        _logger.LogInformation("Starting network service");
        
        _cancellationTokenSource = new CancellationTokenSource();
        _clientId = await _systemInfo.GetClientIdAsync();
        
        // Initialize HTTP client
        InitializeHttpClient();
        
        // Connect to WebSocket
        await ConnectWebSocketAsync();
        
        // Start timers
        _heartbeatTimer = new Timer(async _ => await SendHeartbeatAsync(), null,
            TimeSpan.FromSeconds(_monitoringConfig.HeartbeatIntervalSeconds),
            TimeSpan.FromSeconds(_monitoringConfig.HeartbeatIntervalSeconds));
        
        _syncTimer = new Timer(async _ => await SyncPendingMessagesAsync(), null,
            TimeSpan.FromSeconds(60), TimeSpan.FromSeconds(60));
        
        // Send initial system info
        var systemInfo = await _systemInfo.GetSystemInfoAsync();
        await SendSystemInfoAsync(systemInfo);
    }
    
    public async Task StopAsync()
    {
        lock (_lock)
        {
            if (!_isRunning) return;
            _isRunning = false;
        }
        
        _logger.LogInformation("Stopping network service");
        
        _cancellationTokenSource?.Cancel();
        
        _heartbeatTimer?.Dispose();
        _reconnectTimer?.Dispose();
        _syncTimer?.Dispose();
        
        _heartbeatTimer = null;
        _reconnectTimer = null;
        _syncTimer = null;
        
        if (_webSocket != null && _webSocket.State == WebSocketState.Open)
        {
            await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Service stopping", CancellationToken.None);
        }
        
        _webSocket?.Dispose();
        _webSocket = null;
        
        _httpClient?.Dispose();
        _httpClient = null;
        
        UpdateConnectionStatus(false);
    }
    
    private void InitializeHttpClient()
    {
        var handler = new HttpClientHandler();
        
        if (!string.IsNullOrEmpty(_serverConfig.ClientCertificatePath) && File.Exists(_serverConfig.ClientCertificatePath))
        {
            var cert = new X509Certificate2(_serverConfig.ClientCertificatePath, _serverConfig.ClientCertificatePassword);
            handler.ClientCertificates.Add(cert);
        }
        
        if (!_serverConfig.ValidateServerCertificate)
        {
            handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true;
        }
        
        _httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri(_serverConfig.BaseUrl),
            Timeout = TimeSpan.FromSeconds(_serverConfig.ConnectionTimeoutSeconds)
        };
        
        if (!string.IsNullOrEmpty(_serverConfig.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _serverConfig.ApiKey);
        }
        
        _httpClient.DefaultRequestHeaders.Add("X-Client-ID", _clientId);
        _httpClient.DefaultRequestHeaders.Add("X-Client-Version", typeof(Program).Assembly.GetName().Version?.ToString() ?? "1.0.0");
    }
    
    private async Task ConnectWebSocketAsync()
    {
        try
        {
            _webSocket = new ClientWebSocket();
            
            if (!string.IsNullOrEmpty(_serverConfig.ClientCertificatePath) && File.Exists(_serverConfig.ClientCertificatePath))
            {
                var cert = new X509Certificate2(_serverConfig.ClientCertificatePath, _serverConfig.ClientCertificatePassword);
                _webSocket.Options.ClientCertificates.Add(cert);
            }
            
            if (!_serverConfig.ValidateServerCertificate)
            {
                _webSocket.Options.RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true;
            }
            
            _webSocket.Options.SetRequestHeader("X-Client-ID", _clientId);
            _webSocket.Options.SetRequestHeader("X-API-Key", _serverConfig.ApiKey);
            
            var uri = new Uri(_serverConfig.WebSocketUrl);
            await _webSocket.ConnectAsync(uri, _cancellationTokenSource!.Token);
            
            _logger.LogInformation("WebSocket connected to {Url}", _serverConfig.WebSocketUrl);
            
            UpdateConnectionStatus(true);
            _reconnectAttempts = 0;
            
            // Start receiving messages
            _ = Task.Run(ReceiveMessagesAsync, _cancellationTokenSource.Token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect WebSocket");
            UpdateConnectionStatus(false);
            ScheduleReconnect();
        }
    }
    
    private async Task ReceiveMessagesAsync()
    {
        var buffer = new byte[8192];
        
        while (_webSocket != null && _webSocket.State == WebSocketState.Open && !_cancellationTokenSource!.Token.IsCancellationRequested)
        {
            try
            {
                var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cancellationTokenSource.Token);
                
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.LogWarning("WebSocket closed by server: {CloseStatus}", result.CloseStatus);
                    break;
                }
                
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    await ProcessServerMessageAsync(message);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error receiving WebSocket message");
                break;
            }
        }
        
        UpdateConnectionStatus(false);
        
        if (_isRunning && !_cancellationTokenSource!.Token.IsCancellationRequested)
        {
            ScheduleReconnect();
        }
    }
    
    private async Task ProcessServerMessageAsync(string message)
    {
        try
        {
            var envelope = JsonConvert.DeserializeObject<MessageEnvelope>(message);
            if (envelope == null) return;
            
            switch (envelope.Type)
            {
                case MessageType.RequestScreenshot:
                    var cmd = JsonConvert.DeserializeObject<ServerCommand>(envelope.Payload);
                    if (cmd != null)
                        CommandReceived?.Invoke(this, cmd);
                    break;
                    
                case MessageType.UpdatePolicy:
                case MessageType.PolicyUpdate:
                    var policy = JsonConvert.DeserializeObject<MonitoringPolicy>(envelope.Payload);
                    if (policy != null)
                        PolicyUpdated?.Invoke(this, policy);
                    break;
                    
                case MessageType.LockWorkstation:
                case MessageType.LogoffUser:
                case MessageType.Ping:
                    var command = JsonConvert.DeserializeObject<ServerCommand>(envelope.Payload);
                    if (command != null)
                        CommandReceived?.Invoke(this, command);
                    break;
                    
                case MessageType.CommandAck:
                    _logger.LogDebug("Command acknowledged: {CorrelationId}", envelope.CorrelationId);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process server message");
        }
    }
    
    private void ScheduleReconnect()
    {
        if (_reconnectAttempts >= _serverConfig.MaxReconnectAttempts)
        {
            _logger.LogError("Max reconnect attempts reached, giving up");
            return;
        }
        
        _reconnectAttempts++;
        var delay = TimeSpan.FromSeconds(_serverConfig.ReconnectIntervalSeconds * _reconnectAttempts);
        
        _logger.LogInformation("Scheduling reconnect attempt {Attempt} in {Delay}", _reconnectAttempts, delay);
        
        _reconnectTimer = new Timer(async _ => await ConnectWebSocketAsync(), null, delay, Timeout.InfiniteTimeSpan);
    }
    
    private void UpdateConnectionStatus(bool connected)
    {
        if (_isConnected != connected)
        {
            _isConnected = connected;
            ConnectionStatusChanged?.Invoke(this, connected);
        }
    }
    
    public async Task<bool> SendHeartbeatAsync(HeartbeatPayload? heartbeat = null)
    {
        if (!_isConnected || _webSocket == null || _webSocket.State != WebSocketState.Open)
        {
            // Queue locally
            if (heartbeat != null)
            {
                await _localStorage.SaveHeartbeatAsync(heartbeat);
            }
            return false;
        }
        
        try
        {
            heartbeat ??= new HeartbeatPayload
            {
                Hostname = Environment.MachineName,
                IpAddress = GetLocalIpAddress(),
                MacAddress = GetPrimaryMacAddress(),
                CurrentUser = _userSession.GetCurrentUsername(),
                ActiveWindowTitle = string.Empty, // Would be filled by activity monitor
                ActiveProcessName = string.Empty,
                CurrentRiskLevel = RiskLevel.Normal,
                UptimeSeconds = (long)(DateTime.UtcNow - _systemInfo.GetBootTime()).TotalSeconds,
                SystemMetrics = await _systemInfo.GetSystemMetricsAsync()
            };
            
            var envelope = new MessageEnvelope
            {
                Type = MessageType.Heartbeat,
                ClientId = _clientId,
                Timestamp = DateTime.UtcNow,
                Payload = JsonConvert.SerializeObject(heartbeat)
            };
            
            var json = JsonConvert.SerializeObject(envelope);
            var bytes = Encoding.UTF8.GetBytes(json);
            
            await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, _cancellationTokenSource!.Token);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send heartbeat");
            UpdateConnectionStatus(false);
            return false;
        }
    }
    
    public async Task<bool> SendActivityLogAsync(ActivityLogPayload activity)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.ActivityLog,
            ClientId = _clientId,
            Timestamp = DateTime.UtcNow,
            Payload = JsonConvert.SerializeObject(activity)
        };
        
        return await SendMessageAsync(envelope);
    }
    
    public async Task<bool> SendScreenshotAsync(ScreenshotUploadPayload screenshot)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.ScreenshotUpload,
            ClientId = _clientId,
            Timestamp = DateTime.UtcNow,
            Payload = JsonConvert.SerializeObject(screenshot)
        };
        
        return await SendMessageAsync(envelope);
    }
    
    public async Task<bool> SendSessionStartAsync(SessionStartPayload session)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.SessionStart,
            ClientId = _clientId,
            Timestamp = DateTime.UtcNow,
            Payload = JsonConvert.SerializeObject(session)
        };
        
        return await SendMessageAsync(envelope);
    }
    
    public async Task<bool> SendSessionEndAsync(SessionEndPayload session)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.SessionEnd,
            ClientId = _clientId,
            Timestamp = DateTime.UtcNow,
            Payload = JsonConvert.SerializeObject(session)
        };
        
        return await SendMessageAsync(envelope);
    }
    
    public async Task<bool> SendAlertAsync(AlertTriggeredPayload alert)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.AlertTriggered,
            ClientId = _clientId,
            Timestamp = DateTime.UtcNow,
            Payload = JsonConvert.SerializeObject(alert)
        };
        
        return await SendMessageAsync(envelope);
    }
    
    public async Task<bool> SendSystemInfoAsync(SystemInfoPayload systemInfo)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.SystemInfo,
            ClientId = _clientId,
            Timestamp = DateTime.UtcNow,
            Payload = JsonConvert.SerializeObject(systemInfo)
        };
        
        return await SendMessageAsync(envelope);
    }
    
    private async Task<bool> SendMessageAsync(MessageEnvelope envelope)
    {
        if (!_isConnected || _webSocket == null || _webSocket.State != WebSocketState.Open)
        {
            // Queue locally for later sync
            await _localStorage.SaveMessageAsync(envelope);
            return false;
        }
        
        try
        {
            var json = JsonConvert.SerializeObject(envelope);
            var bytes = Encoding.UTF8.GetBytes(json);
            
            await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, _cancellationTokenSource!.Token);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message type {Type}", envelope.Type);
            UpdateConnectionStatus(false);
            
            // Queue locally
            await _localStorage.SaveMessageAsync(envelope);
            return false;
        }
    }
    
    public async Task SyncPendingMessagesAsync()
    {
        if (!_isConnected || _webSocket == null || _webSocket.State != WebSocketState.Open)
            return;
        
        try
        {
            var pendingMessages = await _localStorage.GetPendingMessagesAsync(50);
            
            if (pendingMessages.Count == 0) return;
            
            _logger.LogDebug("Syncing {Count} pending messages", pendingMessages.Count);
            
            var sentCorrelationIds = new List<string>();
            
            foreach (var message in pendingMessages)
            {
                try
                {
                    var json = JsonConvert.SerializeObject(message);
                    var bytes = Encoding.UTF8.GetBytes(json);
                    
                    await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, _cancellationTokenSource!.Token);
                    
                    sentCorrelationIds.Add(message.CorrelationId);
                    
                    // Small delay to avoid overwhelming the connection
                    await Task.Delay(10);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to sync message {CorrelationId}", message.CorrelationId);
                    break; // Stop on first failure
                }
            }
            
            if (sentCorrelationIds.Count > 0)
            {
                await _localStorage.MarkMessagesSentAsync(sentCorrelationIds);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync pending messages");
        }
    }
    
    private string GetLocalIpAddress()
    {
        try
        {
            var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip))
                {
                    return ip.ToString();
                }
            }
        }
        catch { }
        return "127.0.0.1";
    }
    
    private string GetPrimaryMacAddress()
    {
        try
        {
            var nics = System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces();
            foreach (var nic in nics)
            {
                if (nic.OperationalStatus == System.Net.NetworkInformation.OperationalStatus.Up &&
                    nic.NetworkInterfaceType != System.Net.NetworkInformation.NetworkInterfaceType.Loopback)
                {
                    return nic.GetPhysicalAddress().ToString();
                }
            }
        }
        catch { }
        return "00:00:00:00:00:00";
    }
    
    public void Dispose()
    {
        _cancellationTokenSource?.Cancel();
        _cancellationTokenSource?.Dispose();
        
        _heartbeatTimer?.Dispose();
        _reconnectTimer?.Dispose();
        _syncTimer?.Dispose();
        
        _webSocket?.Dispose();
        _httpClient?.Dispose();
    }
}