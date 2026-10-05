using System.Drawing;
using System.Drawing.Imaging;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollegeMonitor.Client.Configuration;
using CollegeMonitor.Shared.DTOs;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for screenshot service
/// </summary>
public interface IScreenshotService
{
    event EventHandler<ScreenshotUploadPayload>? ScreenshotCaptured;
    
    Task StartAsync();
    Task StopAsync();
    Task<ScreenshotUploadPayload?> CaptureScreenshotAsync(string triggerReason, bool activeWindowOnly = false);
    Task<ScreenshotUploadPayload?> CaptureFullScreenAsync(string triggerReason);
    Task<ScreenshotUploadPayload?> CaptureActiveWindowAsync(string triggerReason);
    Task<int> GetScreenshotsThisHourAsync();
}

/// <summary>
/// Service for capturing screenshots
/// </summary>
public class ScreenshotService : IScreenshotService, IDisposable
{
    private readonly ILogger<ScreenshotService> _logger;
    private readonly StorageConfig _storageConfig;
    private readonly MonitoringConfig _monitoringConfig;
    private readonly ILocalStorageService _localStorage;
    private readonly IUserSessionService _userSession;
    
    private Timer? _intervalTimer;
    private int _screenshotsThisHour = 0;
    private DateTime _hourStart = DateTime.UtcNow;
    private bool _isRunning = false;
    private readonly object _lock = new();
    
    public event EventHandler<ScreenshotUploadPayload>? ScreenshotCaptured;
    
    public ScreenshotService(
        ILogger<ScreenshotService> logger,
        IOptions<StorageConfig> storageConfig,
        IOptions<MonitoringConfig> monitoringConfig,
        ILocalStorageService localStorage,
        IUserSessionService userSession)
    {
        _logger = logger;
        _storageConfig = storageConfig.Value;
        _monitoringConfig = monitoringConfig.Value;
        _localStorage = localStorage;
        _userSession = userSession;
    }
    
