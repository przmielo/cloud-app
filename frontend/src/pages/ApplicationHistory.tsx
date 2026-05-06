import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanApi, LoanApplicationReadDto } from '../services/api';

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  approve: { label: 'Akceptacja', color: '#16a34a' },
  manual:  { label: 'Analiza manualna', color: '#d97706' },
  reject:  { label: 'Odrzucenie', color: '#dc2626' },
};

export default function ApplicationHistory() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<LoanApplicationReadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanApi.getAll()
      .then(r => setApps(r.data))
      .catch(() => setError('Nie można pobrać historii wniosków.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Historia wniosków</h1>
        <button style={styles.btnPrimary} onClick={() => navigate('/')}>
          + Nowy wniosek
        </button>
      </div>

      {loading && <p style={styles.info}>Ładowanie...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && apps.length === 0 && (
        <p style={styles.info}>Brak złożonych wniosków. Złóż pierwszy wniosek!</p>
      )}

      <div style={styles.list}>
        {apps.map(app => {
          const d = app.decision;
          const outcome = d?.outcome as string | undefined;
          const cfg = outcome ? OUTCOME_LABELS[outcome] : undefined;

          return (
            <div key={app.id} style={styles.row} onClick={() => navigate(`/result/${app.id}`)}>
              <div style={styles.rowLeft}>
                <span style={styles.rowId}>#{app.id}</span>
                <div>
                  <div style={styles.rowMain}>
                    {app.loanAmount.toLocaleString('pl-PL')} PLN · {app.loanTermMonths} mies.
                  </div>
                  <div style={styles.rowSub}>
                    {new Date(app.createdAt).toLocaleDateString('pl-PL')} &nbsp;|&nbsp;
                    Dochód: {app.monthlyIncome.toLocaleString('pl-PL')} PLN
                  </div>
                </div>
              </div>
              <div style={styles.rowRight}>
                {d && (
                  <>
                    <span style={{ ...styles.scoreBadge }}>{d.score} pkt</span>
                    {cfg && (
                      <span style={{ ...styles.outcomeBadge, color: cfg.color, borderColor: cfg.color }}>
                        {cfg.label}
                      </span>
                    )}
                  </>
                )}
                {!d && <span style={styles.pending}>Oczekuje</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '760px', margin: '0 auto', padding: '32px 16px', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: '#1d4ed8', fontSize: '1.6rem', margin: 0 },
  info: { textAlign: 'center', color: '#6b7280', marginTop: '40px' },
  error: { textAlign: 'center', color: '#dc2626' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
    padding: '16px 20px', cursor: 'pointer',
  },
  rowLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  rowId: { color: '#9ca3af', fontSize: '0.85rem', minWidth: '28px' },
  rowMain: { fontWeight: 600, fontSize: '1rem', color: '#111827' },
  rowSub: { fontSize: '0.82rem', color: '#6b7280', marginTop: '3px' },
  rowRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  scoreBadge: { background: '#eff6ff', color: '#1d4ed8', borderRadius: '12px', padding: '2px 10px', fontSize: '0.85rem', fontWeight: 700 },
  outcomeBadge: { border: '1px solid', borderRadius: '12px', padding: '2px 10px', fontSize: '0.82rem', fontWeight: 600 },
  pending: { color: '#9ca3af', fontSize: '0.82rem' },
  btnPrimary: { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '0.95rem', cursor: 'pointer' },
};
