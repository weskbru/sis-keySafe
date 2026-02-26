export interface KeyReportItem {
  id: string;
  name: string;
  detail: string;
  type: 'MORADOR' | 'PRESTADOR' | 'VISITANTE';
  keyName: string;
  status: 'Devolvida' | 'Emprestada' | 'Vencida';
  withdrawalDate: string;
  returnDate: string;
}

export const MOCK_KEY_REPORTS: KeyReportItem[] = [
  {
    id: '1',
    name: 'Ricardo Oliveira',
    detail: 'Apto 402, Bloco B',
    type: 'MORADOR',
    keyName: 'Sala de Jogos',
    status: 'Devolvida',
    withdrawalDate: '12/10/2023 14:30',
    returnDate: '12/10/2023 16:45',
  },
  {
    id: '2',
    name: 'João Paulo Silva',
    detail: 'TechFix Reformas',
    type: 'PRESTADOR',
    keyName: 'Cobertura',
    status: 'Emprestada',
    withdrawalDate: '15/10/2023 08:00',
    returnDate: '15/10/2023 18:00',
  },
  {
    id: '3',
    name: 'Maria Clara Souza',
    detail: 'Apto 101, Bloco A',
    type: 'MORADOR',
    keyName: 'Salão de Festas',
    status: 'Vencida',
    withdrawalDate: '14/10/2023 10:00',
    returnDate: '14/10/2023 22:00',
  },
  {
    id: '4',
    name: 'Pedro Henrique',
    detail: 'Visitante',
    type: 'VISITANTE',
    keyName: 'Quadra Esportiva',
    status: 'Devolvida',
    withdrawalDate: '15/10/2023 15:00',
    returnDate: '15/10/2023 17:00',
  },
];
