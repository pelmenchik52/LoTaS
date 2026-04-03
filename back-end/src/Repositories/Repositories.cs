using LogisticsBackend.Data;
using LogisticsBackend.DTOs;
using LogisticsBackend.Models;
using LogisticsBackend.Services;
using Microsoft.EntityFrameworkCore;

using Route = LogisticsBackend.Models.Route;

namespace LogisticsBackend.Repositories;

public class UserRepository
{
	private readonly AppDbContext _db;
	public UserRepository(AppDbContext db) { _db = db; }

	public async Task<List<UserDto>> GetAllAsync()
	{
		return await _db.Users
			.Include(u => u.UserWarehouses)
			.Select(u => new UserDto(
				u.Id, u.Name, u.Email, u.Role, u.Active,
				u.UserWarehouses.Select(uw => uw.WarehouseId).ToList()
			)).ToListAsync();
	}

	public async Task<UserDto?> GetByIdAsync(int id)
	{
		var u = await _db.Users.Include(u => u.UserWarehouses).FirstOrDefaultAsync(u => u.Id == id);
		if (u == null) return null;
		return new UserDto(u.Id, u.Name, u.Email, u.Role, u.Active,
			u.UserWarehouses.Select(uw => uw.WarehouseId).ToList());
	}

	public async Task<UserDto?> CreateAsync(CreateUserDto dto)
	{
		if (await _db.Users.AnyAsync(u => u.Email == dto.Email)) return null;
		var user = new User
		{
			Name = dto.Name,
			Email = dto.Email,
			PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
			Role = dto.Role
		};
		_db.Users.Add(user);
		await _db.SaveChangesAsync();
		foreach (var wId in dto.WarehouseIds)
			_db.UserWarehouses.Add(new UserWarehouse { UserId = user.Id, WarehouseId = wId });
		await _db.SaveChangesAsync();
		return new UserDto(user.Id, user.Name, user.Email, user.Role, user.Active, dto.WarehouseIds);
	}

