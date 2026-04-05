using LogisticsBackend.DTOs;
using LogisticsBackend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LogisticsBackend.Controllers;

[ApiController]
[Route("api/company-requests")]
public class CompanyRequestController : ControllerBase
{
    private readonly CompanyRequestRepository _requests;
    private readonly ProductRepository _products;
    private readonly AuditLogRepository _audit;

    public CompanyRequestController(
        CompanyRequestRepository requests, ProductRepository products, AuditLogRepository audit)
    {
        _requests = requests;
        _products = products;
        _audit = audit;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Public: submit a new company request (no auth)
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateCompanyRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName) ||
            string.IsNullOrWhiteSpace(dto.ContactPerson) ||
            string.IsNullOrWhiteSpace(dto.Phone) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.DeliveryAddress) ||
            dto.Products == null || dto.Products.Count == 0)
        {
            return BadRequest(new { message = "Заповніть всі обов'язкові поля та додайте хоча б один товар" });
        }

        var result = await _requests.CreateAsync(dto);
        return Ok(result);
    }

    // Public: get available products for the form
    [HttpGet("products")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts() => Ok(await _products.GetAllAsync());

    // Manager: list all company requests
    [HttpGet]
    [Authorize(Roles = "manager,admin")]
    public async Task<IActionResult> GetAll() => Ok(await _requests.GetAllAsync());

    // Manager: get single request
    [HttpGet("{id}")]
    [Authorize(Roles = "manager,admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _requests.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // Manager: update status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "manager,admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateCompanyRequestStatusDto dto)
    {
        var managerId = dto.ManagerId ?? CurrentUserId;
        var ok = await _requests.UpdateStatusAsync(id, dto with { ManagerId = managerId });
        if (!ok) return NotFound();
        await _audit.AddAsync(CurrentUserId, "Обробка запиту компанії", "CompanyRequest",
            $"Запит id={id} → {dto.Status}", CurrentIp);
        return Ok(new { message = "Статус оновлено" });
    }
}
