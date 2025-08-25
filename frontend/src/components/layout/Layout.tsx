import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
};
