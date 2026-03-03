import React from 'react';
import { Sidebar } from '../modals/Sidebar';
import chaveIcon from '../images/chave.png';

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
                icon={<img src={chaveIcon} alt="Ícone chave" className="w-6 h-6 object-contain" />}
                title="Relatório de Chaves"
                description="Histórico de posses, temporalidade e registros de devolução."
                iconBg="bg-blue-50"
                onClick={() => onNavigate('key-reports')}
              />
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
      className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group h-full flex flex-col"
    >
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
