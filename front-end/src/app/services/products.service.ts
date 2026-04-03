import { api } from "./api";
import type { Product, WarehouseStock } from "../types";

export const productsService = {
  getAll: () => api.get<Product[]>("/products"),
  create: (data: Omit<Product, "id">) => api.post<Product>("/products", data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
};

export const stockService = {
  getByWarehouse: (warehouseId: string) =>
    api.get<WarehouseStock[]>(`/warehouses/${warehouseId}/stock`),
  receive: (warehouseId: string, productId: string, quantity: number) =>
    api.post(`/warehouses/${warehouseId}/receive`, { productId, quantity }),
  ship: (warehouseId: string, productId: string, quantity: number) =>
    api.post(`/warehouses/${warehouseId}/ship`, { productId, quantity }),
};