import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import TopBar from './components/layout/TopBar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import HistoryPage from './pages/HistoryPage';
import SimulatorPage from './pages/SimulatorPage';
import SetupGuidePage from './pages/SetupGuidePage';
import useSocket from './hooks/useSocket';
import useToast from './hooks/useToast';
import Toast from './components/ui/Toast';
import * as contactsApi from './api/contacts.api';

function AppShell() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [contacts, setContacts]           = useState([]);
  const [gpsStatus, setGpsStatus]         = useState('pending');
  const [pendingScenario, setPendingScenario] = useState(null);
  const { toast, show }       = useToast();
  const { on }                = useSocket(user?.id);

  const loadContacts = useCallback(async () => {
    try { const { data } = await contactsApi.getContacts(); setContacts(data); }
    catch { /* user may not be authenticated yet */ }
  }, []);

  useEffect(() => { loadContacts(); }, []);

  // Real-time: hardware impact detected server-side → show toast
  useEffect(() => {
    return on('incident:detected', ({ event_type, magnitude }) => {
      show(`⚠ Hardware alert: ${event_type} (${Number(magnitude).toFixed(2)}g)`);
    });
  }, [on]);

  // Real-time: dispatch complete → refresh history badge
  useEffect(() => {
    return on('dispatch:complete', () => {
      show('Dispatch complete — check History for delivery status');
    });
  }, [on]);

  function handleRunScenario(scenario) {
    setPendingScenario(scenario);
    navigate('/');
  }

  return (
    <div className="grid min-h-full" style={{ gridTemplateRows: 'auto 1fr' }}>
      <TopBar gpsStatus={gpsStatus} />
      <main>
        <Routes>
          <Route path="/" element={
            <DashboardPage
              contacts={contacts}
              setGpsStatus={setGpsStatus}
              pendingScenario={pendingScenario}
              onScenarioConsumed={() => setPendingScenario(null)}
            />
          } />
          <Route path="/contacts"  element={<ContactsPage contacts={contacts} onContactsChange={loadContacts} />} />
          <Route path="/history"   element={<HistoryPage />} />
          <Route path="/simulator" element={<SimulatorPage onRunScenario={handleRunScenario} />} />
          <Route path="/setup"     element={<SetupGuidePage />} />
        </Routes>
      </main>
      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute><AppShell /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
