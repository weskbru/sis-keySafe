import api from './api';
import type { ApiChave } from './chaveService';

export interface ApiEmprestimo {
  id: number;
  chave: {
    id: number;
    codigo: string;
    descricao: string;
    status: string;
    status_calculado: string;
  };
  pessoa: {
    id: number;
    nome_completo: string;
    cpf_display: string;
    tipo_vinculo: string;
    setor_nome: string | null;
  };
  data_retirada: string;
  data_prevista_devolucao: string | null;
  data_devolucao: string | null;
  observacao: string;
  vencido: boolean;
}

export const emprestimoService = {
  list: () => api.get<ApiEmprestimo[]>('/api/emprestimos/'),

  create: (data: {
    chave: number;
    pessoa: number;
    data_prevista_devolucao?: string;
    observacao?: string;
  }) => api.post<{ id: number }>('/api/emprestimos/', data),

  devolver: (
    id: number,
    data?: { data_devolucao?: string; observacao?: string }
  ) => api.patch(`/api/emprestimos/${id}/devolver/`, data ?? {}),
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

export function toKeyData(chave: ApiChave, emprestimosAtivos: ApiEmprestimo[]) {
  const emp = emprestimosAtivos.find((e) => e.chave.id === chave.id);

  const status: 'available' | 'borrowed' | 'overdue' =
    chave.status_calculado === 'VENCIDO'
      ? 'overdue'
      : chave.status_calculado === 'EMPRESTADA'
      ? 'borrowed'
      : 'available';

  return {
    id: String(chave.id),
    name: chave.codigo,
    location: chave.localizacao,
    category: 'Geral',
    status,
    description: chave.descricao || undefined,
    allowedProfiles: [
      ...(chave.permitir_servidor ? ['Servidor'] : []),
      ...(chave.permitir_prestador ? ['Prestador'] : []),
    ],
    holder: emp
      ? {
          name: emp.pessoa.nome_completo,
          role:
            emp.pessoa.tipo_vinculo === 'SERVIDOR' ? 'Servidor' : 'Prestador',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            emp.pessoa.nome_completo
          )}&background=4f46e5&color=ffffff&size=80`,
          time: formatRelativeTime(emp.data_retirada),
          contact: undefined,
          area: emp.pessoa.setor_nome || undefined,
          cpf: emp.pessoa.cpf_display,
        }
      : undefined,
    emprestimoId: emp ? String(emp.id) : undefined,
  };
}
