using LogisticsBackend.Data;
using LogisticsBackend.DTOs;
using LogisticsBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LogisticsBackend.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var user = await _db.Users
            .Include(u => u.UserWarehouses)
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Active);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        var token = GenerateToken(user);
        var warehouseIds = user.UserWarehouses.Select(uw => uw.WarehouseId).ToList();

        return new AuthResponseDto(token, user.Name, user.Email, user.Role, user.Id, warehouseIds);
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            Active = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        foreach (var wId in dto.WarehouseIds)
        {
            _db.UserWarehouses.Add(new UserWarehouse { UserId = user.Id, WarehouseId = wId });
        }
        await _db.SaveChangesAsync();

        var token = GenerateToken(user);
        return new AuthResponseDto(token, user.Name, user.Email, user.Role, user.Id, dto.WarehouseIds);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpiresInMinutes"] ?? "480"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}