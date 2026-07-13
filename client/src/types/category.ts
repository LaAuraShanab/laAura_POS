export interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  nameAr?: string;
}
