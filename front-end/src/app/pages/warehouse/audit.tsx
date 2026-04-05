import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { ClipboardCheck, Search, AlertTriangle, CheckCircle, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi, authApi, type StockDto } from "../../../api";
import { WarehouseSelector } from "../../components/warehouse-selector";

interface AuditProduct {
  id: string;
  name: string;
  category: string;
  shelf: string;
  systemQuantity: number;
  actualQuantity: number | null;
  unit: string;
  status: "not-checked" | "match" | "shortage" | "surplus";
}

const statusConfig = {
  "not-checked": { label: "Не звірено", color: "text-gray-600 border-gray-600" },
  "match": { label: "Збігається", color: "text-green-600 border-green-600" },
  "shortage": { label: "Недостача", color: "text-red-600 border-red-600" },
  "surplus": { label: "Надлишок", color: "text-orange-600 border-orange-600" },
};

export default function WarehouseAuditPage() {
  const [products, setProducts] = useState<AuditProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuditStarted, setIsAuditStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState(() => {
    const stored = Number(localStorage.getItem("selectedWarehouse") ?? "0");
    return stored || (authApi.getWarehouseIds()[0] ?? 0);
  });

  useEffect(() => {
    const loadStock = async () => {
      try {
        setLoading(true);
        if (!warehouseId) {
          toast.error("Спочатку оберіть склад");
          setLoading(false);
          return;
        }
        localStorage.setItem("selectedWarehouse", String(warehouseId));
        const stock = await warehouseApi.getStock(warehouseId);
        const mapped: AuditProduct[] = stock.map((s: StockDto) => ({
          id: String(s.id),
          name: s.productName,
          category: s.productType,
          shelf: s.shelf,
          systemQuantity: s.quantity,
          actualQuantity: null,
          unit: s.unit,
          status: "not-checked" as const,
        }));
        setProducts(mapped);
      } catch (err) {
        toast.error((err as Error).message || "Помилка завантаження залишків");
      } finally {
        setLoading(false);
      }
    };
    void loadStock();
  }, [warehouseId]);

  const handleWarehouseChange = (id: number) => {
    setWarehouseId(id);
    setProducts([]);
    setIsAuditStarted(false);
  };

  const handleSetActualQuantity = (id: string, value: string) => {
    let quantity = value === "" ? null : parseInt(value);
    if (quantity !== null && quantity < 0) quantity = 0;
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        let status: AuditProduct["status"] = "not-checked";
        if (quantity !== null) {
          if (quantity === product.systemQuantity) {
            status = "match";
          } else if (quantity < product.systemQuantity) {
            status = "shortage";
          } else {
            status = "surplus";
          }
        }
        return { ...product, actualQuantity: quantity, status };
      }
      return product;
    }));
  };

  const handleQuickAdjust = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const currentValue = product.actualQuantity ?? product.systemQuantity;
    const newValue = Math.max(0, currentValue + delta);
    handleSetActualQuantity(id, newValue.toString());
  };

  const handleStartAudit = () => {
    setIsAuditStarted(true);
    toast.success("Ревізію розпочато");
  };

  const handleCompleteAudit = () => {
    const notChecked = products.filter(p => p.actualQuantity === null).length;
    if (notChecked > 0) {
      toast.error(`Залишилось звірити ${notChecked} товарів`);
      return;
    }
    
    toast.success("Ревізію завершено, звіт відправлено бухгалтеру");
    setIsAuditStarted(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shelf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedCount = products.filter(p => p.actualQuantity !== null).length;
  const matchCount = products.filter(p => p.status === "match").length;
  const shortageCount = products.filter(p => p.status === "shortage").length;
  const surplusCount = products.filter(p => p.status === "surplus").length;
  const progress = products.length > 0 ? (checkedCount / products.length) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ревізія (Аудит)</h1>
            <p className="text-muted-foreground">Звірка фактичної кількості з системною</p>
          </div>
          <WarehouseSelector value={warehouseId} onChange={handleWarehouseChange} />
        </div>
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Завантаження залишків для ревізії...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ревізія (Аудит)</h1>
            <p className="text-muted-foreground">Звірка фактичної кількості з системною</p>
          </div>
          <WarehouseSelector value={warehouseId} onChange={handleWarehouseChange} />
        </div>
        <div className="p-6 rounded-lg border border-muted bg-muted/50 text-center text-sm text-muted-foreground">
          На складі немає товарів для ревізії.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ревізія (Аудит)</h1>
          <p className="text-muted-foreground">
            Звірка фактичної кількості з системною
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WarehouseSelector value={warehouseId} onChange={handleWarehouseChange} />
          {!isAuditStarted ? (
            <Button onClick={handleStartAudit} className="gap-2" disabled={loading}>
              <ClipboardCheck className="h-4 w-4" />
              Розпочати ревізію
            </Button>
          ) : (
            <Button onClick={handleCompleteAudit} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Завершити ревізію
            </Button>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Прогрес</p>
                <p className="text-3xl font-bold">{Math.round(progress)}%</p>
              </div>
              <ClipboardCheck className="h-10 w-10 text-blue-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {checkedCount} з {products.length} позицій
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Збігів</p>
                <p className="text-3xl font-bold">{matchCount}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Недостач</p>
                <p className="text-3xl font-bold">{shortageCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Надлишків</p>
                <p className="text-3xl font-bold">{surplusCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблиця ревізії */}
      <Card>
        <CardHeader>
          <CardTitle>Товари для ревізії</CardTitle>
          <CardDescription>
            <div className="flex gap-3 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Пошук товару або стелажу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead className="hidden md:table-cell">Стелаж</TableHead>
                  <TableHead>Має бути</TableHead>
                  <TableHead>Фактично</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const difference = product.actualQuantity !== null 
                    ? product.actualQuantity - product.systemQuantity 
                    : 0;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground md:hidden">{product.shelf}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{product.shelf}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {product.systemQuantity} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuickAdjust(product.id, -1)}
                            disabled={!isAuditStarted}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            value={product.actualQuantity ?? ""}
                            onChange={(e) => handleSetActualQuantity(product.id, e.target.value)}
                            className="w-20 text-center"
                            placeholder="?"
                            disabled={!isAuditStarted}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuickAdjust(product.id, 1)}
                            disabled={!isAuditStarted}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">{product.unit}</span>
                        </div>
                        {product.actualQuantity !== null && difference !== 0 && (
                          <div className={`text-xs mt-1 ${
                            difference > 0 ? "text-orange-600" : "text-red-600"
                          }`}>
                            {difference > 0 ? "+" : ""}{difference} {product.unit}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={statusConfig[product.status].color}
                        >
                          {statusConfig[product.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
