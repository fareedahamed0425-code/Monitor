using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using CollegeMonitor.Client.Configuration;
using CollegeMonitor.Shared.DTOs;
using CollegeMonitor.Shared.Models;

namespace CollegeMonitor.Client.Services;

/// <summary>
/// Interface for local storage service
/// </summary>
public interface ILocalStorageService
{
    Task InitializeAsync();
    Task SaveHeartbeatAsync(HeartbeatPayload heartbeat);
    Task SaveActivityLogAsync(ActivityLogPayload activity);
    Task SaveScreenshotAsync(ScreenshotUploadPayload screenshot);
    Task SaveSessionStartAsync(SessionStartPayload session);
    Task SaveSessionEndAsync(SessionEndPayload session);
    Task SaveAlertAsync(AlertTriggeredPayload alert);
    Task<List<MessageEnvelope>> GetPendingMessagesAsync(int maxCount = 100);
    Task MarkMessagesSentAsync(List<string> correlationIds);
    Task CleanupOldDataAsync();
    Task<long> GetStorageSizeAsync();
    Task<bool> IsStorageFullAsync();
}

/// <summary>
/// Local SQLite storage for offline buffering
/// </summary>
public class LocalStorageService : ILocalStorageService, IDisposable
{
    private readonly StorageConfig _storageConfig;
    private readonly ILogger<LocalStorageService> _logger;
    private SqliteConnection? _connection;
    private readonly SemaphoreSlim _dbLock = new(1, 1);
    private bool _initialized = false;
    
    public LocalStorageService(
        IOptions<StorageConfig> storageConfig,
        ILogger<LocalStorageService> logger)
    {
        _storageConfig = storageConfig.Value;
        _logger = logger;
    }
    
