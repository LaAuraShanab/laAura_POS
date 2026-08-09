import { axiosClient, unwrap } from "./axiosClient";
import type {
  Customer,
  CustomerAccount,
  CustomerFilters,
  CustomerInput,
  CustomerPayment,
  RecordPaymentInput,
} from "../types/customer";

export const customersApi = {
  list: (filters: CustomerFilters = {}) =>
    unwrap<Customer[]>(axiosClient.get("/customers", { params: filters })),
  create: (input: CustomerInput) => unwrap<Customer>(axiosClient.post("/customers", input)),
  update: (id: string, input: Partial<CustomerInput>) =>
    unwrap<Customer>(axiosClient.put(`/customers/${id}`, input)),
  deactivate: (id: string) => unwrap<Customer>(axiosClient.delete(`/customers/${id}`)),
  getAccount: (id: string) => unwrap<CustomerAccount>(axiosClient.get(`/customers/${id}/account`)),
  recordPayment: (id: string, input: RecordPaymentInput) =>
    unwrap<CustomerPayment>(axiosClient.post(`/customers/${id}/payments`, input)),
};
