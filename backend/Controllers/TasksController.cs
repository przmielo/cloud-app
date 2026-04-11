using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudBackend.Data;
using CloudBackend.Models;
using CloudBackend.DTOs;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")] // Adres: http://localhost:8081/api/tasks
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    // Wstrzykiwanie zależności (Dependency Injection) kontekstu bazy danych
    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // ─── Pomocnicza metoda mapowania encji → DTO ──────────────────────────────
    private static TaskReadDto MapToDto(CloudTask task) => new TaskReadDto
    {
        Id          = task.Id,
        Name        = task.Name,
        IsCompleted = task.IsCompleted
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskReadDto>>> GetAll()
    {
        var tasks = await _context.Tasks.ToListAsync();
        return Ok(tasks.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskReadDto>> GetById(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
            return NotFound();

        return Ok(MapToDto(task));
    }

    [HttpPost] // 3. Dodaj (CREATE)
    public async Task<ActionResult<TaskReadDto>> Create(TaskCreateDto dto)
    {
        // Mapowanie DTO → encja (Id zostanie wygenerowane przez bazę)
        var task = new CloudTask
        {
            Name        = dto.Name,
            IsCompleted = dto.IsCompleted
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Zwracamy DTO nowo utworzonego zasobu wraz z nagłówkiem Location (201 Created)
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, MapToDto(task));
    }

    [HttpPut("{id}")] // 4. Edytuj (UPDATE)
    public async Task<ActionResult> Update(int id, TaskCreateDto dto)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
            return NotFound();

        task.Name        = dto.Name;
        task.IsCompleted = dto.IsCompleted;

        await _context.SaveChangesAsync();

        return NoContent(); // Status 204 – operacja udana, brak danych do odesłania
    }

    [HttpDelete("{id}")] // 5. Usuń (DELETE)
    public async Task<ActionResult> Delete(int id)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
