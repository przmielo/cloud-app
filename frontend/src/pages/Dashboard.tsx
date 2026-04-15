import { useEffect, useState } from 'react';
import api from '../services/api';

interface CloudTask {
  id: number;
  name: string;
  isCompleted: boolean;
}

const Dashboard = () => {
  const [items, setItems]           = useState<CloudTask[]>([]);
  const [error, setError]           = useState("");
  const [newName, setNewName]       = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [adding, setAdding]         = useState(false);
  const [success, setSuccess]       = useState("");

  const fetchTasks = () => {
    api.get('/tasks')
      .then((res: any) => setItems(res.data))
      .catch((err: any) => {
        console.error("Szczegóły błędu:", err);
        setError("Błąd połączenia z API. Sprawdź, czy kontener cloud-backend działa na porcie 8081.");
      });
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      setSuccess("Zadanie zostało usunięte!");
      setError("");
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      setError("Błąd podczas usuwania zadania.");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    setSuccess("");
    setError("");

    try {
      await api.post('/tasks', { name: newName.trim(), isCompleted });
      setNewName("");
      setIsCompleted(false);
      setSuccess("Zadanie zostało dodane!");
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      setError("Błąd podczas dodawania zadania.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0d6efd', borderBottom: '3px solid #0d6efd', paddingBottom: '10px' }}>
        ☁️ Cloud App Dashboard
      </h1>

      {/* ── Formularz dodawania zadań (5.4) ───────────────────────────────── */}
      <form
        onSubmit={handleAdd}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          background: '#e9f5ff',
          border: '1px solid #b3d7ff',
          borderRadius: '10px',
          padding: '20px 30px',
          marginBottom: '24px',
          minWidth: '380px',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#0d6efd' }}>
          ➕ Dodaj nowe zadanie
        </h2>

        <input
          type="text"
          placeholder="Nazwa zadania..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ced4da',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          Oznacz jako ukończone
        </label>

        <button
          type="submit"
          disabled={adding}
          style={{
            background: adding ? '#6c757d' : '#0d6efd',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 24px',
            fontSize: '1rem',
            cursor: adding ? 'not-allowed' : 'pointer',
          }}
        >
          {adding ? 'Dodawanie...' : 'Dodaj zadanie'}
        </button>
      </form>

      {/* ── Komunikaty ────────────────────────────────────────────────────── */}
      {success && (
        <div style={{
          background: '#d1e7dd', color: '#0f5132',
          padding: '10px', borderRadius: '5px',
          margin: '0 auto 16px', maxWidth: '400px',
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fff3cd', color: '#856404',
          padding: '10px', borderRadius: '5px',
          margin: '0 auto 16px', maxWidth: '400px',
        }}>
          {error}
        </div>
      )}

      {/* ── Lista zadań ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {items.length === 0 && !error && (
          <p>Brak zadań w bazie. Dodaj pierwsze zadanie powyżej!</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                background: '#f8f9fa',
                margin: '5px',
                padding: '10px 20px',
                borderRadius: '8px',
                borderLeft: item.isCompleted ? '5px solid green' : '5px solid gray',
                width: '350px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                <strong>{item.name}</strong> {item.isCompleted ? '✅' : '⏳'}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
