import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

export const MainLayout = () => {
  return (
    <div className="app-root">
      <Sidebar />

      <div className="main-zone">
        <Header />
        <main className="content-scroll page-enter">
          <Outlet />
        </main>
      </div>

      <OnboardingTour />
    </div>
  );
};
