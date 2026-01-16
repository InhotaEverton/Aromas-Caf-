export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin?: string; // Simplified password simulation
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  active: boolean;
  // imageUrl removed
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  cpf?: string;
}

export enum PaymentMethodType {
  CASH = 'DINHEIRO',
  PIX = 'PIX',
  CREDIT = 'CRÉDITO',
  DEBIT = 'DÉBITO'
}

export interface Payment {
  method: PaymentMethodType;
  amount: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  payments: Payment[];
  change: number; // Troco
  customerId?: string;
  operatorId: string;
}

export interface CashRegisterSession {
  id: string;
  openedAt: number;
  closedAt?: number;
  openingBalance: number;
  closingBalance?: number;
  operatorId: string;
  status: 'OPEN' | 'CLOSED';
  sales: Sale[];
  expectedBalance?: number;
  difference?: number;
  observations?: string;
}

export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  byMethod: Record<PaymentMethodType, number>;
  topProducts: { name: string; quantity: number }[];
}
