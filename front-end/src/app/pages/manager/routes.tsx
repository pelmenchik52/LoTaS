import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import {
  MapPin,
  Truck,
  Loader2,
  Package,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi, warehouseApi, companyRequestApi } from "../../../api";
import type {
  DriverDto,
  VehicleDto,
  DeliveryRequestDto,
  WarehouseDto,
  CompanyRequestDto,
} from "../../../api";
import { MapComponent } from "../../components/map-component";

/* ── component ───────────────────────────────────────────────────── */

export default function ManagerRoutesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [requests, setRequests] = useState<DeliveryRequestDto[]>([]);
  const [companyRequests, setCompanyRequests] = useState<CompanyRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [departureTime, setDepartureTime] = useState("08:00");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<number>>(
    new Set()
  );

  // detail dialog
  const [detailRequest, setDetailRequest] =
    useState<DeliveryRequestDto | null>(null);
  const [detailCompanyRequest, setDetailCompanyRequest] =
    useState<CompanyRequestDto | null>(null);

  /* ── data loading ──────────────────────────────────────────────── */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warehousesData, driversData, vehiclesData, requestsData, companyData] =
        await Promise.all([
          warehouseApi.getWarehouses(),
          managerApi.getDrivers(),
          managerApi.getVehicles(),
          managerApi.getRequests(),
          companyRequestApi.getAll(),
        ]);
      setWarehouses(warehousesData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setRequests(requestsData);
      setCompanyRequests(companyData);
    } catch {
      toast.error("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  };

  /* ── derived ───────────────────────────────────────────────────── */

  const selectedWarehouse = warehouses.find(
    (w) => w.id === Number(selectedWarehouseId)
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingCompanyRequests = companyRequests.filter(
    (r) => r.status === "new" || r.status === "approved" || r.status === "processing"
  );

  const availableDrivers = drivers.filter((d) => d.active && !d.isBusy);
  const availableVehicles = vehicles.filter((v) => v.active);

    const mapPoints = useMemo(() => {
        const pts: {
            id: string;
            name: string;
            address: string;
            lat: number;
            lng: number;
            priority: number;
        }[] = [];

        if (selectedWarehouse) {
            pts.push({
                id: `wh-${selectedWarehouse.id}`,
                name: selectedWarehouse.name,
                address: selectedWarehouse.address,
                lat: selectedWarehouse.lat,
                lng: selectedWarehouse.lng,
                priority: 0,
            });
        }

        pendingRequests
            .filter((r) => selectedRequestIds.has(r.id))
            .forEach((r) => {
                const wh = warehouses.find((w) => w.name === r.warehouseName);
                if (wh) {
                    pts.push({
                        id: `req-${r.id}`,
                        name: r.warehouseName,
                        address: wh.address,
                        lat: wh.lat,
                        lng: wh.lng,
                        priority: r.urgency,
                    });
                }
            });

        pendingCompanyRequests
            .filter((r) => selectedCompanyIds.has(r.id))
            .forEach((r) => {
                if (r.deliveryLat != null && r.deliveryLng != null) {
                    pts.push({
                        id: `cr-${r.id}`,
                        name: r.companyName,
                        address: r.deliveryAddress,
                        lat: r.deliveryLat,
                        lng: r.deliveryLng,
                        priority: r.urgency,
                    });
                }
            });

        return pts;
    }, [selectedWarehouse, selectedRequestIds, selectedCompanyIds, pendingRequests, pendingCompanyRequests, warehouses]);

  /* ── handlers ──────────────────────────────────────────────────── */

  const handleToggleRequest = (id: number) => {
    setSelectedRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleCompanyRequest = (id: number) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateRoute = async () => {
    if (!selectedWarehouse) {
      toast.error("Оберіть склад відправлення");
      return;
    }
    if (!selectedDriverId) {
      toast.error("Оберіть водія");
      return;
    }
    if (!selectedVehicleId) {
      toast.error("Оберіть транспорт");
      return;
    }
    if (selectedRequestIds.size === 0 && selectedCompanyIds.size === 0) {
      toast.error("Оберіть хоча б одну точку доставки");
      return;
    }
    try {
      setSaving(true);
      const selected = pendingRequests.filter((r) =>
        selectedRequestIds.has(r.id)
      );
      const selectedCompany = pendingCompanyRequests.filter((r) =>
        selectedCompanyIds.has(r.id)
      );
      const toNames = [
        ...selected.map((r) => r.warehouseName),
        ...selectedCompany.map((r) => `${r.companyName} (${r.deliveryAddress})`),
      ].join(", ");
      await managerApi.createRoute({
        from: selectedWarehouse.name,
        to: toNames,
        distance: 0,
        estimatedTime: 0,
        driverId: selectedDriverId ? Number(selectedDriverId) : undefined,
        vehicleId: selectedVehicleId ? Number(selectedVehicleId) : undefined,
        orders: [],
      });
      toast.success("Маршрут створено");
      setSelectedRequestIds(new Set());
      setSelectedCompanyIds(new Set());
      await loadData();
    } catch {
      toast.error("Помилка створення маршруту");
    } finally {
      setSaving(false);
    }
  };

  /* ── render ────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Завантаження...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Планування маршрутів</h1>
        <p className="text-muted-foreground">
          Інтелектуальна система розрахунку оптимальних маршрутів доставки
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6">
        {/* ── Left column ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Departure params */}
          <Card>
            <CardHeader>
              <CardTitle>Параметри відправлення</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Склад відправлення</Label>
                <Select
                  value={selectedWarehouseId}
                  onValueChange={setSelectedWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть склад" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.active)
                      .map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedWarehouse && (
                  <p className="text-sm text-muted-foreground">
                    {selectedWarehouse.address}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Час відправлення</Label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Driver & transport */}
          <Card>
            <CardHeader>
              <CardTitle>Водій та транспорт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Водій</Label>
                <Select
                  value={selectedDriverId}
                  onValueChange={setSelectedDriverId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть водія" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Транспорт (фура)</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={setSelectedVehicleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть транспорт" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.model} — {v.plateNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Create route button */}
          <Button
            className="w-full"
            size="lg"
            disabled={saving}
            onClick={handleCreateRoute}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Створити маршрут
          </Button>
        </div>

        {/* ── Right column ─────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Карта маршруту
              </CardTitle>
              <CardDescription>
                {selectedWarehouse
                  ? `Відправлення з: ${selectedWarehouse.name} о ${departureTime}`
                  : "Оберіть склад відправлення для перегляду карти"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px] w-full rounded-lg overflow-hidden border">
                <MapComponent
                  points={mapPoints}
                  center={
                    selectedWarehouse
                      ? [selectedWarehouse.lat, selectedWarehouse.lng]
                      : [50.4501, 30.5234]
                  }
                  zoom={12}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Точки доставки
              </CardTitle>
              <CardDescription>
                Оберіть точки для включення в маршрут
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 && pendingCompanyRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mb-2 opacity-30" />
                  <p>Немає запитів на доставку</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCompanyRequests.map((req) => (
                    <div
                      key={`cr-${req.id}`}
                      className="flex items-start gap-3 border rounded-lg p-4"
                    >
                      <Checkbox
                        checked={selectedCompanyIds.has(req.id)}
                        onCheckedChange={() => handleToggleCompanyRequest(req.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">
                            {req.companyName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="shrink-0">
                              Компанія
                            </Badge>
                            <Badge
                              variant="destructive"
                              className="shrink-0"
                            >
                              Пріоритет: {req.urgency}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {req.deliveryAddress}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {req.products.length} товарів
                          </span>
                          <span>{req.contactPerson} · {req.phone}</span>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => setDetailCompanyRequest(req)}
                          >
                            Деталі
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-start gap-3 border rounded-lg p-4"
                    >
                      <Checkbox
                        checked={selectedRequestIds.has(req.id)}
                        onCheckedChange={() => handleToggleRequest(req.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">
                            {req.warehouseName}
                          </p>
                          <Badge
                            variant="destructive"
                            className="shrink-0"
                          >
                            Пріоритет: {req.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Замовлення від {req.requestedByName}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {req.products.length} товарів
                          </span>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => setDetailRequest(req)}
                          >
                            Деталі замовлення
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Request detail dialog ────────────────────────────────── */}
      <Dialog
        open={!!detailRequest}
        onOpenChange={(open) => !open && setDetailRequest(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Деталі замовлення #{detailRequest?.id}
            </DialogTitle>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Склад</p>
                  <p className="font-medium">{detailRequest.warehouseName}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Замовник</p>
                  <p className="font-medium">
                    {detailRequest.requestedByName}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Терміновість</p>
                  <p className="font-medium">{detailRequest.urgency}/10</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Товарів</p>
                  <p className="font-medium">
                    {detailRequest.products.length}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Список товарів
                </Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {detailRequest.products.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border rounded-lg p-3"
                    >
                      <span className="font-medium text-sm">
                        {p.productName || `Товар ${p.productId}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {p.quantity} од. · {p.weight} кг
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Company request detail dialog ────────────────────────── */}
      <Dialog
        open={!!detailCompanyRequest}
        onOpenChange={(open) => !open && setDetailCompanyRequest(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Запит від компанії #{detailCompanyRequest?.id}
            </DialogTitle>
          </DialogHeader>
          {detailCompanyRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Компанія</p>
                  <p className="font-medium">{detailCompanyRequest.companyName}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Контакт</p>
                  <p className="font-medium">{detailCompanyRequest.contactPerson}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Телефон</p>
                  <p className="font-medium">{detailCompanyRequest.phone}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{detailCompanyRequest.email}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-muted-foreground">Адреса доставки</p>
                  <p className="font-medium">{detailCompanyRequest.deliveryAddress}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Терміновість</p>
                  <p className="font-medium">{detailCompanyRequest.urgency === 3 ? "Критичний" : detailCompanyRequest.urgency === 2 ? "Підвищений" : "Нормальний"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Товарів</p>
                  <p className="font-medium">{detailCompanyRequest.products.length}</p>
                </div>
              </div>
              {detailCompanyRequest.notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Примітки</p>
                  <p className="font-medium">{detailCompanyRequest.notes}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">
                  Список товарів
                </Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {detailCompanyRequest.products.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border rounded-lg p-3"
                    >
                      <span className="font-medium text-sm">
                        {p.productName || `Товар ${p.productId}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {p.quantity} од. · {p.weight} кг
                      </span>
                    </div>
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