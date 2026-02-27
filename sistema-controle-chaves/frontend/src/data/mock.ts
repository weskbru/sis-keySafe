export type KeyStatus = 'available' | 'borrowed' | 'overdue';

export interface KeyData {
  id: string;
  name: string;
  location: string;
  category: string;
  status: KeyStatus;
  lastUsed?: string;
  holder?: {
    name: string;
    role: string;
    avatar: string;
    time?: string;
  };
  description?: string;
  allowedProfiles?: string[];
  observations?: string;
  borrowedAt?: string;
}

export const MOCK_KEYS: KeyData[] = [
  {
    id: '01',
    name: 'Chave 01',
    location: 'Apto 101',
    category: 'Social / Serviço',
    status: 'available',
    lastUsed: 'Ontem',
  },
  {
    id: '08',
    name: 'Chave 08',
    location: 'Salão de Festas',
    category: 'Área Comum',
    status: 'borrowed',
    holder: {
      name: 'Ricardo M.',
      role: 'Morador',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
      time: 'Há 2h',
    },
    description: 'Chave mestra para acesso ao Salão de Festas Principal e Cozinha Gourmet.',
    allowedProfiles: ['Morador', 'Administração'],
    borrowedAt: 'Hoje, 14:30',
    observations: '"Reserva para aniversário do filho. Devolução prevista para 22h."',
  },
  {
    id: '12',
    name: 'Chave 12',
    location: 'Academia',
    category: 'Social / Lazer',
    status: 'overdue',
    holder: {
      name: 'Ana Clara',
      role: 'Visitante',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      time: '45m',
    },
  },
  {
    id: '02',
    name: 'Chave 02',
    location: 'Apto 102',
    category: 'Social',
    status: 'available',
  },
  {
    id: '05',
    name: 'Chave 05',
    location: 'Almoxarifado',
    category: 'Administrativo',
    status: 'available',
  },
  {
    id: '22',
    name: 'Chave 22',
    location: 'Terraço',
    category: 'Manutenção',
    status: 'borrowed',
    holder: {
      name: 'Carlos Lima',
      role: 'Zelador',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
    },
  },
  {
    id: '03',
    name: 'Chave 03',
    location: 'Apto 103',
    category: 'Serviço',
    status: 'available',
  },
  {
    id: '15',
    name: 'Chave 15',
    location: 'Lavanderia',
    category: 'Área Comum',
    status: 'available',
  },
];

export interface PersonData {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  role: 'Servidor' | 'Prestador' | 'Visitante';
  document: string;
  contact: string;
  area?: string;
  observations?: string;
}

export const MOCK_PEOPLE: PersonData[] = [
  {
    id: '1',
    name: 'João Silva de Souza',
    email: 'joao.silva@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
    role: 'Servidor',
    document: '123.456.789-00',
    contact: '(11) 98765-4321',
  },
  {
    id: '2',
    name: 'Maria Oliveira Santos',
    email: 'maria.oliveira@prestadora.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
    role: 'Prestador',
    document: '234.567.890-11',
    contact: '(11) 97654-3210',
  },
  {
    id: '3',
    name: 'Ricardo Ferreira',
    email: 'ricardo.f@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
    role: 'Visitante',
    document: '345.678.901-22',
    contact: '(11) 96543-2109',
  },
  {
    id: '4',
    name: 'Ana Beatriz Costa',
    email: 'ana.costa@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
    role: 'Servidor',
    document: '456.789.012-33',
    contact: '(11) 95432-1098',
  },
  {
    id: '5',
    name: 'Felipe Mendes',
    email: 'felipe.limpeza@servicos.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
    role: 'Prestador',
    document: '567.890.123-44',
    contact: '(11) 94321-0987',
  },
  {
    id: '6',
    name: 'Juliana Rocha',
    email: 'juliana.rocha@email.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces',
    role: 'Visitante',
    document: '678.901.234-55',
    contact: '(11) 93210-9876',
  },
];
