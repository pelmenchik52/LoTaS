import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import type { UserRole } from "../types";

import { authService } from "../services/auth.service";

const warehouses = ["Склад 1", "Склад 2", "Склад 3", "Склад 4", "Склад 5"];

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    const { user } = await authService.login(loginEmail, loginPassword);
    toast.success(`Вітаємо, ${user.name}!`);
    // Перенаправлення залишається без змін:
    switch (user.role) {
      case "admin": navigate("/admin/users"); break;
      case "manager": navigate("/manager/routes"); break;
      case "warehouse": navigate("/warehouse/select"); break;
      case "accountant": navigate("/accountant/reports"); break;
    }
  } catch {
    toast.error("Невірний email або пароль");
    setIsLoading(false);
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Стан для логіну
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Стан для реєстрації
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole | "">("");
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Симуляція перевірки
    const user = mockUsers.find(
      (u) => u.email === loginEmail && u.password === loginPassword
    );

    if (user) {
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);
      toast.success(`Вітаємо, ${user.name}!`);
      
      setTimeout(() => {
        // Перенаправлення на першу сторінку відповідної ролі
        switch (user.role) {
          case "admin":
            navigate("/admin/users");
            break;
          case "manager":
            navigate("/manager/routes");
            break;
          case "warehouse":
            navigate("/warehouse/select");
            break;
          case "accountant":
            navigate("/accountant/reports");
            break;
          default:
            navigate("/");
        }
      }, 500);
    } else {
      toast.error("Невірний email або пароль");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!registerRole) { toast.error("Оберіть роль"); return; }
  setIsLoading(true);
  try {
    const { user } = await authService.register({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      role: registerRole,
      warehouses: selectedWarehouses,
    });
    toast.success(`Реєстрацію завершено! Вітаємо, ${user.name}!`);
    switch (user.role) {
      case "admin": navigate("/admin/users"); break;
      case "manager": navigate("/manager/routes"); break;
      case "warehouse": navigate("/warehouse/select"); break;
      case "accountant": navigate("/accountant/reports"); break;
    }
  } catch {
    toast.error("Помилка реєстрації");
    setIsLoading(false);
  }
};

  const toggleWarehouse = (warehouse: string) => {
    setSelectedWarehouses((prev) =>
      prev.includes(warehouse)
        ? prev.filter((w) => w !== warehouse)
        : [...prev, warehouse]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl mb-2">Система управління складами</CardTitle>
            <CardDescription>
              Увійдіть в систему або створіть новий акаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Вхід</TabsTrigger>
                <TabsTrigger value="register">Реєстрація</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Вхід..." : "Увійти"}
                  </Button>
                  <div className="text-sm text-muted-foreground text-center mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="font-semibold mb-2">Тестові акаунти:</p>
                    <p>admin@company.com / admin</p>
                    <p>manager@company.com / manager</p>
                    <p>warehouse@company.com / warehouse</p>
                    <p>accountant@company.com / accountant</p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">ПІБ</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Іван Петренко"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@company.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role">Роль</Label>
                    <Select value={registerRole} onValueChange={(value) => setRegisterRole(value as UserRole)}>
                      <SelectTrigger id="register-role">
                        <SelectValue placeholder="Оберіть роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Адміністратор</SelectItem>
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="warehouse">Комірник</SelectItem>
                        <SelectItem value="accountant">Бухгалтер</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {registerRole === "warehouse" && (
                    <div className="space-y-2">
                      <Label>Доступні склади</Label>
                      <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                        {warehouses.map((warehouse) => (
                          <div key={warehouse} className="flex items-center space-x-2">
                            <Checkbox
                              id={`reg-${warehouse}`}
                              checked={selectedWarehouses.includes(warehouse)}
                              onCheckedChange={() => toggleWarehouse(warehouse)}
                            />
                            <label htmlFor={`reg-${warehouse}`} className="text-sm cursor-pointer">
                              {warehouse}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Реєстрація..." : "Зареєструватися"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
