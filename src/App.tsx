import { Navigate, Route, Routes } from 'react-router-dom';
import { Splash } from '@/pages/Splash';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';
import { ThisWeek } from '@/pages/ThisWeek';
import { QuestionPage } from '@/pages/QuestionPage';
import { SessionsList } from '@/pages/manage/SessionsList';
import { SessionDetail } from '@/pages/manage/SessionDetail';
import { SessionResponses } from '@/pages/manage/SessionResponses';
import { QuestionManage } from '@/pages/manage/QuestionManage';
import { InquiriesManage } from '@/pages/manage/InquiriesManage';
import { Preview } from '@/pages/Preview';
import { Protected } from '@/components/Protected';
import { AdminRoute } from '@/components/AdminRoute';

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
      <Route
        path="/q/:id"
        element={
          <Protected>
            <QuestionPage />
          </Protected>
        }
      />
      <Route
        path="/manage"
        element={
          <AdminRoute>
            <SessionsList />
          </AdminRoute>
        }
      />
      <Route
        path="/manage/s/:id"
        element={
          <AdminRoute>
            <SessionDetail />
          </AdminRoute>
        }
      />
      <Route
        path="/manage/s/:id/responses"
        element={
          <AdminRoute>
            <SessionResponses />
          </AdminRoute>
        }
      />
      <Route
        path="/manage/q/:id"
        element={
          <AdminRoute>
            <QuestionManage />
          </AdminRoute>
        }
      />
      <Route
        path="/manage/inquiries"
        element={
          <AdminRoute>
            <InquiriesManage />
          </AdminRoute>
        }
      />
      <Route path="/app" element={<Navigate to="/this-week" replace />} />
      {import.meta.env.DEV && <Route path="/preview" element={<Preview />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
