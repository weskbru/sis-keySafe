import api from './api';

export interface ApiSetor {
  id: number;
  nome: string;
  ativo: boolean;
}

export const setorService = {
  list: () => api.get<ApiSetor[]>('/api/setores/'),
};
