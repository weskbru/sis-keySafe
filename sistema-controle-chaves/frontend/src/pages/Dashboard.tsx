import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { KeyData, PersonData } from '../data/mock';
import { Sidebar } from '../modals/Sidebar';
import { ReturnKeyModal } from '../modals/ReturnKeyModal';
import { AssignKeyModal } from '../modals/AssignKeyModal';
import { RegisterKeyModal } from '../modals/RegisterKeyModal';
import { EditKeyModal } from '../modals/EditKeyModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { chaveService } from '../services/chaveService';
import { emprestimoService, toKeyData } from '../services/emprestimoService';
import { pessoaService, toPessoaData } from '../services/pessoaService';
import { useToast } from '../contexts/ToastContext';
import keyIcon from '../images/key-icon_34404.png';
import chaveIcon from '../images/chave.png';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (
    page: 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports'
  ) => void;
}

export function Dashboard({ onLogout, onNavigate }: DashboardProps) {
  const { showToast } = useToast();
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfile, setFilterProfile] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRegisterKeyModalOpen, setIsRegisterKeyModalOpen] = useState(false);
  const [isEditKeyModalOpen, setIsEditKeyModalOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [pessoas, setPessoas] = useState<PersonData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'save-key' | 'delete-key' | 'edit-key' | 'assign-key' | 'return-key' | null;
    data?: any;
  }>({ isOpen: false, type: null });

  const loadDashboardData = useCallback(async () => {
    try {
      const [chavesRes, emprestimosRes, pessoasRes] = await Promise.all([
        chaveService.list(),
        emprestimoService.list(),
        pessoaService.list(),
      ]);
      const empAtivos = emprestimosRes.data.filter((e) => !e.data_devolucao);
      setKeys(chavesRes.data.map((c) => toKeyData(c, empAtivos, emprestimosRes.data)));
      setPessoas(pessoasRes.data.map(toPessoaData));
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Atualiza a cada 10 segundos para refletir mudanças feitas por outros usuários
    const interval = setInterval(loadDashboardData, 10_000);

    // Atualiza imediatamente ao retornar para a aba/janela
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadDashboardData();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadDashboardData]);

  const selectedKey = keys.find((k) => k.id === selectedKeyId);

  const availableCount = keys.filter((k) => k.status === 'available').length;
  const borrowedCount = keys.filter((k) => k.status === 'borrowed').length;
  const overdueCount = keys.filter((k) => k.status === 'overdue').length;

  const filteredKeys = keys.filter((key) => {
    const matchesSearch =
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProfile =
      filterProfile === 'all' ||
      (filterProfile === 'Servidor' && key.holder?.role === 'Servidor') ||
      (filterProfile === 'Prestador' && key.holder?.role === 'Prestador');
    const matchesStatus = filterStatus === 'all' || key.status === filterStatus;
    return matchesSearch && matchesProfile && matchesStatus;
  });

  const [prevSearchTerm, setPrevSearchTerm] = useState('');
  const [prevFilterProfile, setPrevFilterProfile] = useState('all');
  const [prevFilterStatus, setPrevFilterStatus] = useState('all');

  if (
    searchTerm !== prevSearchTerm ||
    filterProfile !== prevFilterProfile ||
    filterStatus !== prevFilterStatus
  ) {
    setCurrentPage(1);
    setPrevSearchTerm(searchTerm);
    setPrevFilterProfile(filterProfile);
    setPrevFilterStatus(filterStatus);
  }

  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKeys = filteredKeys.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleReturnConfirm = (observations: string) => {
    setConfirmationModal({ isOpen: true, type: 'return-key', data: { observations } });
  };

  const executeReturnKey = async () => {
    if (!selectedKey?.emprestimoId) return;
    try {
      await emprestimoService.devolver(parseInt(selectedKey.emprestimoId, 10), {
        observacao: confirmationModal.data?.observations,
      });
      setIsReturnModalOpen(false);
      setSelectedKeyId(null);
      await loadDashboardData();
    } catch (err: any) {
      const msg =
        err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : 'Erro ao registrar devolução.';
      showToast(msg);
    }
  };

  const handleAssignConfirm = (data: any) => {
    setConfirmationModal({ isOpen: true, type: 'assign-key', data });
  };

  const executeAssignKey = async () => {
    if (!selectedKey || !confirmationModal.data) return;
    const data = confirmationModal.data;
    if (!data.personId) {
      showToast('Selecione uma pessoa cadastrada no sistema.', 'warning');
      return;
    }
    try {
      const isoDate = data.returnDateIso
        ? new Date(data.returnDateIso).toISOString()
        : undefined;
      await emprestimoService.create({
        chave: parseInt(selectedKey.id, 10),
        pessoa: parseInt(data.personId, 10),
        data_prevista_devolucao: isoDate,
        observacao: data.observations,
      });
      setIsAssignModalOpen(false);
      await loadDashboardData();
    } catch (err: any) {
      const msg =
        err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : 'Erro ao conceder chave.';
      showToast(msg);
    }
  };

  const handleRegisterKeyConfirm = (data: any) => {
    setConfirmationModal({ isOpen: true, type: 'save-key', data });
  };

  const executeSaveKey = async () => {
    if (!confirmationModal.data) return;
    const data = confirmationModal.data;
    try {
      await chaveService.create({
        codigo: data.name,
        localizacao: data.location || 'Bloco A',
        descricao: data.description || '',
        permitir_servidor: data.allowedProfiles?.includes('Servidor') ?? true,
        permitir_prestador: data.allowedProfiles?.includes('Prestador') ?? true,
      });
      setIsRegisterKeyModalOpen(false);
      await loadDashboardData();
    } catch (err: any) {
      const msg =
        err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : 'Erro ao cadastrar chave.';
      showToast(msg);
    }
  };

  const handleEditKeyConfirm = (data: {
    name: string;
    allowedProfiles: string[];
    description?: string;
  }) => {
    setConfirmationModal({ isOpen: true, type: 'edit-key', data });
  };

  const executeEditKey = async () => {
    if (!selectedKey || !confirmationModal.data) return;
    const data = confirmationModal.data;
    try {
      await chaveService.update(parseInt(selectedKey.id, 10), {
        codigo: data.name,
        descricao: data.description,
        permitir_servidor: data.allowedProfiles.includes('Servidor'),
        permitir_prestador: data.allowedProfiles.includes('Prestador'),
      });
      setIsEditKeyModalOpen(false);
      await loadDashboardData();
    } catch {
      showToast('Erro ao editar chave.');
    }
  };

  const handleDeleteKey = () => {
    setConfirmationModal({ isOpen: true, type: 'delete-key' });
  };

  const executeDeleteKey = async () => {
    if (!selectedKey) return;
    try {
      await chaveService.destroy(parseInt(selectedKey.id, 10));
      setSelectedKeyId(null);
      setIsEditKeyModalOpen(false);
      await loadDashboardData();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        showToast('Esta chave possui empréstimos e não pode ser removida.', 'warning');
      } else {
        showToast('Erro ao excluir chave.');
      }
    }
  };

  const handleConfirmAction = () => {
    switch (confirmationModal.type) {
      case 'save-key':
        executeSaveKey();
        break;
      case 'delete-key':
        executeDeleteKey();
        break;
      case 'edit-key':
        executeEditKey();
        break;
      case 'assign-key':
        executeAssignKey();
        break;
      case 'return-key':
        executeReturnKey();
        break;
    }
  };

  const getConfirmationConfig = () => {
    switch (confirmationModal.type) {
      case 'save-key':
        return {
          title: 'Confirmar Cadastro',
          message: 'Deseja realmente cadastrar esta chave?',
          confirmText: 'Sim, Cadastrar',
          type: 'success' as const,
        };
      case 'delete-key':
        return {
          title: 'Confirmar Exclusão',
          message: 'Tem certeza que deseja excluir esta chave? Esta ação não pode ser desfeita.',
          confirmText: 'Sim, Excluir',
          type: 'danger' as const,
        };
      case 'edit-key':
        return {
          title: 'Confirmar Alterações',
          message: 'Deseja realmente salvar as alterações desta chave?',
          confirmText: 'Sim, Salvar',
          type: 'success' as const,
        };
      case 'assign-key':
        return {
          title: 'Confirmar Concessão',
          message: 'Deseja realmente conceder esta chave?',
          confirmText: 'Sim, Conceder',
          type: 'warning' as const,
        };
      case 'return-key':
        return {
          title: 'Confirmar Devolução',
          message: 'Deseja realmente registrar a devolução desta chave?',
          confirmText: 'Sim, Registrar',
          type: 'success' as const,
        };
      default:
        return {
          title: 'Confirmar',
          message: 'Deseja continuar?',
          confirmText: 'Confirmar',
          type: 'warning' as const,
        };
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar activePage="dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Dashboard Principal</h2>
              <p className="text-xs text-gray-500 mt-1">Gestão e controle de chaves</p>
            </div>
            <div className="h-12 w-px bg-gray-100"></div>
            <div className="flex items-center gap-6 text-sm">
              <StatusLegend icon={<CheckCircle2 size={16} />} color="bg-emerald-500" label="Disponível" />
              <StatusLegend icon={<Clock size={16} />} color="bg-amber-500" label="Emprestado" />
              <StatusLegend icon={<AlertCircle size={16} />} color="bg-red-500" label="Atrasado" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegisterKeyModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2.5 transition-all shadow-md shadow-blue-200/50 text-sm hover:shadow-lg hover:shadow-blue-200"
            >
              <Plus size={18} />
              Cadastrar Nova Chave
            </button>
            <div className="relative">
              <button
                onClick={() => setIsBellOpen((prev) => !prev)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {overdueCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {isBellOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-40">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resumo</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Disponiveis</span>
                      <span className="font-bold text-emerald-600">{availableCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Emprestadas</span>
                      <span className="font-bold text-amber-600">{borrowedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Atrasadas</span>
                      <span className="font-bold text-red-600">{overdueCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome da chave..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterProfile}
                onChange={(e) => setFilterProfile(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option value="all">Todos os Perfis</option>
                <option value="Servidor">Servidor</option>
                <option value="Prestador">Prestador</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="available">Disponível</option>
                <option value="borrowed">Emprestada</option>
                <option value="overdue">Atrasada</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterProfile('all');
                  setFilterStatus('all');
                }}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center gap-2 font-medium transition-colors"
              >
                <Filter size={18} />
                Limpar
              </button>
            </div>
          </div>

          {keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <img src={chaveIcon} alt="" className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhuma chave cadastrada</p>
              <p className="text-sm mt-1">Clique em "Cadastrar Nova Chave" para começar.</p>
            </div>
          ) : (
            <>
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(220px,220px))] justify-start gap-x-2 gap-y-3 pb-4">
                {currentKeys.map((keyItem) => (
                  <KeyCard
                    key={keyItem.id}
                    data={keyItem}
                    isSelected={selectedKeyId === keyItem.id}
                    onClick={() => setSelectedKeyId(keyItem.id)}
                  />
                ))}
              </div>

              {filteredKeys.length > 0 && totalPages > 1 && (
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Exibindo{' '}
                    <span className="font-bold text-gray-900">
                      {startIndex + 1}-{Math.min(endIndex, filteredKeys.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-bold text-gray-900">{filteredKeys.length}</span> chaves
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded-lg border font-medium transition-colors',
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Right Panel (Details) */}
      {selectedKey && (
        <aside className="w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-xl z-30">
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-lg">Detalhes da Chave</h3>
            <button
              onClick={() => setSelectedKeyId(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={keyIcon} alt="Ícone chave" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedKey.name}</h2>
                <p className="text-gray-500">{selectedKey.location}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Descrição</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedKey.description || 'Chave de acesso padrão para esta área.'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Perfis Permitidos</h4>
              <div className="flex flex-wrap gap-2">
                {selectedKey.allowedProfiles && selectedKey.allowedProfiles.length > 0 ? (
                  selectedKey.allowedProfiles.map((profile) => (
                    <span
                      key={profile}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
                    >
                      {profile}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    Todos
                  </span>
                )}
              </div>
            </div>

            {selectedKey.holder && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900">Informações do Portador</h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <img
                      src={selectedKey.holder.avatar}
                      alt={selectedKey.holder.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                    />
                    {selectedKey.status === 'overdue' && (
                      <div className="absolute bottom-0 right-0 bg-red-500 text-white p-1 rounded-full border-2 border-white">
                        <AlertCircle size={14} />
                      </div>
                    )}
                  </div>
                  <h5 className="font-bold text-gray-900">{selectedKey.holder.name}</h5>
                  <p className="text-xs text-gray-500 mt-1">{selectedKey.holder.role}</p>
                  {selectedKey.holder.cpf && (
                    <p className="text-xs font-mono text-gray-500 mt-1">{selectedKey.holder.cpf}</p>
                  )}
                  {selectedKey.holder.contact && (
                    <p className="text-xs text-gray-500 mt-1">{selectedKey.holder.contact}</p>
                  )}
                  {selectedKey.holder.area && (
                    <p className="text-xs text-blue-600 font-medium mt-1">{selectedKey.holder.area}</p>
                  )}
                </div>
              </div>
            )}

            {selectedKey.status === 'available' && selectedKey.lastUser && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900">Último Uso</h4>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col items-center text-center">
                  <div className="mb-3">
                    <img
                      src={selectedKey.lastUser.avatar}
                      alt={selectedKey.lastUser.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                    />
                  </div>
                  <h5 className="font-bold text-gray-900">{selectedKey.lastUser.name}</h5>
                  <p className="text-xs text-gray-600 mt-1">{selectedKey.lastUser.role}</p>
                  {selectedKey.lastUser.returnedAt && (
                    <p className="text-xs text-gray-500 mt-2 bg-white/50 px-2 py-1 rounded">
                      {selectedKey.lastUser.returnedAt}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {selectedKey.status === 'available' && (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                  {selectedKey.status === 'borrowed' && (
                    <Clock size={16} className="text-amber-500" />
                  )}
                  {selectedKey.status === 'overdue' && (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-bold',
                      selectedKey.status === 'available' && 'text-emerald-700',
                      selectedKey.status === 'borrowed' && 'text-amber-700',
                      selectedKey.status === 'overdue' && 'text-red-700'
                    )}
                  >
                    {selectedKey.status === 'available' && 'Disponível'}
                    {selectedKey.status === 'borrowed' && 'Emprestada'}
                    {selectedKey.status === 'overdue' && 'Atrasada'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  {selectedKey.status === 'borrowed' ? 'Entrega Prevista' : 'Entrega'}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedKey.status === 'available' && selectedKey.lastUser?.returnedAt
                    ? selectedKey.lastUser.returnedAt
                    : selectedKey.borrowedAt || '—'}
                </p>
              </div>
            </div>

            {selectedKey.observations && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-900">Observações</h4>
                <p className="text-sm text-gray-600 italic bg-yellow-50/50 p-3 rounded-lg border border-yellow-100/50">
                  {selectedKey.observations}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 space-y-3 bg-gray-50/50">
            {selectedKey.status === 'available' ? (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                <div className="bg-white/20 p-1 rounded">
                  <img src={keyIcon} alt="Ícone chave" className="w-4 h-4 object-contain" />
                </div>
                Entregar Chave
              </button>
            ) : (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                <div className="bg-white/20 p-1 rounded">
                  <ArrowRight size={16} />
                </div>
                Registar Devolução
              </button>
            )}
            {selectedKey.status !== 'borrowed' && selectedKey.status !== 'overdue' && (
              <button
                onClick={() => setIsEditKeyModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
            )}
          </div>
        </aside>
      )}

      {selectedKey && (
        <>
          <ReturnKeyModal
            isOpen={isReturnModalOpen}
            onClose={() => setIsReturnModalOpen(false)}
            onConfirm={handleReturnConfirm}
            keyData={selectedKey}
          />
          <AssignKeyModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            onConfirm={handleAssignConfirm}
            keyData={selectedKey}
            pessoas={pessoas}
          />
        </>
      )}

      <RegisterKeyModal
        isOpen={isRegisterKeyModalOpen}
        onClose={() => setIsRegisterKeyModalOpen(false)}
        onConfirm={handleRegisterKeyConfirm}
      />

      {selectedKey && (
        <EditKeyModal
          isOpen={isEditKeyModalOpen}
          onClose={() => setIsEditKeyModalOpen(false)}
          onConfirm={handleEditKeyConfirm}
          onDelete={handleDeleteKey}
          keyData={selectedKey}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: null })}
        onConfirm={handleConfirmAction}
        {...getConfirmationConfig()}
      />
    </div>
  );
}

function StatusLegend({
  icon,
  color,
  label,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <span className={cn('w-2.5 h-2.5 rounded-full shadow-sm', color)} />
      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
        <span className="text-gray-400">{icon}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

interface KeyCardProps {
  data: KeyData;
  isSelected: boolean;
  onClick: () => void;
}

const KeyCard: React.FC<KeyCardProps> = ({ data, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white p-3 rounded-xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col aspect-[3/4] w-full max-w-[220px] mx-auto',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-1'
      )}
    >
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative mx-auto mb-4">
          <div
            className={cn(
              'w-20 h-20 rounded-xl flex items-center justify-center transition-all border',
              data.status === 'available' &&
                'bg-emerald-50 border-emerald-200 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
              data.status === 'borrowed' &&
                'bg-amber-50 border-amber-200 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]',
              data.status === 'overdue' &&
                'bg-red-50 border-red-200 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
            )}
          >
            <img src={keyIcon} alt="Chave" className="w-16 h-16 object-contain" />
          </div>
          <span
            className={cn(
              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
              data.status === 'available' && 'bg-emerald-500',
              data.status === 'borrowed' && 'bg-amber-500',
              data.status === 'overdue' && 'bg-red-500 animate-pulse'
            )}
          />
        </div>

        <div className="mb-1 text-center">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{data.name}</h3>
        </div>
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 text-center">
          {data.location}
        </h3>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
        {data.status === 'available' ? (
          <div className="flex items-center gap-2">
            {data.lastUserName ? (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.lastUserName)}&background=4f46e5&color=ffffff&size=80`}
                alt={data.lastUserName}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
            )}
            <div className="text-[11px] text-gray-400 italic leading-tight">
              <p>Último uso:</p>
              <p className="text-gray-600 not-italic font-medium truncate max-w-30">
                {data.lastUserName || '—'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {data.holder && (
              <>
                <img
                  src={data.holder.avatar}
                  alt={data.holder.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-700 leading-tight">
                    {data.holder.name}
                  </span>
                  {data.status === 'overdue' && (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle size={10} />
                      Atrasado!
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {data.status === 'available' && (
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
            <ArrowRight size={14} />
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4">
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
            data.status === 'available' && 'text-emerald-700 bg-emerald-50 border-emerald-100',
            data.status === 'borrowed' && 'text-amber-700 bg-amber-50 border-amber-100',
            data.status === 'overdue' && 'text-red-700 bg-red-50 border-red-100'
          )}
        >
          {data.status === 'available' && 'Livre'}
          {data.status === 'borrowed' && 'Emprestada'}
          {data.status === 'overdue' && 'Atrasada'}
        </span>
      </div>
    </div>
  );
};
