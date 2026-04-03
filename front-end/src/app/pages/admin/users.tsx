import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { UserPlus, Car, Edit, Trash2, Truck, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Driver, Vehicle, Trailer } from "../../types";
import { usersService } from "../../services/users.service";
import { driversService } from "../../services/drivers.service";
import { vehiclesService, trailersService } from "../../services/vehicles.service";

type Role = "admin" | "manager" | "warehouse" | "accountant";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  warehouses: string[];
  active: boolean;
}

const warehouses = ["Склад 1", "Склад 2", "Склад 3", "Склад 4", "Склад 5"];

const initialUsers: User[] = [
  { id: "1", name: "Олександр Коваленко", email: "kovalenko@company.com", role: "admin", warehouses: [], active: true },
  { id: "2", name: "Марія Шевченко", email: "shevchenko@company.com", role: "manager", warehouses: [], active: true },
  { id: "3", name: "Іван Петренко", email: "petrenko@company.com", role: "warehouse", warehouses: ["Склад 1", "Склад 3"], active: true },
  { id: "4", name: "Ольга Сидоренко", email: "sydorenko@company.com", role: "accountant", warehouses: [], active: true },
];

const initialTrailers: Trailer[] = [
  { id: "1", type: "Тент", length: 13.6, width: 2.45, maxWeight: 20000, active: true },
  { id: "2", type: "Рефрижератор", length: 13.6, width: 2.45, maxWeight: 18000, active: true },
  { id: "3", type: "Контейнеровоз", length: 12.0, width: 2.5, maxWeight: 24000, active: true },
];

const initialVehicles: Vehicle[] = [
  { id: "1", model: "Mercedes Actros", plateNumber: "AA 1234 BB", fuelConsumption: 28.5, power: 450, trailerId: "1", fuelType: "diesel", capacity: 20000, active: true },
  { id: "2", model: "Volvo FH16", plateNumber: "AA 5678 BB", fuelConsumption: 30.0, power: 540, trailerId: "2", fuelType: "diesel", capacity: 18000, active: true },
  { id: "3", model: "MAN TGX", plateNumber: "AA 9012 CC", fuelConsumption: 27.5, power: 500, trailerId: null, fuelType: "diesel", capacity: 19000, active: true },
];

const initialDrivers: Driver[] = [
  { id: "1", name: "Дмитро Іваненко", phone: "+380 67 123 4567", license: "ABC123456", vehicleId: "1", hourlyRate: 150, workHoursPerDay: 8, workHoursThisWeek: 32, maxHoursPerWeek: 48, isBusy: false, active: true },
  { id: "2", name: "Андрій Мельник", phone: "+380 63 987 6543", license: "DEF789012", vehicleId: "2", hourlyRate: 160, workHoursPerDay: 8, workHoursThisWeek: 40, maxHoursPerWeek: 48, isBusy: true, active: true },
  { id: "3", name: "Василь Петров", phone: "+380 50 555 1234", license: "GHI345678", vehicleId: null, hourlyRate: 145, workHoursPerDay: 8, workHoursThisWeek: 24, maxHoursPerWeek: 48, isBusy: false, active: true },
];

const roleLabels: Record<Role, string> = {
  admin: "Адміністратор",
  manager: "Менеджер",
  warehouse: "Комірник",
  accountant: "Бухгалтер",
};

