import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-ink-dim font-mono text-sm tracking-widest uppercase">
        Initialising...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
