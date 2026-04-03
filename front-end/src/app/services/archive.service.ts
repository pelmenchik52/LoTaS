import { api } from "./api";
import type { TransactionArchive } from "../types";

export const archiveService = {
  getAll: (params?: { warehouseId?: string; type?: "receiving" | "shipping"; from?: string; to?: string }) =>
    api.get<TransactionArchive[]>(
      "/archive?" + new URLSearchParams(params as Record<string, string>).toString()
    ),
};