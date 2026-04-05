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
  Fuel,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi, warehouseApi, companyRequestApi } from "../../../api";
import type {
  DriverDto,
  VehicleDto,
  WarehouseDto,
  CompanyRequestDto,
  StockDto,
} from "../../../api";
import { MapComponent } from "../../components/map-component";

/* ── helpers ─────────────────────────────────────────────────────── */

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

interface WarehouseAssignment {
  warehouse: WarehouseDto;
  /** productId → available quantity on this warehouse */
  products: Map<number, number>;
  /** Which company request IDs this warehouse fulfils */
  forRequests: Set<number>;
}

/* ── component ───────────────────────────────────────────────────── */

export default function ManagerRoutesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [companyRequests, setCompanyRequests] = useState<CompanyRequestDto[]>([]);
  const [allStock, setAllStock] = useState<Map<number, StockDto[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [departureTime, setDepartureTime] = useState("08:00");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<number>>(
    new Set()
  );
  const [distance, setDistance] = useState<number>(0);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [fuelPrice, setFuelPrice] = useState<string>("52");

  // auto-computed warehouses
  const [warehouseAssignments, setWarehouseAssignments] = useState<WarehouseAssignment[]>([]);

  // detail dialog
  const [detailCompanyRequest, setDetailCompanyRequest] =
    useState<CompanyRequestDto | null>(null);

  /* ── data loading ──────────────────────────────────────────────── */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warehousesData, driversData, vehiclesData, companyData] =
        await Promise.all([
          warehouseApi.getWarehouses(),
          managerApi.getDrivers(),
          managerApi.getVehicles(),
          companyRequestApi.getAll(),
        ]);
      setWarehouses(warehousesData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setCompanyRequests(companyData);

      // Load stock for all active warehouses
      const activeWarehouses = warehousesData.filter((w) => w.active);
      const stockMap = new Map<number, StockDto[]>();
      await Promise.all(
        activeWarehouses.map(async (wh) => {
          try {
            const stock = await warehouseApi.getStock(wh.id);
            stockMap.set(wh.id, stock);
          } catch { /* skip */ }
        })
      );
      setAllStock(stockMap);
    } catch {
      toast.error("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  };

  /* ── derived ───────────────────────────────────────────────────── */

  const pendingCompanyRequests = useMemo(() => companyRequests.filter(
    (r) => r.status === "new" || r.status === "approved"
  ), [companyRequests]);

  const availableDrivers = drivers.filter((d) => d.active && !d.isBusy);
  const availableVehicles = vehicles.filter((v) => v.active);

  const selectedDriver = drivers.find((d) => String(d.id) === selectedDriverId);
  const selectedVehicle2 = vehicles.find((v) => String(v.id) === selectedVehicleId);

  // Auto-select warehouses based on product availability + proximity
  useEffect(() => {
    if (selectedCompanyIds.size === 0) {
      setWarehouseAssignments([]);
      return;
    }
    const selectedReqs = pendingCompanyRequests.filter((r) => selectedCompanyIds.has(r.id));
    if (selectedReqs.length === 0) { setWarehouseAssignments([]); return; }

    // Collect all needed products: productId → total quantity needed
    const needed = new Map<number, number>();
    for (const req of selectedReqs) {
      for (const p of req.products) {
        needed.set(p.productId, (needed.get(p.productId) || 0) + p.quantity);
      }
    }

    // Compute centroid of delivery points for proximity scoring
    const centroid = {
      lat: selectedReqs.reduce((s, r) => s + (r.deliveryLat || 0), 0) / selectedReqs.length,
      lng: selectedReqs.reduce((s, r) => s + (r.deliveryLng || 0), 0) / selectedReqs.length,
    };

    // Score each warehouse: does it have stock? how close is it?
    const activeWarehouses = warehouses.filter((w) => w.active);
    const warehouseScores: {
      wh: WarehouseDto;
      stock: StockDto[];
      dist: number;
      productCoverage: Map<number, number>;
    }[] = [];

    for (const wh of activeWarehouses) {
      const stock = allStock.get(wh.id) || [];
      const productCoverage = new Map<number, number>();
      for (const [pid, qtyNeeded] of needed) {
        const s = stock.find((st) => st.productId === pid);
        if (s && s.quantity > 0) {
          productCoverage.set(pid, Math.min(s.quantity, qtyNeeded));
        }
      }
      if (productCoverage.size > 0) {
        warehouseScores.push({
          wh,
          stock,
          dist: haversine(centroid, wh),
          productCoverage,
        });
      }
    }

    // Greedy: pick warehouses that cover most remaining products, tiebreak by distance
    const remaining = new Map(needed);
    const assignments: WarehouseAssignment[] = [];

    while (remaining.size > 0 && warehouseScores.length > 0) {
      // Recalculate what each warehouse can still provide
      let best: typeof warehouseScores[0] | null = null;
      let bestScore = -1;
      for (const ws of warehouseScores) {
        let canProvide = 0;
        for (const [pid, qtyNeeded] of remaining) {
          const s = ws.stock.find((st) => st.productId === pid);
          if (s && s.quantity > 0) canProvide += Math.min(s.quantity, qtyNeeded);
        }
        // Score = coverage / distance (closer + more stock = better)
        const score = canProvide / (ws.dist + 1);
        if (score > bestScore) {
          bestScore = score;
          best = ws;
        }
      }
      if (!best || bestScore <= 0) break;

      const assigned = new Map<number, number>();
      const forRequests = new Set<number>();
      for (const [pid, qtyNeeded] of remaining) {
        const s = best.stock.find((st) => st.productId === pid);
        if (s && s.quantity > 0) {
          const take = Math.min(s.quantity, qtyNeeded);
          assigned.set(pid, take);
          const leftover = qtyNeeded - take;
          if (leftover <= 0) remaining.delete(pid);
          else remaining.set(pid, leftover);
        }
      }
      // Find which requests this warehouse covers
      for (const req of selectedReqs) {
        if (req.products.some((p) => assigned.has(p.productId))) {
          forRequests.add(req.id);
        }
      }

      assignments.push({ warehouse: best.wh, products: assigned, forRequests });
      // Remove this warehouse from candidates
      const idx = warehouseScores.indexOf(best);
      warehouseScores.splice(idx, 1);
    }

    setWarehouseAssignments(assignments);
  }, [selectedCompanyIds, pendingCompanyRequests, warehouses, allStock]);

  const distanceNum = distance;
  const fuelPriceNum = parseFloat(fuelPrice) || 0;
  const AVERAGE_SPEED = 50;
  const estimatedTime = distanceNum / AVERAGE_SPEED;
  const fuelCost = selectedVehicle2 ? (distanceNum / 100) * selectedVehicle2.fuelConsumption * fuelPriceNum : 0;
  const driverSalary = selectedDriver ? estimatedTime * selectedDriver.hourlyRate : 0;
  const totalCost = fuelCost + driverSalary;
  const totalCargoWeight = useMemo(() => {
    return pendingCompanyRequests
      .filter((r) => selectedCompanyIds.has(r.id))
      .reduce((sum, r) => sum + r.products.reduce((s, p) => s + p.weight * p.quantity, 0), 0);
  }, [pendingCompanyRequests, selectedCompanyIds]);

  // Check for missing products (no warehouse has them)
  const missingProducts = useMemo(() => {
    const selectedReqs = pendingCompanyRequests.filter((r) => selectedCompanyIds.has(r.id));
    const needed = new Map<number, { name: string; qty: number }>();
    for (const req of selectedReqs) {
      for (const p of req.products) {
        const existing = needed.get(p.productId);
        needed.set(p.productId, {
          name: p.productName || `#${p.productId}`,
          qty: (existing?.qty || 0) + p.quantity,
        });
      }
    }
    // Subtract what warehouses provide
    for (const a of warehouseAssignments) {
      for (const [pid, qty] of a.products) {
        const n = needed.get(pid);
        if (n) {
          n.qty -= qty;
          if (n.qty <= 0) needed.delete(pid);
        }
      }
    }
    return Array.from(needed.values()).filter((n) => n.qty > 0);
  }, [pendingCompanyRequests, selectedCompanyIds, warehouseAssignments]);

  // Auto-calculate route distance via OSRM (warehouse stops + delivery points)
  useEffect(() => {
    if (warehouseAssignments.length === 0 || selectedCompanyIds.size === 0) {
      setDistance(0);
      return;
    }
    const selectedReqs = pendingCompanyRequests.filter((r) => selectedCompanyIds.has(r.id));
    const validReqs = selectedReqs.filter((r) => r.deliveryLat && r.deliveryLng);
    if (validReqs.length === 0) { setDistance(0); return; }

    // Build route: warehouses first (sorted by proximity to first delivery), then deliveries
    const whPoints = warehouseAssignments.map((a) => ({
      lat: a.warehouse.lat, lng: a.warehouse.lng,
    }));
    const delPoints = validReqs.map((r) => ({ lat: r.deliveryLat, lng: r.deliveryLng }));
    const allPoints = [...whPoints, ...delPoints];

    const coords = allPoints.map((p) => `${p.lng},${p.lat}`).join(";");

    let cancelled = false;
    setCalculatingDistance(true);

    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.routes?.[0]) {
          setDistance(Math.round(data.routes[0].distance / 1000 * 10) / 10);
        }
      })
      .catch(() => {
        if (cancelled) return;
        let total = 0;
        for (let i = 1; i < allPoints.length; i++) {
          total += haversine(allPoints[i - 1], allPoints[i]);
        }
        setDistance(Math.round(total * 10) / 10);
      })
      .finally(() => { if (!cancelled) setCalculatingDistance(false); });

    return () => { cancelled = true; };
  }, [warehouseAssignments, selectedCompanyIds, pendingCompanyRequests]);

    const mapPoints = useMemo(() => {
        const pts: {
            id: string;
            name: string;
            address: string;
            lat: number;
            lng: number;
            priority: number;
        }[] = [];

        for (const a of warehouseAssignments) {
            pts.push({
                id: `wh-${a.warehouse.id}`,
                name: `📦 ${a.warehouse.name}`,
                address: a.warehouse.address,
                lat: a.warehouse.lat,
                lng: a.warehouse.lng,
                priority: 0,
            });
        }

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
    }, [warehouseAssignments, selectedCompanyIds, pendingCompanyRequests]);

  /* ── handlers ──────────────────────────────────────────────────── */

  const handleToggleCompanyRequest = (id: number) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateRoute = async () => {
    if (warehouseAssignments.length === 0) {
      toast.error("Немає складів з потрібними товарами");
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
    if (selectedCompanyIds.size === 0) {
      toast.error("Оберіть хоча б одну точку доставки");
      return;
    }
    if (distanceNum <= 0) {
      toast.error("Зачекайте розрахунок відстані");
      return;
    }
    if (fuelPriceNum <= 0) {
      toast.error("Вкажіть ціну палива");
      return;
    }
    if (missingProducts.length > 0) {
      toast.error(`Не знайдено на складах: ${missingProducts.map((p) => p.name).join(", ")}`);
      return;
    }
    try {
      setSaving(true);
      const selectedCompany = pendingCompanyRequests.filter((r) =>
        selectedCompanyIds.has(r.id)
      );

      const whNames = warehouseAssignments.map((a) => a.warehouse.name).join(" → ");
      const toNames = selectedCompany
        .map((r) => `${r.companyName} (${r.deliveryAddress})`)
        .join(", ");

      // Build orders: one order per warehouse→delivery pair
      const orders: { from: string; to: string; urgency: number; products: { productId: number; productName?: string; quantity: number; weight: number }[] }[] = [];
      for (const assignment of warehouseAssignments) {
        for (const req of selectedCompany) {
          if (!assignment.forRequests.has(req.id)) continue;
          const orderProducts = req.products
            .filter((p) => assignment.products.has(p.productId))
            .map((p) => ({
              productId: p.productId,
              productName: p.productName,
              quantity: Math.min(p.quantity, assignment.products.get(p.productId) || 0),
              weight: p.weight,
            }))
            .filter((p) => p.quantity > 0);
          if (orderProducts.length > 0) {
            orders.push({
              from: assignment.warehouse.name,
              to: `${req.companyName} (${req.deliveryAddress})`,
              urgency: req.urgency,
              products: orderProducts,
            });
          }
        }
      }

      await managerApi.createRoute({
        from: whNames,
        to: toNames,
        distance: distanceNum,
        estimatedTime: Math.round(estimatedTime * 100) / 100,
        driverId: Number(selectedDriverId),
        vehicleId: Number(selectedVehicleId),
        fuelPrice: fuelPriceNum,
        orders,
      });
      await Promise.all(
        selectedCompany.map((r) => companyRequestApi.updateStatus(r.id, "processing"))
      );
      toast.success("Маршрут створено. Передайте на склад для відвантаження.");
      setSelectedCompanyIds(new Set());
      setDistance(0);
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
              <CardTitle>Параметри маршруту</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Час відправлення</Label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Відстань (км)</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                    {calculatingDistance ? (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Розрахунок...
                      </span>
                    ) : distanceNum > 0 ? (
                      <span className="font-medium">{distanceNum} км</span>
                    ) : (
                      <span className="text-muted-foreground">Оберіть точки</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ціна палива (грн/л)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="52"
                    value={fuelPrice}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v < 0) { setFuelPrice("0"); return; }
                      setFuelPrice(e.target.value);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-detected warehouses */}
          {warehouseAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Склади для завантаження
                </CardTitle>
                <CardDescription>
                  Автоматично підібрані за наявністю товарів та близькістю
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouseAssignments.map((a) => (
                  <div key={a.warehouse.id} className="border rounded-lg p-3 space-y-1">
                    <p className="font-semibold">{a.warehouse.name}</p>
                    <p className="text-xs text-muted-foreground">{a.warehouse.address}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(a.products).map(([pid, qty]) => {
                        const stockItem = (allStock.get(a.warehouse.id) || []).find((s) => s.productId === pid);
                        return (
                          <Badge key={pid} variant="outline" className="text-xs">
                            {stockItem?.productName || `#${pid}`}: {qty} шт
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Missing products warning */}
          {missingProducts.length > 0 && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-destructive mb-1">Товари не знайдені на складах:</p>
                <ul className="text-sm text-destructive space-y-0.5">
                  {missingProducts.map((p, i) => (
                    <li key={i}>• {p.name} ({p.qty} шт)</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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

          {/* Cost summary */}
          {distanceNum > 0 && selectedVehicle2 && selectedDriver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Розрахунок витрат
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5" /> Паливо
                  </span>
                  <span className="font-medium">{fuelCost.toFixed(2)} грн</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> Зарплата водія
                  </span>
                  <span className="font-medium">{driverSalary.toFixed(2)} грн</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Орієнтовний час
                  </span>
                  <span className="font-medium">{estimatedTime.toFixed(1)} год</span>
                </div>
                {selectedCompanyIds.size > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" /> Вага вантажу
                    </span>
                    <span className="font-medium">{totalCargoWeight.toFixed(1)} кг</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Загалом</span>
                  <span className="text-primary">{totalCost.toFixed(2)} грн</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create route button */}
          <Button
            className="w-full"
            size="lg"
            disabled={saving || missingProducts.length > 0}
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
                {warehouseAssignments.length > 0
                  ? `Склади: ${warehouseAssignments.map((a) => a.warehouse.name).join(", ")} • Відправлення о ${departureTime}`
                  : "Оберіть точки доставки для побудови маршруту"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px] w-full rounded-lg overflow-hidden border">
                <MapComponent
                  points={mapPoints}
                  center={
                    warehouseAssignments.length > 0
                      ? [warehouseAssignments[0].warehouse.lat, warehouseAssignments[0].warehouse.lng]
                      : [50.4501, 30.5234]
                  }
                  zoom={10}
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
              {pendingCompanyRequests.length === 0 ? (
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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