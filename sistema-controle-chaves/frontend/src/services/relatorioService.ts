import api from './api';
import type { ApiEmprestimo } from './emprestimoService';

export interface KeyReportItem {
  id: string;
  name: string;
  role: 'Servidor' | 'Prestador';
  contact: string;
  area: string;
  keyName: string;
  status: 'Devolvida' | 'Emprestada' | 'Vencida';
  withdrawalDate: string;
  returnDate: string;
}

export interface RelatorioParams {
  historico?: boolean;
  data_from?: string;
  data_to?: string;
  nome?: string;
  chave?: string;
  tipo_vinculo?: string;
}

function formatIsoToPtBr(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toReportItem(emp: ApiEmprestimo): KeyReportItem {
  const status: KeyReportItem['status'] = emp.data_devolucao
    ? 'Devolvida'
    : emp.vencido
    ? 'Vencida'
    : 'Emprestada';

  return {
    id: String(emp.id),
    name: emp.pessoa.nome_completo,
    role: emp.pessoa.tipo_vinculo === 'SERVIDOR' ? 'Servidor' : 'Prestador',
    contact: '',
    area: emp.pessoa.setor_nome || '—',
    keyName: emp.chave.codigo,
    status,
    withdrawalDate: formatIsoToPtBr(emp.data_retirada),
    returnDate: formatIsoToPtBr(emp.data_devolucao),
  };
}

export async function fetchHistorico(params: RelatorioParams = {}): Promise<KeyReportItem[]> {
  const query = new URLSearchParams();
  if (params.historico !== false) query.set('historico', 'true');
  if (params.data_from) query.set('data_from', params.data_from);
  if (params.data_to) query.set('data_to', params.data_to);
  if (params.nome) query.set('nome', params.nome);
  if (params.chave) query.set('chave', params.chave);
  if (params.tipo_vinculo) query.set('tipo_vinculo', params.tipo_vinculo);

  const res = await api.get<ApiEmprestimo[]>(`/api/emprestimos/?${query.toString()}`);
  return res.data.map(toReportItem);
}
