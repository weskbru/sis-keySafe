import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { adminUserService, type ApiAdminUser, type AdminUserPayload } from '../services/adminUserService';
import { AdminUserModal } from '../modals/AdminUserModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { Sidebar } from '../modals/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface AdminUsersPageProps {
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

export function AdminUsersPage({ onNavigate, onLogout }: AdminUsersPageProps) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiAdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiAdminUser | null>(null);

  // Guard: apenas superusuários acessam esta página
  useEffect(() => {
    if (currentUser && !currentUser.is_superuser) {
      onNavigate('dashboard');
    }
  }, [currentUser, onNavigate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminUserService.list();
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSave = async (data: AdminUserPayload) => {
    try {
      if (editTarget) {
        await adminUserService.update(editTarget.id, data);
      } else {
        await adminUserService.create(data);
      }
      await loadUsers();
    } catch (err: any) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Erro ao salvar. Tente novamente.';
      showToast(msg);
    }
  };

  const handleToggleActive = async (user: ApiAdminUser) => {
    try {
      await adminUserService.update(user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch {
      showToast('Erro ao alterar status. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminUserService.destroy(deleteTarget.id);
      await loadUsers();
    } catch {
      showToast('Erro ao excluir. Tente novamente.');
    }
  };

  const isSelf = (user: ApiAdminUser) => user.id === currentUser?.id;

  const fullName = (user: ApiAdminUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(' ') || '—';

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar activePage="admin-users" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
              <ShieldCheck size={22} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestão de Administradores</h1>
              <p className="text-xs text-gray-500">Controle de acesso ao sistema</p>
            </div>
          </div>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            <Plus size={18} />
            Novo Administrador
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="text-sm">Carregando administradores...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
                <Users size={40} className="text-gray-200" />
                <p className="text-sm font-medium">Nenhum administrador cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Nome Completo</th>
                      <th className="px-6 py-4">E-mail</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                fullName(user) !== '—' ? fullName(user) : user.username
                              )}&background=4f46e5&color=ffffff&size=80`}
                              alt={user.username}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <span className="font-semibold text-gray-900 text-sm">
                              {user.username}
                              {isSelf(user) && (
                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                  você
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{fullName(user)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email || '—'}</td>
                        <td className="px-6 py-4">
                          <TypeBadge isSuperuser={user.is_superuser} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge isActive={user.is_active} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Editar */}
                            <button
                              onClick={() => { setEditTarget(user); setModalOpen(true); }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* Toggle Ativo */}
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={isSelf(user)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                isSelf(user)
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : user.is_active
                                  ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              )}
                              title={user.is_active ? 'Desativar' : 'Ativar'}
                            >
                              {user.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => setDeleteTarget(user)}
                              disabled={isSelf(user)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                isSelf(user)
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              )}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AdminUserModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onConfirm={handleSave}
        initialData={editTarget}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Administrador"
        message={`Deseja excluir permanentemente o usuário "${deleteTarget?.username}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}

function TypeBadge({ isSuperuser }: { isSuperuser: boolean }) {
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-semibold border',
        isSuperuser
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      )}
    >
      {isSuperuser ? 'Superusuário' : 'Administrador'}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-semibold border',
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-100 text-gray-500 border-gray-200'
      )}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  );
}
