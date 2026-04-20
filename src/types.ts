import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  revenueGoal?: number;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  date: Timestamp;
  status: 'pending' | 'concluido' | 'cancelado';
  price: number;
  createdAt: Timestamp;
}

export interface FinancialEntry {
  id: string;
  type: 'entrada' | 'saida';
  category: string;
  description?: string;
  amount: number;
  date: Timestamp;
  referenceId?: string;
}
