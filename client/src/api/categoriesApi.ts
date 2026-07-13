import { axiosClient, unwrap } from "./axiosClient";
import type { Category, CategoryInput } from "../types/category";

export const categoriesApi = {
  list: () => unwrap<Category[]>(axiosClient.get("/categories")),
  create: (input: CategoryInput) => unwrap<Category>(axiosClient.post("/categories", input)),
  update: (id: string, input: CategoryInput) => unwrap<Category>(axiosClient.put(`/categories/${id}`, input)),
  remove: (id: string) => unwrap<{ deleted: boolean }>(axiosClient.delete(`/categories/${id}`)),
};
