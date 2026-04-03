// src/app/services/auth.service.ts
import { api } from "./api";
import type { User, UserRole } from "../types";

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  // Логін
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>("/auth/login", { email, password });
    // Зберігаємо токен і дані користувача
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userId", data.user.id);
    return data;
  },

  // Реєстрація
  async register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    warehouses: string[];
  }): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>("/auth/register", payload);
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userId", data.user.id);
    return data;
  },

  // Вихід
  logout() {
    localStorage.clear();
    window.location.href = "/login";
  },
};