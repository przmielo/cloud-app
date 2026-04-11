namespace CloudBackend.DTOs
{
    /// <summary>
    /// DTO zwracany klientowi podczas odczytu zadania.
    /// Ukrywa wewnętrzne pola systemowe encji bazodanowej.
    /// </summary>
    public class TaskReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
    }
}
