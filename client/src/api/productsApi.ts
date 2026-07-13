import { axiosClient, unwrap } from "./axiosClient";
import type { Product, ProductInput } from "../types/product";

export interface ProductFilters {
  search?: string;
  categoryId?: string;
}

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    unwrap<Product[]>(axiosClient.get("/products", { params: filters })),
  create: (input: ProductInput) => unwrap<Product>(axiosClient.post("/products", input)),
  update: (id: string, input: Partial<ProductInput>) =>
    unwrap<Product>(axiosClient.put(`/products/${id}`, input)),
  remove: (id: string) => unwrap<Product>(axiosClient.delete(`/products/${id}`)),
  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return unwrap<Product>(axiosClient.post(`/products/${id}/image`, formData));
  },
};
