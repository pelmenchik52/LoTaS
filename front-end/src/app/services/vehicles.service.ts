import { api } from "./api";
import type { Vehicle, Trailer } from "../types";

export const vehiclesService = {
  getAll: () => api.get<Vehicle[]>("/vehicles"),
  create: (data: Omit<Vehicle, "id">) => api.post<Vehicle>("/vehicles", data),
  update: (id: string, data: Partial<Vehicle>) => api.put<Vehicle>(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete<void>(`/vehicles/${id}`),
};

export const trailersService = {
  getAll: () => api.get<Trailer[]>("/trailers"),
  create: (data: Omit<Trailer, "id">) => api.post<Trailer>("/trailers", data),
  update: (id: string, data: Partial<Trailer>) => api.put<Trailer>(`/trailers/${id}`, data),
  delete: (id: string) => api.delete<void>(`/trailers/${id}`),
};