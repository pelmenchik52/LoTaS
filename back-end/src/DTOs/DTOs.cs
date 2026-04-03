namespace LogisticsBackend.DTOs;

// Auth
public record LoginRequestDto(string Email, string Password);

public record RegisterRequestDto(
    string Name,
    string Email,
    string Password,
    string Role,
    List<int> WarehouseIds
);

public record AuthResponseDto(
    string Token,
    string Name,
    string Email,
    string Role,
    int Id,
    List<int> WarehouseIds
);

// Users
public record UserDto(
    int Id,
    string Name,
    string Email,
    string Role,
    bool Active,
    List<int> WarehouseIds
);

public record CreateUserDto(
    string Name,
    string Email,
    string Password,
    string Role,
    List<int> WarehouseIds
);

public record UpdateUserDto(
    string Name,
    string Email,
    string Role,
    bool Active,
    List<int> WarehouseIds,
    string? Password
);

// Warehouses
public record WarehouseDto(int Id, string Name, string Address, double Lat, double Lng, bool Active);

// Products
public record ProductDto(
    int Id, string Name, string Type,
    double Weight, int UrgencyCoefficient, int? ExpirationDays, bool Active
);

public record CreateProductDto(
    string Name, string Type,
    double Weight, int UrgencyCoefficient, int? ExpirationDays
);

// Stock
public record StockDto(
    int Id, int WarehouseId, string WarehouseName,
    int ProductId, string ProductName, string ProductType,
    double Quantity, string Unit, string Shelf,
    string Status, // in-stock | low-stock | out-of-stock
    DateTime? ExpiryDate, DateTime LastUpdated
);

public record UpdateStockDto(double Quantity, string Unit, string Shelf, DateTime? ExpiryDate);

// Vehicles
public record VehicleDto(
    int Id, string Model, string PlateNumber,
    double FuelConsumption, int Power, int? TrailerId, string? TrailerType,
    string FuelType, double Capacity, bool Active
);

public record CreateVehicleDto(
    string Model, string PlateNumber, double FuelConsumption,
    int Power, int? TrailerId, string FuelType, double Capacity
);

// Trailers
public record TrailerDto(int Id, string Type, double Length, double Width, double MaxWeight, bool Active);

public record CreateTrailerDto(string Type, double Length, double Width, double MaxWeight);

// Drivers
public record DriverDto(
    int Id, string Name, string Phone, string License,
    int? VehicleId, string? VehicleModel, string? PlateNumber,
    decimal HourlyRate, double WorkHoursPerDay, double WorkHoursThisWeek,
    double MaxHoursPerWeek, bool IsBusy, bool Active
);

public record CreateDriverDto(
    string Name, string Phone, string License,
    int? VehicleId, decimal HourlyRate, double WorkHoursPerDay,
    double MaxHoursPerWeek
);

public record UpdateDriverDto(
    string Name, string Phone, string License,
    int? VehicleId, decimal HourlyRate, double WorkHoursPerDay,
    double WorkHoursThisWeek, double MaxHoursPerWeek, bool IsBusy, bool Active
);

// Routes
public record RouteDto(
    int Id, string From, string To, double Distance, double EstimatedTime,
    int? DriverId, string? DriverName, int? VehicleId, string? VehicleModel,
    string Status, decimal? TotalCost, decimal? FuelCost, decimal? DriverSalary,
    DateTime CreatedAt, List<OrderDto> Orders
);

public record CreateRouteDto(
    string From, string To, double Distance, double EstimatedTime,
    int? DriverId, int? VehicleId, List<CreateOrderDto> Orders
);

public record UpdateRouteStatusDto(string Status);

// Orders
public record OrderDto(
    int Id, int RouteId, string From, string To,
    string Status, int Urgency, List<OrderProductDto> Products
);

public record CreateOrderDto(
    string From, string To, int Urgency, List<OrderProductDto> Products
);

public record OrderProductDto(int ProductId, string? ProductName, double Quantity, double Weight);

// Delivery Requests
public record DeliveryRequestDto(
    int Id, int WarehouseId, string WarehouseName,
    int RequestedById, string RequestedByName,
    string Status, int? ManagerId, string? Notes, int Urgency,
    DateTime CreatedAt, List<RequestProductDto> Products
);

public record CreateDeliveryRequestDto(
    int WarehouseId,
    List<RequestProductDto> Products,
    string? Notes,
    int Urgency
);

public record RequestProductDto(int ProductId, string? ProductName, double Quantity, double Weight);

public record UpdateDeliveryRequestStatusDto(string Status, int? ManagerId);

// Transactions
public record TransactionDto(
    int Id, string Type, int WarehouseId, string WarehouseName,
    int ProductId, string ProductName, double Quantity,
    DateTime Date, string PerformedByName, string? Notes
);

public record CreateTransactionDto(
    string Type, int WarehouseId, int ProductId,
    double Quantity, string? Notes
);

// Audit
public record AuditLogDto(
    int Id, int UserId, string UserName,
    string Action, string Entity, string? Details,
    DateTime Timestamp, string IpAddress
);

// Costs calculation
public record CostCalculationDto(
    double Distance,
    double FuelConsumption,
    double FuelPrice,
    decimal HourlyRate,
    double EstimatedHours,
    double CargoWeight,
    double VehicleCapacity
);

public record CostResultDto(
    decimal FuelCost,
    decimal DriverSalary,
    decimal TotalCost,
    double EfficiencyPercent
);