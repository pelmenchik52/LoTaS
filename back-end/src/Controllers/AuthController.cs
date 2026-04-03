using LogisticsBackend.DTOs;
using LogisticsBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsBackend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Невірний email або пароль" });
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        if (result == null)
            return BadRequest(new { message = "Користувач з таким email вже існує" });
        return Ok(result);
    }
}