using LogisticsBackend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsBackend.Controllers;

[ApiController]
[Route("api/accountant")]
[Authorize(Roles = "accountant,admin")]
public class AccountantController : ControllerBase
{
    private readonly TransactionArchiveRepository _transactions;
    private readonly RouteRepository _routes;
    private readonly WarehouseStockRepository _stock;

    public AccountantController(
        TransactionArchiveRepository transactions,
        RouteRepository routes,
        WarehouseStockRepository stock)
    {
        _transactions = transactions;
        _routes = routes;
        _stock = stock;
    }

    // Archive of all transactions
    [HttpGet("archive")]
    public async Task<IActionResult> GetArchive() => Ok(await _transactions.GetAllAsync());

    // All routes with costs for reporting
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports() => Ok(await _routes.GetAllAsync());

    // Cost analysis: routes summary
    [HttpGet("costs")]
    public async Task<IActionResult> GetCosts()
    {
        var routes = await _routes.GetAllAsync();
        var summary = routes
            .Where(r => r.TotalCost.HasValue)
            .Select(r => new
            {
                r.Id,
                r.From,
                r.To,
                r.Distance,
                r.Status,
                r.TotalCost,
                r.FuelCost,
                r.DriverSalary,
                r.CreatedAt,
                DriverName = r.DriverName,
                VehicleModel = r.VehicleModel,
            })
            .ToList();
        return Ok(summary);
    }

    // Discrepancies: stocks with low or out-of-stock status
    [HttpGet("discrepancies")]
    public async Task<IActionResult> GetDiscrepancies()
    {
        var stocks = await _stock.GetAllAsync();
        var discrepancies = stocks
            .Where(s => s.Status != "in-stock")
            .Select(s => new
            {
                s.Id,
                s.WarehouseId,
                s.WarehouseName,
                s.ProductId,
                s.ProductName,
                s.ProductType,
                s.Quantity,
                s.Unit,
                s.Status,
                s.ExpiryDate,
                s.LastUpdated
            })
            .ToList();
        return Ok(discrepancies);
    }
}