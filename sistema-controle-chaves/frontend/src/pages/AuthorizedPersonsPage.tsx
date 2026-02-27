import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  X 
} from 'lucide-react';
import { Sidebar } from '../modals/Sidebar';
import { MOCK_PEOPLE, PersonData } from '../data/mock';
import { cn } from '../lib/utils';
import { RegisterPersonModal } from '../modals/RegisterPersonModal';

interface AuthorizedPersonsPageProps {
  onNavigate: (page: 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports') => void;
  onLogout: () => void;
}

export function AuthorizedPersonsPage({ onNavigate, onLogout }: AuthorizedPersonsPageProps) {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [people, setPeople] = useState<PersonData[]>(MOCK_PEOPLE);
  const [editingPerson, setEditingPerson] = useState<PersonData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Lógica de filtragem
  const filteredPeople = people.filter(person => {
    // Filtro por pesquisa
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      person.name.toLowerCase().includes(searchLower) ||
      person.document.toLowerCase().includes(searchLower) ||
      person.contact.toLowerCase().includes(searchLower) ||
      (person.email && person.email.toLowerCase().includes(searchLower));

    // Filtro por perfil
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(person.role);

    return matchesSearch && matchesRole;
  });

  // Resetar página ao filtrar
  const [prevSearchTerm, setPrevSearchTerm] = useState('');
  const [prevSelectedRoles, setPrevSelectedRoles] = useState<string[]>([]);

  if (searchTerm !== prevSearchTerm || JSON.stringify(selectedRoles) !== JSON.stringify(prevSelectedRoles)) {
    setCurrentPage(1);
    setPrevSearchTerm(searchTerm);
    setPrevSelectedRoles(selectedRoles);
  }

  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPeople = filteredPeople.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRegisterConfirm = (data: any) => {
    if (data.id) {
      // Edit existing person
      setPeople(prevPeople => prevPeople.map(p => p.id === data.id ? {
        ...p,
        name: data.name,
        role: data.role,
        document: data.document,
        contact: data.phone,
        area: data.area,
        observations: data.observations,
        avatar: data.avatar || p.avatar // Update avatar if provided
      } : p));
    } else {
      // Create new person
      const newPerson: PersonData = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: '', // Email is not collected in the modal
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
        role: data.role,
        document: data.document,
        contact: data.phone,
        area: data.area,
        observations: data.observations
      };
      setPeople(prevPeople => [newPerson, ...prevPeople]);
    }
    setIsRegisterModalOpen(false);
    setEditingPerson(null);
  };

  const handleEdit = (person: PersonData) => {
    setEditingPerson(person);
    setIsRegisterModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta pessoa?')) {
      setPeople(prevPeople => prevPeople.filter(p => p.id !== id));
    }
  };

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
    setEditingPerson(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar activePage="authorized-persons" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Pessoas Autorizadas</h2>
          <button 
            onClick={() => {
              setEditingPerson(null);
              setIsRegisterModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
          >
            <Plus size={20} />
            Cadastrar Nova Pessoa
          </button>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Search and Filter Bar */}
            <div className="p-6 border-b border-gray-100 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar por nome, CPF ou documento..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-2 font-medium transition-colors"
              >
                <Filter size={18} />
                Filtros
                {selectedRoles.length > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedRoles.length}
                  </span>
                )}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {currentPeople.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    {searchTerm || selectedRoles.length > 0 
                      ? 'Nenhuma pessoa encontrada com os critérios de busca.' 
                      : 'Nenhuma pessoa cadastrada.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Avatar</th>
                      <th className="px-6 py-4">Nome Completo</th>
                      <th className="px-6 py-4">Perfil</th>
                      <th className="px-6 py-4">Documento</th>
                      <th className="px-6 py-4">Contato</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPeople.map((person) => (
                      <tr key={person.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <img 
                            src={person.avatar} 
                            alt={person.name} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{person.name}</span>
                            {person.email && <span className="text-xs text-gray-500">{person.email}</span>}
                            {person.area && <span className="text-xs text-blue-600 font-medium">{person.area}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={person.role} />
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                          {person.document}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {person.contact}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleEdit(person)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(person.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {currentPeople.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Exibindo <span className="font-bold text-gray-900">{filteredPeople.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredPeople.length)}</span> de <span className="font-bold text-gray-900">{filteredPeople.length}</span> registros
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
                        "w-8 h-8 flex items-center justify-center rounded-lg border font-medium transition-colors",
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
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

          </div>
        </div>
      </main>

      {isRegisterModalOpen && (
        <RegisterPersonModal 
          isOpen={isRegisterModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleRegisterConfirm}
          initialData={editingPerson}
        />
      )}

      {isFilterModalOpen && (
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          selectedRoles={selectedRoles}
          onRoleChange={(role) => {
            setSelectedRoles(prev =>
              prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
            );
          }}
        />
      )}
    </div>
  );
}

function FilterModal({ 
  isOpen, 
  onClose, 
  selectedRoles, 
  onRoleChange 
}: { 
  isOpen: boolean;
  onClose: () => void;
  selectedRoles: string[];
  onRoleChange: (role: string) => void;
}) {
  if (!isOpen) return null;

  const roles = ['Servidor', 'Prestador', 'Visitante'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Filtrar por Perfil</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {roles.map(role => (
            <label key={role} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="checkbox" 
                checked={selectedRoles.includes(role)}
                onChange={() => onRoleChange(role)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700 flex-1">{role}</span>
              {selectedRoles.includes(role) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Selecionado</span>
              )}
            </label>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          {selectedRoles.length > 0 && (
            <button 
              onClick={onClose}
              className="flex-1 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Aplicar Filtros ({selectedRoles.length})
            </button>
          )}
          <button 
            onClick={() => {
              onClose();
            }}
            className={cn(
              "flex-1 font-medium py-2.5 rounded-lg transition-colors text-sm",
              selectedRoles.length > 0
                ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {selectedRoles.length > 0 ? 'Fechar' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: PersonData['role'] }) {
  const styles = {
    'Servidor': 'bg-blue-100 text-blue-700',
    'Prestador': 'bg-orange-100 text-orange-700',
    'Visitante': 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold", styles[role])}>
      {role}
    </span>
  );
}
