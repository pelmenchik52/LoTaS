using LogisticsBackend.Models;
using Microsoft.EntityFrameworkCore;

using Route = LogisticsBackend.Models.Route;

namespace LogisticsBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<UserWarehouse> UserWarehouses => Set<UserWarehouse>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Trailer> Trailers => Set<Trailer>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<WarehouseStock> WarehouseStocks => Set<WarehouseStock>();
    public DbSet<Route> Routes => Set<Route>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderProduct> OrderProducts => Set<OrderProduct>();
    public DbSet<DeliveryRequest> DeliveryRequests => Set<DeliveryRequest>();
    public DbSet<DeliveryRequestProduct> DeliveryRequestProducts => Set<DeliveryRequestProduct>();
    public DbSet<TransactionArchive> TransactionArchives => Set<TransactionArchive>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<CompanyRequest> CompanyRequests => Set<CompanyRequest>();
    public DbSet<CompanyRequestProduct> CompanyRequestProducts => Set<CompanyRequestProduct>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserWarehouse>()
            .HasOne(uw => uw.User)
            .WithMany(u => u.UserWarehouses)
            .HasForeignKey(uw => uw.UserId);

        modelBuilder.Entity<UserWarehouse>()
            .HasOne(uw => uw.Warehouse)
            .WithMany(w => w.UserWarehouses)
            .HasForeignKey(uw => uw.WarehouseId);

        modelBuilder.Entity<DeliveryRequest>()
            .HasOne(dr => dr.Manager)
            .WithMany()
            .HasForeignKey(dr => dr.ManagerId)
            .IsRequired(false);

        modelBuilder.Entity<DeliveryRequest>()
            .HasOne(dr => dr.RequestedBy)
            .WithMany()
            .HasForeignKey(dr => dr.RequestedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Route>()
            .HasMany(r => r.Orders)
            .WithOne(o => o.Route)
            .HasForeignKey(o => o.RouteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<CompanyRequest>()
            .HasOne(cr => cr.Manager)
            .WithMany()
            .HasForeignKey(cr => cr.ManagerId)
            .IsRequired(false);

        // Decimal precision
        modelBuilder.Entity<Driver>()
            .Property(d => d.HourlyRate)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Route>()
            .Property(r => r.TotalCost).HasPrecision(12, 2);
        modelBuilder.Entity<Route>()
            .Property(r => r.FuelCost).HasPrecision(12, 2);
        modelBuilder.Entity<Route>()
            .Property(r => r.DriverSalary).HasPrecision(12, 2);
    }
}