const roleColors: Record<Role, string> = {
  admin: "purple",
  manager: "blue",
  warehouse: "green",
  accountant: "orange",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersService.getAll(),
      driversService.getAll(),
      vehiclesService.getAll(),
      trailersService.getAll(),
    ])
      .then(([u, d, v, t]) => { setUsers(u); setDrivers(d); setVehicles(v); setTrailers(t); })
      .catch(() => toast.error("Помилка завантаження даних"))
      .finally(() => setIsLoading(false));
  }, []);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingTrailer, setEditingTrailer] = useState<Trailer | null>(null);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isTrailerDialogOpen, setIsTrailerDialogOpen] = useState(false);

  // Forms
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "" as Role | "", warehouses: [] as string[] });
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", license: "", vehicleId: "", hourlyRate: "", workHoursPerDay: "8", maxHoursPerWeek: "48" });
  const [vehicleForm, setVehicleForm] = useState({ model: "", plateNumber: "", fuelConsumption: "", power: "", trailerId: "", fuelType: "", capacity: "" });
  const [trailerForm, setTrailerForm] = useState({ type: "", length: "", width: "", maxWeight: "" });

  // Users
  const handleDeleteUser = async (id: string) => {
    try {
      await usersService.delete(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success("Користувача видалено");
    } catch {
      toast.error("Не вдалося видалити користувача");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, role: user.role, warehouses: user.warehouses });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      toast.error("Заповніть усі обов'язкові поля");
      return;
    }
    // Тепер TypeScript знає, що role точно не ""
    const validForm = userForm as { name: string; email: string; role: Role; warehouses: string[] };

    try {
      if (editingUser) {
        const updated = await usersService.update(editingUser.id, validForm);
        setUsers(users.map(u => u.id === updated.id ? updated : u));
      } else {
        const created = await usersService.create({ ...validForm, active: true });
        setUsers([...users, created]);
      }
      toast.success("Збережено");
      setIsUserDialogOpen(false);
    } catch {
      toast.error("Помилка збереження");
    }
  };

  // Drivers
  const handleDeleteDriver = (id: string) => {
    setDrivers(drivers.filter((d) => d.id !== id));
    toast.success("Водія видалено");
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      license: driver.license,
      vehicleId: driver.vehicleId || "",
      hourlyRate: driver.hourlyRate.toString(),
      workHoursPerDay: driver.workHoursPerDay.toString(),
      maxHoursPerWeek: driver.maxHoursPerWeek.toString(),
    });
    setIsDriverDialogOpen(true);
  };

  const handleSaveDriver = () => {
    if (!driverForm.name || !driverForm.phone || !driverForm.license || !driverForm.hourlyRate) {
      toast.error("Заповніть усі обов'язкові поля");
      return;
    }

    const finalVehicleId = driverForm.vehicleId === "none" ? null : driverForm.vehicleId || null;

    if (editingDriver) {
      setDrivers(
        drivers.map((d) =>
          d.id === editingDriver.id
            ? {
                ...d,
                name: driverForm.name,
                phone: driverForm.phone,
                license: driverForm.license,
                vehicleId: finalVehicleId,
                hourlyRate: parseFloat(driverForm.hourlyRate),
                workHoursPerDay: parseFloat(driverForm.workHoursPerDay),
                maxHoursPerWeek: parseFloat(driverForm.maxHoursPerWeek),
              }
            : d
        )
      );
      toast.success("Водія оновлено");
    } else {
      const newDriver: Driver = {
        id: Date.now().toString(),
        name: driverForm.name,
        phone: driverForm.phone,
        license: driverForm.license,
        vehicleId: finalVehicleId,
        hourlyRate: parseFloat(driverForm.hourlyRate),
        workHoursPerDay: parseFloat(driverForm.workHoursPerDay),
        workHoursThisWeek: 0,
        maxHoursPerWeek: parseFloat(driverForm.maxHoursPerWeek),
        isBusy: false,
        active: true,
      };
      setDrivers([...drivers, newDriver]);
      toast.success("Водія додано");
    }

    setIsDriverDialogOpen(false);
    setEditingDriver(null);
    setDriverForm({ name: "", phone: "", license: "", vehicleId: "", hourlyRate: "", workHoursPerDay: "8", maxHoursPerWeek: "48" });
  };

  // Vehicles
  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
    toast.success("Транспорт видалено");
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      fuelConsumption: vehicle.fuelConsumption.toString(),
      power: vehicle.power.toString(),
      trailerId: vehicle.trailerId || "",
      fuelType: vehicle.fuelType,
      capacity: vehicle.capacity.toString(),
    });
    setIsVehicleDialogOpen(true);
  };

  const handleSaveVehicle = () => {
    if (!vehicleForm.model || !vehicleForm.plateNumber || !vehicleForm.fuelConsumption || !vehicleForm.power || !vehicleForm.capacity) {
      toast.error("Заповніть усі обов'язкові поля");
      return;
    }

    const finalTrailerId = vehicleForm.trailerId === "none" ? null : vehicleForm.trailerId || null;

    if (editingVehicle) {
      setVehicles(
        vehicles.map((v) =>
          v.id === editingVehicle.id
            ? {
                ...v,
                model: vehicleForm.model,
                plateNumber: vehicleForm.plateNumber,
                fuelConsumption: parseFloat(vehicleForm.fuelConsumption),
                power: parseFloat(vehicleForm.power),
                trailerId: finalTrailerId,
                fuelType: vehicleForm.fuelType as any,
                capacity: parseFloat(vehicleForm.capacity),
              }
            : v
        )
      );
      toast.success("Транспорт оновлено");
    } else {
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        model: vehicleForm.model,
        plateNumber: vehicleForm.plateNumber,
        fuelConsumption: parseFloat(vehicleForm.fuelConsumption),
        power: parseFloat(vehicleForm.power),
        trailerId: finalTrailerId,
        fuelType: vehicleForm.fuelType as any,
        capacity: parseFloat(vehicleForm.capacity),
        active: true,
      };
      setVehicles([...vehicles, newVehicle]);
      toast.success("Транспорт додано");
    }

    setIsVehicleDialogOpen(false);
    setEditingVehicle(null);
    setVehicleForm({ model: "", plateNumber: "", fuelConsumption: "", power: "", trailerId: "", fuelType: "", capacity: "" });
  };

  // Trailers
  const handleDeleteTrailer = (id: string) => {
    setTrailers(trailers.filter((t) => t.id !== id));
    toast.success("Причіп видалено");
  };

  const handleEditTrailer = (trailer: Trailer) => {
    setEditingTrailer(trailer);
    setTrailerForm({
      type: trailer.type,
      length: trailer.length.toString(),
      width: trailer.width.toString(),
      maxWeight: trailer.maxWeight.toString(),
    });
    setIsTrailerDialogOpen(true);
  };

  const handleSaveTrailer = () => {
    if (!trailerForm.type || !trailerForm.length || !trailerForm.width || !trailerForm.maxWeight) {
      toast.error("Заповніть усі поля");
      return;
    }

    if (editingTrailer) {
      setTrailers(
        trailers.map((t) =>
          t.id === editingTrailer.id
            ? {
                ...t,
                type: trailerForm.type,
                length: parseFloat(trailerForm.length),
                width: parseFloat(trailerForm.width),
                maxWeight: parseFloat(trailerForm.maxWeight),
              }
            : t
        )
      );
      toast.success("Причіп оновлено");
    } else {
      const newTrailer: Trailer = {
        id: Date.now().toString(),
        type: trailerForm.type,
        length: parseFloat(trailerForm.length),
        width: parseFloat(trailerForm.width),
        maxWeight: parseFloat(trailerForm.maxWeight),
        active: true,
      };
      setTrailers([...trailers, newTrailer]);
      toast.success("Причіп додано");
    }

    setIsTrailerDialogOpen(false);
    setEditingTrailer(null);
    setTrailerForm({ type: "", length: "", width: "", maxWeight: "" });
  };

  const getVehicleById = (id: string | null) => vehicles.find((v) => v.id === id);
  const getTrailerById = (id: string | null) => trailers.find((t) => t.id === id);

  const toggleWarehouse = (warehouse: string) => {
    setUserForm((prev) => ({
      ...prev,
      warehouses: prev.warehouses.includes(warehouse) ? prev.warehouses.filter((w) => w !== warehouse) : [...prev.warehouses, warehouse],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Користувачі та Права</h1>
          <p className="text-muted-foreground">Управління користувачами, водіями, транспортом та причепами</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="users">Користувачі</TabsTrigger>
          <TabsTrigger value="drivers">Водії</TabsTrigger>
          <TabsTrigger value="vehicles">Фури</TabsTrigger>
          <TabsTrigger value="trailers">Причепи</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Користувачі системи</CardTitle>
                  <CardDescription>Створення акаунтів та призначення ролей</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingUser(null);
                        setUserForm({ name: "", email: "", role: "", warehouses: [] });
                      }}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Додати</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Редагувати користувача" : "Новий користувач"}</DialogTitle>
                      <DialogDescription>Створення облікового запису</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ім'я</Label>
                        <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Введіть ім'я" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} type="email" placeholder="email@company.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Роль</Label>
                        <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value as Role })}>
                          <SelectTrigger>
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
                      {userForm.role === "warehouse" && (
                        <div className="space-y-2">
                          <Label>Склади</Label>
                          <div className="space-y-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                            {warehouses.map((warehouse) => (
                              <div key={warehouse} className="flex items-center space-x-2">
                                <Checkbox id={`user-${warehouse}`} checked={userForm.warehouses.includes(warehouse)} onCheckedChange={() => toggleWarehouse(warehouse)} />
                                <label htmlFor={`user-${warehouse}`} className="text-sm cursor-pointer">
                                  {warehouse}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button onClick={handleSaveUser} className="w-full">
                        {editingUser ? "Зберегти зміни" : "Створити користувача"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ім'я</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead className="hidden lg:table-cell">Склади</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabels[user.role]}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{user.warehouses.length > 0 ? user.warehouses.join(", ") : "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Водії</CardTitle>
                  <CardDescription>Управління водіями компанії</CardDescription>
                </div>
                <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingDriver(null);
                        setDriverForm({ name: "", phone: "", license: "", vehicleId: "", hourlyRate: "", workHoursPerDay: "8", maxHoursPerWeek: "48" });
                      }}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Додати</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingDriver ? "Редагувати водія" : "Новий водій"}</DialogTitle>
                      <DialogDescription>Додавання водія в систему</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>ПІБ</Label>
                        <Input value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} placeholder="Іван Петренко" />
                      </div>
                      <div className="space-y-2">
                        <Label>Телефон</Label>
                        <Input value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} placeholder="+380 XX XXX XXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>Номер посвідчення</Label>
                        <Input value={driverForm.license} onChange={(e) => setDriverForm({ ...driverForm, license: e.target.value })} placeholder="ABC123456" />
                      </div>
                      <div className="space-y-2">
                        <Label>Машина (фура)</Label>
                        <Select value={driverForm.vehicleId} onValueChange={(value) => setDriverForm({ ...driverForm, vehicleId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть машину" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Немає</SelectItem>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.model} ({vehicle.plateNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ставка (грн/год)</Label>
                          <Input type="number" value={driverForm.hourlyRate} onChange={(e) => setDriverForm({ ...driverForm, hourlyRate: e.target.value })} placeholder="150" />
                        </div>
                        <div className="space-y-2">
                          <Label>Годин/день</Label>
                          <Input type="number" value={driverForm.workHoursPerDay} onChange={(e) => setDriverForm({ ...driverForm, workHoursPerDay: e.target.value })} placeholder="8" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Макс. годин/тиждень</Label>
                        <Input type="number" value={driverForm.maxHoursPerWeek} onChange={(e) => setDriverForm({ ...driverForm, maxHoursPerWeek: e.target.value })} placeholder="48" />
                      </div>
                      <Button onClick={handleSaveDriver} className="w-full">
                        {editingDriver ? "Зберегти зміни" : "Додати водія"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ПІБ</TableHead>
                      <TableHead className="hidden sm:table-cell">Машина</TableHead>
                      <TableHead className="hidden md:table-cell">Ставка</TableHead>
                      <TableHead className="hidden lg:table-cell">Години (тиждень)</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => {
                      const vehicle = getVehicleById(driver.vehicleId);
                      const hoursLeft = driver.maxHoursPerWeek - driver.workHoursThisWeek;
                      return (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">{vehicle ? vehicle.model : "—"}</TableCell>
                          <TableCell className="hidden md:table-cell">{driver.hourlyRate} грн/год</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {driver.workHoursThisWeek}/{driver.maxHoursPerWeek} ({hoursLeft}г залишилось)
                          </TableCell>
                          <TableCell>
                            {driver.isBusy ? <Badge variant="outline">Зайнятий</Badge> : <Badge variant="outline" className="border-green-500 text-green-600">Вільний</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditDriver(driver)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDriver(driver.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Фури</CardTitle>
                  <CardDescription>Управління парком вантажних автомобілів</CardDescription>
                </div>
                <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingVehicle(null);
                        setVehicleForm({ model: "", plateNumber: "", fuelConsumption: "", power: "", trailerId: "", fuelType: "", capacity: "" });
                      }}
                      className="gap-2"
                    >
                      <Car className="h-4 w-4" />
                      <span className="hidden sm:inline">Додати</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingVehicle ? "Редагувати фуру" : "Нова фура"}</DialogTitle>
                      <DialogDescription>Реєстрація транспортного засобу</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Модель</Label>
                        <Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="Mercedes Actros" />
                      </div>
                      <div className="space-y-2">
                        <Label>Номерний знак</Label>
                        <Input value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} placeholder="AA 1234 BB" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Розхід (л/100км)</Label>
                          <Input type="number" step="0.1" value={vehicleForm.fuelConsumption} onChange={(e) => setVehicleForm({ ...vehicleForm, fuelConsumption: e.target.value })} placeholder="28.5" />
                        </div>
                        <div className="space-y-2">
                          <Label>Потужність (к.с.)</Label>
                          <Input type="number" value={vehicleForm.power} onChange={(e) => setVehicleForm({ ...vehicleForm, power: e.target.value })} placeholder="450" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Тип палива</Label>
                        <Select value={vehicleForm.fuelType} onValueChange={(value) => setVehicleForm({ ...vehicleForm, fuelType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть тип" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diesel">Дизель</SelectItem>
                            <SelectItem value="petrol">Бензин</SelectItem>
                            <SelectItem value="electric">Електро</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Під'єднаний причіп</Label>
                        <Select value={vehicleForm.trailerId} onValueChange={(value) => setVehicleForm({ ...vehicleForm, trailerId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть причіп" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Немає</SelectItem>
                            {trailers.map((trailer) => (
                              <SelectItem key={trailer.id} value={trailer.id}>
                                {trailer.type} ({trailer.length}м x {trailer.width}м)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Вантажопідйомність (кг)</Label>
                        <Input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} placeholder="20000" />
                      </div>
                      <Button onClick={handleSaveVehicle} className="w-full">
                        {editingVehicle ? "Зберегти зміни" : "Додати фуру"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Модель</TableHead>
                      <TableHead className="hidden sm:table-cell">Номер</TableHead>
                      <TableHead className="hidden md:table-cell">Розхід</TableHead>
                      <TableHead className="hidden lg:table-cell">Потужність</TableHead>
                      <TableHead className="hidden xl:table-cell">Причіп</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => {
                      const trailer = getTrailerById(vehicle.trailerId);
                      return (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.model}</TableCell>
                          <TableCell className="hidden sm:table-cell">{vehicle.plateNumber}</TableCell>
                          <TableCell className="hidden md:table-cell">{vehicle.fuelConsumption} л/100км</TableCell>
                          <TableCell className="hidden lg:table-cell">{vehicle.power} к.с.</TableCell>
                          <TableCell className="hidden xl:table-cell">{trailer ? trailer.type : "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditVehicle(vehicle)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteVehicle(vehicle.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trailers Tab */}
        <TabsContent value="trailers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Причепи</CardTitle>
                  <CardDescription>Управління причепами та напівпричепами</CardDescription>
                </div>
                <Dialog open={isTrailerDialogOpen} onOpenChange={setIsTrailerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingTrailer(null);
                        setTrailerForm({ type: "", length: "", width: "", maxWeight: "" });
                      }}
                      className="gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">Додати</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTrailer ? "Редагувати причіп" : "Новий причіп"}</DialogTitle>
                      <DialogDescription>Реєстрація причепа</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Тип причепа</Label>
                        <Select value={trailerForm.type} onValueChange={(value) => setTrailerForm({ ...trailerForm, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть тип" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Тент">Тент</SelectItem>
                            <SelectItem value="Рефрижератор">Рефрижератор</SelectItem>
                            <SelectItem value="Контейнеровоз">Контейнеровоз</SelectItem>
                            <SelectItem value="Платформа">Платформа</SelectItem>
                            <SelectItem value="Цистерна">Цистерна</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Довжина (м)</Label>
                          <Input type="number" step="0.1" value={trailerForm.length} onChange={(e) => setTrailerForm({ ...trailerForm, length: e.target.value })} placeholder="13.6" />
                        </div>
                        <div className="space-y-2">
                          <Label>Ширина (м)</Label>
                          <Input type="number" step="0.01" value={trailerForm.width} onChange={(e) => setTrailerForm({ ...trailerForm, width: e.target.value })} placeholder="2.45" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Макс. вага (кг)</Label>
                        <Input type="number" value={trailerForm.maxWeight} onChange={(e) => setTrailerForm({ ...trailerForm, maxWeight: e.target.value })} placeholder="20000" />
                      </div>
                      <Button onClick={handleSaveTrailer} className="w-full">
                        {editingTrailer ? "Зберегти зміни" : "Додати причіп"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Довжина (м)</TableHead>
                    <TableHead>Ширина (м)</TableHead>
                    <TableHead className="hidden md:table-cell">Макс. вага (кг)</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trailers.map((trailer) => (
                    <TableRow key={trailer.id}>
                      <TableCell className="font-medium">{trailer.type}</TableCell>
                      <TableCell>{trailer.length}</TableCell>
                      <TableCell>{trailer.width}</TableCell>
                      <TableCell className="hidden md:table-cell">{trailer.maxWeight}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTrailer(trailer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTrailer(trailer.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}