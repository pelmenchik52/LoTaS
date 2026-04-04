import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { MapPin, Truck, AlertTriangle, DollarSign, Clock, Package, Warehouse, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../../../api/api";
import type { RouteDto, DriverDto, VehicleDto, OrderDto } from "../../../api/api";
import { MapComponent } from "../../components/map-component";

interface RoutePoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  order: Order;
}

interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const mockProducts: Product[] = [
  { id: "1", name: "Молоко", type: "Швидкопсувний", weight: 1, urgencyCoefficient: 9, expirationDays: 7, active: true },
  { id: "2", name: "Хліб", type: "Швидкопсувний", weight: 0.5, urgencyCoefficient: 8, expirationDays: 3, active: true },
  { id: "3", name: "М'ясо", type: "Заморожений", weight: 2, urgencyCoefficient: 10, expirationDays: 1, active: true },
  { id: "4", name: "Консерви", type: "Звичайний", weight: 0.4, urgencyCoefficient: 3, active: true },
];

const mockTrailers: Trailer[] = [
  { id: "1", type: "Тент", length: 13.6, width: 2.45, maxWeight: 20000, active: true },
  { id: "2", type: "Рефрижератор", length: 13.6, width: 2.45, maxWeight: 18000, active: true },
];

const mockVehicles: Vehicle[] = [
  { id: "1", model: "Mercedes Actros", plateNumber: "AA 1234 BB", fuelConsumption: 28.5, power: 450, trailerId: "1", fuelType: "diesel", capacity: 20000, active: true },
  { id: "2", model: "Volvo FH16", plateNumber: "AA 5678 BB", fuelConsumption: 30.0, power: 540, trailerId: "2", fuelType: "diesel", capacity: 18000, active: true },
];

const mockDrivers: Driver[] = [
  { id: "1", name: "Дмитро Іваненко", phone: "+380 67 123 4567", license: "ABC123456", vehicleId: "1", hourlyRate: 150, workHoursPerDay: 8, workHoursThisWeek: 32, maxHoursPerWeek: 48, isBusy: false, active: true },
  { id: "2", name: "Андрій Мельник", phone: "+380 63 987 6543", license: "DEF789012", vehicleId: "2", hourlyRate: 160, workHoursPerDay: 8, workHoursThisWeek: 40, maxHoursPerWeek: 48, isBusy: false, active: true },
];

const mockWarehouses: WarehouseLocation[] = [
  { id: "1", name: "Склад №1 Київ-Центр", address: "вул. Промислова, 15, Київ", lat: 50.4265, lng: 30.5383 },
  { id: "2", name: "Склад №2 Київ-Дарницький", address: "просп. Бажана, 10, Київ", lat: 50.3975, lng: 30.6341 },
  { id: "3", name: "Склад №3 Київ-Святошин", address: "вул. Жилянська, 120, Київ", lat: 50.4492, lng: 30.4176 },
];

const mockRoutePoints: RoutePoint[] = [
  {
    id: "1",
    name: "Сільпо Центр",
    address: "вул. Хрещатик, 44, Київ",
    lat: 50.4501,
    lng: 30.5234,
    priority: 9,
    order: {
      id: "ord1",
      routeId: "route1",
      products: [
        { productId: "1", quantity: 100, weight: 100 },
        { productId: "3", quantity: 50, weight: 100 },
      ],
      from: "Склад 1",
      to: "Сільпо Центр",
      status: "pending",
      urgency: 9,
    },
  },
  {
    id: "2",
    name: "АТБ Подол",
    address: "вул. Спаська, 12, Київ",
    lat: 50.4676,
    lng: 30.5167,
    priority: 8,
    order: {
      id: "ord2",
      routeId: "route1",
      products: [
        { productId: "2", quantity: 200, weight: 100 },
        { productId: "4", quantity: 150, weight: 60 },
      ],
      from: "Склад 1",
      to: "АТБ Подол",
      status: "pending",
      urgency: 8,
    },
  },
  {
    id: "3",
    name: "Novus Оболонь",
    address: "просп. Героїв, 23, Київ",
    lat: 50.5168,
    lng: 30.4976,
    priority: 5,
    order: {
      id: "ord3",
      routeId: "route1",
      products: [{ productId: "1", quantity: 80, weight: 80 }],
      from: "Склад 1",
      to: "Novus Оболонь",
      status: "pending",
      urgency: 5,
    },
  },
];

