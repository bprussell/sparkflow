import { Outlet, Link, useLocation } from 'react-router-dom';
import { Lightbulb, BarChart3, LogOut, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navItems = [
    { path: '/', icon: Lightbulb, label: 'Pipeline' },
    { path: '/insights', icon: BarChart3, label: 'Insights' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 40%, #0d1f38 70%, #081420 100%)' }}>
      {/* Top nav */}
      <nav className="border-b border-white/10 sticky top-0 z-50"         style={{ background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-800 text-white text-lg tracking-tight">Idea Pipeline</span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === path
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
                style={location.pathname === path ? { background: 'rgba(124,58,237,0.3)', color: 'white' } : {}}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-white/50 text-sm hidden sm:block">{user.full_name || user.email}</span>
            )}
            <button
              onClick={() => base44.auth.logout('/')}
              className="text-white/40 hover:text-white/70 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}