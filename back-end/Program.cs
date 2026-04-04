using LogisticsBackend.Data;
//using LogisticsBackend.Middlewares;
using LogisticsBackend.Services;
using LogisticsBackend.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.Parse("8.0"), 
        mySqlOptions => mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 10, 
            maxRetryDelay: TimeSpan.FromSeconds(5), 
            errorNumbersToAdd: null)));
// JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// CORS - allow React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Repositories
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<RouteRepository>();
builder.Services.AddScoped<WarehouseStockRepository>();
builder.Services.AddScoped<DriverRepository>();
builder.Services.AddScoped<VehicleRepository>();
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<OrderRepository>();
builder.Services.AddScoped<DeliveryRequestRepository>();
builder.Services.AddScoped<TransactionArchiveRepository>();
builder.Services.AddScoped<AuditLogRepository>();
builder.Services.AddScoped<WarehouseRepository>();
builder.Services.AddScoped<TrailerRepository>();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<RouteService>();
builder.Services.AddScoped<InventoryService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Seed database on startup
// Seed database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Give the database a moment to accept connections 
   
    // REPLACE EnsureCreatedAsync with MigrateAsync
    await db.Database.MigrateAsync(); 
    
    await DbSeeder.SeedAsync(db);
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();