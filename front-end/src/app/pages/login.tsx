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
import { authApi } from "../../api/api.ts";

const warehouseOptions = [
    { id: 1, name: "Склад 1" },
    { id: 2, name: "Склад 2" },
    { id: 3, name: "Склад 3" },
    { id: 4, name: "Склад 4" },
    { id: 5, name: "Склад 5" },
];

function redirectByRole(role: string, navigate: ReturnType<typeof useNavigate>) {
    switch (role) {
        case "admin": navigate("/admin/users"); break;
        case "manager": navigate("/manager/routes"); break;
        case "warehouse": navigate("/warehouse/select"); break;
        case "accountant": navigate("/accountant/reports"); break;
        default: navigate("/");
    }
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerRole, setRegisterRole] = useState<UserRole | "">("");
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authApi.login(loginEmail, loginPassword);
            authApi.persist(res);
            toast.success(`Вітаємо, ${res.name}!`);
            setTimeout(() => redirectByRole(res.role, navigate), 400);
        } catch (err: any) {
            toast.error(err.message ?? "Невірний email або пароль");
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerRole) { toast.error("Оберіть роль користувача"); return; }
        setIsLoading(true);
        try {
            const res = await authApi.register(
                registerName, registerEmail, registerPassword,
                registerRole, selectedWarehouseIds
            );
            authApi.persist(res);
            toast.success(`Реєстрацію завершено! Вітаємо, ${res.name}!`);
            setTimeout(() => redirectByRole(res.role, navigate), 400);
        } catch (err: any) {
            toast.error(err.message ?? "Помилка реєстрації");
            setIsLoading(false);
        }
    };

    const toggleWarehouse = (id: number) => {
        setSelectedWarehouseIds(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="border-2">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-2xl mb-2">Система управління складами</CardTitle>
                        <CardDescription>Увійдіть в систему або створіть новий акаунт</CardDescription>
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
                                        <Input id="login-email" type="email" placeholder="email@company.com"
                                            value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Пароль</Label>
                                        <Input id="login-password" type="password" placeholder="••••••••"
                                            value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
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
                                        <Input id="register-name" type="text" placeholder="Іван Петренко"
                                            value={registerName} onChange={e => setRegisterName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-email">Email</Label>
                                        <Input id="register-email" type="email" placeholder="email@company.com"
                                            value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Пароль</Label>
                                        <Input id="register-password" type="password" placeholder="••••••••"
                                            value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Роль</Label>
                                        <Select value={registerRole} onValueChange={v => setRegisterRole(v as UserRole)}>
                                            <SelectTrigger><SelectValue placeholder="Оберіть роль" /></SelectTrigger>
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
                                                {warehouseOptions.map(w => (
                                                    <div key={w.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`reg-${w.id}`}
                                                            checked={selectedWarehouseIds.includes(w.id)}
                                                            onCheckedChange={() => toggleWarehouse(w.id)}
                                                        />
                                                        <label htmlFor={`reg-${w.id}`} className="text-sm cursor-pointer">{w.name}</label>
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