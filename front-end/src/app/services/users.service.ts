import { api } from "./api";
import type { User } from "../types";

export const usersService = {
  getAll: () => api.get<User[]>("/users"),
  create: (data: Omit<User, "id">) => api.post<User>("/users", data),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete<void>(`/users/${id}`),
};