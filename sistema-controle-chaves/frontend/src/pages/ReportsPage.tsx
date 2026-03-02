import React from 'react';
import { 
  Search, 
  Bell, 
  Sparkles,
  Download
} from 'lucide-react';
import { Sidebar } from '../modals/Sidebar';

interface ReportsPageProps {
  onNavigate: (page: 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports') => void;
  onLogout: () => void;
}

export function ReportsPage({ onNavigate, onLogout }: ReportsPageProps) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar activePage="reports" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Menu de Relatórios</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar módulo..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Hero Section */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Central de Módulos</h1>
              <p className="text-gray-500 text-lg max-w-2xl">
                Acesse rapidamente as ferramentas de auditoria e controle. Selecione uma categoria abaixo para gerar e visualizar relatórios detalhados.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ReportCard 
                icon={<img src="/images/chave.png" alt="Ícone chave" className="w-6 h-6 object-contain" />}
                title="Relatório de Chaves"
                description="Histórico de posses, temporalidade e registros de devolução."
                iconBg="bg-blue-50"
                onClick={() => onNavigate('key-reports')}
              />
            </div>

            {/* Bottom Banner */}
            <div className="bg-blue-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-100">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center shadow-lg shadow-gray-200 flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Relatório Consolidado Inteligente</h3>
                  <p className="text-gray-600">Gere um PDF com dados cruzados de todos os módulos ativos.</p>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
                <Download size={20} />
                Exportar Tudo
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function ReportCard({ icon, title, description, iconBg, onClick }: { icon: React.ReactNode, title: string, description: string, iconBg: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col"
    >
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
