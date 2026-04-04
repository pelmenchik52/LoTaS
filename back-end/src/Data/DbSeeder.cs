using LogisticsBackend.Models;
using Microsoft.EntityFrameworkCore;

using Route = LogisticsBackend.Models.Route;

namespace LogisticsBackend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Seed only if empty
        if (await db.Users.AnyAsync()) return;

        // Warehouses
        var warehouses = new List<Warehouse>
        {
            new() { Name = "Склад 1", Address = "вул. Промислова, 15, Київ", Lat = 50.4265, Lng = 30.5383 },
            new() { Name = "Склад 2", Address = "просп. Бажана, 10, Київ", Lat = 50.3975, Lng = 30.6341 },
            new() { Name = "Склад 3", Address = "вул. Жилянська, 120, Київ", Lat = 50.4492, Lng = 30.4176 },
            new() { Name = "Склад 4", Address = "вул. Відрадна, 95, Київ", Lat = 50.4350, Lng = 30.4890 },
            new() { Name = "Склад 5", Address = "вул. Харківське шосе, 17, Київ", Lat = 50.4100, Lng = 30.6200 },
        };
        db.Warehouses.AddRange(warehouses);
        await db.SaveChangesAsync();

        // Users
        var admin = new User { Name = "Олександр Коваленко", Email = "admin@company.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"), Role = "admin" };
        var manager = new User { Name = "Марія Шевченко", Email = "manager@company.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager"), Role = "manager" };
        var warehouse = new User { Name = "Іван Петренко", Email = "warehouse@company.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("warehouse"), Role = "warehouse" };
        var accountant = new User { Name = "Ольга Сидоренко", Email = "accountant@company.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("accountant"), Role = "accountant" };

        db.Users.AddRange(admin, manager, warehouse, accountant);
        await db.SaveChangesAsync();

        // Link warehouse user to warehouses 1 and 3
        db.UserWarehouses.AddRange(
            new UserWarehouse { UserId = warehouse.Id, WarehouseId = warehouses[0].Id },
            new UserWarehouse { UserId = warehouse.Id, WarehouseId = warehouses[2].Id }
        );
        await db.SaveChangesAsync();

        // Trailers
        var trailers = new List<Trailer>
        {
            new() { Type = "Тент", Length = 13.6, Width = 2.45, MaxWeight = 20000 },
            new() { Type = "Рефрижератор", Length = 13.6, Width = 2.45, MaxWeight = 18000 },
            new() { Type = "Контейнеровоз", Length = 12.0, Width = 2.5, MaxWeight = 24000 },
        };
        db.Trailers.AddRange(trailers);
        await db.SaveChangesAsync();

        // Vehicles
        var vehicles = new List<Vehicle>
        {
            new() { Model = "Mercedes Actros", PlateNumber = "AA 1234 BB", FuelConsumption = 28.5, Power = 450, TrailerId = trailers[0].Id, FuelType = "diesel", Capacity = 20000 },
            new() { Model = "Volvo FH16", PlateNumber = "AA 5678 BB", FuelConsumption = 30.0, Power = 540, TrailerId = trailers[1].Id, FuelType = "diesel", Capacity = 18000 },
            new() { Model = "MAN TGX", PlateNumber = "AA 9012 CC", FuelConsumption = 27.5, Power = 500, TrailerId = null, FuelType = "diesel", Capacity = 19000 },
        };
        db.Vehicles.AddRange(vehicles);
        await db.SaveChangesAsync();

        // Drivers
        var drivers = new List<Driver>
        {
            new() { Name = "Дмитро Іваненко", Phone = "+380 67 123 4567", License = "ABC123456", VehicleId = vehicles[0].Id, HourlyRate = 150, WorkHoursPerDay = 8, WorkHoursThisWeek = 32, MaxHoursPerWeek = 48, IsBusy = false },
            new() { Name = "Андрій Мельник", Phone = "+380 63 987 6543", License = "DEF789012", VehicleId = vehicles[1].Id, HourlyRate = 160, WorkHoursPerDay = 8, WorkHoursThisWeek = 40, MaxHoursPerWeek = 48, IsBusy = true },
            new() { Name = "Василь Петров", Phone = "+380 50 555 1234", License = "GHI345678", VehicleId = null, HourlyRate = 145, WorkHoursPerDay = 8, WorkHoursThisWeek = 24, MaxHoursPerWeek = 48, IsBusy = false },
        };
        db.Drivers.AddRange(drivers);
        await db.SaveChangesAsync();

        // Products
        var products = new List<Product>
        {
            new() { Name = "Молоко 2.5%", Type = "Швидкопсувний", Weight = 1.0, UrgencyCoefficient = 9, ExpirationDays = 7 },
            new() { Name = "Хліб білий", Type = "Швидкопсувний", Weight = 0.5, UrgencyCoefficient = 8, ExpirationDays = 3 },
            new() { Name = "М'ясо яловичина", Type = "Заморожений", Weight = 2.0, UrgencyCoefficient = 10, ExpirationDays = 1 },
            new() { Name = "Консерви", Type = "Звичайний", Weight = 0.4, UrgencyCoefficient = 3 },
            new() { Name = "Крупи", Type = "Звичайний", Weight = 1.0, UrgencyCoefficient = 2 },
            new() { Name = "Яблука Голден", Type = "Швидкопсувний", Weight = 1.0, UrgencyCoefficient = 6, ExpirationDays = 14 },
            new() { Name = "Сир твердий", Type = "Швидкопсувний", Weight = 1.0, UrgencyCoefficient = 7, ExpirationDays = 30 },
            new() { Name = "Цукор", Type = "Звичайний", Weight = 1.0, UrgencyCoefficient = 2 },
            new() { Name = "Макарони", Type = "Звичайний", Weight = 0.5, UrgencyCoefficient = 1 },
            new() { Name = "Йогурт", Type = "Швидкопсувний", Weight = 0.2, UrgencyCoefficient = 8, ExpirationDays = 5 },
        };
        db.Products.AddRange(products);
        await db.SaveChangesAsync();

        // Warehouse stocks
        var stocks = new List<WarehouseStock>
        {
            new() { WarehouseId = warehouses[0].Id, ProductId = products[0].Id, Quantity = 240, Unit = "л", Shelf = "A-12", ExpiryDate = DateTime.UtcNow.AddDays(12) },
            new() { WarehouseId = warehouses[0].Id, ProductId = products[1].Id, Quantity = 85, Unit = "шт", Shelf = "B-05", ExpiryDate = DateTime.UtcNow.AddDays(2) },
            new() { WarehouseId = warehouses[0].Id, ProductId = products[5].Id, Quantity = 120, Unit = "кг", Shelf = "C-08" },
            new() { WarehouseId = warehouses[0].Id, ProductId = products[6].Id, Quantity = 15, Unit = "кг", Shelf = "A-15", ExpiryDate = DateTime.UtcNow.AddDays(17) },
            new() { WarehouseId = warehouses[0].Id, ProductId = products[8].Id, Quantity = 200, Unit = "уп", Shelf = "D-03" },
            new() { WarehouseId = warehouses[0].Id, ProductId = products[9].Id, Quantity = 8, Unit = "шт", Shelf = "A-13", ExpiryDate = DateTime.UtcNow.AddDays(2) },
            new() { WarehouseId = warehouses[0].Id, ProductId = products[7].Id, Quantity = 150, Unit = "кг", Shelf = "D-01" },
            new() { WarehouseId = warehouses[1].Id, ProductId = products[0].Id, Quantity = 100, Unit = "л", Shelf = "A-01" },
            new() { WarehouseId = warehouses[1].Id, ProductId = products[2].Id, Quantity = 50, Unit = "кг", Shelf = "B-03" },
            new() { WarehouseId = warehouses[2].Id, ProductId = products[3].Id, Quantity = 300, Unit = "шт", Shelf = "C-05" },
            new() { WarehouseId = warehouses[2].Id, ProductId = products[4].Id, Quantity = 500, Unit = "кг", Shelf = "D-02" },
        };
        db.WarehouseStocks.AddRange(stocks);
        await db.SaveChangesAsync();

        // Sample Routes
        var route1 = new Route
        {
            From = "Склад 1",
            To = "Сільпо Центр",
            Distance = 15.3,
            EstimatedTime = 1.2,
            DriverId = drivers[0].Id,
            VehicleId = vehicles[0].Id,
            Status = "in-progress",
            TotalCost = 2150,
            FuelCost = 700,
            DriverSalary = 1200,
        };
        var route2 = new Route
        {
            From = "Склад 2",
            To = "АТБ Подол",
            Distance = 22.1,
            EstimatedTime = 1.8,
            DriverId = drivers[1].Id,
            VehicleId = vehicles[1].Id,
            Status = "planned",
            TotalCost = 3100,
            FuelCost = 1100,
            DriverSalary = 1800,
        };
        db.Routes.AddRange(route1, route2);
        await db.SaveChangesAsync();

        // Sample delivery requests
        var req = new DeliveryRequest
        {
            WarehouseId = warehouses[0].Id,
            RequestedById = warehouse.Id,
            Status = "pending",
            Urgency = 2,
            Notes = "Термінова поставка молока",
        };
        req.Products.Add(new DeliveryRequestProduct { ProductId = products[0].Id, Quantity = 200, Weight = 200 });
        req.Products.Add(new DeliveryRequestProduct { ProductId = products[1].Id, Quantity = 150, Weight = 75 });
        db.DeliveryRequests.Add(req);
        await db.SaveChangesAsync();

        // Audit log seed
        db.AuditLogs.Add(new AuditLog
        {
            UserId = admin.Id,
            Action = "Ініціалізація",
            Entity = "System",
            Details = "База даних проініціалізована",
            IpAddress = "127.0.0.1"
        });
        await db.SaveChangesAsync();
    }
}