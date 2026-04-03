import { api } from "./api";
import type { Driver } from "../types";

export const driversService = {
  getAll: () => api.get<Driver[]>("/drivers"),
  create: (data: Omit<Driver, "id">) => api.post<Driver>("/drivers", data),
  update: (id: string, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data),
  delete: (id: string) => api.delete<void>(`/drivers/${id}`),
};