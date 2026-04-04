using LogisticsBackend.DTOs;
using LogisticsBackend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LogisticsBackend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly UserRepository _users;
    private readonly AuditLogRepository _audit;
    private readonly DriverRepository _drivers;
    private readonly VehicleRepository _vehicles;
    private readonly TrailerRepository _trailers;
    private readonly WarehouseRepository _warehouses;
    private readonly ProductRepository _products;
    private readonly WarehouseStockRepository _stock;

    public AdminController(
        UserRepository users, AuditLogRepository audit,
        DriverRepository drivers, VehicleRepository vehicles,
        TrailerRepository trailers, WarehouseRepository warehouses,
        ProductRepository products, WarehouseStockRepository stock)
    {
        _users = users; _audit = audit; _drivers = drivers;
        _vehicles = vehicles; _trailers = trailers;
        _warehouses = warehouses; _products = products; _stock = stock;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await _users.GetAllAsync());

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var result = await _users.CreateAsync(dto);
        if (result == null) return BadRequest(new { message = "Email вже зайнятий" });
        await _audit.AddAsync(CurrentUserId, "Створення", "User", $"Створено користувача {dto.Email}", CurrentIp);
        return Ok(result);
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var ok = await _users.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Редагування", "User", $"Оновлено користувача id={id}", CurrentIp);
        return Ok(new { message = "Оновлено" });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var ok = await _users.DeleteAsync(id);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Деактивація", "User", $"Деактивовано користувача id={id}", CurrentIp);
        return Ok(new { message = "Деактивовано" });
    }

    // Drivers
    [HttpGet("drivers")]
    public async Task<IActionResult> GetDrivers() => Ok(await _drivers.GetAllAsync());

    [HttpPost("drivers")]
    public async Task<IActionResult> CreateDriver([FromBody] CreateDriverDto dto)
    {
        var result = await _drivers.CreateAsync(dto);
        await _audit.AddAsync(CurrentUserId, "Створення", "Driver", $"Створено водія {dto.Name}", CurrentIp);
        return Ok(result);
    }

    [HttpPut("drivers/{id}")]
    public async Task<IActionResult> UpdateDriver(int id, [FromBody] UpdateDriverDto dto)
    {
        var ok = await _drivers.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return Ok(new { message = "Оновлено" });
    }

    [HttpDelete("drivers/{id}")]
    public async Task<IActionResult> DeleteDriver(int id)
    {
        var ok = await _drivers.DeleteAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Деактивовано" });
    }

    // Vehicles
    [HttpGet("vehicles")]
    public async Task<IActionResult> GetVehicles() => Ok(await _vehicles.GetAllAsync());

    [HttpPost("vehicles")]
    public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleDto dto)
    {
        var result = await _vehicles.CreateAsync(dto);
        await _audit.AddAsync(CurrentUserId, "Створення", "Vehicle", $"Додано авто {dto.PlateNumber}", CurrentIp);
        return Ok(result);
    }

    [HttpPut("vehicles/{id}")]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] CreateVehicleDto dto)
    {
        var ok = await _vehicles.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return Ok(new { message = "Оновлено" });
    }

    [HttpDelete("vehicles/{id}")]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var ok = await _vehicles.DeleteAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Деактивовано" });
    }

    // Trailers
    [HttpGet("trailers")]
    public async Task<IActionResult> GetTrailers() => Ok(await _trailers.GetAllAsync());

    [HttpPost("trailers")]
    public async Task<IActionResult> CreateTrailer([FromBody] CreateTrailerDto dto)
    {
        var result = await _trailers.CreateAsync(dto);
        return Ok(result);
    }

    [HttpDelete("trailers/{id}")]
    public async Task<IActionResult> DeleteTrailer(int id)
    {
        var ok = await _trailers.DeleteAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Деактивовано" });
    }

    // Warehouses
    [HttpGet("warehouses")]
    public async Task<IActionResult> GetWarehouses() => Ok(await _warehouses.GetAllAsync());

    [HttpPost("warehouses")]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseDto dto)
    {
        var result = await _warehouses.CreateAsync(dto.Name, dto.Address, dto.Lat, dto.Lng);
        await _audit.AddAsync(CurrentUserId, "Створення", "Warehouse", $"Створено склад {dto.Name}", CurrentIp);
        return Ok(result);
    }

    [HttpPut("warehouses/{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseDto dto)
    {
        var ok = await _warehouses.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Редагування", "Warehouse", $"Оновлено склад id={id}", CurrentIp);
        return Ok(new { message = "Оновлено" });
    }

    [HttpDelete("warehouses/{id}")]
    public async Task<IActionResult> DeleteWarehouse(int id)
    {
        var ok = await _warehouses.DeleteAsync(id);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Деактивація", "Warehouse", $"Деактивовано склад id={id}", CurrentIp);
        return Ok(new { message = "Деактивовано" });
    }

    // Products
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts() => Ok(await _products.GetAllAsync());

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        var result = await _products.CreateAsync(dto);
        return Ok(result);
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductDto dto)
    {
        var ok = await _products.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return Ok(new { message = "Оновлено" });
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var ok = await _products.DeleteAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Деактивовано" });
    }

    // Stock (all warehouses)
    [HttpPost("inventory")]
    public async Task<IActionResult> CreateStock([FromBody] CreateStockDto dto)
    {
        var result = await _stock.CreateAsync(dto.WarehouseId, dto.ProductId, dto.Quantity, dto.Unit, dto.Shelf);
        if (result == null) return BadRequest(new { message = "Не вдалося створити запис" });
        await _audit.AddAsync(CurrentUserId, "Створення", "WarehouseStock",
            $"Створено залишок товару id={dto.ProductId} на складі id={dto.WarehouseId}, кількість={dto.Quantity}", CurrentIp);
        return Ok(result);
    }

    [HttpGet("inventory")]
    public async Task<IActionResult> GetAllInventory() => Ok(await _stock.GetAllAsync());

    [HttpPut("inventory/{id}")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
    {
        var ok = await _stock.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return Ok(new { message = "Оновлено" });
    }

    // Audit
    [HttpGet("audit")]
    public async Task<IActionResult> GetAudit() => Ok(await _audit.GetAllAsync());
}