    public async Task InitializeAsync()
    {
        if (_initialized) return;
        
        await _dbLock.WaitAsync();
        try
        {
            // Ensure directory exists
            var dbDirectory = Path.GetDirectoryName(_storageConfig.LocalDbPath);
            if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
            {
                Directory.CreateDirectory(dbDirectory);
            }
            
            var screenshotDirectory = _storageConfig.ScreenshotPath;
            if (!Directory.Exists(screenshotDirectory))
            {
                Directory.CreateDirectory(screenshotDirectory);
            }
            
            // Create connection
            var connectionString = new SqliteConnectionStringBuilder
            {
                DataSource = _storageConfig.LocalDbPath,
                Mode = SqliteOpenMode.ReadWriteCreate,
                Cache = SqliteCacheMode.Shared,
                ForeignKeys = true
            }.ToString();
            
            _connection = new SqliteConnection(connectionString);
            await _connection.OpenAsync();
            
            // Create tables
            await CreateTablesAsync();
            
            // Enable WAL mode for better concurrency
            await ExecuteNonQueryAsync("PRAGMA journal_mode=WAL;");
            await ExecuteNonQueryAsync("PRAGMA synchronous=NORMAL;");
            await ExecuteNonQueryAsync("PRAGMA cache_size=-32768;"); // 32MB cache
            
            _initialized = true;
            _logger.LogInformation("Local storage initialized at {Path}", _storageConfig.LocalDbPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize local storage");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    private async Task CreateTablesAsync()
    {
        var createTablesSql = @"
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                correlation_id TEXT NOT NULL UNIQUE,
                message_type INTEGER NOT NULL,
                client_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                payload TEXT NOT NULL,
                sent INTEGER NOT NULL DEFAULT 0,
                sent_at TEXT,
                retry_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_messages_sent ON messages(sent);
            CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
            CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
            
            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                correlation_id TEXT NOT NULL UNIQUE,
                session_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                trigger_reason TEXT NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                file_size INTEGER NOT NULL,
                format TEXT NOT NULL,
                metadata TEXT,
                uploaded INTEGER NOT NULL DEFAULT 0,
                uploaded_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_screenshots_session ON screenshots(session_id);
            CREATE INDEX IF NOT EXISTS idx_screenshots_uploaded ON screenshots(uploaded);
            
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                student_id TEXT,
                domain TEXT,
                login_time TEXT NOT NULL,
                logout_time TEXT,
                duration_seconds INTEGER,
                logout_reason TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(username);
            CREATE INDEX IF NOT EXISTS idx_sessions_login ON sessions(login_time);
            
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                correlation_id TEXT NOT NULL UNIQUE,
                session_id TEXT NOT NULL,
                alert_type INTEGER NOT NULL,
                severity INTEGER NOT NULL,
                description TEXT NOT NULL,
                screenshot_id TEXT,
                context TEXT,
                resolved INTEGER NOT NULL DEFAULT 0,
                resolved_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_alerts_session ON alerts(session_id);
            CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
            CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
            
            CREATE TABLE IF NOT EXISTS system_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                os_version TEXT,
                os_build TEXT,
                processor_info TEXT,
                total_memory INTEGER,
                client_version TEXT,
                boot_time TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        ";
        
        await ExecuteNonQueryAsync(createTablesSql);
    }
    
    public async Task SaveHeartbeatAsync(HeartbeatPayload heartbeat)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.Heartbeat,
            ClientId = Environment.MachineName,
            Timestamp = DateTime.UtcNow,
            Payload = System.Text.Json.JsonSerializer.Serialize(heartbeat)
        };
        
        await SaveMessageAsync(envelope);
    }
    
    public async Task SaveActivityLogAsync(ActivityLogPayload activity)
    {
        var envelope = new MessageEnvelope
        {
            Type = MessageType.ActivityLog,
            ClientId = Environment.MachineName,
            Timestamp = DateTime.UtcNow,
            Payload = System.Text.Json.JsonSerializer.Serialize(activity)
        };
        
        await SaveMessageAsync(envelope);
    }
    
    public async Task SaveScreenshotAsync(ScreenshotUploadPayload screenshot)
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var correlationId = Guid.NewGuid().ToString();
            var fileName = $"screenshot_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{correlationId[..8]}.{screenshot.Format.ToLower()}";
            var filePath = Path.Combine(_storageConfig.ScreenshotPath, fileName);
            
            // Save image to file
            await File.WriteAllBytesAsync(filePath, screenshot.ImageData);
            
            // Save metadata to database
            var sql = @"
                INSERT INTO screenshots (correlation_id, session_id, file_path, trigger_reason, width, height, file_size, format, metadata)
                VALUES ($correlationId, $sessionId, $filePath, $triggerReason, $width, $height, $fileSize, $format, $metadata);";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("$correlationId", correlationId);
            cmd.Parameters.AddWithValue("$sessionId", screenshot.SessionId);
            cmd.Parameters.AddWithValue("$filePath", filePath);
            cmd.Parameters.AddWithValue("$triggerReason", screenshot.TriggerReason);
            cmd.Parameters.AddWithValue("$width", screenshot.Width);
            cmd.Parameters.AddWithValue("$height", screenshot.Height);
            cmd.Parameters.AddWithValue("$fileSize", screenshot.FileSize);
            cmd.Parameters.AddWithValue("$format", screenshot.Format);
            cmd.Parameters.AddWithValue("$metadata", System.Text.Json.JsonSerializer.Serialize(screenshot.Metadata));
            
            await cmd.ExecuteNonQueryAsync();
            
            _logger.LogDebug("Screenshot saved: {FilePath} ({Size} bytes)", filePath, screenshot.FileSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save screenshot");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task SaveSessionStartAsync(SessionStartPayload session)
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var sql = @"
                INSERT OR REPLACE INTO sessions (id, username, student_id, domain, login_time)
                VALUES ($id, $username, $studentId, $domain, $loginTime);";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("$id", session.SessionId);
            cmd.Parameters.AddWithValue("$username", session.Username);
            cmd.Parameters.AddWithValue("$studentId", session.StudentId ?? string.Empty);
            cmd.Parameters.AddWithValue("$domain", session.Domain ?? string.Empty);
            cmd.Parameters.AddWithValue("$loginTime", session.LoginTime.ToString("O"));
            
            await cmd.ExecuteNonQueryAsync();
            
            // Also save as message for sync
            var envelope = new MessageEnvelope
            {
                Type = MessageType.SessionStart,
                ClientId = Environment.MachineName,
                Timestamp = DateTime.UtcNow,
                Payload = System.Text.Json.JsonSerializer.Serialize(session)
            };
            
            await SaveMessageAsync(envelope);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save session start");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task SaveSessionEndAsync(SessionEndPayload session)
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var sql = @"
                UPDATE sessions 
                SET logout_time = $logoutTime, duration_seconds = $duration, logout_reason = $reason
                WHERE id = $id;";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("$id", session.SessionId);
            cmd.Parameters.AddWithValue("$logoutTime", session.LogoutTime.ToString("O"));
            cmd.Parameters.AddWithValue("$duration", (long)session.Duration.TotalSeconds);
            cmd.Parameters.AddWithValue("$reason", session.LogoutReason ?? string.Empty);
            
            await cmd.ExecuteNonQueryAsync();
            
            // Also save as message for sync
            var envelope = new MessageEnvelope
            {
                Type = MessageType.SessionEnd,
                ClientId = Environment.MachineName,
                Timestamp = DateTime.UtcNow,
                Payload = System.Text.Json.JsonSerializer.Serialize(session)
            };
            
            await SaveMessageAsync(envelope);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save session end");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task SaveAlertAsync(AlertTriggeredPayload alert)
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var correlationId = Guid.NewGuid().ToString();
            
            var sql = @"
                INSERT INTO alerts (correlation_id, session_id, alert_type, severity, description, screenshot_id, context)
                VALUES ($correlationId, $sessionId, $alertType, $severity, $description, $screenshotId, $context);";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("$correlationId", correlationId);
            cmd.Parameters.AddWithValue("$sessionId", alert.SessionId);
            cmd.Parameters.AddWithValue("$alertType", (int)alert.AlertType);
            cmd.Parameters.AddWithValue("$severity", (int)alert.Severity);
            cmd.Parameters.AddWithValue("$description", alert.Description);
            cmd.Parameters.AddWithValue("$screenshotId", alert.ScreenshotId ?? string.Empty);
            cmd.Parameters.AddWithValue("$context", System.Text.Json.JsonSerializer.Serialize(alert.Context));
            
            await cmd.ExecuteNonQueryAsync();
            
            // Also save as message for sync
            var envelope = new MessageEnvelope
            {
                Type = MessageType.AlertTriggered,
                ClientId = Environment.MachineName,
                Timestamp = DateTime.UtcNow,
                Payload = System.Text.Json.JsonSerializer.Serialize(alert)
            };
            
            await SaveMessageAsync(envelope);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save alert");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    private async Task SaveMessageAsync(MessageEnvelope envelope)
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var sql = @"
                INSERT INTO messages (correlation_id, message_type, client_id, timestamp, payload)
                VALUES ($correlationId, $messageType, $clientId, $timestamp, $payload);";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("$correlationId", envelope.CorrelationId);
            cmd.Parameters.AddWithValue("$messageType", (int)envelope.Type);
            cmd.Parameters.AddWithValue("$clientId", envelope.ClientId);
            cmd.Parameters.AddWithValue("$timestamp", envelope.Timestamp.ToString("O"));
            cmd.Parameters.AddWithValue("$payload", envelope.Payload);
            
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save message");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task<List<MessageEnvelope>> GetPendingMessagesAsync(int maxCount = 100)
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var messages = new List<MessageEnvelope>();
            
            var sql = @"
                SELECT correlation_id, message_type, client_id, timestamp, payload
                FROM messages
                WHERE sent = 0
                ORDER BY timestamp ASC
                LIMIT $limit;";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("$limit", maxCount);
            
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                messages.Add(new MessageEnvelope
                {
                    CorrelationId = reader.GetString(0),
                    Type = (MessageType)reader.GetInt32(1),
                    ClientId = reader.GetString(2),
                    Timestamp = DateTime.Parse(reader.GetString(3)),
                    Payload = reader.GetString(4)
                });
            }
            
            return messages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get pending messages");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task MarkMessagesSentAsync(List<string> correlationIds)
    {
        if (correlationIds == null || correlationIds.Count == 0) return;
        
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var placeholders = string.Join(",", correlationIds.Select((_, i) => $"$id{i}"));
            var sql = $"UPDATE messages SET sent = 1, sent_at = datetime('now') WHERE correlation_id IN ({placeholders});";
            
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = sql;
            
            for (int i = 0; i < correlationIds.Count; i++)
            {
                cmd.Parameters.AddWithValue($"$id{i}", correlationIds[i]);
            }
            
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark messages as sent");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task CleanupOldDataAsync()
    {
        await _dbLock.WaitAsync();
        try
        {
            if (_connection == null) throw new InvalidOperationException("Database not initialized");
            
            var screenshotCutoff = DateTime.UtcNow.AddDays(-_storageConfig.ScreenshotRetentionDays).ToString("O");
            var activityCutoff = DateTime.UtcNow.AddDays(-_storageConfig.ActivityLogRetentionDays).ToString("O");
            
            // Delete old screenshots
            var screenshotSql = @"
                SELECT file_path FROM screenshots 
                WHERE created_at < $cutoff AND uploaded = 1;";
            
            var filesToDelete = new List<string>();
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = screenshotSql;
                cmd.Parameters.AddWithValue("$cutoff", screenshotCutoff);
                
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    filesToDelete.Add(reader.GetString(0));
                }
            }
            
            foreach (var file in filesToDelete)
            {
                try
                {
                    if (File.Exists(file))
                    {
                        File.Delete(file);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete screenshot file: {File}", file);
                }
            }
            
            // Delete old screenshot records
            await ExecuteNonQueryAsync($"DELETE FROM screenshots WHERE created_at < '{screenshotCutoff}' AND uploaded = 1;");
            
            // Delete old messages
            await ExecuteNonQueryAsync($"DELETE FROM messages WHERE sent = 1 AND sent_at < '{activityCutoff}';");
            
            // Delete old alerts (keep resolved ones longer)
            await ExecuteNonQueryAsync($"DELETE FROM alerts WHERE created_at < '{activityCutoff}' AND resolved = 1;");
            
            // Vacuum to reclaim space
            await ExecuteNonQueryAsync("VACUUM;");
            
            _logger.LogInformation("Cleanup completed. Deleted {Count} screenshot files", filesToDelete.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup old data");
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task<long> GetStorageSizeAsync()
    {
        await _dbLock.WaitAsync();
        try
        {
            long totalSize = 0;
            
            // Database file size
            if (File.Exists(_storageConfig.LocalDbPath))
            {
                totalSize += new FileInfo(_storageConfig.LocalDbPath).Length;
            }
            
            // Screenshot files
            if (Directory.Exists(_storageConfig.ScreenshotPath))
            {
                var files = Directory.GetFiles(_storageConfig.ScreenshotPath);
                foreach (var file in files)
                {
                    totalSize += new FileInfo(file).Length;
                }
            }
            
            return totalSize;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get storage size");
            return 0;
        }
        finally
        {
            _dbLock.Release();
        }
    }
    
    public async Task<bool> IsStorageFullAsync()
    {
        var size = await GetStorageSizeAsync();
        var maxSize = (long)_storageConfig.MaxLocalStorageMB * 1024 * 1024;
        return size >= maxSize;
    }
    
    private async Task ExecuteNonQueryAsync(string sql)
    {
        if (_connection == null) throw new InvalidOperationException("Database not initialized");
        
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = sql;
        await cmd.ExecuteNonQueryAsync();
    }
    
    public void Dispose()
    {
        _connection?.Dispose();
        _dbLock.Dispose();
        _initialized = false;
    }
}