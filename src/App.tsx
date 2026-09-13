import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
const Splash = lazy(() => import('@/pages/Splash').then((m) => ({ default: m.Splash })));
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const AuthCallback = lazy(() =>
  import('@/pages/AuthCallback').then((m) => ({ default: m.AuthCallback })),
);
const ThisWeek = lazy(() => import('@/pages/ThisWeek').then((m) => ({ default: m.ThisWeek })));
const QuestionPage = lazy(() =>
  import('@/pages/QuestionPage').then((m) => ({ default: m.QuestionPage })),
);
const Live = lazy(() => import('@/pages/Live').then((m) => ({ default: m.Live })));
const SessionsList = lazy(() =>
  import('@/pages/manage/SessionsList').then((m) => ({ default: m.SessionsList })),
);
const SessionLive = lazy(() =>
  import('@/pages/manage/SessionLive').then((m) => ({ default: m.SessionLive })),
);
const SessionDetail = lazy(() =>
  import('@/pages/manage/SessionDetail').then((m) => ({ default: m.SessionDetail })),
);
const SessionResponses = lazy(() =>
  import('@/pages/manage/SessionResponses').then((m) => ({ default: m.SessionResponses })),
);
const SessionQuestions = lazy(() =>
  import('@/pages/manage/SessionQuestions').then((m) => ({ default: m.SessionQuestions })),
);
const QuestionManage = lazy(() =>
  import('@/pages/manage/QuestionManage').then((m) => ({ default: m.QuestionManage })),
);
import { Protected } from '@/components/Protected';
import { AdminRoute } from '@/components/AdminRoute';
import { Participant } from '@/polling/Participant';
const Teacher = lazy(() => import('@/polling/Teacher').then((m) => ({ default: m.Teacher })));
import { liveApi } from '@/polling/api';
import '@/polling/polling.css';
const PollPreview =
  import.meta.env.DEV || import.meta.env.VITE_POLL_PREVIEW === 'true'
    ? lazy(() => import('@/polling/Preview'))
    : null;
function OldQuestion() {
  const { id } = useParams();
  return <Navigate to={`/archive/q/${id}`} replace />;
}
function OldManage() {
  const location = useLocation();
  return <Navigate to={`/archive${location.pathname}`} replace />;
}
export default function App() {
  return (
    <Suspense
      fallback={
        <div className="poll-app">
          <p style={{ padding: 24 }}>Loading…</p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Participant api={liveApi} />} />
        <Route
          path="/manage"
          element={
            <AdminRoute>
              <Teacher api={liveApi} />
            </AdminRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/archive" element={<Splash />} />
        <Route path="/archive/login" element={<Login />} />
        <Route
          path="/archive/this-week"
          element={
            <Protected>
              <ThisWeek />
            </Protected>
          }
        />
        <Route
          path="/archive/q/:id"
          element={
            <Protected>
              <QuestionPage />
            </Protected>
          }
        />
        <Route
          path="/archive/live"
          element={
            <Protected>
              <Live />
            </Protected>
          }
        />
        <Route
          path="/archive/manage"
          element={
            <AdminRoute>
              <SessionsList />
            </AdminRoute>
          }
        />
        <Route
          path="/archive/manage/s/:id/live"
          element={
            <AdminRoute>
              <SessionLive />
            </AdminRoute>
          }
        />
        <Route
          path="/archive/manage/s/:id"
          element={
            <AdminRoute>
              <SessionDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/archive/manage/s/:id/responses"
          element={
            <AdminRoute>
              <SessionResponses />
            </AdminRoute>
          }
        />
        <Route
          path="/archive/manage/s/:id/questions"
          element={
            <AdminRoute>
              <SessionQuestions />
            </AdminRoute>
          }
        />
        <Route
          path="/archive/manage/q/:id"
          element={
            <AdminRoute>
              <QuestionManage />
            </AdminRoute>
          }
        />
        <Route path="/this-week" element={<Navigate to="/archive/this-week" replace />} />
        <Route path="/q/:id" element={<OldQuestion />} />
        <Route path="/manage/*" element={<OldManage />} />
        <Route path="/live" element={<Navigate to="/" replace />} />
        <Route path="/app" element={<Navigate to="/" replace />} />
        {PollPreview && (
          <Route
            path="/preview/polls/*"
            element={
              <Suspense fallback={<p>Loading preview…</p>}>
                <PollPreview />
              </Suspense>
            }
          />
        )}
        {PollPreview && (
          <Route path="/preview" element={<Navigate to="/preview/polls/manage" replace />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
