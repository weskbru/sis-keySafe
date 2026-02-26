import React, { useState } from 'react';
import { X, Key, Home, Users, Search, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { KeyData } from '../data/mock';

interface AssignKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  keyData: KeyData;
}

type UserType = 'resident' | 'visitor';

export function AssignKeyModal({ isOpen, onClose, onConfirm, keyData }: AssignKeyModalProps) {
  if (!isOpen) return null;

  const [userType, setUserType] = useState<UserType>('resident');
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [observations, setObservations] = useState('');

  const handleSubmit = () => {
    onConfirm({
      keyId: keyData.id,
      userType,
      personName: searchTerm, // In a real app this would be the selected person's ID
      withdrawalDate,
      returnDate,
      observations
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Key size={24} />
            <h2 className="text-xl font-bold text-gray-900">Entregar Chaves</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo de Usuário</label>
            <div className="grid grid-cols-2 gap-4">
              <UserTypeOption 
                selected={userType === 'resident'} 
                onClick={() => setUserType('resident')}
                icon={<Home size={20} />}
                title="Morador"
                subtitle="Residente cadastrado"
              />
              <UserTypeOption 
                selected={userType === 'visitor'} 
                onClick={() => setUserType('visitor')}
                icon={<Users size={20} />}
                title="Visitante/Prestador"
                subtitle="Acesso temporário"
              />
            </div>
          </div>

          {/* Search Person */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buscar Pessoa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Digite o nome ou CPF da pessoa cadastrada..." 
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data/Hora de Retirada</label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-600"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prevista de Devolução</label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-600"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Observações</label>
            <textarea 
              className="w-full h-24 p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm transition-all placeholder:text-gray-400"
              placeholder="Adicione informações relevantes sobre a entrega..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Confirmar Entrega
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function UserTypeOption({ selected, onClick, icon, title, subtitle }: { selected: boolean, onClick: () => void, icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
        selected 
          ? "border-blue-600 bg-blue-50/50" 
          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-blue-600">
          <div className="w-4 h-4 rounded-full border-[3px] border-blue-600" />
        </div>
      )}
      {!selected && (
        <div className="absolute top-3 right-3 text-gray-200">
          <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
        </div>
      )}
      
      <div className={cn("mb-2", selected ? "text-blue-600" : "text-gray-400")}>
        {icon}
      </div>
      <span className={cn("text-sm font-bold mb-0.5", selected ? "text-gray-900" : "text-gray-700")}>{title}</span>
      <span className="text-[10px] text-gray-400 font-medium">{subtitle}</span>
    </button>
  );
}
