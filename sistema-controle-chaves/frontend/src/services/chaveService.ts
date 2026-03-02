import api from './api';

export interface ApiChave {
  id: number;
  codigo: string;
  descricao: string;
  localizacao: string;
  status: 'DISPONIVEL' | 'EMPRESTADA' | 'MANUTENCAO';
  status_calculado: 'DISPONIVEL' | 'EMPRESTADA' | 'MANUTENCAO' | 'VENCIDO';
  permitir_servidor: boolean;
  permitir_prestador: boolean;
  ativo: boolean;
}

export const chaveService = {
  list: () => api.get<ApiChave[]>('/api/chaves/'),

  create: (data: {
    codigo: string;
    localizacao: string;
    descricao?: string;
    permitir_servidor: boolean;
    permitir_prestador: boolean;
  }) => api.post<ApiChave>('/api/chaves/', data),

  update: (
    id: number,
    data: Partial<{
      codigo: string;
      localizacao: string;
      descricao: string;
      permitir_servidor: boolean;
      permitir_prestador: boolean;
    }>
  ) => api.patch<ApiChave>(`/api/chaves/${id}/`, data),

  destroy: (id: number) => api.delete(`/api/chaves/${id}/`),
};
