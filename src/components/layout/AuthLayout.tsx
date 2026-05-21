import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store';

export const AuthLayout = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Ambient aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 60%)' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[320px] h-[320px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 60%)' }}
        />
      </div>

      {/* Subtle grid mask */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(var(--accent) 1px,transparent 1px),linear-gradient(90deg,var(--accent) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      <div className="w-full max-w-5xl relative z-10">
        <Outlet />
      </div>
    </div>
  );
};
