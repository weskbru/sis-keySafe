import React, { useState } from 'react';
import { X, ShieldCheck, Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ApiAdminUser, AdminUserPayload } from '../services/adminUserService';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AdminUserPayload) => void;
  initialData?: ApiAdminUser | null;
}

type UserType = 'admin' | 'superadmin';

export function AdminUserModal({ isOpen, onClose, onConfirm, initialData }: AdminUserModalProps) {
  if (!isOpen) return null;

  const isEdit = !!initialData;

  const [username, setUsername] = useState(initialData?.username || '');
  const [firstName, setFirstName] = useState(initialData?.first_name || '');
  const [lastName, setLastName] = useState(initialData?.last_name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>(
    initialData?.is_superuser ? 'superadmin' : 'admin'
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = () => {
    if (!username.trim() || !email.trim()) {
      alert('Preencha usuário e e-mail.');
      return;
    }
    if (!isEdit && !password.trim()) {
      alert('A senha é obrigatória ao criar um administrador.');
      return;
    }

    const payload: AdminUserPayload = {
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      is_superuser: userType === 'superadmin',
    };

    if (!isEdit) {
      payload.username = username.trim();
    }

    if (password.trim()) {
      payload.password = password.trim();
    }

    if (isEdit) {
      payload.is_active = isActive;
    }

    onConfirm(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Administrador' : 'Novo Administrador'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Usuário <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: joao.silva"
              className={cn(
                'w-full px-4 py-3 rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm',
                isEdit
                  ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                  : 'border-gray-200'
              )}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-gray-400">O nome de usuário não pode ser alterado.</p>
            )}
          </div>

          {/* Nome + Sobrenome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                placeholder="Ex: João"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Sobrenome</label>
              <input
                type="text"
                placeholder="Ex: Silva"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Ex: joao@aeb.gov.br"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Senha {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && <span className="text-gray-400 font-normal"> — deixe em branco para não alterar</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isEdit ? '••••••••' : 'Mínimo 8 caracteres'}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Acesso</label>
            <div className="grid grid-cols-2 gap-3">
              <TypeOption
                selected={userType === 'admin'}
                onClick={() => setUserType('admin')}
                icon={<Shield size={22} />}
                label="Administrador"
                description="Acesso padrão ao sistema"
              />
              <TypeOption
                selected={userType === 'superadmin'}
                onClick={() => setUserType('superadmin')}
                icon={<ShieldCheck size={22} />}
                label="Superusuário"
                description="Gerencia outros admins"
              />
            </div>
          </div>

          {/* Ativo (apenas edição) */}
          {isEdit && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Conta ativa</p>
                <p className="text-xs text-gray-500">Desativar bloqueia o acesso ao sistema</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  isActive ? 'bg-blue-600' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    isActive ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            {isEdit ? 'Salvar Alterações' : 'Criar Administrador'}
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeOption({
  selected, onClick, icon, label, description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left gap-1',
        selected
          ? 'border-blue-600 bg-blue-50/50'
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="w-4 h-4 rounded-full border-[3px] border-blue-600" />
        </div>
      )}
      <div className={cn('mb-1', selected ? 'text-blue-600' : 'text-gray-400')}>{icon}</div>
      <span className={cn('text-sm font-bold', selected ? 'text-gray-900' : 'text-gray-700')}>
        {label}
      </span>
      <span className="text-[10px] text-gray-400">{description}</span>
    </button>
  );
}
