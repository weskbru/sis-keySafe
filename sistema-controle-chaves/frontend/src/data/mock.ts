export type KeyStatus = 'available' | 'borrowed' | 'overdue';

export interface KeyData {
  id: string;
  name: string;
  location: string;
  category: string;
  status: KeyStatus;
  lastUsed?: string;
  holder?: {
    area: any | string;
    contact: any | string;
    name: string;
    role: string;
    avatar: string;
    time?: string;
  };
  lastUser?: {
    name: string;
    role: string;
    avatar: string;
    contact?: string;
    area?: string;
    returnedAt?: string;
  };
  description?: string;
  allowedProfiles?: string[];
  observations?: string;
  borrowedAt?: string;
  /** ID do empréstimo ativo — preenchido pela API quando status !== 'available' */
  emprestimoId?: string;
}

export const MOCK_KEYS: KeyData[] = [
  {
    id: '01',
    name: 'Chave 01',
    location: 'Bloco A',
    category: 'Geral',
    status: 'available',
    lastUsed: 'Ontem',
    lastUser: {
      name: 'João Silva de Souza',
      role: 'Servidor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
      contact: '(11) 98765-4321',
      area: 'ACI - Assessoria de Cooperacao Internacional',
      returnedAt: 'Hoje, 16:45',
    },
  },
  {
    id: '08',
    name: 'Chave 08',
    location: 'Bloco F',
    category: 'Geral',
    status: 'borrowed',
    holder: {
      name: 'Ricardo M.',
      role: 'Servidor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
      time: 'Há 2h',
      area: undefined,
      contact: undefined
    },
    description: 'Chave mestra para acesso ao Salão de Festas Principal e Cozinha Gourmet.',
    allowedProfiles: ['Servidor', 'Prestador'],
    borrowedAt: 'Hoje, 14:30',
    observations: '"Reserva para aniversário do filho. Devolução prevista para 22h."',
  },
  {
    id: '12',
    name: 'Chave 12',
    location: 'Bloco A',
    category: 'Geral',
    status: 'overdue',
    holder: {
      name: 'Ana Clara',
      role: 'Servidor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      time: '45m',
      area: undefined,
      contact: undefined
    },
  },
  {
    id: '02',
    name: 'Chave 02',
    location: 'Bloco A',
    category: 'Geral',
    status: 'available',
  },
  {
    id: '05',
    name: 'Chave 05',
    location: 'Bloco F',
    category: 'Geral',
    status: 'available',
    lastUser: {
      name: 'Ana Beatriz Costa',
      role: 'Servidor',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
      contact: '(11) 95432-1098',
      area: 'COF - Coordenacao de Orcamento e Financas',
      returnedAt: 'Ontem, 18:20',
    },
  },
  {
    id: '22',
    name: 'Chave 22',
    location: 'Bloco F',
    category: 'Geral',
    status: 'borrowed',
    holder: {
      name: 'Carlos Lima',
      role: 'Prestador',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
      area: undefined,
      contact: undefined
    },
  },
  {
    id: '03',
    name: 'Chave 03',
    location: 'Bloco A',
    category: 'Geral',
    status: 'available',
    lastUser: {
      name: 'Felipe Mendes',
      role: 'Prestador',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      contact: '(11) 94321-0987',
      returnedAt: '2 dias atrás, 14:15',
    },
  },
  {
    id: '15',
    name: 'Chave 15',
    location: 'Bloco F',
    category: 'Geral',
    status: 'available',
  },
];

export interface PersonData {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  role: 'Servidor' | 'Prestador';
  document: string;
  contact: string;
  area?: string;
  observations?: string;
  /** ID do setor no backend — preenchido quando dado vem da API */
  setorId?: number;
}

export const MOCK_PEOPLE: PersonData[] = [
  {
    id: '1',
    name: 'João Silva de Souza',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
    role: 'Servidor',
    document: '123.456.789-00',
    contact: '(11) 98765-4321',
    area: 'ACI - Assessoria de Cooperacao Internacional',
  },
  {
    id: '2',
    name: 'Maria Oliveira Santos',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
    role: 'Prestador',
    document: '234.567.890-11',
    contact: '(11) 97654-3210',
  },
  {
    id: '4',
    name: 'Ana Beatriz Costa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
    role: 'Servidor',
    document: '456.789.012-33',
    contact: '(11) 95432-1098',
    area: 'COF - Coordenacao de Orcamento e Financas',
  },
  {
    id: '5',
    name: 'Felipe Mendes',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
    role: 'Prestador',
    document: '567.890.123-44',
    contact: '(11) 94321-0987',
  },
];
