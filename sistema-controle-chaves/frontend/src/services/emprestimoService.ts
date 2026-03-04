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

function formatDateBR(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const normalized = /[Zz]|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return undefined;
  // Converte UTC → America/Sao_Paulo (UTC-3, sem horário de verão desde 2019)
  const sp = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return sp.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC',
  });
}

export function toKeyData(
  chave: ApiChave,
  emprestimosAtivos: ApiEmprestimo[],
  todosEmprestimos: ApiEmprestimo[] = emprestimosAtivos
) {
  const emp = emprestimosAtivos.find((e) => e.chave.id === chave.id);

  const lastLoan = todosEmprestimos
    .filter((e) => e.chave.id === chave.id && e.data_devolucao)
    .sort((a, b) => new Date(b.data_devolucao!).getTime() - new Date(a.data_devolucao!).getTime())[0];

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
          contact: undefined,
          area: emp.pessoa.setor_nome || undefined,
          cpf: emp.pessoa.cpf_display,
        }
      : undefined,
    lastUserName: lastLoan ? lastLoan.pessoa.nome_completo : undefined,
    withdrawnAt: emp ? formatDateBR(emp.data_retirada) : undefined,
    borrowedAt: emp ? formatDateBR(emp.data_prevista_devolucao) : undefined,
    emprestimoId: emp ? String(emp.id) : undefined,
  };
}
