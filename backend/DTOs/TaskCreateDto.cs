namespace CloudBackend.DTOs
{
    /// <summary>
    /// DTO przyjmowany od klienta podczas tworzenia nowego zadania.
    /// Nie zawiera pola Id (generowanego przez bazę) ani pól systemowych.
    /// </summary>
    public class TaskCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
    }
}
