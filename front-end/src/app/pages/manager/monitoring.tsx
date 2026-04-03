import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Button } from "../../components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/alert-dialog";
import { Truck, MapPin, Clock, CheckCircle, AlertCircle, Navigation, AlertTriangle, XCircle } from "lucide-react";
import type { Driver, Vehicle } from "../../types";

interface Route {
  id: string;
  driverId: string;
  vehicleId: string;
  status: "on-time" | "delayed" | "completed" | "cancelled";
  progress: number;
  currentLocation: string;
  stops: number;
  completedStops: number;
  estimatedTime: string;
  actualTime?: string;
}

const mockDrivers: Driver[] = [
  { id: "1", name: "Дмитро Іваненко", phone: "+380 67 123 4567", license: "ABC123456", vehicleId: "1", hourlyRate: 150, workHoursPerDay: 8, workHoursThisWeek: 32, maxHoursPerWeek: 48, isBusy: true, active: true },
  { id: "2", name: "Андрій Мельник", phone: "+380 63 987 6543", license: "DEF789012", vehicleId: "2", hourlyRate: 160, workHoursPerDay: 8, workHoursThisWeek: 40, maxHoursPerWeek: 48, isBusy: true, active: true },
  { id: "3", name: "Василь Петров", phone: "+380 50 555 1234", license: "GHI345678", vehicleId: "3", hourlyRate: 145, workHoursPerDay: 8, workHoursThisWeek: 24, maxHoursPerWeek: 48, isBusy: false, active: true },
];

const mockVehicles: Vehicle[] = [
  { id: "1", model: "Mercedes Actros", plateNumber: "AA 1234 BB", fuelConsumption: 28.5, power: 450, trailerId: "1", fuelType: "diesel", capacity: 20000, active: true },
  { id: "2", model: "Volvo FH16", plateNumber: "AA 5678 BB", fuelConsumption: 30.0, power: 540, trailerId: "2", fuelType: "diesel", capacity: 18000, active: true },
  { id: "3", model: "MAN TGX", plateNumber: "AA 9012 CC", fuelConsumption: 27.5, power: 500, trailerId: null, fuelType: "diesel", capacity: 19000, active: true },
];

const initialRoutes: Route[] = [
  {
    id: "1",
    driverId: "1",
    vehicleId: "1",
    status: "on-time",
    progress: 65,
    currentLocation: "Поблизу Сільпо Центр",
    stops: 5,
    completedStops: 3,
    estimatedTime: "14:30",
  },
  {
    id: "2",
    driverId: "2",
    vehicleId: "2",
    status: "on-time",
    progress: 40,
    currentLocation: "На шляху до АТБ Подол",
    stops: 4,
    completedStops: 1,
    estimatedTime: "15:00",
  },
];

const statusConfig = {
  "on-time": {
    label: "Вчасно",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle,
  },
  delayed: {
    label: "Затримка",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: AlertCircle,
  },
  completed: {
    label: "Завершено",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Скасовано",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: XCircle,
  },
};

export default function ManagerMonitoringPage() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);

  const getDriverById = (id: string) => mockDrivers.find((d) => d.id === id);
  const getVehicleById = (id: string) => mockVehicles.find((v) => v.id === id);

  const handleCancelRoute = (routeId: string) => {
    setRoutes(
      routes.map((r) =>
        r.id === routeId
          ? {
              ...r,
              status: "cancelled",
              actualTime: "Скасовано",
            }
          : r
      )
    );
  };

  const activeRoutes = routes.filter((r) => r.status !== "completed" && r.status !== "cancelled");
  const completedRoutes = routes.filter((r) => r.status === "completed");
  const delayedRoutes = routes.filter((r) => r.status === "delayed");
  const cancelledRoutes = routes.filter((r) => r.status === "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Моніторинг виконання</h1>
        <p className="text-muted-foreground">Відстеження доставок в реальному часі та контроль водіїв</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активні маршруті</p>
                <p className="text-2xl font-bold">{activeRoutes.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Завершено</p>
                <p className="text-2xl font-bold">{completedRoutes.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Затримки</p>
                <p className="text-2xl font-bold">{delayedRoutes.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Скасовано</p>
                <p className="text-2xl font-bold">{cancelledRoutes.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список маршрутів */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Поточні маршрути</h2>

        {routes.map((route) => {
          const driver = getDriverById(route.driverId);
          const vehicle = getVehicleById(route.vehicleId);
          const config = statusConfig[route.status];
          const StatusIcon = config.icon;

          return (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {driver?.name || "Невідомий водій"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {vehicle?.model || "Невідомий транспорт"} ({vehicle?.plateNumber})
                    </CardDescription>
                  </div>
                  <Badge className={config.color + " border"}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Інформація про водія */}
                {driver && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted rounded-lg text-sm">
                    <div>
                      <p className="text-muted-foreground">Телефон</p>
                      <p className="font-medium">{driver.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Години цього тижня</p>
                      <p className="font-medium">
                        {driver.workHoursThisWeek} / {driver.maxHoursPerWeek}
                      </p>
                    </div>
                  </div>
                )}

                {/* Прогрес */}
                {route.status !== "cancelled" && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Прогрес: {route.completedStops} з {route.stops} зупинок
                        </span>
                        <span className="text-sm font-medium">{route.progress}%</span>
                      </div>
                      <Progress value={route.progress} className="h-2" />
                    </div>

                    {/* Локація та час */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Поточна локація</p>
                          <p className="text-sm text-muted-foreground">{route.currentLocation}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Очікуваний час завершення</p>
                          <p className="text-sm text-muted-foreground">{route.actualTime || route.estimatedTime}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Дії */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Navigation className="h-4 w-4" />
                    Відстежити на карті
                  </Button>
                  {route.status === "on-time" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Скасувати маршрут
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Це скасує поточний маршрут. Ви впевнені, що хочете продовжити?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancelRoute(route.id)}>
                            Скасувати маршрут
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Статус водіїв */}
      <Card>
        <CardHeader>
          <CardTitle>Статус всіх водіїв</CardTitle>
          <CardDescription>Моніторинг доступності водіїв</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockDrivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-right">
                    <p className="text-muted-foreground">Години тижня</p>
                    <p className="font-medium">
                      {driver.workHoursThisWeek}/{driver.maxHoursPerWeek}
                    </p>
                  </div>
                  <div>
                    {driver.isBusy ? (
                      <Badge variant="outline">Зайнятий</Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        Вільний
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}