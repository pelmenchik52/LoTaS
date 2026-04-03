import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { UserPlus, Edit, Trash2, Car, Truck, Package as PackageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type UserDto, type DriverDto, type VehicleDto, type TrailerDto } from "../../../api/api.ts";

type Role = "admin" | "manager" | "warehouse" | "accountant";
const roleLabels: Record<Role, string> = { admin: "Адміністратор", manager: "Менеджер", warehouse: "Комірник", accountant: "Бухгалтер" };
const roleColors: Record<Role, string> = { admin: "text-purple-600 border-purple-600", manager: "text-blue-600 border-blue-600", warehouse: "text-green-600 border-green-600", accountant: "text-orange-600 border-orange-600" };

const warehouseOptions = [
    { id: 1, name: "Склад 1" }, { id: 2, name: "Склад 2" }, { id: 3, name: "Склад 3" },
    { id: 4, name: "Склад 4" }, { id: 5, name: "Склад 5" },
];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [drivers, setDrivers] = useState<DriverDto[]>([]);
    const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
    const [trailers, setTrailers] = useState<TrailerDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [userDialog, setUserDialog] = useState(false);
    const [driverDialog, setDriverDialog] = useState(false);
    const [vehicleDialog, setVehicleDialog] = useState(false);
    const [editUser, setEditUser] = useState<UserDto | null>(null);

    // User form state
    const [uName, setUName] = useState(""); const [uEmail, setUEmail] = useState("");
    const [uPass, setUPass] = useState(""); const [uRole, setURole] = useState<Role>("warehouse");
    const [uWarehouses, setUWarehouses] = useState<number[]>([]);

    // Driver form
    const [dName, setDName] = useState(""); const [dPhone, setDPhone] = useState("");
    const [dLicense, setDLicense] = useState(""); const [dVehicleId, setDVehicleId] = useState("");
    const [dRate, setDRate] = useState(""); const [dHours, setDHours] = useState("8");
    const [dMaxHours, setDMaxHours] = useState("48");

    // Vehicle form
    const [vModel, setVModel] = useState(""); const [vPlate, setVPlate] = useState("");
    const [vFuel, setVFuel] = useState(""); const [vPower, setVPower] = useState("");
    const [vCapacity, setVCapacity] = useState(""); const [vFuelType, setVFuelType] = useState("diesel");
    const [vTrailerId, setVTrailerId] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const [u, d, v, t] = await Promise.all([
                adminApi.getUsers(), adminApi.getDrivers(), adminApi.getVehicles(), adminApi.getTrailers(),
            ]);
            setUsers(u); setDrivers(d); setVehicles(v); setTrailers(t);
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openNewUser = () => {
        setEditUser(null); setUName(""); setUEmail(""); setUPass(""); setURole("warehouse"); setUWarehouses([]);
        setUserDialog(true);
    };
    const openEditUser = (u: UserDto) => {
        setEditUser(u); setUName(u.name); setUEmail(u.email); setUPass(""); setURole(u.role as Role); setUWarehouses(u.warehouseIds);
        setUserDialog(true);
    };

    const handleSaveUser = async () => {
        try {
            if (editUser) {
                await adminApi.updateUser(editUser.id, { name: uName, email: uEmail, role: uRole, active: true, warehouseIds: uWarehouses, password: uPass || undefined });
                toast.success("Користувача оновлено");
            } else {
                await adminApi.createUser({ name: uName, email: uEmail, password: uPass, role: uRole, warehouseIds: uWarehouses });
                toast.success("Користувача створено");
            }
            setUserDialog(false); load();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleDeleteUser = async (id: number) => {
        try { await adminApi.deleteUser(id); toast.success("Деактивовано"); load(); }
        catch (e: any) { toast.error(e.message); }
    };

    const handleSaveDriver = async () => {
        try {
            await adminApi.createDriver({ name: dName, phone: dPhone, license: dLicense, vehicleId: dVehicleId ? Number(dVehicleId) : null, hourlyRate: Number(dRate), workHoursPerDay: Number(dHours), maxHoursPerWeek: Number(dMaxHours) });
            toast.success("Водія додано"); setDriverDialog(false); load();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleDeleteDriver = async (id: number) => {
        try { await adminApi.deleteDriver(id); toast.success("Деактивовано"); load(); }
        catch (e: any) { toast.error(e.message); }
    };

    const handleSaveVehicle = async () => {
        try {
            await adminApi.createVehicle({ model: vModel, plateNumber: vPlate, fuelConsumption: Number(vFuel), power: Number(vPower), capacity: Number(vCapacity), fuelType: vFuelType, trailerId: vTrailerId ? Number(vTrailerId) : null });
            toast.success("Авто додано"); setVehicleDialog(false); load();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleDeleteVehicle = async (id: number) => {
        try { await adminApi.deleteVehicle(id); toast.success("Деактивовано"); load(); }
        catch (e: any) { toast.error(e.message); }
    };

    const toggleWarehouse = (id: number) =>
        setUWarehouses(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Управління користувачами</h1>
                    <p className="text-muted-foreground">Керування персоналом, водіями та транспортом</p>
                </div>
                <Button variant="outline" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Оновити
                </Button>
            </div>

            <Tabs defaultValue="users">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users">Користувачі</TabsTrigger>
                    <TabsTrigger value="drivers">Водії</TabsTrigger>
                    <TabsTrigger value="vehicles">Транспорт</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Користувачі системи</CardTitle>
                            <Button onClick={openNewUser}><UserPlus className="h-4 w-4 mr-2" />Додати</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ПІБ</TableHead>
                                        <TableHead className="hidden md:table-cell">Email</TableHead>
                                        <TableHead>Роль</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead className="text-right">Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{u.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={roleColors[u.role as Role]}>
                                                    {roleLabels[u.role as Role] ?? u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Активний" : "Неактивний"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEditUser(u)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Drivers Tab */}
                <TabsContent value="drivers">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Водії</CardTitle>
                            <Button onClick={() => setDriverDialog(true)}><Car className="h-4 w-4 mr-2" />Додати водія</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ПІБ</TableHead>
                                        <TableHead className="hidden md:table-cell">Телефон</TableHead>
                                        <TableHead className="hidden md:table-cell">Авто</TableHead>
                                        <TableHead>Ставка</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead className="text-right">Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {drivers.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell className="font-medium">{d.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{d.phone}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {d.vehicleModel ? <Badge variant="outline">{d.vehicleModel} ({d.plateNumber})</Badge> : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>{d.hourlyRate} грн/год</TableCell>
                                            <TableCell>
                                                <Badge variant={d.isBusy ? "secondary" : "default"}>{d.isBusy ? "Зайнятий" : "Вільний"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteDriver(d.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vehicles Tab */}
                <TabsContent value="vehicles">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Транспортні засоби</CardTitle>
                            <Button onClick={() => setVehicleDialog(true)}><Truck className="h-4 w-4 mr-2" />Додати авто</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Модель</TableHead>
                                        <TableHead>Номер</TableHead>
                                        <TableHead className="hidden md:table-cell">Паливо</TableHead>
                                        <TableHead className="hidden md:table-cell">Вантажність</TableHead>
                                        <TableHead className="hidden lg:table-cell">Причіп</TableHead>
                                        <TableHead className="text-right">Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicles.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.model}</TableCell>
                                            <TableCell><Badge variant="outline">{v.plateNumber}</Badge></TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{v.fuelConsumption} л/100км</TableCell>
                                            <TableCell className="hidden md:table-cell">{(v.capacity / 1000).toFixed(1)} т</TableCell>
                                            <TableCell className="hidden lg:table-cell">{v.trailerType ?? "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteVehicle(v.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* User Dialog */}
            <Dialog open={userDialog} onOpenChange={setUserDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editUser ? "Редагувати користувача" : "Новий користувач"}</DialogTitle>
                        <DialogDescription>Заповніть дані користувача</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>ПІБ</Label><Input value={uName} onChange={e => setUName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} /></div>
                        <div className="space-y-2"><Label>{editUser ? "Новий пароль (залиште порожнім щоб не змінювати)" : "Пароль"}</Label><Input type="password" value={uPass} onChange={e => setUPass(e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Роль</Label>
                            <Select value={uRole} onValueChange={v => setURole(v as Role)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Адміністратор</SelectItem>
                                    <SelectItem value="manager">Менеджер</SelectItem>
                                    <SelectItem value="warehouse">Комірник</SelectItem>
                                    <SelectItem value="accountant">Бухгалтер</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {uRole === "warehouse" && (
                            <div className="space-y-2">
                                <Label>Склади</Label>
                                <div className="border rounded-md p-3 space-y-2 max-h-36 overflow-y-auto">
                                    {warehouseOptions.map(w => (
                                        <div key={w.id} className="flex items-center space-x-2">
                                            <Checkbox checked={uWarehouses.includes(w.id)} onCheckedChange={() => toggleWarehouse(w.id)} id={`w-${w.id}`} />
                                            <label htmlFor={`w-${w.id}`} className="text-sm cursor-pointer">{w.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Button className="w-full" onClick={handleSaveUser}>{editUser ? "Зберегти зміни" : "Створити"}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Driver Dialog */}
            <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Новий водій</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2"><Label>ПІБ</Label><Input value={dName} onChange={e => setDName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Телефон</Label><Input value={dPhone} onChange={e => setDPhone(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Посвідчення</Label><Input value={dLicense} onChange={e => setDLicense(e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Авто</Label>
                            <Select value={dVehicleId} onValueChange={setDVehicleId}>
                                <SelectTrigger><SelectValue placeholder="Без авто" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Без авто</SelectItem>
                                    {vehicles.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.model} ({v.plateNumber})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2"><Label>Ставка (грн/год)</Label><Input type="number" value={dRate} onChange={e => setDRate(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Год/день</Label><Input type="number" value={dHours} onChange={e => setDHours(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Макс год/тиж</Label><Input type="number" value={dMaxHours} onChange={e => setDMaxHours(e.target.value)} /></div>
                        </div>
                        <Button className="w-full" onClick={handleSaveDriver}>Додати водія</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Vehicle Dialog */}
            <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Новий транспортний засіб</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2"><Label>Модель</Label><Input value={vModel} onChange={e => setVModel(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Номерний знак</Label><Input value={vPlate} onChange={e => setVPlate(e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2"><Label>Розхід л/100км</Label><Input type="number" value={vFuel} onChange={e => setVFuel(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Потужність (к.с.)</Label><Input type="number" value={vPower} onChange={e => setVPower(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Вантажність (кг)</Label><Input type="number" value={vCapacity} onChange={e => setVCapacity(e.target.value)} /></div>
                            <div className="space-y-2">
                                <Label>Тип палива</Label>
                                <Select value={vFuelType} onValueChange={setVFuelType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="diesel">Дизель</SelectItem>
                                        <SelectItem value="petrol">Бензин</SelectItem>
                                        <SelectItem value="electric">Електро</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Причіп</Label>
                            <Select value={vTrailerId} onValueChange={setVTrailerId}>
                                <SelectTrigger><SelectValue placeholder="Без причепа" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Без причепа</SelectItem>
                                    {trailers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.type} ({t.maxWeight / 1000} т)</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full" onClick={handleSaveVehicle}>Додати авто</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}