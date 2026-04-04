using LogisticsBackend.DTOs;
using LogisticsBackend.Repositories;
using LogisticsBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LogisticsBackend.Controllers;

[ApiController]
[Route("api/warehouse")]
[Authorize(Roles = "warehouse,admin,manager")]
public class WarehouseController : ControllerBase
{
    private readonly WarehouseStockRepository _stock;
    private readonly WarehouseRepository _warehouses;
    private readonly ProductRepository _products;
    private readonly DeliveryRequestRepository _requests;
    private readonly TransactionArchiveRepository _transactions;
    private readonly InventoryService _inventoryService;
    private readonly AuditLogRepository _audit;

    public WarehouseController(
        WarehouseStockRepository stock, WarehouseRepository warehouses,
        ProductRepository products, DeliveryRequestRepository requests,
        TransactionArchiveRepository transactions, InventoryService inventoryService,
        AuditLogRepository audit)
    {
        _stock = stock; _warehouses = warehouses; _products = products;
        _requests = requests; _transactions = transactions;
        _inventoryService = inventoryService; _audit = audit;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Warehouses list
    [HttpGet]
    public async Task<IActionResult> GetWarehouses() => Ok(await _warehouses.GetAllAsync());

    // Stock for a specific warehouse
    [HttpGet("{warehouseId}/stock")]
    public async Task<IActionResult> GetStock(int warehouseId) =>
        Ok(await _stock.GetByWarehouseAsync(warehouseId));

    [HttpPut("stock/{id}")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
    {
        var ok = await _stock.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Оновлення залишку", "WarehouseStock",
            $"Запис id={id} оновлено: {dto.Quantity} {dto.Unit}", CurrentIp);
        return Ok(new { message = "Залишок оновлено" });
    }

    // Products
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts() => Ok(await _products.GetAllAsync());

    // Find nearest warehouses that have a product in stock
    [HttpGet("nearest-stock")]
    public async Task<IActionResult> GetNearestStock([FromQuery] int productId, [FromQuery] int excludeWarehouseId)
    {
        var result = await _inventoryService.FindNearestStockAsync(productId, excludeWarehouseId);
        return Ok(result);
    }

    // Delivery requests (warehouse worker creates)
    [HttpGet("{warehouseId}/requests")]
    public async Task<IActionResult> GetRequests(int warehouseId) =>
        Ok(await _requests.GetByWarehouseAsync(warehouseId));

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateDeliveryRequestDto dto)
    {
        var result = await _requests.CreateAsync(dto, CurrentUserId);
        await _audit.AddAsync(CurrentUserId, "Запит доставки", "DeliveryRequest",
            $"Створено запит для складу id={dto.WarehouseId}, терміновість={dto.Urgency}", CurrentIp);
        return Ok(result);
    }

    // Transactions (receiving/shipping)
    [HttpGet("{warehouseId}/transactions")]
    public async Task<IActionResult> GetTransactions(int warehouseId) =>
        Ok(await _transactions.GetByWarehouseAsync(warehouseId));

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
    {
        var ok = await _inventoryService.ProcessTransactionAsync(dto, CurrentUserId);
        if (!ok) return BadRequest(new { message = "Недостатньо товару на складі або помилка обробки" });

        await _audit.AddAsync(CurrentUserId, dto.Type == "receiving" ? "Прийом товару" : "Відвантаження",
            "Transaction", $"Склад id={dto.WarehouseId}, продукт id={dto.ProductId}, кількість={dto.Quantity}", CurrentIp);

        return Ok(new { message = "Транзакцію виконано" });
    }
}