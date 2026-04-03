import { api } from "./api";
import type { Route } from "../types";

export const routesService = {
  getAll: () => api.get<Route[]>("/routes"),
  getById: (id: string) => api.get<Route>(`/routes/${id}`),
  create: (data: Omit<Route, "id">) => api.post<Route>("/routes", data),
  update: (id: string, data: Partial<Route>) => api.put<Route>(`/routes/${id}`, data),
  delete: (id: string) => api.delete<void>(`/routes/${id}`),
};