import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanApi, type LoanApplicationCreateDto } from '../services/api';

const STEPS = ['Dane osobowe', 'Zatrudnienie', 'Zobowiązania', 'Kredyt'];

const emptyForm: LoanApplicationCreateDto = {
  age: 30,
  educationLevel: 'secondary',
  maritalStatus: 'single',
  dependents: 0,
  employmentType: 'permanent',
  employmentYears: 3,
  monthlyIncome: 5000,
  existingMonthlyDebt: 0,
  livingCosts: 2000,
  loanAmount: 50000,
  loanTermMonths: 60,
  loanPurpose: 'consumer',
  propertyValue: 0,
  pastLoans: 0,
  latePayments: 0,
  creditHistoryMonths: 0,
};

export default function LoanApplicationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<LoanApplicationCreateDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof LoanApplicationCreateDto, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await loanApi.submit(form);
      navigate(`/result/${res.data.id}`);
    } catch {
      setError('Błąd podczas wysyłania wniosku. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Wniosek kredytowy</h1>

      {/* Step indicator */}
      <div style={styles.steps}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ ...styles.step, ...(i === step ? styles.stepActive : {}) }}>
            <span style={styles.stepNum}>{i + 1}</span> {label}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {step === 0 && (
          <>
            <h2 style={styles.sectionTitle}>Dane osobowe</h2>
            <Field label="Wiek">
              <input type="number" value={form.age} onChange={e => set('age', +e.target.value)} style={styles.input} min={18} max={80} />
            </Field>
            <Field label="Wykształcenie">
              <select value={form.educationLevel} onChange={e => set('educationLevel', e.target.value)} style={styles.input}>
                <option value="basic">Podstawowe</option>
                <option value="vocational">Zawodowe</option>
                <option value="secondary">Średnie</option>
                <option value="higher">Wyższe</option>
              </select>
            </Field>
            <Field label="Stan cywilny">
              <select value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} style={styles.input}>
                <option value="single">Kawaler/Panna</option>
                <option value="married">Żonaty/Zamężna</option>
                <option value="divorced">Rozwiedziony/a</option>
                <option value="widowed">Wdowiec/Wdowa</option>
              </select>
            </Field>
            <Field label="Liczba osób na utrzymaniu">
              <input type="number" value={form.dependents} onChange={e => set('dependents', +e.target.value)} style={styles.input} min={0} max={10} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={styles.sectionTitle}>Zatrudnienie i dochody</h2>
            <Field label="Forma zatrudnienia">
              <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)} style={styles.input}>
                <option value="permanent">Umowa o pracę (stała)</option>
                <option value="b2b">B2B / Działalność gospodarcza</option>
                <option value="contract">Umowa zlecenie/o dzieło</option>
                <option value="pension">Emerytura/Renta</option>
                <option value="unemployed">Bezrobotny/a</option>
              </select>
            </Field>
            <Field label="Staż pracy (lata)">
              <input type="number" value={form.employmentYears} onChange={e => set('employmentYears', +e.target.value)} style={styles.input} min={0} />
            </Field>
            <Field label="Miesięczny dochód netto (PLN)">
              <input type="number" value={form.monthlyIncome} onChange={e => set('monthlyIncome', +e.target.value)} style={styles.input} min={0} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={styles.sectionTitle}>Zobowiązania finansowe</h2>
            <Field label="Łączne miesięczne raty istniejących kredytów (PLN)">
              <input type="number" value={form.existingMonthlyDebt} onChange={e => set('existingMonthlyDebt', +e.target.value)} style={styles.input} min={0} />
            </Field>
            <Field label="Miesięczne koszty utrzymania (PLN)">
              <input type="number" value={form.livingCosts} onChange={e => set('livingCosts', +e.target.value)} style={styles.input} min={0} />
            </Field>
            <Field label="Liczba dotychczasowych kredytów">
              <input type="number" value={form.pastLoans} onChange={e => set('pastLoans', +e.target.value)} style={styles.input} min={0} />
            </Field>
            <Field label="Długość historii kredytowej (miesiące)">
              <input type="number" value={form.creditHistoryMonths} onChange={e => set('creditHistoryMonths', +e.target.value)} style={styles.input} min={0} />
            </Field>
            <Field label="Liczba opóźnień w spłacie &gt;30 dni (ostatnie 24 mies.)">
              <input type="number" value={form.latePayments} onChange={e => set('latePayments', +e.target.value)} style={styles.input} min={0} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={styles.sectionTitle}>Dane kredytu</h2>
            <Field label="Kwota kredytu (PLN)">
              <input type="number" value={form.loanAmount} onChange={e => set('loanAmount', +e.target.value)} style={styles.input} min={1000} />
            </Field>
            <Field label="Okres spłaty (miesiące)">
              <input type="number" value={form.loanTermMonths} onChange={e => set('loanTermMonths', +e.target.value)} style={styles.input} min={3} max={360} />
            </Field>
            <Field label="Cel kredytu">
              <select value={form.loanPurpose} onChange={e => set('loanPurpose', e.target.value)} style={styles.input}>
                <option value="housing">Mieszkaniowy</option>
                <option value="car">Samochodowy</option>
                <option value="consumer">Konsumpcyjny</option>
                <option value="consolidation">Konsolidacyjny</option>
                <option value="other">Inny</option>
              </select>
            </Field>
            {form.loanPurpose === 'housing' && (
              <Field label="Wartość nieruchomości (PLN)">
                <input type="number" value={form.propertyValue} onChange={e => set('propertyValue', +e.target.value)} style={styles.input} min={0} />
              </Field>
            )}
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.nav}>
          {step > 0 && (
            <button style={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
              Wstecz
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button style={styles.btnPrimary} onClick={() => setStep(s => s + 1)}>
              Dalej
            </button>
          ) : (
            <button style={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Wysyłanie...' : 'Wyślij wniosek'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '640px', margin: '0 auto', padding: '32px 16px', fontFamily: 'Arial, sans-serif' },
  title: { color: '#1d4ed8', fontSize: '1.6rem', marginBottom: '24px', textAlign: 'center' },
  steps: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  step: { padding: '6px 14px', borderRadius: '20px', background: '#e5e7eb', fontSize: '0.85rem', color: '#6b7280' },
  stepActive: { background: '#1d4ed8', color: '#fff' },
  stepNum: { fontWeight: 700 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px' },
  sectionTitle: { color: '#1d4ed8', fontSize: '1.1rem', marginBottom: '20px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '24px' },
  btnPrimary: { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 28px', fontSize: '1rem', cursor: 'pointer' },
  btnSecondary: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 28px', fontSize: '1rem', cursor: 'pointer' },
  error: { color: '#dc2626', marginTop: '12px' },
};
