import React from 'react';
import { LayoutDashboard, FileText, Settings, Key, LogOut, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activePage: 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports';
  onNavigate: (page: 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports') => void;
  onLogout: () => void;
}

export function Sidebar({ activePage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <Key className="text-white w-6 h-6" />
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
        <NavItem 
          icon={<Settings size={20} />} 
          label="Configurações" 
          active={activePage === 'settings'} 
          onClick={() => onNavigate('settings')}
        />
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
          <img 
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=faces" 
            alt="User" 
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">João Silva</p>
            <p className="text-xs text-gray-500 truncate">Operador de Turno</p>
          </div>
          <button onClick={onLogout} className="text-gray-400 group-hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1",
        active 
          ? "bg-blue-50 text-blue-600 shadow-sm" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
