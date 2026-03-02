import React, { useState, useMemo } from 'react';
import { X, Key, Home, Users, Search, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { KeyData, PersonData } from '../data/mock';

interface AssignKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  keyData: KeyData;
  pessoas: PersonData[];
}

type UserType = 'Servidor' | 'Prestador';

export function AssignKeyModal({ isOpen, onClose, onConfirm, keyData, pessoas }: AssignKeyModalProps) {
  if (!isOpen) return null;

  const [userType, setUserType] = useState<UserType>('Servidor');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [showPersonList, setShowPersonList] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [observations, setObservations] = useState('');

  const now = useMemo(() => new Date(), []);
  const withdrawalDateTime = useMemo(() => {
    return now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [now]);

  const filteredPeople = pessoas.filter((person) => {
    const matchesType = person.role === userType;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      person.name.toLowerCase().includes(searchLower) ||
      person.document.toLowerCase().includes(searchLower) ||
      person.contact.toLowerCase().includes(searchLower);
    return matchesType && matchesSearch;
  });

  const handleSelectPerson = (person: PersonData) => {
    setSelectedPerson(person);
    setSearchTerm(person.name);
    setShowPersonList(false);
  };

  const formatDateTimeLocal = (datetimeLocalValue: string): string => {
    if (!datetimeLocalValue) return '';
    const [date, time] = datetimeLocalValue.split('T');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time}`;
  };

  const handleSubmit = () => {
    onConfirm({
      keyId: keyData.id,
      userType,
      personName: selectedPerson?.name || searchTerm,
      personId: selectedPerson?.id,
      personContact: selectedPerson?.contact,
      personArea: selectedPerson?.area,
      personDocument: selectedPerson?.document,
      personAvatar: selectedPerson?.avatar,
      customWithdrawalTime: withdrawalDateTime,
      expectedReturnDate: returnDate ? formatDateTimeLocal(returnDate) : undefined,
      returnDateIso: returnDate || undefined,
      observations,
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
            <h2 className="text-xl font-bold text-gray-900">Conceder Chave</h2>
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Perfil</label>
            <div className="grid grid-cols-2 gap-4">
              <UserTypeOption
                selected={userType === 'Servidor'}
                onClick={() => {
                  setUserType('Servidor');
                  setSelectedPerson(null);
                  setSearchTerm('');
                  setShowPersonList(false);
                }}
                icon={<Home size={20} />}
                title="Servidor"
                subtitle="Acesso padrão"
              />
              <UserTypeOption
                selected={userType === 'Prestador'}
                onClick={() => {
                  setUserType('Prestador');
                  setSelectedPerson(null);
                  setSearchTerm('');
                  setShowPersonList(false);
                }}
                icon={<Users size={20} />}
                title="Prestador"
                subtitle="Serviço terceirizado"
              />
            </div>
          </div>

          {/* Search Person */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buscar Pessoa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Digite o nome ou CPF da pessoa cadastrada..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowPersonList(true);
                }}
                onFocus={() => setShowPersonList(true)}
              />

              {showPersonList && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  {filteredPeople.length > 0 ? (
                    filteredPeople.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handleSelectPerson(person)}
                        className="w-full px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                      >
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{person.name}</p>
                          <p className="text-xs text-gray-500">{person.document}</p>
                        </div>
                        {selectedPerson?.id === person.id && (
                          <CheckCircle2 size={16} className="text-blue-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      Nenhuma pessoa encontrada
                    </div>
                  )}
                </div>
              )}

              {selectedPerson && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <img
                    src={selectedPerson.avatar}
                    alt={selectedPerson.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedPerson.name}</p>
                    <p className="text-xs text-gray-500">{selectedPerson.document}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPerson(null);
                      setSearchTerm('');
                      setShowPersonList(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Withdrawal DateTime */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Data/Hora de Retirada
            </label>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calendar size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{withdrawalDateTime}</p>
                <p className="text-xs text-gray-600 mt-1">Registrada automaticamente</p>
              </div>
            </div>
          </div>

          {/* Expected Return DateTime */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Data/Hora Prevista de Devolução
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <input
                type="datetime-local"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-600"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              Opcional — deixe em branco se não houver prazo definido.
            </p>
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
            Confirmar Concessão
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function UserTypeOption({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left',
        selected
          ? 'border-blue-600 bg-blue-50/50'
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
      )}
    >
      {selected ? (
        <div className="absolute top-3 right-3 text-blue-600">
          <div className="w-4 h-4 rounded-full border-[3px] border-blue-600" />
        </div>
      ) : (
        <div className="absolute top-3 right-3 text-gray-200">
          <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
        </div>
      )}
      <div className={cn('mb-2', selected ? 'text-blue-600' : 'text-gray-400')}>{icon}</div>
      <span className={cn('text-sm font-bold mb-0.5', selected ? 'text-gray-900' : 'text-gray-700')}>
        {title}
      </span>
      <span className="text-[10px] text-gray-400 font-medium">{subtitle}</span>
    </button>
  );
}
