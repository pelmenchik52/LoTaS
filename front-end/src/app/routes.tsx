import { createBrowserRouter } from "react-router";
import Layout from "./components/layout";
import LoginPage from "./pages/login";

// Адміністратор
import AdminUsersPage from "./pages/admin/users";
import AdminNetworkPage from "./pages/admin/network";
import AdminAuditPage from "./pages/admin/audit";
import AdminInventoryPage from "./pages/admin/inventory";

// Менеджер
import ManagerRoutesPage from "./pages/manager/routes";
import ManagerCostsPage from "./pages/manager/costs";
import ManagerMonitoringPage from "./pages/manager/monitoring";

// Комірник
import WarehouseSelectPage from "./pages/warehouse/select";
import WarehouseStockPage from "./pages/warehouse/stock";
import WarehouseReceivingPage from "./pages/warehouse/receiving";
import WarehouseShippingPage from "./pages/warehouse/shipping";
import WarehouseAuditPage from "./pages/warehouse/audit";
import WarehouseRequestsPage from "./pages/warehouse/requests";

// Бухгалтер
import AccountantReportsPage from "./pages/accountant/reports";
import AccountantCostsPage from "./pages/accountant/costs";
import AccountantDiscrepanciesPage from "./pages/accountant/discrepancies";
import AccountantArchivePage from "./pages/accountant/archive";

import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      // Адміністратор
      {
        path: "admin/users",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      
      // Менеджер
      {
        path: "manager/routes",
        element: (
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerRoutesPage />
          </ProtectedRoute>
        ),
      },
      
      // Комірник
      {
        path: "wharehouse/stock",
        element: (
          <ProtectedRoute allowedRoles={["warehouse"]}>
            <WarehouseStockPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "accountant/reports",
        element: (
          <ProtectedRoute allowedRoles={["accountant"]}>
            <AccountantReportsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);