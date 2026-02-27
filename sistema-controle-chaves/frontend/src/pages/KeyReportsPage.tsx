import React from 'react';
import { 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  Filter, 
  Key, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_KEY_REPORTS, KeyReportItem } from '../data/mockReports';

interface KeyReportsPageProps {
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

export function KeyReportsPage({ onNavigate, onLogout }: KeyReportsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
            <Key className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Relatório de Empréstimo de Chaves</h1>
            <p className="text-xs text-gray-500">Gestão e controle de acesso</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
            <Printer size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Exportar CSV">
            <FileText size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Exportar PDF">
            <FileSpreadsheet size={20} />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors" onClick={() => onNavigate('dashboard')}>
             <img 
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=faces" 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 text-blue-900 font-bold">
            <Filter size={20} className="text-blue-600" />
            <h3>Filtros de Pesquisa</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input 
                type="text" 
                placeholder="Digite o nome..." 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Chave</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white">
                <option>Todas as chaves</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Máxima quantidade</label>
              <input 
                type="number" 
                defaultValue="10000"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Período De</label>
              <input 
                type="datetime-local" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Período Até</label>
              <input 
                type="datetime-local" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-500"
              />
            </div>
            
            {/* Status Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Empréstimos</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                  Finalizados
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                  Em andamento
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                  Vencidos
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-t border-gray-100 pt-6">
            <div className="flex flex-col md:flex-row gap-8 w-full md:w-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quem Pegou</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                    Morador
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                    Visitante/Prestador
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ordenar Por</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="sort" defaultChecked className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                    Chave
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="sort" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                    Data empréstimo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="sort" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                    Nome
                  </label>
                </div>
              </div>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-200 active:scale-95 w-full md:w-auto justify-center">
              <Filter size={18} />
              Filtrar Resultados
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Chave</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Retirada</th>
                  <th className="px-6 py-4">Entrega/Validade</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_KEY_REPORTS.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.detail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={item.type} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <Key size={14} className="text-gray-400" />
                        {item.keyName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.withdrawalDate}
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-sm",
                      item.status === 'Vencida' ? "text-red-600 font-bold" : "text-gray-600"
                    )}>
                      {item.returnDate}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Mostrando <span className="font-bold text-gray-900">1</span> a <span className="font-bold text-gray-900">4</span> de <span className="font-bold text-gray-900">124</span> resultados
            </span>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft size={18} />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-md shadow-blue-200">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium">
                3
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TypeBadge({ type }: { type: KeyReportItem['type'] }) {
  const styles = {
    'MORADOR': 'bg-gray-100 text-gray-600',
    'PRESTADOR': 'bg-blue-50 text-blue-600',
    'VISITANTE': 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide", styles[type])}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: KeyReportItem['status'] }) {
  const styles = {
    'Devolvida': 'bg-emerald-50 text-emerald-600',
    'Emprestada': 'bg-amber-50 text-amber-600',
    'Vencida': 'bg-red-50 text-red-600',
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit", styles[status])}>
      <span className={cn("w-1.5 h-1.5 rounded-full", 
        status === 'Devolvida' && "bg-emerald-500",
        status === 'Emprestada' && "bg-amber-500",
        status === 'Vencida' && "bg-red-500"
      )} />
      {status}
    </span>
  );
}