const FUEL_PRICE = 52; // грн за літр дизелю

// Функція для розрахунку відстані між двома точками (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радіус Землі в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function ManagerRoutesPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteDto | null>(null);
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, driversData, vehiclesData] = await Promise.all([
        managerApi.getRoutes(),
        managerApi.getDrivers(),
        managerApi.getVehicles()
      ]);
      setRoutes(routesData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (error) {
      toast.error("Помилка завантаження даних");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteStatusUpdate = async (routeId: number, status: string) => {
    try {
      setSaving(true);
      await managerApi.updateRouteStatus(routeId, status);
      await loadData(); // Reload data
      toast.success("Статус маршруту оновлено");
    } catch (error) {
      toast.error("Помилка оновлення статусу");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getDriverById = (id?: number) => drivers.find(d => d.id === id);
  const getVehicleById = (id?: number) => vehicles.find(v => v.id === id);
      const distance = calculateDistance(prevLat, prevLng, point.lat, point.lng);
      totalDistance += distance;
      prevLat = point.lat;
      prevLng = point.lng;
    });

    // Додаємо відстань повернення до складу
    totalDistance += calculateDistance(prevLat, prevLng, warehouse.lat, warehouse.lng);

    // Розрахунок палива
    const fuelConsumption = (totalDistance / 100) * vehicle.fuelConsumption;
    const fuelCost = fuelConsumption * FUEL_PRICE;

    // Розрахунок часу (середня швидкість 40 км/год в місті + 15 хв на кожну точку)
    const avgSpeed = 40;
    const drivingTime = totalDistance / avgSpeed;
    const stopTime = (sortedPoints.length * 15) / 60; // 15 хв = 0.25 год на точку
    const estimatedTime = drivingTime + stopTime;

    // Зарплата водія
    const driverSalary = Math.ceil(estimatedTime) * driver.hourlyRate;

    // Перевірка годин
    const hoursLeft = driver.maxHoursPerWeek - driver.workHoursThisWeek;
    const hoursOverload = estimatedTime > hoursLeft;

    return {
      distance: totalDistance.toFixed(1),
      fuelConsumption: fuelConsumption.toFixed(2),
      fuelCost: fuelCost.toFixed(2),
      estimatedTime: estimatedTime.toFixed(1),
      driverSalary: driverSalary.toFixed(2),
      totalCost: (fuelCost + driverSalary).toFixed(2),
      hoursOverload,
      hoursLeft: hoursLeft.toFixed(1),
      sortedPoints,
    };
  };

  const costs = calculateRouteCosts();

  const handleGenerateRoute = () => {
    if (selectedPoints.length === 0) {
      toast.error("Оберіть точки доставки");
      return;
    }

    if (!selectedDriver) {
      toast.error("Оберіть водія");
      return;
    }

    if (!selectedVehicle) {
      toast.error("Оберіть транспорт");
      return;
    }

    if (!selectedWarehouse) {
      toast.error("Оберіть склад");
      return;
    }

    if (!departureTime) {
      toast.error("Вкажіть час відправлення");
      return;
    }

    if (costs?.hoursOverload) {
      toast.warning("⚠️ Увага! Водій перевищить ліміт годин на тиждень");
    }

    const warehouse = getWarehouseById(selectedWarehouse);
    const driver = getDriverById(selectedDriver);
    
    toast.success(`✅ Маршрут створено!\n📍 Склад: ${warehouse?.name}\n👤 Водій: ${driver?.name}\n🕐 Час відправлення: ${departureTime}\n💰 Вартість: ${costs?.totalCost} грн`);
    
    // Тут можна зберегти маршрут в базу даних
  };

  const warehouse = selectedWarehouse ? getWarehouseById(selectedWarehouse) : null;
  const selectedPointsData = costs?.sortedPoints || [];
  
  // Додаємо склад до точок на карті
  const mapPoints = warehouse 
    ? [{ id: 'warehouse', name: warehouse.name, address: warehouse.address, lat: warehouse.lat, lng: warehouse.lng, priority: 10 }, ...selectedPointsData]
    : selectedPointsData;

  const mapCenter: [number, number] = warehouse ? [warehouse.lat, warehouse.lng] : [50.4501, 30.5234];

  const viewOrderDetails = (point: RoutePoint) => {
    setSelectedOrder(point);
    setIsOrderDetailsOpen(true);
  };

  const driver = selectedDriver ? getDriverById(selectedDriver) : null;
  const vehicle = selectedVehicle ? getVehicleById(selectedVehicle) : null;
  const trailer = vehicle?.trailerId ? getTrailerById(vehicle.trailerId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управління маршрутами</h1>
        <p className="text-muted-foreground">Перегляд та управління маршрутами доставки</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Завантаження маршрутів...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Статистика */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Всього маршрутів</p>
                    <p className="text-3xl font-bold">{routes.length}</p>
                  </div>
                  <MapPin className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Активних</p>
                    <p className="text-3xl font-bold">{routes.filter(r => r.status === "active" || r.status === "in-progress").length}</p>
                  </div>
                  <Truck className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Завершених</p>
                    <p className="text-3xl font-bold">{routes.filter(r => r.status === "completed").length}</p>
                  </div>
                  <Package className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Загальна вартість</p>
                    <p className="text-3xl font-bold">
                      {routes.reduce((sum, r) => sum + (r.totalCost || 0), 0).toFixed(0)}₴
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Список маршрутів */}
          <Card>
            <CardHeader>
              <CardTitle>Маршрути</CardTitle>
              <CardDescription>Список всіх маршрутів у системі</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Маршрут</TableHead>
                    <TableHead>Водій</TableHead>
                    <TableHead>Транспорт</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Відстань</TableHead>
                    <TableHead>Вартість</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Немає маршрутів у системі
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => {
                      const driver = getDriverById(route.driverId);
                      const vehicle = getVehicleById(route.vehicleId);
                      return (
                        <TableRow key={route.id}>
                          <TableCell className="font-medium">
                            {route.from} → {route.to}
                          </TableCell>
                          <TableCell>{driver?.name || "—"}</TableCell>
                          <TableCell>{vehicle?.model || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              route.status === "completed" ? "default" :
                              route.status === "active" || route.status === "in-progress" ? "outline" :
                              "secondary"
                            }>
                              {route.status === "completed" ? "Завершено" :
                               route.status === "active" || route.status === "in-progress" ? "Активний" :
                               "Очікує"}
                            </Badge>
                          </TableCell>
                          <TableCell>{route.distance} км</TableCell>
                          <TableCell>{route.totalCost?.toFixed(0) || "—"}₴</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRoute(route);
                                  setIsRouteDetailsOpen(true);
                                }}
                              >
                                Деталі
                              </Button>
                              {route.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRouteStatusUpdate(route.id, "completed")}
                                  disabled={saving}
                                >
                                  Завершити
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Деталі маршруту */}
      <Dialog open={isRouteDetailsOpen} onOpenChange={setIsRouteDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Деталі маршруту</DialogTitle>
            <DialogDescription>
              {selectedRoute && `${selectedRoute.from} → ${selectedRoute.to}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Водій</Label>
                  <p>{getDriverById(selectedRoute.driverId)?.name || "—"}</p>
                </div>
                <div>
                  <Label>Транспорт</Label>
                  <p>{getVehicleById(selectedRoute.vehicleId)?.model || "—"}</p>
                </div>
                <div>
                  <Label>Відстань</Label>
                  <p>{selectedRoute.distance} км</p>
                </div>
                <div>
                  <Label>Вартість</Label>
                  <p>{selectedRoute.totalCost?.toFixed(2) || "—"}₴</p>
                </div>
              </div>

              <div>
                <Label>Замовлення</Label>
                <div className="mt-2 space-y-2">
                  {selectedRoute.orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Замовлення #{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Терміновість: {order.urgency}/10
                            </p>
                          </div>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm">Товари:</p>
                          <ul className="text-sm text-muted-foreground ml-4">
                            {order.products.map((product, idx) => (
                              <li key={idx}>
                                {product.productName || `Товар ${product.productId}`} - {product.quantity} од.
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}