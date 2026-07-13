import { axiosClient, unwrap } from "./axiosClient";
import type { Customer, CustomerFilters, CustomerInput } from "../types/customer";

export const customersApi = {
  list: (filters: CustomerFilters = {}) =>
    unwrap<Customer[]>(axiosClient.get("/customers", { params: filters })),
  create: (input: CustomerInput) => unwrap<Customer>(axiosClient.post("/customers", input)),
  update: (id: string, input: Partial<CustomerInput>) =>
    unwrap<Customer>(axiosClient.put(`/customers/${id}`, input)),
  deactivate: (id: string) => unwrap<Customer>(axiosClient.delete(`/customers/${id}`)),
};
