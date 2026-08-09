import type { PaymentMethod, SalePaymentStatus } from "./sale";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Outstanding balance owed, present on list responses.
  balance?: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
}

export interface CustomerFilters {
  search?: string;
}

export interface AccountUnpaidSale {
  id: string;
  reference: string;
  date: string;
  grandTotal: string;
  amountPaid: string;
  paymentStatus: SalePaymentStatus;
  remaining: number;
}

export interface PaymentAllocation {
  id: string;
  saleId: string;
  amount: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  amount: string;
  method: PaymentMethod;
  receivedAt: string;
  note: string | null;
  recordedBy: { id: string; name: string };
  allocations: PaymentAllocation[];
}

export interface CustomerAccount {
  customer: Customer;
  balance: number;
  totalSpent: number;
  unpaidSales: AccountUnpaidSale[];
  payments: CustomerPayment[];
}

export interface RecordPaymentInput {
  amount: number;
  method?: PaymentMethod;
  note?: string;
  allocations?: { saleId: string; amount: number }[];
}