    public async Task StartAsync()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }
        
        _logger.LogInformation("Starting screenshot service");
        
        // Ensure screenshot directory exists
        if (!Directory.Exists(_storageConfig.ScreenshotPath))
        {
            Directory.CreateDirectory(_storageConfig.ScreenshotPath);
        }
        
        // Start interval timer
        _intervalTimer = new Timer(async _ => await CapturePeriodicScreenshotAsync(), null, 
            TimeSpan.FromSeconds(_monitoringConfig.ScreenshotIntervalSeconds), 
            TimeSpan.FromSeconds(_monitoringConfig.ScreenshotIntervalSeconds));
        
        // Reset hourly counter
        _hourStart = DateTime.UtcNow;
        _screenshotsThisHour = 0;
    }
    
    public async Task StopAsync()
    {
        lock (_lock)
        {
            if (!_isRunning) return;
            _isRunning = false;
        }
        
        _logger.LogInformation("Stopping screenshot service");
        
        _intervalTimer?.Dispose();
        _intervalTimer = null;
    }
    
    public async Task<ScreenshotUploadPayload?> CaptureScreenshotAsync(string triggerReason, bool activeWindowOnly = false)
    {
        if (!_userSession.IsUserLoggedIn())
        {
            _logger.LogDebug("No user logged in, skipping screenshot");
            return null;
        }
        
        // Check rate limit
        if (!CanTakeScreenshot())
        {
            _logger.LogWarning("Screenshot rate limit exceeded, skipping");
            return null;
        }
        
        try
        {
            ScreenshotUploadPayload? result;
            
            if (activeWindowOnly)
            {
                result = await CaptureActiveWindowAsync(triggerReason);
            }
            else
            {
                result = await CaptureFullScreenAsync(triggerReason);
            }
            
            if (result != null)
            {
                _screenshotsThisHour++;
                ScreenshotCaptured?.Invoke(this, result);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to capture screenshot: {Reason}", triggerReason);
            return null;
        }
    }
    
    public async Task<ScreenshotUploadPayload?> CaptureFullScreenAsync(string triggerReason)
    {
        var session = _userSession.GetCurrentSession();
        if (session == null) return null;
        
        try
        {
            // Capture all screens
            var bounds = System.Windows.Forms.Screen.GetBounds(Point.Empty);
            using var bitmap = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format24bppRgb);
            
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
                
                // Add watermark
                AddWatermark(graphics, bounds.Width, bounds.Height, session);
            }
            
            return await SaveScreenshotAsync(bitmap, triggerReason, session.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to capture full screen screenshot");
            return null;
        }
    }
    
    public async Task<ScreenshotUploadPayload?> CaptureActiveWindowAsync(string triggerReason)
    {
        var session = _userSession.GetCurrentSession();
        if (session == null) return null;
        
        try
        {
            // Get active window
            var hWnd = GetForegroundWindow();
            if (hWnd == IntPtr.Zero)
            {
                return await CaptureFullScreenAsync(triggerReason);
            }
            
            // Get window bounds
            if (!GetWindowRect(hWnd, out var rect))
            {
                return await CaptureFullScreenAsync(triggerReason);
            }
            
            var width = rect.Right - rect.Left;
            var height = rect.Bottom - rect.Top;
            
            if (width <= 0 || height <= 0)
            {
                return await CaptureFullScreenAsync(triggerReason);
            }
            
            using var bitmap = new Bitmap(width, height, PixelFormat.Format24bppRgb);
            
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.CopyFromScreen(rect.Left, rect.Top, 0, 0, new Size(width, height));
                
                // Add watermark
                AddWatermark(graphics, width, height, session);
            }
            
            return await SaveScreenshotAsync(bitmap, triggerReason, session.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to capture active window screenshot");
            return await CaptureFullScreenAsync(triggerReason);
        }
    }
    
    public async Task<int> GetScreenshotsThisHourAsync()
    {
        lock (_lock)
        {
            // Reset counter if hour has passed
            if (DateTime.UtcNow - _hourStart >= TimeSpan.FromHours(1))
            {
                _hourStart = DateTime.UtcNow;
                _screenshotsThisHour = 0;
            }
            return _screenshotsThisHour;
        }
    }
    
    private async Task CapturePeriodicScreenshotAsync()
    {
        if (!_isRunning || !_userSession.IsUserLoggedIn()) return;
        
        if (!CanTakeScreenshot())
        {
            _logger.LogDebug("Periodic screenshot skipped due to rate limit");
            return;
        }
        
        try
        {
            await CaptureFullScreenAsync("Periodic");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to capture periodic screenshot");
        }
    }
    
    private bool CanTakeScreenshot()
    {
        lock (_lock)
        {
            // Reset counter if hour has passed
            if (DateTime.UtcNow - _hourStart >= TimeSpan.FromHours(1))
            {
                _hourStart = DateTime.UtcNow;
                _screenshotsThisHour = 0;
            }
            
            return _screenshotsThisHour < _monitoringConfig.MaxScreenshotsPerHour;
        }
    }
    
    private async Task<ScreenshotUploadPayload?> SaveScreenshotAsync(Bitmap bitmap, string triggerReason, string sessionId)
    {
        using var memoryStream = new MemoryStream();
        
        // Save as PNG with compression
        var encoder = GetEncoder(ImageFormat.Png);
        var encoderParams = new EncoderParameters(1);
        encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, _storageConfig.ScreenshotQuality);
        
        bitmap.Save(memoryStream, encoder, encoderParams);
        
        var imageData = memoryStream.ToArray();
        
        var payload = new ScreenshotUploadPayload
        {
            SessionId = sessionId,
            TriggerReason = triggerReason,
            ImageData = imageData,
            Width = bitmap.Width,
            Height = bitmap.Height,
            FileSize = imageData.Length,
            Format = "PNG",
            Metadata = new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow.ToString("O"),
                ["username"] = _userSession.GetCurrentUsername(),
                ["student_id"] = _userSession.GetCurrentStudentId(),
                ["machine_name"] = Environment.MachineName
            }
        };
        
        // Save to local storage
        await _localStorage.SaveScreenshotAsync(payload);
        
        return payload;
    }
    
    private void AddWatermark(Graphics graphics, int width, int height, SessionStartPayload session)
    {
        try
        {
            var watermarkText = $"CollegeMonitor | {session.Username} | {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss UTC} | {Environment.MachineName}";
            
            using var font = new Font("Consolas", 10, FontStyle.Bold);
            using var brush = new SolidBrush(Color.FromArgb(180, 255, 255, 255));
            using var shadowBrush = new SolidBrush(Color.FromArgb(180, 0, 0, 0));
            
            var textSize = graphics.MeasureString(watermarkText, font);
            var x = width - textSize.Width - 10;
            var y = height - textSize.Height - 10;
            
            // Draw shadow
            graphics.DrawString(watermarkText, font, shadowBrush, x + 1, y + 1);
            // Draw text
            graphics.DrawString(watermarkText, font, brush, x, y);
            
            // Add corner marker
            using var pen = new Pen(Color.Red, 2);
            graphics.DrawRectangle(pen, 0, 0, width - 1, height - 1);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to add watermark to screenshot");
        }
    }
    
    private ImageCodecInfo GetEncoder(ImageFormat format)
    {
        var codecs = ImageCodecInfo.GetImageDecoders();
        return codecs.FirstOrDefault(c => c.FormatID == format.Guid) ?? codecs[0];
    }
    
    // P/Invoke for window capture
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();
    
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    [return: System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    public void Dispose()
    {
        _intervalTimer?.Dispose();
    }
}