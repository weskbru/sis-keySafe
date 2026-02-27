import React, { useState } from 'react';
import { X, Key, Save, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { KeyData } from '../data/mock';

interface EditKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; location: string; allowedProfiles: string[]; description?: string }) => void;
  onDelete: () => void;
  keyData: KeyData;
}

export function EditKeyModal({ isOpen, onClose, onConfirm, onDelete, keyData }: EditKeyModalProps) {
  if (!isOpen) return null;

  const [keyName, setKeyName] = useState(keyData.name);
  const [location, setLocation] = useState(keyData.location);
  const [allowedProfiles, setAllowedProfiles] = useState<string[]>(keyData.allowedProfiles || []);
  const [description, setDescription] = useState(keyData.description || '');

  const toggleProfile = (profile: string) => {
    setAllowedProfiles(prev => 
      prev.includes(profile) 
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    );
  };

  const handleSubmit = () => {
    onConfirm({
      name: keyName,
      location,
      allowedProfiles,
      description
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Key size={20} />
            <h2 className="text-lg font-bold text-gray-900">Editar Chave</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Chave</label>
            <input 
              type="text" 
              placeholder="Ex: Sala de Reunião 01"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 text-sm"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Localização</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white cursor-pointer"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="Bloco A">Bloco A</option>
              <option value="Bloco F">Bloco F</option>
            </select>
          </div>

          {/* Allowed Profiles */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Perfis Permitidos</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={allowedProfiles.includes('Servidor')}
                  onChange={() => toggleProfile('Servidor')}
                />
                <span className="text-sm font-medium text-gray-700">Servidor</span>
              </label>
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={allowedProfiles.includes('Prestador')}
                  onChange={() => toggleProfile('Prestador')}
                />
                <span className="text-sm font-medium text-gray-700">Prestador de Serviço</span>
              </label>
            </div>
          </div>

          {/* Description/Observations */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observações</label>
            <textarea 
              className="w-full h-28 p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm transition-all placeholder:text-gray-400"
              placeholder="Adicione detalhes sobre a chave, localização ou restrições de uso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Delete Section */}
          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 font-medium"
            >
              <Trash2 size={18} />
              Excluir Chave
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-blue-200 active:scale-[0.98] flex items-center gap-2 text-sm"
          >
            <Save size={16} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
