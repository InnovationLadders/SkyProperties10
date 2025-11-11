import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout = ({ children }) => {
  console.log('[MainLayout] Rendering', { hasChildren: !!children });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
};