	public async Task<bool> UpdateAsync(int id, UpdateUserDto dto)
	{
		var user = await _db.Users.Include(u => u.UserWarehouses).FirstOrDefaultAsync(u => u.Id == id);
		if (user == null) return false;
		user.Name = dto.Name;
		user.Email = dto.Email;
		user.Role = dto.Role;
		user.Active = dto.Active;
		if (!string.IsNullOrEmpty(dto.Password))
			user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
		_db.UserWarehouses.RemoveRange(user.UserWarehouses);
		foreach (var wId in dto.WarehouseIds)
			_db.UserWarehouses.Add(new UserWarehouse { UserId = user.Id, WarehouseId = wId });
		await _db.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var user = await _db.Users.FindAsync(id);
		if (user == null) return false;
		user.Active = false;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class WarehouseRepository
{
	private readonly AppDbContext _db;
	public WarehouseRepository(AppDbContext db) { _db = db; }

	public async Task<List<WarehouseDto>> GetAllAsync() =>
		await _db.Warehouses
			.Where(w => w.Active)
			.Select(w => new WarehouseDto(w.Id, w.Name, w.Address, w.Lat, w.Lng, w.Active))
			.ToListAsync();

	public async Task<WarehouseDto?> CreateAsync(string name, string address, double lat, double lng)
	{
		var w = new Warehouse { Name = name, Address = address, Lat = lat, Lng = lng };
		_db.Warehouses.Add(w);
		await _db.SaveChangesAsync();
		return new WarehouseDto(w.Id, w.Name, w.Address, w.Lat, w.Lng, w.Active);
	}
}

public class ProductRepository
{
	private readonly AppDbContext _db;
	public ProductRepository(AppDbContext db) { _db = db; }

	public async Task<List<ProductDto>> GetAllAsync() =>
		await _db.Products
			.Where(p => p.Active)
			.Select(p => new ProductDto(p.Id, p.Name, p.Type, p.Weight, p.UrgencyCoefficient, p.ExpirationDays, p.Active))
			.ToListAsync();

	public async Task<ProductDto?> CreateAsync(CreateProductDto dto)
	{
		var p = new Product { Name = dto.Name, Type = dto.Type, Weight = dto.Weight, UrgencyCoefficient = dto.UrgencyCoefficient, ExpirationDays = dto.ExpirationDays };
		_db.Products.Add(p);
		await _db.SaveChangesAsync();
		return new ProductDto(p.Id, p.Name, p.Type, p.Weight, p.UrgencyCoefficient, p.ExpirationDays, p.Active);
	}

	public async Task<bool> UpdateAsync(int id, CreateProductDto dto)
	{
		var p = await _db.Products.FindAsync(id);
		if (p == null) return false;
		p.Name = dto.Name; p.Type = dto.Type; p.Weight = dto.Weight;
		p.UrgencyCoefficient = dto.UrgencyCoefficient; p.ExpirationDays = dto.ExpirationDays;
		await _db.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var p = await _db.Products.FindAsync(id);
		if (p == null) return false;
		p.Active = false;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class WarehouseStockRepository
{
	private readonly AppDbContext _db;
	private readonly InventoryService _inventoryService;
	public WarehouseStockRepository(AppDbContext db, InventoryService inventoryService)
	{ _db = db; _inventoryService = inventoryService; }

	public async Task<List<StockDto>> GetByWarehouseAsync(int warehouseId)
	{
		return await _db.WarehouseStocks
			.Include(s => s.Warehouse)
			.Include(s => s.Product)
			.Where(s => s.WarehouseId == warehouseId)
			.Select(s => new StockDto(
				s.Id, s.WarehouseId, s.Warehouse.Name,
				s.ProductId, s.Product.Name, s.Product.Type,
				s.Quantity, s.Unit, s.Shelf,
				s.Quantity <= 0 ? "out-of-stock" : s.Quantity < 20 ? "low-stock" : "in-stock",
				s.ExpiryDate, s.LastUpdated
			)).ToListAsync();
	}

	public async Task<List<StockDto>> GetAllAsync()
	{
		return await _db.WarehouseStocks
			.Include(s => s.Warehouse)
			.Include(s => s.Product)
			.Select(s => new StockDto(
				s.Id, s.WarehouseId, s.Warehouse.Name,
				s.ProductId, s.Product.Name, s.Product.Type,
				s.Quantity, s.Unit, s.Shelf,
				s.Quantity <= 0 ? "out-of-stock" : s.Quantity < 20 ? "low-stock" : "in-stock",
				s.ExpiryDate, s.LastUpdated
			)).ToListAsync();
	}

	public async Task<bool> UpdateAsync(int id, UpdateStockDto dto)
	{
		var s = await _db.WarehouseStocks.FindAsync(id);
		if (s == null) return false;
		s.Quantity = dto.Quantity; s.Unit = dto.Unit;
		s.Shelf = dto.Shelf; s.ExpiryDate = dto.ExpiryDate;
		s.LastUpdated = DateTime.UtcNow;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class DriverRepository
{
	private readonly AppDbContext _db;
	public DriverRepository(AppDbContext db) { _db = db; }

	public async Task<List<DriverDto>> GetAllAsync() =>
		await _db.Drivers
			.Include(d => d.Vehicle)
			.Where(d => d.Active)
			.Select(d => new DriverDto(
				d.Id, d.Name, d.Phone, d.License,
				d.VehicleId, d.Vehicle != null ? d.Vehicle.Model : null,
				d.Vehicle != null ? d.Vehicle.PlateNumber : null,
				d.HourlyRate, d.WorkHoursPerDay, d.WorkHoursThisWeek,
				d.MaxHoursPerWeek, d.IsBusy, d.Active
			)).ToListAsync();

	public async Task<DriverDto?> CreateAsync(CreateDriverDto dto)
	{
		var d = new Driver
		{
			Name = dto.Name,
			Phone = dto.Phone,
			License = dto.License,
			VehicleId = dto.VehicleId,
			HourlyRate = dto.HourlyRate,
			WorkHoursPerDay = dto.WorkHoursPerDay,
			MaxHoursPerWeek = dto.MaxHoursPerWeek
		};
		_db.Drivers.Add(d);
		await _db.SaveChangesAsync();
		return new DriverDto(d.Id, d.Name, d.Phone, d.License, d.VehicleId, null, null,
			d.HourlyRate, d.WorkHoursPerDay, d.WorkHoursThisWeek, d.MaxHoursPerWeek, d.IsBusy, d.Active);
	}

	public async Task<bool> UpdateAsync(int id, UpdateDriverDto dto)
	{
		var d = await _db.Drivers.FindAsync(id);
		if (d == null) return false;
		d.Name = dto.Name; d.Phone = dto.Phone; d.License = dto.License;
		d.VehicleId = dto.VehicleId; d.HourlyRate = dto.HourlyRate;
		d.WorkHoursPerDay = dto.WorkHoursPerDay; d.WorkHoursThisWeek = dto.WorkHoursThisWeek;
		d.MaxHoursPerWeek = dto.MaxHoursPerWeek; d.IsBusy = dto.IsBusy; d.Active = dto.Active;
		await _db.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var d = await _db.Drivers.FindAsync(id);
		if (d == null) return false;
		d.Active = false;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class VehicleRepository
{
	private readonly AppDbContext _db;
	public VehicleRepository(AppDbContext db) { _db = db; }

	public async Task<List<VehicleDto>> GetAllAsync() =>
		await _db.Vehicles
			.Include(v => v.Trailer)
			.Where(v => v.Active)
			.Select(v => new VehicleDto(
				v.Id, v.Model, v.PlateNumber, v.FuelConsumption, v.Power,
				v.TrailerId, v.Trailer != null ? v.Trailer.Type : null,
				v.FuelType, v.Capacity, v.Active
			)).ToListAsync();

	public async Task<VehicleDto?> CreateAsync(CreateVehicleDto dto)
	{
		var v = new Vehicle
		{
			Model = dto.Model,
			PlateNumber = dto.PlateNumber,
			FuelConsumption = dto.FuelConsumption,
			Power = dto.Power,
			TrailerId = dto.TrailerId,
			FuelType = dto.FuelType,
			Capacity = dto.Capacity
		};
		_db.Vehicles.Add(v);
		await _db.SaveChangesAsync();
		return new VehicleDto(v.Id, v.Model, v.PlateNumber, v.FuelConsumption, v.Power,
			v.TrailerId, null, v.FuelType, v.Capacity, v.Active);
	}

	public async Task<bool> UpdateAsync(int id, CreateVehicleDto dto)
	{
		var v = await _db.Vehicles.FindAsync(id);
		if (v == null) return false;
		v.Model = dto.Model; v.PlateNumber = dto.PlateNumber;
		v.FuelConsumption = dto.FuelConsumption; v.Power = dto.Power;
		v.TrailerId = dto.TrailerId; v.FuelType = dto.FuelType; v.Capacity = dto.Capacity;
		await _db.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var v = await _db.Vehicles.FindAsync(id);
		if (v == null) return false;
		v.Active = false;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class TrailerRepository
{
	private readonly AppDbContext _db;
	public TrailerRepository(AppDbContext db) { _db = db; }

	public async Task<List<TrailerDto>> GetAllAsync() =>
		await _db.Trailers
			.Where(t => t.Active)
			.Select(t => new TrailerDto(t.Id, t.Type, t.Length, t.Width, t.MaxWeight, t.Active))
			.ToListAsync();

	public async Task<TrailerDto?> CreateAsync(CreateTrailerDto dto)
	{
		var t = new Trailer { Type = dto.Type, Length = dto.Length, Width = dto.Width, MaxWeight = dto.MaxWeight };
		_db.Trailers.Add(t);
		await _db.SaveChangesAsync();
		return new TrailerDto(t.Id, t.Type, t.Length, t.Width, t.MaxWeight, t.Active);
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var t = await _db.Trailers.FindAsync(id);
		if (t == null) return false;
		t.Active = false;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class RouteRepository
{
	private readonly AppDbContext _db;
	public RouteRepository(AppDbContext db) { _db = db; }

	private static RouteDto MapRoute(LogisticsBackend.Models.Route r) => new(
		r.Id, r.From, r.To, r.Distance, r.EstimatedTime,
		r.DriverId, r.Driver?.Name, r.VehicleId, r.Vehicle?.Model,
		r.Status, r.TotalCost, r.FuelCost, r.DriverSalary, r.CreatedAt,
		r.Orders.Select(o => new OrderDto(
			o.Id, o.RouteId, o.From, o.To, o.Status, o.Urgency,
			o.OrderProducts.Select(op => new OrderProductDto(op.ProductId, op.Product?.Name, op.Quantity, op.Weight)).ToList()
		)).ToList()
	);

	public async Task<List<RouteDto>> GetAllAsync() =>
		(await _db.Routes
			.Include(r => r.Driver)
			.Include(r => r.Vehicle)
			.Include(r => r.Orders).ThenInclude(o => o.OrderProducts).ThenInclude(op => op.Product)
			.OrderByDescending(r => r.CreatedAt)
			.ToListAsync()).Select(MapRoute).ToList();

	public async Task<RouteDto?> GetByIdAsync(int id)
	{
		var r = await _db.Routes
			.Include(r => r.Driver)
			.Include(r => r.Vehicle)
			.Include(r => r.Orders).ThenInclude(o => o.OrderProducts).ThenInclude(op => op.Product)
			.FirstOrDefaultAsync(r => r.Id == id);
		return r == null ? null : MapRoute(r);
	}

	public async Task<RouteDto?> CreateAsync(CreateRouteDto dto)
	{
		var route = new Route
		{
			From = dto.From,
			To = dto.To,
			Distance = dto.Distance,
			EstimatedTime = dto.EstimatedTime,
			DriverId = dto.DriverId,
			VehicleId = dto.VehicleId
		};
		foreach (var o in dto.Orders)
		{
			var order = new Order { From = o.From, To = o.To, Urgency = o.Urgency };
			foreach (var op in o.Products)
				order.OrderProducts.Add(new OrderProduct { ProductId = op.ProductId, Quantity = op.Quantity, Weight = op.Weight });
			route.Orders.Add(order);
		}
		_db.Routes.Add(route);
		await _db.SaveChangesAsync();
		return await GetByIdAsync(route.Id);
	}

	public async Task<bool> UpdateStatusAsync(int id, string status)
	{
		var r = await _db.Routes.FindAsync(id);
		if (r == null) return false;
		r.Status = status;
		// If driver is marked busy/free based on route status
		if (r.DriverId.HasValue)
		{
			var driver = await _db.Drivers.FindAsync(r.DriverId.Value);
			if (driver != null)
				driver.IsBusy = status == "in-progress";
		}
		await _db.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var r = await _db.Routes.FindAsync(id);
		if (r == null) return false;
		_db.Routes.Remove(r);
		await _db.SaveChangesAsync();
		return true;
	}
}

public class OrderRepository
{
	private readonly AppDbContext _db;
	public OrderRepository(AppDbContext db) { _db = db; }

	public async Task<List<OrderDto>> GetAllAsync() =>
		await _db.Orders
			.Include(o => o.OrderProducts).ThenInclude(op => op.Product)
			.Select(o => new OrderDto(
				o.Id, o.RouteId, o.From, o.To, o.Status, o.Urgency,
				o.OrderProducts.Select(op => new OrderProductDto(op.ProductId, op.Product.Name, op.Quantity, op.Weight)).ToList()
			)).ToListAsync();
}

public class DeliveryRequestRepository
{
	private readonly AppDbContext _db;
	public DeliveryRequestRepository(AppDbContext db) { _db = db; }

	private static DeliveryRequestDto Map(DeliveryRequest r) => new(
		r.Id, r.WarehouseId, r.Warehouse?.Name ?? "",
		r.RequestedById, r.RequestedBy?.Name ?? "",
		r.Status, r.ManagerId, r.Notes, r.Urgency, r.CreatedAt,
		r.Products.Select(p => new RequestProductDto(p.ProductId, p.Product?.Name, p.Quantity, p.Weight)).ToList()
	);

	public async Task<List<DeliveryRequestDto>> GetAllAsync() =>
		(await _db.DeliveryRequests
			.Include(r => r.Warehouse)
			.Include(r => r.RequestedBy)
			.Include(r => r.Products).ThenInclude(p => p.Product)
			.OrderByDescending(r => r.Urgency).ThenByDescending(r => r.CreatedAt)
			.ToListAsync()).Select(Map).ToList();

	public async Task<List<DeliveryRequestDto>> GetByWarehouseAsync(int warehouseId) =>
		(await _db.DeliveryRequests
			.Include(r => r.Warehouse)
			.Include(r => r.RequestedBy)
			.Include(r => r.Products).ThenInclude(p => p.Product)
			.Where(r => r.WarehouseId == warehouseId)
			.OrderByDescending(r => r.CreatedAt)
			.ToListAsync()).Select(Map).ToList();

	public async Task<DeliveryRequestDto?> CreateAsync(CreateDeliveryRequestDto dto, int userId)
	{
		var req = new DeliveryRequest
		{
			WarehouseId = dto.WarehouseId,
			RequestedById = userId,
			Notes = dto.Notes,
			Urgency = dto.Urgency
		};
		foreach (var p in dto.Products)
			req.Products.Add(new DeliveryRequestProduct { ProductId = p.ProductId, Quantity = p.Quantity, Weight = p.Weight });
		_db.DeliveryRequests.Add(req);
		await _db.SaveChangesAsync();
		var created = await _db.DeliveryRequests
			.Include(r => r.Warehouse)
			.Include(r => r.RequestedBy)
			.Include(r => r.Products).ThenInclude(p => p.Product)
			.FirstOrDefaultAsync(r => r.Id == req.Id);
		return created == null ? null : Map(created);
	}

	public async Task<bool> UpdateStatusAsync(int id, UpdateDeliveryRequestStatusDto dto)
	{
		var r = await _db.DeliveryRequests.FindAsync(id);
		if (r == null) return false;
		r.Status = dto.Status;
		if (dto.ManagerId.HasValue) r.ManagerId = dto.ManagerId;
		await _db.SaveChangesAsync();
		return true;
	}
}

public class TransactionArchiveRepository
{
	private readonly AppDbContext _db;
	public TransactionArchiveRepository(AppDbContext db) { _db = db; }

	public async Task<List<TransactionDto>> GetAllAsync() =>
		await _db.TransactionArchives
			.Include(t => t.Warehouse)
			.Include(t => t.Product)
			.Include(t => t.PerformedBy)
			.OrderByDescending(t => t.Date)
			.Select(t => new TransactionDto(
				t.Id, t.Type, t.WarehouseId, t.Warehouse.Name,
				t.ProductId, t.Product.Name, t.Quantity,
				t.Date, t.PerformedBy.Name, t.Notes
			)).ToListAsync();

	public async Task<List<TransactionDto>> GetByWarehouseAsync(int warehouseId) =>
		await _db.TransactionArchives
			.Include(t => t.Warehouse)
			.Include(t => t.Product)
			.Include(t => t.PerformedBy)
			.Where(t => t.WarehouseId == warehouseId)
			.OrderByDescending(t => t.Date)
			.Select(t => new TransactionDto(
				t.Id, t.Type, t.WarehouseId, t.Warehouse.Name,
				t.ProductId, t.Product.Name, t.Quantity,
				t.Date, t.PerformedBy.Name, t.Notes
			)).ToListAsync();
}

public class AuditLogRepository
{
	private readonly AppDbContext _db;
	public AuditLogRepository(AppDbContext db) { _db = db; }

	public async Task<List<AuditLogDto>> GetAllAsync() =>
		await _db.AuditLogs
			.Include(a => a.User)
			.OrderByDescending(a => a.Timestamp)
			.Select(a => new AuditLogDto(
				a.Id, a.UserId, a.User.Name,
				a.Action, a.Entity, a.Details,
				a.Timestamp, a.IpAddress
			)).ToListAsync();

	public async Task AddAsync(int userId, string action, string entity, string? details, string ip)
	{
		_db.AuditLogs.Add(new AuditLog
		{
			UserId = userId,
			Action = action,
			Entity = entity,
			Details = details,
			IpAddress = ip
		});
		await _db.SaveChangesAsync();
	}
}