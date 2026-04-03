namespace LogisticsBackend.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = ""; // admin | manager | warehouse | accountant
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserWarehouse> UserWarehouses { get; set; } = new List<UserWarehouse>();
}

public class UserWarehouse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
}

public class Warehouse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Address { get; set; } = "";
    public double Lat { get; set; }
    public double Lng { get; set; }
    public bool Active { get; set; } = true;

    public ICollection<WarehouseStock> Stocks { get; set; } = new List<WarehouseStock>();
    public ICollection<UserWarehouse> UserWarehouses { get; set; } = new List<UserWarehouse>();
}

public class Vehicle
{
    public int Id { get; set; }
    public string Model { get; set; } = "";
    public string PlateNumber { get; set; } = "";
    public double FuelConsumption { get; set; } // л/100км
    public int Power { get; set; } // к.с.
    public int? TrailerId { get; set; }
    public Trailer? Trailer { get; set; }
    public string FuelType { get; set; } = "diesel"; // diesel | petrol | electric
    public double Capacity { get; set; } // кг
    public bool Active { get; set; } = true;
}

public class Trailer
{
    public int Id { get; set; }
    public string Type { get; set; } = "";
    public double Length { get; set; }
    public double Width { get; set; }
    public double MaxWeight { get; set; }
    public bool Active { get; set; } = true;
}

public class Driver
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string License { get; set; } = "";
    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public decimal HourlyRate { get; set; }
    public double WorkHoursPerDay { get; set; }
    public double WorkHoursThisWeek { get; set; }
    public double MaxHoursPerWeek { get; set; }
    public bool IsBusy { get; set; }
    public bool Active { get; set; } = true;
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Type { get; set; } = ""; // Швидкопсувний | Заморожений | Звичайний
    public double Weight { get; set; } // кг за одиницю
    public int UrgencyCoefficient { get; set; } // 1-10
    public int? ExpirationDays { get; set; }
    public bool Active { get; set; } = true;
}

public class WarehouseStock
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public double Quantity { get; set; }
    public string Unit { get; set; } = "шт";
    public string Shelf { get; set; } = "";
    public DateTime? ExpiryDate { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class Route
{
    public int Id { get; set; }
    public string From { get; set; } = "";
    public string To { get; set; } = "";
    public double Distance { get; set; } // км
    public double EstimatedTime { get; set; } // годин
    public int? DriverId { get; set; }
    public Driver? Driver { get; set; }
    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public string Status { get; set; } = "planned"; // planned | in-progress | completed | cancelled
    public decimal? TotalCost { get; set; }
    public decimal? FuelCost { get; set; }
    public decimal? DriverSalary { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

public class Order
{
    public int Id { get; set; }
    public int RouteId { get; set; }
    public Route Route { get; set; } = null!;
    public string From { get; set; } = "";
    public string To { get; set; } = "";
    public string Status { get; set; } = "pending"; // pending | in-transit | delivered
    public int Urgency { get; set; } = 5; // 1-10
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderProduct> OrderProducts { get; set; } = new List<OrderProduct>();
}

public class OrderProduct
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public double Quantity { get; set; }
    public double Weight { get; set; }
}

public class DeliveryRequest
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public int RequestedById { get; set; }
    public User RequestedBy { get; set; } = null!;
    public string Status { get; set; } = "pending"; // pending | approved | rejected | completed
    public int? ManagerId { get; set; }
    public User? Manager { get; set; }
    public string? Notes { get; set; }
    public int Urgency { get; set; } = 5; // 1=normal, 2=high, 3=critical
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<DeliveryRequestProduct> Products { get; set; } = new List<DeliveryRequestProduct>();
}

public class DeliveryRequestProduct
{
    public int Id { get; set; }
    public int DeliveryRequestId { get; set; }
    public DeliveryRequest DeliveryRequest { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public double Quantity { get; set; }
    public double Weight { get; set; }
}

public class TransactionArchive
{
    public int Id { get; set; }
    public string Type { get; set; } = ""; // receiving | shipping
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public double Quantity { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public int PerformedById { get; set; }
    public User PerformedBy { get; set; } = null!;
    public string? Notes { get; set; }
}

public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Action { get; set; } = "";
    public string Entity { get; set; } = "";
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string IpAddress { get; set; } = "";
}