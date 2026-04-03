import { api } from "./api";
import type { DeliveryRequest } from "../types";

export const requestsService = {
  getAll: () => api.get<DeliveryRequest[]>("/requests"),
  getByWarehouse: (warehouseId: string) =>
    api.get<DeliveryRequest[]>(`/warehouses/${warehouseId}/requests`),
  create: (data: Omit<DeliveryRequest, "id" | "createdAt">) =>
    api.post<DeliveryRequest>("/requests", data),
  approve: (id: string) => api.put(`/requests/${id}/approve`, {}),
  reject: (id: string) => api.put(`/requests/${id}/reject`, {}),
};