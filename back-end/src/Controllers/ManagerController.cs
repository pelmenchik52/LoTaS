using LogisticsBackend.DTOs;
using LogisticsBackend.Repositories;
using LogisticsBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LogisticsBackend.Controllers;

[ApiController]
[Route("api/manager")]
[Authorize(Roles = "manager,admin")]
public class ManagerController : ControllerBase
{
    private readonly RouteRepository _routes;
    private readonly RouteService _routeService;
    private readonly DeliveryRequestRepository _requests;
    private readonly DriverRepository _drivers;
    private readonly VehicleRepository _vehicles;
    private readonly ProductRepository _products;
    private readonly AuditLogRepository _audit;

    public ManagerController(
        RouteRepository routes, RouteService routeService,
        DeliveryRequestRepository requests, DriverRepository drivers,
        VehicleRepository vehicles, ProductRepository products,
        AuditLogRepository audit)
    {
        _routes = routes; _routeService = routeService;
        _requests = requests; _drivers = drivers;
        _vehicles = vehicles; _products = products; _audit = audit;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Routes
    [HttpGet("routes")]
    public async Task<IActionResult> GetRoutes() => Ok(await _routes.GetAllAsync());

    [HttpGet("routes/{id}")]
    public async Task<IActionResult> GetRoute(int id)
    {
        var route = await _routes.GetByIdAsync(id);
        if (route == null) return NotFound();
        return Ok(route);
    }

    [HttpPost("routes")]
    public async Task<IActionResult> CreateRoute([FromBody] CreateRouteDto dto)
    {
        var result = await _routes.CreateAsync(dto);
        await _audit.AddAsync(CurrentUserId, "Створення", "Route", $"Створено маршрут {dto.From} → {dto.To}", CurrentIp);
        return Ok(result);
    }

    [HttpPut("routes/{id}/status")]
    public async Task<IActionResult> UpdateRouteStatus(int id, [FromBody] UpdateRouteStatusDto dto)
    {
        var ok = await _routes.UpdateStatusAsync(id, dto.Status);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Оновлення статусу", "Route", $"Маршрут id={id} → {dto.Status}", CurrentIp);
        return Ok(new { message = "Статус оновлено" });
    }

    [HttpDelete("routes/{id}")]
    public async Task<IActionResult> DeleteRoute(int id)
    {
        var ok = await _routes.DeleteAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Маршрут видалено" });
    }

    // Delivery requests (for manager to approve/reject)
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests() => Ok(await _requests.GetAllAsync());

    [HttpPut("requests/{id}/status")]
    public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateDeliveryRequestStatusDto dto)
    {
        var managerId = dto.ManagerId ?? CurrentUserId;
        var ok = await _requests.UpdateStatusAsync(id, dto with { ManagerId = managerId });
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Обробка запиту", "DeliveryRequest",
            $"Запит id={id} → {dto.Status}", CurrentIp);
        return Ok(new { message = "Статус запиту оновлено" });
    }

    // Drivers and vehicles for monitoring
    [HttpGet("drivers")]
    public async Task<IActionResult> GetDrivers() => Ok(await _drivers.GetAllAsync());

    [HttpGet("vehicles")]
    public async Task<IActionResult> GetVehicles() => Ok(await _vehicles.GetAllAsync());

    // Products
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts() => Ok(await _products.GetAllAsync());

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        var result = await _products.CreateAsync(dto);
        await _audit.AddAsync(CurrentUserId, "Створення", "Product", $"Додано товар {dto.Name}", CurrentIp);
        return Ok(result);
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductDto dto)
    {
        var ok = await _products.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Редагування", "Product", $"Оновлено товар id={id}", CurrentIp);
        return Ok(new { message = "Оновлено" });
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var ok = await _products.DeleteAsync(id);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Деактивація", "Product", $"Деактивовано товар id={id}", CurrentIp);
        return Ok(new { message = "Деактивовано" });
    }

    // Cost calculator
    [HttpPost("costs/calculate")]
    public IActionResult CalculateCosts([FromBody] CostCalculationDto dto)
    {
        var result = _routeService.CalculateCost(dto);
        return Ok(result);
    }
}