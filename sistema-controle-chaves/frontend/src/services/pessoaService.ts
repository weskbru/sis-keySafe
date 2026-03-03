import api from './api';

export interface ApiPessoa {
  id: number;
  nome_completo: string;
  cpf_display: string;
  tipo_vinculo: 'SERVIDOR' | 'PRESTADOR';
  setor: number | null;
  setor_nome: string | null;
  foto: string | null;
  telefone: string;
  observacao: string;
  ativo: boolean;
}

export const pessoaService = {
  list: () => api.get<ApiPessoa[]>('/api/pessoas/'),

  create: (data: FormData) =>
    api.post<ApiPessoa>('/api/pessoas/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    api.patch<ApiPessoa>(`/api/pessoas/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  destroy: (id: number) => api.delete(`/api/pessoas/${id}/`),
};

export function toPessoaData(p: ApiPessoa) {
  return {
    id: String(p.id),
    name: p.nome_completo,
    avatar:
      p.foto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome_completo)}&background=4f46e5&color=ffffff&size=80`,
    role: (p.tipo_vinculo === 'SERVIDOR' ? 'Servidor' : 'Prestador') as
      | 'Servidor'
      | 'Prestador',
    document: p.cpf_display,
    contact: p.telefone,
    area: p.setor_nome || undefined,
    observations: p.observacao || undefined,
    setorId: p.setor ?? undefined,
  };
}
