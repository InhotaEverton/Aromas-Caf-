import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Tradicional',
    category: 'Cafés em Grão',
    price: 25.00,
    description: 'Torra Escura. Café clássico e equilibrado.',
    active: true
  },
  {
    id: '2',
    name: 'Gourmet',
    category: 'Cafés em Grão',
    price: 32.00,
    description: 'Torra Média. Notas frutadas e acidez equilibrada.',
    active: true
  },
  {
    id: '3',
    name: 'Superior',
    category: 'Cafés em Grão',
    price: 38.00,
    description: 'Sabor marcante e aroma intenso.',
    active: true
  },
  {
    id: '4',
    name: 'Especial 84 Pontos',
    category: 'Especiais',
    price: 45.00,
    description: 'Notas complexas e finalização suave.',
    active: true
  },
  {
    id: '5',
    name: 'Especial 87 Pontos',
    category: 'Especiais',
    price: 52.00,
    description: 'Experiência sensorial única com notas florais.',
    active: true
  },
  {
    id: '6',
    name: 'Especial 90 Pontos',
    category: 'Especiais',
    price: 65.00,
    description: 'Perfil aromático intenso e notas exóticas.',
    active: true
  },
  {
    id: '7',
    name: 'Especial 93 Pontos',
    category: 'Especiais',
    price: 80.00,
    description: 'Café raro com características excepcionais.',
    active: true
  },
  {
    id: '8',
    name: 'Drip Coffee',
    category: 'Práticos',
    price: 4.50,
    description: 'Café em sachê para preparo prático.',
    active: true
  },
];

export const CATEGORIES = ['Todos', 'Cafés em Grão', 'Especiais', 'Práticos'];