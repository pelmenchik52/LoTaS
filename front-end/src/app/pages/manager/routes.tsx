import { useState } from "react";
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
import { MapPin, Truck, AlertTriangle, DollarSign, Clock, Package, Warehouse } from "lucide-react";
import { toast } from "sonner";
import type { Driver, Vehicle, Trailer, Product, Order } from "../../types";
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
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>(mockRoutePoints);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("1");
  const [departureTime, setDepartureTime] = useState<string>("08:00");
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RoutePoint | null>(null);

  const togglePoint = (pointId: string) => {
    setSelectedPoints((prev) => (prev.includes(pointId) ? prev.filter((id) => id !== pointId) : [...prev, pointId]));
  };

  const getProductById = (id: string) => mockProducts.find((p) => p.id === id);
  const getDriverById = (id: string) => mockDrivers.find((d) => d.id === id);
  const getVehicleById = (id: string) => mockVehicles.find((v) => v.id === id);
  const getTrailerById = (id: string | null) => mockTrailers.find((t) => t.id === id);
  const getWarehouseById = (id: string) => mockWarehouses.find((w) => w.id === id);

  // Розрахунок витрат з урахуванням реальної відстані
  const calculateRouteCosts = () => {
    if (selectedPoints.length === 0 || !selectedDriver || !selectedVehicle || !selectedWarehouse) {
      return null;
    }

    const driver = getDriverById(selectedDriver);
    const vehicle = getVehicleById(selectedVehicle);
    const warehouse = getWarehouseById(selectedWarehouse);

    if (!driver || !vehicle || !warehouse) return null;

    // Сортуємо точки за пріоритетом (терміновістю)
    const sortedPoints = routePoints
      .filter((p) => selectedPoints.includes(p.id))
      .sort((a, b) => b.priority - a.priority);

    // Розраховуємо загальну відстань з урахуванням складу
    let totalDistance = 0;
    let prevLat = warehouse.lat;
    let prevLng = warehouse.lng;

    sortedPoints.forEach((point) => {
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
        <h1 className="text-3xl font-bold mb-2">Планування маршрутів</h1>
        <p className="text-muted-foreground">Інтелектуальна система розрахунку оптимальних маршрутів доставки</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Панель управління */}
        <div className="lg:col-span-1 space-y-4">
          {/* Вибір складу та часу */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Параметри відправлення</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Склад відправлення</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder="Оберіть склад" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockWarehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {warehouse && (
                  <p className="text-sm text-muted-foreground">{warehouse.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure-time">Час відправлення</Label>
                <Input 
                  id="departure-time"
                  type="time" 
                  value={departureTime} 
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Вибір водія та транспорту */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Водій та транспорт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Водій</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Оберіть водія" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id} disabled={driver.isBusy}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {driver && (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
                  <p>
                    <span className="font-medium">Ставка:</span> {driver.hourlyRate} грн/год
                  </p>
                  <p>
                    <span className="font-medium">Години:</span> {driver.workHoursThisWeek}/{driver.maxHoursPerWeek} (залишилось {driver.maxHoursPerWeek - driver.workHoursThisWeek}г)
                  </p>
                  <p>
                    <span className="font-medium">Статус:</span> {driver.isBusy ? <Badge variant="outline">Зайнятий</Badge> : <Badge variant="outline" className="border-green-500">Вільний</Badge>}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="vehicle">Транспорт (фура)</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Оберіть транспорт" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} ({vehicle.plateNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {vehicle && (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
                  <p>
                    <span className="font-medium">Модель:</span> {vehicle.model}
                  </p>
                  <p>
                    <span className="font-medium">Номер:</span> {vehicle.plateNumber}
                  </p>
                  <p>
                    <span className="font-medium">Розхід:</span> {vehicle.fuelConsumption} л/100км
                  </p>
                  <p>
                    <span className="font-medium">Потужність:</span> {vehicle.power} к.с.
                  </p>
                  {trailer && (
                    <>
                      <p className="font-medium mt-2">Причіп:</p>
                      <p>
                        <span className="font-medium">Тип:</span> {trailer.type}
                      </p>
                      <p>
                        <span className="font-medium">Розміри:</span> {trailer.length}м x {trailer.width}м
                      </p>
                      <p>
                        <span className="font-medium">Макс. вага:</span> {trailer.maxWeight} кг
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Розрахунок витрат */}
          {costs && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Розрахунок витрат
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Відстань:</span>
                  <span className="font-medium">{costs.distance} км</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Паливо:</span>
                  <span className="font-medium">{costs.fuelConsumption} л</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Вартість палива:</span>
                  <span className="font-medium">{costs.fuelCost} грн</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Час в дорозі:</span>
                  <span className="font-medium">{costs.estimatedTime} год</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Зарплата водія:</span>
                  <span className="font-medium">{costs.driverSalary} грн</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Загальна вартість:</span>
                  <span className="text-primary">{costs.totalCost} грн</span>
                </div>

                {costs.hoursOverload && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Водій перевищить ліміт на {(parseFloat(costs.estimatedTime) - parseFloat(costs.hoursLeft)).toFixed(1)} год</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button onClick={handleGenerateRoute} className="w-full" size="lg">
            Створити маршрут
          </Button>
        </div>

        {/* Карта та точки */}
        <div className="lg:col-span-2 space-y-4">
          {/* Карта */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Карта маршруту
              </CardTitle>
              {warehouse && (
                <CardDescription>
                  <Warehouse className="h-3 w-3 inline mr-1" />
                  Відправлення з: {warehouse.name} о {departureTime}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapComponent
                  points={mapPoints}
                  center={mapCenter} 
                  zoom={12} 
                />
              </div>
              {selectedPoints.length > 0 && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2">Порядок доставки (за терміновістю):</p>
                  <ol className="text-sm space-y-1">
                    {costs?.sortedPoints.map((point, index) => (
                      <li key={point.id}>
                        {index + 1}. {point.name} <Badge variant="outline" className="ml-2">Пріоритет: {point.priority}</Badge>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Точки доставки */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Точки доставки</CardTitle>
              <CardDescription>Оберіть точки для включення в маршрут</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {routePoints.map((point) => (
                  <div key={point.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id={point.id} checked={selectedPoints.includes(point.id)} onCheckedChange={() => togglePoint(point.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <label htmlFor={point.id} className="font-medium cursor-pointer">
                          {point.name}
                        </label>
                        <Badge variant={point.priority >= 8 ? "destructive" : point.priority >= 5 ? "default" : "secondary"}>Пріоритет: {point.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{point.address}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <Package className="h-3 w-3 inline mr-1" />
                          {point.order.products.length} товарів
                        </span>
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => viewOrderDetails(point)}>
                          Деталі замовлення
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Діалог деталей замовлення */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-2xl z-[9999]">
          <DialogHeader>
            <DialogTitle>Деталі замовлення</DialogTitle>
            <DialogDescription>{selectedOrder?.name}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Адреса</p>
                  <p className="font-medium">{selectedOrder.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Терміновість</p>
                  <p className="font-medium">{selectedOrder.priority}/10</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Товари в замовленні</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Кількість</TableHead>
                      <TableHead>Вага</TableHead>
                      <TableHead>Терміновість</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order.products.map((orderProduct) => {
                      const product = getProductById(orderProduct.productId);
                      if (!product) return null;
                      return (
                        <TableRow key={orderProduct.productId}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.type}</Badge>
                          </TableCell>
                          <TableCell>{orderProduct.quantity} од.</TableCell>
                          <TableCell>{orderProduct.weight} кг</TableCell>
                          <TableCell>
                            <Badge variant={product.urgencyCoefficient >= 8 ? "destructive" : "default"}>{product.urgencyCoefficient}/10</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Загальна вага замовлення:</span>{" "}
                  {selectedOrder.order.products.reduce((sum, p) => sum + p.weight, 0)} кг
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
