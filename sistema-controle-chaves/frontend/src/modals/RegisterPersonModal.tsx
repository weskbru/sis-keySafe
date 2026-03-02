import React, { useState, useRef } from 'react';
import { X, GraduationCap, UserCog, CheckCircle2, Camera, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { PersonData } from '../data/mock';
import type { ApiSetor } from '../services/setorService';

interface RegisterPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData?: PersonData | null;
  setores: ApiSetor[];
}

type Role = 'Servidor' | 'Prestador';

export function RegisterPersonModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  setores,
}: RegisterPersonModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(initialData?.name || '');
  const [role, setRole] = useState<Role>(initialData?.role || 'Servidor');
  const [document, setDocument] = useState(initialData?.document || '');
  const [phone, setPhone] = useState(initialData?.contact || '');
  const [areaQuery, setAreaQuery] = useState(initialData?.area || '');
  const [selectedSetorId, setSelectedSetorId] = useState<number | null>(
    initialData?.setorId ?? null
  );
  const [showAreaList, setShowAreaList] = useState(false);
  const [observations, setObservations] = useState(initialData?.observations || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSetores = setores
    .filter((s) => s.nome.toLowerCase().includes(areaQuery.toLowerCase()))
    .slice(0, 5);

  const toTitleCase = (value: string) =>
    value.replace(/\b\w/g, (c) => c.toUpperCase());

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const parts = digits.match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
    if (!parts) return digits;
    const [, p1, p2, p3, p4] = parts;
    return [p1, p2 ? `.${p2}` : '', p3 ? `.${p3}` : '', p4 ? `-${p4}` : ''].join('');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const parts = digits.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    if (!parts) return digits;
    const [, p1, p2, p3] = parts;
    return [p1 ? `(${p1}) ` : '', p2, p3 ? `-${p3}` : ''].join('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSetor = (setor: ApiSetor) => {
    setAreaQuery(setor.nome);
    setSelectedSetorId(setor.id);
    setShowAreaList(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !document.trim() || !phone.trim()) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    onConfirm({
      id: initialData?.id,
      name,
      role,
      document,
      phone,
      area: areaQuery || undefined,
      setorId: selectedSetorId,
      observations,
      avatarFile,
      avatar:
        avatarPreview ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=ffffff&size=80`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Editar Pessoa Autorizada' : 'Cadastrar Pessoa Autorizada'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Foto de Perfil</label>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative group">
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={24} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    <User size={40} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-colors border border-blue-200 font-medium"
                >
                  <Camera size={18} />
                  {avatarPreview ? 'Alterar Foto' : 'Selecionar Foto'}
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF (máximo 5MB)</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              type="text"
              placeholder="Ex: Maria José da Silva"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
              value={name}
              onChange={(e) => setName(toTitleCase(e.target.value))}
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Perfil</label>
            <div className="grid grid-cols-2 gap-4">
              <RoleOption
                selected={role === 'Servidor'}
                onClick={() => setRole('Servidor')}
                icon={<GraduationCap size={24} />}
                label="SERVIDOR"
              />
              <RoleOption
                selected={role === 'Prestador'}
                onClick={() => setRole('Prestador')}
                icon={<UserCog size={24} />}
                label="PRESTADOR"
              />
            </div>
          </div>

          {/* Area/Setor */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-sm font-medium text-gray-700">
              Área/Setor
              {role === 'Servidor' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Digite para buscar o setor..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                value={areaQuery}
                onChange={(e) => {
                  setAreaQuery(e.target.value);
                  setSelectedSetorId(null);
                  setShowAreaList(true);
                }}
                onFocus={() => setShowAreaList(true)}
              />
              {showAreaList && areaQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {filteredSetores.length > 0 ? (
                    filteredSetores.map((setor) => (
                      <button
                        key={setor.id}
                        type="button"
                        onClick={() => handleSelectSetor(setor)}
                        className="w-full px-4 py-2.5 hover:bg-blue-50 transition-colors text-left text-sm text-gray-700"
                      >
                        {setor.nome}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-sm text-gray-500">Nenhum resultado</div>
                  )}
                </div>
              )}
              {selectedSetorId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium pointer-events-none">
                  ✓ Selecionado
                </span>
              )}
            </div>
          </div>

          {/* Document and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                value={document}
                onChange={(e) => setDocument(formatCpf(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Telefone de Contato</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
              />
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Observações</label>
            <textarea
              className="w-full h-24 p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm transition-all placeholder:text-gray-400"
              placeholder="Informações adicionais relevantes (empresa, etc)..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            {initialData ? 'Salvar Alterações' : 'Salvar Cadastro'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-24 gap-2',
        selected
          ? 'border-blue-600 bg-blue-50/50 text-blue-700'
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-500'
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 text-blue-600">
          <CheckCircle2 size={16} fill="currentColor" className="text-white" />
        </div>
      )}
      <div className={cn('transition-colors', selected ? 'text-blue-600' : 'text-gray-400')}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}
