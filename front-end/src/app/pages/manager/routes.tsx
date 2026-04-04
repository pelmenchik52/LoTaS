import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { MapPin, Truck, DollarSign, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../../../api";
import type { RouteDto, DriverDto, VehicleDto } from "../../../api";

export default function ManagerRoutesPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteDto | null>(null);
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, driversData, vehiclesData] = await Promise.all([
        managerApi.getRoutes(),
        managerApi.getDrivers(),
        managerApi.getVehicles(),
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
      await loadData();
      toast.success("Статус маршруту оновлено");
    } catch (error) {
      toast.error("Помилка оновлення статусу");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getDriverById = (id?: number) => drivers.find((d) => d.id === id);
  const getVehicleById = (id?: number) => vehicles.find((v) => v.id === id);

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