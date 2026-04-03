using LogisticsBackend.DTOs;

namespace LogisticsBackend.Services;

public class RouteService
{
    private readonly IConfiguration _config;

    public RouteService(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>
    /// Calculates route cost: fuel + driver salary.
    /// </summary>
    public CostResultDto CalculateCost(CostCalculationDto dto)
    {
        // Fuel cost
        var fuelLiters = (dto.Distance / 100.0) * dto.FuelConsumption;
        var fuelCost = (decimal)(fuelLiters * dto.FuelPrice);

        // Driver salary
        var driverSalary = dto.HourlyRate * (decimal)dto.EstimatedHours;

        var total = fuelCost + driverSalary;

        // Efficiency = actual cargo weight / max capacity
        var efficiency = dto.VehicleCapacity > 0
            ? Math.Round((dto.CargoWeight / dto.VehicleCapacity) * 100, 1)
            : 0;

        return new CostResultDto(fuelCost, driverSalary, total, efficiency);
    }

    /// <summary>
    /// Priority algorithm: sorts delivery points by urgency score.
    /// Score = urgency level (1-3) * 10 + product urgency coefficients average.
    /// Higher score = deliver first.
    /// </summary>
    public List<T> PrioritizeDeliveries<T>(List<T> deliveries, Func<T, int> getUrgency, Func<T, double> getProductUrgency)
    {
        return deliveries
            .OrderByDescending(d => getUrgency(d) * 10 + getProductUrgency(d))
            .ToList();
    }

    /// <summary>
    /// Calculates estimated time based on distance.
    /// Assumes average speed of 60 km/h in city, 80 km/h intercity.
    /// </summary>
    public double EstimateTime(double distanceKm, bool isCity = true)
    {
        var speed = isCity ? 40.0 : 80.0; // km/h
        return Math.Round(distanceKm / speed, 2);
    }

    /// <summary>
    /// Determines urgency level label for display.
    /// </summary>
    public static string GetUrgencyLabel(int urgency) => urgency switch
    {
        1 => "normal",
        2 => "high",
        3 => "critical",
        _ => "normal"
    };

    public static string GetUrgencyLabelUa(int urgency) => urgency switch
    {
        1 => "Нормальний",
        2 => "Підвищений",
        3 => "Критичний",
        _ => "Нормальний"
    };
}