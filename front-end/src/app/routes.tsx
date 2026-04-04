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
      { path: "admin/users", Component: AdminUsersPage },
      { path: "admin/network", Component: AdminNetworkPage },
      { path: "admin/audit", Component: AdminAuditPage },
      { path: "admin/inventory", Component: AdminInventoryPage },
      
      // Менеджер
      { path: "manager/routes", Component: ManagerRoutesPage },
      { path: "manager/costs", Component: ManagerCostsPage },
      { path: "manager/monitoring", Component: ManagerMonitoringPage },
      
      // Комірник
      { path: "warehouse/select", Component: WarehouseSelectPage },
      { path: "warehouse/stock", Component: WarehouseStockPage },
      { path: "warehouse/receiving", Component: WarehouseReceivingPage },
      { path: "warehouse/shipping", Component: WarehouseShippingPage },
      { path: "warehouse/audit", Component: WarehouseAuditPage },
      { path: "warehouse/requests", Component: WarehouseRequestsPage },
      
      // Бухгалтер
      { path: "accountant/reports", Component: AccountantReportsPage },
      { path: "accountant/costs", Component: AccountantCostsPage },
      { path: "accountant/discrepancies", Component: AccountantDiscrepanciesPage },
      { path: "accountant/archive", Component: AccountantArchivePage },
    ],
  },
]);