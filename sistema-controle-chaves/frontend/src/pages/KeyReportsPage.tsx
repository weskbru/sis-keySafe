import React, { useMemo, useState } from 'react';
import { 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  Filter, 
  Key, 
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_KEYS, MOCK_PEOPLE, KeyData } from '../data/mock';

interface KeyReportsPageProps {
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

type ReportRole = 'Servidor' | 'Prestador';

interface KeyReportItem {
  id: string;
  name: string;
  role: ReportRole;
  contact: string;
  area?: string;
  keyName: string;
  status: 'Devolvida' | 'Emprestada' | 'Vencida';
  withdrawalDate: string;
  returnDate: string;
}

export function KeyReportsPage({ onNavigate, onLogout }: KeyReportsPageProps) {
  const [nameFilter, setNameFilter] = useState('');
  const [keyFilter, setKeyFilter] = useState('all');
  const [maxResults, setMaxResults] = useState(10000);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    finalizados: true,
    andamento: true,
    vencidos: false
  });
  const [roleFilters, setRoleFilters] = useState({
    servidor: true,
    prestador: true
  });

  const reportRows = useMemo<KeyReportItem[]>(() => {
    return MOCK_KEYS.flatMap((key: KeyData) => {
      const user = key.holder || key.lastUser;
      if (!user) return [];

      const person = MOCK_PEOPLE.find(p => p.name === user.name);
      const rawRole = (user.role || person?.role || 'Servidor');
      if (rawRole === 'Visitante') return [];
      const role = rawRole as ReportRole;
      const contact = person?.contact || (('contact' in user ? (user as { contact?: string }).contact : undefined) ?? '—');
      const area = person?.area || (('area' in user ? (user as { area?: string }).area : undefined) ?? undefined);

      const statusLabel: KeyReportItem['status'] =
        key.status === 'available' ? 'Devolvida' :
        key.status === 'borrowed' ? 'Emprestada' :
        'Vencida';

      return [{
        id: key.id,
        name: user.name,
        role,
        contact,
        area,
        keyName: key.name,
        status: statusLabel,
        withdrawalDate: key.borrowedAt || '—',
        returnDate: key.lastUser?.returnedAt || '—'
      }];
    });
  }, []);

  const parseDateTimePtBr = (value: string): Date | null => {
    if (!value || value === '—') return null;
    const [datePart, timePart] = value.split(' ');
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day, hour || 0, minute || 0);
  };

  const filteredRows = useMemo(() => {
    const fromDate = periodFrom ? new Date(periodFrom) : null;
    const toDate = periodTo ? new Date(periodTo) : null;

    const matchesStatus = (status: KeyReportItem['status']) => {
      if (status === 'Devolvida') return statusFilters.finalizados;
      if (status === 'Emprestada') return statusFilters.andamento;
      if (status === 'Vencida') return statusFilters.vencidos;
      return true;
    };

    const matchesRole = (role: KeyReportItem['role']) => {
      if (role === 'Servidor') return roleFilters.servidor;
      if (role === 'Prestador') return roleFilters.prestador;
      return true;
    };

    const normalizedName = nameFilter.trim().toLowerCase();

    const rows = reportRows.filter((item) => {
      if (normalizedName && !item.name.toLowerCase().includes(normalizedName)) {
        return false;
      }

      if (keyFilter !== 'all' && item.keyName !== keyFilter) {
        return false;
      }

      if (!matchesStatus(item.status)) {
        return false;
      }

      if (!matchesRole(item.role)) {
        return false;
      }

      if (fromDate || toDate) {
        const withdrawDate = parseDateTimePtBr(item.withdrawalDate);
        if (!withdrawDate) return false;
        if (fromDate && withdrawDate < fromDate) return false;
        if (toDate && withdrawDate > toDate) return false;
      }

      return true;
    });

    return rows.slice(0, Math.max(0, maxResults));
  }, [
    reportRows,
    nameFilter,
    keyFilter,
    maxResults,
    periodFrom,
    periodTo,
    statusFilters,
    roleFilters
  ]);

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
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Chave</label>
              <select 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white"
                value={keyFilter}
                onChange={(e) => setKeyFilter(e.target.value)}
              >
                <option value="all">Todas as chaves</option>
                {MOCK_KEYS.map((keyItem) => (
                  <option key={keyItem.id} value={keyItem.name}>{keyItem.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Máxima quantidade</label>
              <input 
                type="number" 
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Período De</label>
              <input 
                type="datetime-local" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-500"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Período Até</label>
              <input 
                type="datetime-local" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-500"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
              />
            </div>
            
            {/* Status Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Empréstimos</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={statusFilters.finalizados}
                    onChange={(e) => setStatusFilters(prev => ({ ...prev, finalizados: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                  />
                  Finalizados
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={statusFilters.andamento}
                    onChange={(e) => setStatusFilters(prev => ({ ...prev, andamento: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                  />
                  Em andamento
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={statusFilters.vencidos}
                    onChange={(e) => setStatusFilters(prev => ({ ...prev, vencidos: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                  />
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
                    <input 
                      type="checkbox" 
                      checked={roleFilters.servidor}
                      onChange={(e) => setRoleFilters(prev => ({ ...prev, servidor: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                    />
                    Servidor
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={roleFilters.prestador}
                      onChange={(e) => setRoleFilters(prev => ({ ...prev, prestador: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                    />
                    Prestador
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

            <button 
              onClick={() => {
                setNameFilter('');
                setKeyFilter('all');
                setMaxResults(10000);
                setPeriodFrom('');
                setPeriodTo('');
                setStatusFilters({ finalizados: true, andamento: true, vencidos: false });
                setRoleFilters({ servidor: true, prestador: true });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-200 active:scale-95 w-full md:w-auto justify-center"
            >
              <Filter size={18} />
              Limpar Filtros
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
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Area</th>
                  <th className="px-6 py-4">Chave</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Retirada</th>
                  <th className="px-6 py-4">Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge role={item.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.contact}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.area || '—'}
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

function TypeBadge({ role }: { role: KeyReportItem['role'] }) {
  const styles = {
    'Servidor': 'bg-gray-100 text-gray-600',
    'Prestador': 'bg-blue-50 text-blue-600',
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide", styles[role])}>
      {role}
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
