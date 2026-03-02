import React from 'react';
import { LayoutDashboard, FileText, LogOut, Users, User, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

type Page = 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports' | 'admin-users';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function Sidebar({ activePage, onNavigate, onLogout }: SidebarProps) {
  const { currentUser } = useAuth();

  const displayName = currentUser?.full_name || currentUser?.username || '—';
  const role = currentUser?.is_superuser ? 'Superusuário' : 'Administrador';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=ffffff&size=80`;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 border border-gray-100">
          <img src="/images/chave.png" alt="Logo Sistema" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">KeyControl</h1>
          <p className="text-xs text-gray-500">Portaria & Segurança</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activePage === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem
          icon={<Users size={15} />}
          label="Pessoas Autorizadas"
          active={activePage === 'authorized-persons'}
          onClick={() => onNavigate('authorized-persons')}
        />
        <NavItem
          icon={<FileText size={20} />}
          label="Relatórios"
          active={activePage === 'reports'}
          onClick={() => onNavigate('reports')}
        />
        {currentUser?.is_superuser && (
          <NavItem
            icon={<ShieldCheck size={20} />}
            label="Gestão de Admins"
            active={activePage === 'admin-users'}
            onClick={() => onNavigate('admin-users')}
          />
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
          {currentUser ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
              <User size={20} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{role}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1',
        active
          ? 'bg-blue-50 text-blue-600 shadow-sm'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
