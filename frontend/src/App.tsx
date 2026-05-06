import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoanApplicationForm from './pages/LoanApplicationForm';
import ResultPage from './pages/ResultPage';
import ApplicationHistory from './pages/ApplicationHistory';

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <nav style={navStyle}>
          <a href="/" style={navLink}>Nowy wniosek</a>
          <a href="/history" style={navLink}>Historia</a>
        </nav>
        <Routes>
          <Route path="/" element={<LoanApplicationForm />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/history" element={<ApplicationHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const navStyle: React.CSSProperties = {
  background: '#1d4ed8',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  height: '52px',
};

const navLink: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 600,
  fontSize: '0.95rem',
};

export default App;
