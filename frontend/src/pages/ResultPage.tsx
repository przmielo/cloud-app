import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loanApi, LoanApplicationReadDto } from '../services/api';

const OUTCOME_CONFIG = {
  approve: { label: 'AKCEPTACJA', color: '#16a34a', bg: '#dcfce7', emoji: '✅' },
  manual:  { label: 'ANALIZA MANUALNA', color: '#d97706', bg: '#fef3c7', emoji: '⏳' },
  reject:  { label: 'ODRZUCENIE', color: '#dc2626', bg: '#fee2e2', emoji: '❌' },
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<LoanApplicationReadDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanApi.getById(Number(id))
      .then(r => setApp(r.data))
      .catch(() => setError('Nie można pobrać wyników wniosku.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={styles.loading}>Ładowanie wyników...</p>;
  if (error || !app) return <p style={styles.error}>{error || 'Brak danych.'}</p>;

  const d = app.decision;
  const outcome = d?.outcome as keyof typeof OUTCOME_CONFIG | undefined;
  const cfg = outcome ? OUTCOME_CONFIG[outcome] : null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Wynik oceny kredytowej</h1>

      {cfg && (
        <div style={{ ...styles.outcomeBox, background: cfg.bg, borderColor: cfg.color }}>
          <span style={{ fontSize: '2rem' }}>{cfg.emoji}</span>
          <span style={{ color: cfg.color, fontWeight: 700, fontSize: '1.3rem' }}>{cfg.label}</span>
        </div>
      )}

      {d && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Wskaźniki oceny</h2>

          <Metric label="Scoring" value={`${d.score} / 850 pkt`} />
          <div style={styles.scoreBar}>
            <div style={{ ...styles.scoreBarFill, width: `${((d.score - 300) / 550) * 100}%`, background: cfg?.color ?? '#1d4ed8' }} />
          </div>
          <div style={styles.scoreScale}>
            <span>300 (odrzucenie)</span><span>550 (analiza)</span><span>700 (akceptacja)</span><span>850</span>
          </div>

          <Metric label="DStI (Debt Service to Income)" value={`${(d.dstI * 100).toFixed(1)}%`}
            note="Próg KNF: 50%. Źródło: Rekomendacja S KNF (uchwała nr 242/2023)" />
          <Metric label="Szacowana miesięczna rata" value={`${d.monthlyInstalment.toFixed(2)} PLN`}
            note="Wyliczona przy stopie rocznej 7%" />

          <div style={styles.reasonBox}>
            <strong>Uzasadnienie decyzji:</strong>
            <p style={{ margin: '6px 0 0' }}>{d.reason}</p>
          </div>
        </div>
      )}

      <div style={styles.actions}>
        <button style={styles.btnSecondary} onClick={() => navigate('/history')}>
          Historia wniosków
        </button>
        <button style={styles.btnPrimary} onClick={() => navigate('/')}>
          Nowy wniosek
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{value}</span>
      </div>
      {note && <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '4px 0 0' }}>{note}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '600px', margin: '0 auto', padding: '32px 16px', fontFamily: 'Arial, sans-serif' },
  title: { color: '#1d4ed8', fontSize: '1.6rem', marginBottom: '24px', textAlign: 'center' },
  loading: { textAlign: 'center', marginTop: '60px', color: '#6b7280' },
  error: { textAlign: 'center', marginTop: '60px', color: '#dc2626' },
  outcomeBox: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', borderRadius: '12px', border: '2px solid', marginBottom: '24px' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  sectionTitle: { color: '#1d4ed8', fontSize: '1.1rem', marginBottom: '20px' },
  scoreBar: { height: '10px', background: '#e5e7eb', borderRadius: '5px', margin: '8px 0 4px', overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: '5px', transition: 'width 0.5s' },
  scoreScale: { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '20px' },
  reasonBox: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginTop: '16px' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  btnPrimary: { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 28px', fontSize: '1rem', cursor: 'pointer' },
  btnSecondary: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 28px', fontSize: '1rem', cursor: 'pointer' },
};
