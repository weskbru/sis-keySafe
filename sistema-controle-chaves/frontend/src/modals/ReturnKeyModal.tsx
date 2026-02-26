import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { KeyData } from '../data/mock';

interface ReturnKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observations: string) => void;
  keyData: KeyData;
}

export function ReturnKeyModal({ isOpen, onClose, onConfirm, keyData }: ReturnKeyModalProps) {
  if (!isOpen) return null;

  const [observations, setObservations] = useState('');

  // Default values if data is missing
  const holderName = keyData.holder?.name || 'Desconhecido';
  const borrowedAt = keyData.borrowedAt || 'Data não registrada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Devolver Chave</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Name */}
          <h3 className="text-lg font-medium text-blue-600">{keyData.name} - {keyData.location}</h3>

          {/* Summary Card */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              <Info size={14} />
              Resumo da Retirada
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Portador</p>
                <p className="text-sm font-bold text-gray-900">{holderName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Data de Retirada</p>
                <p className="text-sm font-bold text-gray-900">{borrowedAt}</p>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Observações da devolução</label>
            <textarea 
              className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm transition-all placeholder:text-gray-400"
              placeholder="Informações adicionais relevantes..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button 
            onClick={() => onConfirm(observations)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Salvar Devolução
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
