import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Filter, 
  Key, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Edit2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_KEYS, KeyData } from '../data/mock';
import { Sidebar } from '../modals/Sidebar';
import { ReturnKeyModal } from '../modals/ReturnKeyModal';
import { AssignKeyModal } from '../modals/AssignKeyModal';
import { RegisterKeyModal } from '../modals/RegisterKeyModal';
import { EditKeyModal } from '../modals/EditKeyModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (page: 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports') => void;
}

export function Dashboard({ onLogout, onNavigate }: DashboardProps) {
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>('08');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRegisterKeyModalOpen, setIsRegisterKeyModalOpen] = useState(false);
  const [isEditKeyModalOpen, setIsEditKeyModalOpen] = useState(false);
  const [keys, setKeys] = useState<KeyData[]>(MOCK_KEYS);
  
  // Confirmation modals state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'save-key' | 'delete-key' | 'edit-key' | 'assign-key' | 'return-key' | null;
    data?: any;
  }>({ isOpen: false, type: null });

  const selectedKey = keys.find(k => k.id === selectedKeyId);

  const filteredKeys = keys.filter(key => 
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReturnConfirm = (observations: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'return-key',
      data: { observations }
    });
  };

  const executeReturnKey = () => {
    if (!selectedKey || !confirmationModal.data) return;

    setKeys(prevKeys => prevKeys.map(key => {
      if (key.id === selectedKey.id) {
        return {
          ...key,
          status: 'available',
          holder: undefined,
          borrowedAt: undefined,
          lastUsed: 'Hoje',
          observations: confirmationModal.data.observations || undefined
        };
      }
      return key;
    }));
    setIsReturnModalOpen(false);
  };

  const handleAssignConfirm = (data: any) => {
    setConfirmationModal({
      isOpen: true,
      type: 'assign-key',
      data
    });
  };

  const executeAssignKey = () => {
    if (!selectedKey || !confirmationModal.data) return;
    const data = confirmationModal.data;

    setKeys(prevKeys => prevKeys.map(key => {
      if (key.id === selectedKey.id) {
        return {
          ...key,
          status: 'borrowed',
          holder: {
            name: data.personName || 'Desconhecido',
            role: data.userType,
            avatar: data.personAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.personName || 'User')}&background=random`,
            time: 'Agora',
            contact: data.personContact,
            area: data.personArea,
            document: data.personDocument
          },
          borrowedAt: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          observations: data.observations
        };
      }
      return key;
    }));
    setIsAssignModalOpen(false);
  };

  const handleRegisterKeyConfirm = (data: any) => {
    setConfirmationModal({
      isOpen: true,
      type: 'save-key',
      data
    });
  };

  const executeSaveKey = () => {
    if (!confirmationModal.data) return;
    const data = confirmationModal.data;

    const newKey: KeyData = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      location: data.location || 'Bloco A',
      category: 'Geral',
      status: 'available',
      description: data.description,
      allowedProfiles: data.allowedProfiles,
      lastUsed: 'Nunca'
    };
    
    setKeys(prevKeys => [newKey, ...prevKeys]);
    setIsRegisterKeyModalOpen(false);
  };

  const handleEditKeyConfirm = (data: { name: string; allowedProfiles: string[]; description?: string }) => {
    setConfirmationModal({
      isOpen: true,
      type: 'edit-key',
      data
    });
  };

  const executeEditKey = () => {
    if (!selectedKey || !confirmationModal.data) return;
    const data = confirmationModal.data;

    setKeys(prevKeys => prevKeys.map(key => {
      if (key.id === selectedKey.id) {
        return {
          ...key,
          name: data.name,
          allowedProfiles: data.allowedProfiles,
          description: data.description
        };
      }
      return key;
    }));
    setIsEditKeyModalOpen(false);
  };

  const handleDeleteKey = () => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete-key'
    });
  };

  const executeDeleteKey = () => {
    if (!selectedKey) return;

    setKeys(prevKeys => prevKeys.filter(key => key.id !== selectedKey.id));
    setSelectedKeyId(null);
    setIsEditKeyModalOpen(false);
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
          type: 'success' as const
        };
      case 'delete-key':
        return {
          title: 'Confirmar Exclusão',
          message: 'Tem certeza que deseja excluir esta chave? Esta ação não pode ser desfeita.',
          confirmText: 'Sim, Excluir',
          type: 'danger' as const
        };
      case 'edit-key':
        return {
          title: 'Confirmar Alterações',
          message: 'Deseja realmente salvar as alterações desta chave?',
          confirmText: 'Sim, Salvar',
          type: 'success' as const
        };
      case 'assign-key':
        return {
          title: 'Confirmar Concessão',
          message: 'Deseja realmente conceder esta chave?',
          confirmText: 'Sim, Conceder',
          type: 'warning' as const
        };
      case 'return-key':
        return {
          title: 'Confirmar Devolução',
          message: 'Deseja realmente registrar a devolução desta chave?',
          confirmText: 'Sim, Registrar',
          type: 'success' as const
        };
      default:
        return {
          title: 'Confirmar',
          message: 'Deseja continuar?',
          confirmText: 'Confirmar',
          type: 'warning' as const
        };
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar activePage="dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold text-gray-900">Dashboard Principal</h2>
            <div className="flex items-center gap-4 text-sm">
              <StatusLegend color="bg-emerald-500" label="Disponível" />
              <StatusLegend color="bg-amber-500" label="Emprestado" />
              <StatusLegend color="bg-red-500" label="Atrasado" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsRegisterKeyModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200 text-sm"
            >
              <Plus size={18} />
              Cadastrar Nova Chave
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle size={20} />
            </button>
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
              <select className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                <option>Todos os Perfis</option>
              </select>
              <select className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                <option>Todos os Status</option>
              </select>
              <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center gap-2 font-medium transition-colors">
                <Filter size={18} />
                Filtrar
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
            {filteredKeys.map((keyItem) => (
              <KeyCard 
                key={keyItem.id} 
                data={keyItem} 
                isSelected={selectedKeyId === keyItem.id}
                onClick={() => setSelectedKeyId(keyItem.id)}
              />
            ))}
          </div>
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
            {/* Header Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-600">
                <Key size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedKey.name}</h2>
                <p className="text-gray-500">{selectedKey.location}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Descrição</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedKey.description || "Chave de acesso padrão para esta área."}
              </p>
            </div>

            {/* Allowed Profiles */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Perfis Permitidos</h4>
              <div className="flex flex-wrap gap-2">
                {selectedKey.allowedProfiles ? (
                  selectedKey.allowedProfiles.map(profile => (
                    <span key={profile} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
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

            {/* Holder Info */}
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
                  {selectedKey.holder.contact && (
                    <p className="text-xs text-gray-500 mt-1">{selectedKey.holder.contact}</p>
                  )}
                  {selectedKey.holder.area && (
                    <p className="text-xs text-blue-600 font-medium mt-1">{selectedKey.holder.area}</p>
                  )}
                </div>
              </div>
            )}

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {selectedKey.status === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                  {selectedKey.status === 'borrowed' && <Clock size={16} className="text-amber-500" />}
                  {selectedKey.status === 'overdue' && <AlertCircle size={16} className="text-red-500" />}
                  <span className={cn(
                    "text-sm font-bold",
                    selectedKey.status === 'available' && "text-emerald-700",
                    selectedKey.status === 'borrowed' && "text-amber-700",
                    selectedKey.status === 'overdue' && "text-red-700",
                  )}>
                    {selectedKey.status === 'available' && "Disponível"}
                    {selectedKey.status === 'borrowed' && "Emprestada"}
                    {selectedKey.status === 'overdue' && "Atrasada"}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Entrega</p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedKey.borrowedAt || "—"}
                </p>
              </div>
            </div>

            {/* Observations */}
            {selectedKey.observations && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-900">Observações</h4>
                <p className="text-sm text-gray-600 italic bg-yellow-50/50 p-3 rounded-lg border border-yellow-100/50">
                  {selectedKey.observations}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 space-y-3 bg-gray-50/50">
            {selectedKey.status === 'available' ? (
              <button 
                onClick={() => setIsAssignModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                <div className="bg-white/20 p-1 rounded">
                  <Key size={16} />
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
            
            <button 
              onClick={() => setIsEditKeyModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
            >
              <Edit2 size={16} />
              Editar
            </button>
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: null })}
        onConfirm={handleConfirmAction}
        {...getConfirmationConfig()}
      />
    </div>
  );
}

// Subcomponents

function StatusLegend({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
      <span className="text-gray-600 font-medium">{label}</span>
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
        "bg-white p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
        isSelected 
          ? "border-blue-500 ring-2 ring-blue-100 shadow-lg" 
          : "border-gray-100 hover:border-blue-200 hover:shadow-md"
      )}
    >
      {/* Status Icon Background */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
        data.status === 'available' && "bg-emerald-50 text-emerald-500",
        data.status === 'borrowed' && "bg-amber-50 text-amber-500",
        data.status === 'overdue' && "bg-red-50 text-red-500",
      )}>
        <Key size={24} />
      </div>

      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-gray-900 text-lg">{data.name} -</h3>
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-4">{data.location}</h3>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
        {data.status === 'available' ? (
          <div className="text-xs text-gray-400 italic">
            <p>Último uso:</p>
            <p>{data.lastUsed || "—"}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {data.holder && (
              <>
                <img 
                  src={data.holder.avatar} 
                  alt={data.holder.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700">{data.holder.name}</span>
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

        {data.status === 'available' ? (
           <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
             <ArrowRight size={16} />
           </div>
        ) : (
          <div className="text-right">
             {data.status === 'overdue' ? (
               <span className="text-lg font-bold text-gray-900">{data.holder?.time}</span>
             ) : (
               <span className="text-xs text-gray-400">{data.holder?.time}</span>
             )}
          </div>
        )}
      </div>
      
      {/* Status Label Top Right */}
      <div className="absolute top-5 right-5">
        <span className={cn(
          "text-xs font-bold",
          data.status === 'available' && "text-emerald-600",
          data.status === 'borrowed' && "text-amber-600",
          data.status === 'overdue' && "text-red-600",
        )}>
          {data.status === 'available' && "Livre"}
          {data.status === 'borrowed' && "Emprestada"}
          {data.status === 'overdue' && "Atrasada"}
        </span>
      </div>
    </div>
  );
}
