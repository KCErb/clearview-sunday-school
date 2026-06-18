import { Navigate, Route, Routes } from 'react-router-dom';
import { Splash } from '@/pages/Splash';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';
import { ThisWeek } from '@/pages/ThisWeek';
import { Protected } from '@/components/Protected';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/this-week"
        element={
          <Protected>
            <ThisWeek />
          </Protected>
        }
      />
      <Route path="/app" element={<Navigate to="/this-week" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
