using LogisticsBackend.Data;
using LogisticsBackend.DTOs;
using LogisticsBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsBackend.Services;

public class InventoryService
{
    private readonly AppDbContext _db;

    public InventoryService(AppDbContext db)
    {
        _db = db;
    }

    public string GetStockStatus(double quantity)
    {
        if (quantity <= 0) return "out-of-stock";
        if (quantity < 20) return "low-stock";
        return "in-stock";
    }

    /// <summary>
    /// Finds nearest warehouses that have a specific product with quantity > 0.
    /// </summary>
    public async Task<List<StockDto>> FindNearestStockAsync(int productId, int excludeWarehouseId)
    {
        var stocks = await _db.WarehouseStocks
            .Include(s => s.Warehouse)
            .Include(s => s.Product)
            .Where(s => s.ProductId == productId
                     && s.WarehouseId != excludeWarehouseId
                     && s.Quantity > 0)
            .OrderByDescending(s => s.Quantity)
            .Take(5)
            .ToListAsync();

        return stocks.Select(s => new StockDto(
            s.Id, s.WarehouseId, s.Warehouse.Name,
            s.ProductId, s.Product.Name, s.Product.Type,
            s.Quantity, s.Unit, s.Shelf,
            GetStockStatus(s.Quantity),
            s.ExpiryDate, s.LastUpdated
        )).ToList();
    }

    /// <summary>
    /// Adds a transaction record and updates stock.
    /// </summary>
    public async Task<bool> ProcessTransactionAsync(CreateTransactionDto dto, int userId)
    {
        var stock = await _db.WarehouseStocks
            .FirstOrDefaultAsync(s => s.WarehouseId == dto.WarehouseId && s.ProductId == dto.ProductId);

        if (dto.Type == "shipping")
        {
            if (stock == null || stock.Quantity < dto.Quantity) return false;
            stock.Quantity -= dto.Quantity;
            stock.LastUpdated = DateTime.UtcNow;
        }
        else // receiving
        {
            if (stock == null)
            {
                stock = new WarehouseStock
                {
                    WarehouseId = dto.WarehouseId,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    Unit = "шт",
                    Shelf = "-",
                    LastUpdated = DateTime.UtcNow
                };
                _db.WarehouseStocks.Add(stock);
            }
            else
            {
                stock.Quantity += dto.Quantity;
                stock.LastUpdated = DateTime.UtcNow;
            }
        }

        var tx = new TransactionArchive
        {
            Type = dto.Type,
            WarehouseId = dto.WarehouseId,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            PerformedById = userId,
            Notes = dto.Notes,
            Date = DateTime.UtcNow
        };

        _db.TransactionArchives.Add(tx);
        await _db.SaveChangesAsync();
        return true;
    }
}