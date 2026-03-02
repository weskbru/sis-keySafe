import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Printer,
  FileSpreadsheet,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Shield,
  Building,
  CheckCircle,
  LogOut,
  LogIn,
  Loader2,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchHistorico, KeyReportItem } from '../services/relatorioService';
import { Sidebar } from '../modals/Sidebar';

interface KeyReportsPageProps {
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

type SortBy = 'key' | 'date' | 'name';

const PAGE_SIZE = 10;

export function KeyReportsPage({ onNavigate, onLogout }: KeyReportsPageProps) {
  const [rows, setRows] = useState<KeyReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameFilter, setNameFilter] = useState('');
  const [keyFilter, setKeyFilter] = useState('all');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    finalizados: true,
    andamento: false,
    vencidos: false,
  });
  const [roleFilters, setRoleFilters] = useState({
    servidor: true,
    prestador: true,
  });
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistorico({ historico: true });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lista de chaves únicas para o select
  const uniqueKeys = useMemo(
    () => [...new Set(rows.map((r) => r.keyName))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    const fromDate = periodFrom ? new Date(periodFrom) : null;
    const toDate = periodTo ? new Date(periodTo) : null;

    const matchesStatus = (s: KeyReportItem['status']) => {
      if (s === 'Devolvida') return statusFilters.finalizados;
      if (s === 'Emprestada') return statusFilters.andamento;
      if (s === 'Vencida') return statusFilters.vencidos;
      return true;
    };

    const matchesRole = (role: KeyReportItem['role']) => {
      if (role === 'Servidor') return roleFilters.servidor;
      if (role === 'Prestador') return roleFilters.prestador;
      return true;
    };

    let result = rows.filter((item) => {
      if (normalizedName && !item.name.toLowerCase().includes(normalizedName)) return false;
      if (keyFilter !== 'all' && item.keyName !== keyFilter) return false;
      if (!matchesStatus(item.status)) return false;
      if (!matchesRole(item.role)) return false;

      if (fromDate || toDate) {
        // withdrawalDate está em formato pt-BR DD/MM/YYYY HH:mm
        const parts = item.withdrawalDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (!parts) return false;
        const d = new Date(
          Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]),
          Number(parts[4]), Number(parts[5])
        );
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
      }

      return true;
    });

    // Ordenação
    result = [...result].sort((a, b) => {
      if (sortBy === 'key') return a.keyName.localeCompare(b.keyName);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // date (desc) — padrão
      return b.withdrawalDate.localeCompare(a.withdrawalDate);
    });

    return result;
  }, [rows, nameFilter, keyFilter, periodFrom, periodTo, statusFilters, roleFilters, sortBy]);

  // Reset para página 1 ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, keyFilter, periodFrom, periodTo, statusFilters, roleFilters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleExportXlsx = () => {
    const data = [
      ['Nome', 'Perfil', 'Área', 'Chave', 'Status', 'Retirada', 'Devolução'],
      ...filteredRows.map((r) => [
        r.name,
        r.role,
        r.area,
        r.keyName,
        r.status,
        r.withdrawalDate,
        r.returnDate,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras das colunas
    ws['!cols'] = [
      { wch: 35 }, // Nome
      { wch: 12 }, // Perfil
      { wch: 45 }, // Área
      { wch: 14 }, // Chave
      { wch: 12 }, // Status
      { wch: 18 }, // Retirada
      { wch: 18 }, // Devolução
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empréstimos');

    const filename = `relatorio-emprestimos-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handlePrint = () => window.print();

  const handleClearFilters = () => {
    setNameFilter('');
    setKeyFilter('all');
    setPeriodFrom('');
    setPeriodTo('');
    setStatusFilters({ finalizados: true, andamento: false, vencidos: false });
    setRoleFilters({ servidor: true, prestador: true });
    setSortBy('date');
  };

  const rangeStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredRows.length);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar activePage="key-reports" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shadow-lg shadow-gray-200">
              <img src="/images/chave.png" alt="Ícone chave" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Relatório de Empréstimo de Chaves</h1>
              <p className="text-xs text-gray-500">Gestão e controle de acesso</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Imprimir"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleExportXlsx}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar Excel"
            >
              <FileSpreadsheet size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6 text-blue-900 font-bold">
              <Filter size={20} className="text-blue-600" />
              <h3>Filtros de Pesquisa</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Digite o nome..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Chave */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Chave</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white"
                  value={keyFilter}
                  onChange={(e) => setKeyFilter(e.target.value)}
                >
                  <option value="all">Todas as chaves</option>
                  {uniqueKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Empréstimos
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'finalizados', label: 'Finalizados' },
                    { key: 'andamento', label: 'Em andamento' },
                    { key: 'vencidos', label: 'Vencidos' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFilters[key as keyof typeof statusFilters]}
                        onChange={(e) =>
                          setStatusFilters((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Período De */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Período De</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-500"
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                />
              </div>

              {/* Período Até */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Período Até</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-500"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-t border-gray-100 pt-6">
              <div className="flex flex-col md:flex-row gap-8 w-full md:w-auto">
                {/* Quem Pegou */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Quem Pegou
                  </label>
                  <div className="flex gap-4">
                    {[
                      { key: 'servidor', label: 'Servidor' },
                      { key: 'prestador', label: 'Prestador' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleFilters[key as keyof typeof roleFilters]}
                          onChange={(e) =>
                            setRoleFilters((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ordenar Por */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ordenar Por
                  </label>
                  <div className="flex gap-4">
                    {([
                      { value: 'key', label: 'Chave' },
                      { value: 'date', label: 'Data empréstimo' },
                      { value: 'name', label: 'Nome' },
                    ] as { value: SortBy; label: string }[]).map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === value}
                          onChange={() => setSortBy(value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-200 active:scale-95 w-full md:w-auto justify-center"
              >
                <Filter size={18} />
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="text-sm">Carregando relatório...</span>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
                <FileText size={40} className="text-gray-200" />
                <p className="text-sm font-medium">Nenhum empréstimo encontrado</p>
                <p className="text-xs">Ajuste os filtros ou registre devoluções para gerar histórico</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4"><div className="flex items-center gap-2"><User size={14} />Nome</div></th>
                        <th className="px-6 py-4"><div className="flex items-center gap-2"><Shield size={14} />Perfil</div></th>
                        <th className="px-6 py-4"><div className="flex items-center gap-2"><Building size={14} />Área</div></th>
                        <th className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src="/images/chave.png" alt="Chave" className="w-3.5 h-3.5 object-contain" />
                            Chave
                          </div>
                        </th>
                        <th className="px-6 py-4"><div className="flex items-center gap-2"><CheckCircle size={14} />Status</div></th>
                        <th className="px-6 py-4"><div className="flex items-center gap-2"><LogOut size={14} />Retirada</div></th>
                        <th className="px-6 py-4"><div className="flex items-center gap-2"><LogIn size={14} />Devolução</div></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedRows.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">{item.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <TypeBadge role={item.role} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.area}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                              <img src="/images/chave.png" alt="Ícone chave" className="w-3.5 h-3.5 object-contain" />
                              {item.keyName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.withdrawalDate}</td>
                          <td className={cn(
                            'px-6 py-4 text-sm',
                            item.status === 'Vencida' ? 'text-red-600 font-bold' : 'text-gray-600'
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
                    Mostrando{' '}
                    <span className="font-bold text-gray-900">{rangeStart}</span> a{' '}
                    <span className="font-bold text-gray-900">{rangeEnd}</span> de{' '}
                    <span className="font-bold text-gray-900">{filteredRows.length}</span> resultados
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = totalPages <= 5
                        ? i + 1
                        : currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'w-10 h-10 flex items-center justify-center rounded-full font-medium text-sm',
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: KeyReportItem['status'] }) {
  const map = {
    Devolvida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Emprestada: 'bg-blue-50 text-blue-700 border-blue-200',
    Vencida: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', map[status])}>
      {status}
    </span>
  );
}

function TypeBadge({ role }: { role: KeyReportItem['role'] }) {
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-semibold border',
        role === 'Servidor'
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      )}
    >
      {role}
    </span>
  );
}
