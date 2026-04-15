using CloudBackend.Models;
using Xunit;

namespace CloudBackend.Tests;

public class UnitTest1
{
    [Fact]
    public void NewTask_ShouldNotBeCompleted()
    {
        // Arrange - Tworzenie obiektu
        var task = new CloudTask();

        // Act - Nadanie nazwy
        task.Name = "Przetestować bezpiecznik";

        // Assert - Weryfikacja: nowe zadanie NIE powinno być ukończone
        Assert.False(task.IsCompleted);
    }
}
