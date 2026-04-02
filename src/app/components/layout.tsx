import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { 
  Menu, 
  Crown, 
  Briefcase, 
  Package, 
  Calculator,
  LogOut,
  Users,
  Network,
  FileText,
  Route,
  TrendingUp,
  Monitor,
  Warehouse,
  Box,
  TruckIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  BarChart3,
  DollarSign,
  AlertCircle,
  PackageSearch,
  Archive
} from "lucide-react";

type UserRole = "admin" | "manager" | "warehouse" | "accountant";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  // Адміністратор
  { icon: Users, label: "Користувачі та Права", path: "/admin/users", roles: ["admin"] },
  { icon: Network, label: "Структура мережі", path: "/admin/network", roles: ["admin"] },
  { icon: PackageSearch, label: "Управління складом", path: "/admin/inventory", roles: ["admin"] },
  { icon: FileText, label: "Аудит системи", path: "/admin/audit", roles: ["admin"] },
  
  // Менеджер
  { icon: Route, label: "Планування маршрутів", path: "/manager/routes", roles: ["manager"] },
  { icon: Calculator, label: "Калькулятор витрат", path: "/manager/costs", roles: ["manager"] },
  { icon: Monitor, label: "Моніторинг виконання", path: "/manager/monitoring", roles: ["manager"] },
  
  // Комірник
  { icon: Warehouse, label: "Вибір складу", path: "/warehouse/select", roles: ["warehouse"] },
  { icon: Box, label: "Складські залишки", path: "/warehouse/stock", roles: ["warehouse"] },
  { icon: ArrowDownToLine, label: "Прийом товарів", path: "/warehouse/receiving", roles: ["warehouse"] },
  { icon: ArrowUpFromLine, label: "Відвантаження", path: "/warehouse/shipping", roles: ["warehouse"] },
  { icon: TruckIcon, label: "Запити доставки", path: "/warehouse/requests", roles: ["warehouse"] },
  { icon: ClipboardCheck, label: "Ревізія", path: "/warehouse/audit", roles: ["warehouse"] },
  
  // Бухгалтер
  { icon: BarChart3, label: "Звітність по доставках", path: "/accountant/reports", roles: ["accountant"] },
  { icon: DollarSign, label: "Аналіз витрат", path: "/accountant/costs", roles: ["accountant"] },
  { icon: AlertCircle, label: "Акти розбіжностей", path: "/accountant/discrepancies", roles: ["accountant"] },
  { icon: Archive, label: "Архів операцій", path: "/accountant/archive", roles: ["accountant"] },
];

const roleInfo = {
  admin: { icon: Crown, label: "Адміністратор", color: "text-purple-600" },
  manager: { icon: Briefcase, label: "Менеджер", color: "text-blue-600" },
  warehouse: { icon: Package, label: "Комірник", color: "text-green-600" },
  accountant: { icon: Calculator, label: "Бухгалтер", color: "text-orange-600" },
};

export default function Layout() {
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Перевірка авторизації
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as UserRole;
    if (!storedRole) {
      navigate("/login");
    } else {
      setUserRole(storedRole);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));
  
  const RoleIcon = roleInfo[userRole].icon;

  const MenuContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <RoleIcon className={`h-8 w-8 ${roleInfo[userRole].color}`} />
          <div>
            <h2 className="font-semibold">{roleInfo[userRole].label}</h2>
            <p className="text-sm text-muted-foreground">Система управління</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => mobile && setIsOpen(false)}
            >
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3 p-2">
          <Avatar>
            <AvatarFallback className={roleInfo[userRole].color}>
              <RoleIcon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Користувач</p>
            <p className="text-xs text-muted-foreground truncate">user@company.com</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Вийти
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Підтвердження виходу</AlertDialogTitle>
              <AlertDialogDescription>
                Ви впевнені, що хочете вийти з облікового запису?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Вийти</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card">
        <MenuContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RoleIcon className={`h-6 w-6 ${roleInfo[userRole].color}`} />
            <h1 className="font-semibold">{roleInfo[userRole].label}</h1>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <MenuContent mobile />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}