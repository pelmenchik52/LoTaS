import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { ArrowDownToLine, Check, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { authApi, warehouseApi, type DeliveryRequestDto } from "../../../api";

interface ReceivingRequest extends DeliveryRequestDto {
  products: (DeliveryRequestDto["products"][number] & { receivedQuantity: number })[];
}

export default function WarehouseReceivingPage() {
  const [requests, setRequests] = useState<ReceivingRequest[]>([]);
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const warehouseIds = authApi.getWarehouseIds();
  const warehouseId = warehouseIds[0] ?? 1;

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const data = await warehouseApi.getRequests(warehouseId);
        setRequests(data.map((req) => ({
          ...req,
          products: req.products.map((product) => ({ ...product, receivedQuantity: 0 })),
        })));
      } catch (err) {
        setError((err as Error)?.message || "Не вдалося завантажити запити");
      } finally {
        setLoading(false);
      }
    };

    void loadRequests();
  }, [warehouseId]);

  const handleReceiveProduct = (requestId: number, productId: number, quantity: number) => {
    const sanitizedQuantity = Math.max(0, quantity);
    setRequests((prev) => prev.map((request) => {
      if (request.id !== requestId) return request;
      return {
        ...request,
        products: request.products.map((product) =>
          product.productId === productId ? { ...product, receivedQuantity: sanitizedQuantity } : product
        ),
      };
    }));
  };

  const handleCompleteRequest = async (requestId: number) => {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    const allReceived = request.products.every((product) => product.receivedQuantity > 0);
    if (!allReceived) {
      toast.error("Не всі товари прийнято");
      return;
    }

    try {
      for (const product of request.products) {
        await warehouseApi.createTransaction({
          type: "receiving",
          warehouseId,
          productId: product.productId,
          quantity: product.receivedQuantity,
          notes: `Прийом з запиту ${request.id}`,
        });
      }

      setRequests((prev) => prev.map((item) =>
        item.id === requestId ? { ...item, status: "completed", products: item.products } : item
      ));
      toast.success("Приймання завершено, товари додано на баланс");
    } catch (err) {
      toast.error((err as Error)?.message || "Помилка під час приймання");
    }
  };

  const pendingDeliveries = requests.filter((r) => r.status === "pending").length;
  const completedToday = requests.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Прийом товарів</h1>
        <p className="text-muted-foreground">Приймання товарів на баланс складу</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Очікується</p>
                <p className="text-3xl font-bold">{pendingDeliveries}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Прийнято</p>
                <p className="text-3xl font-bold">{completedToday}</p>
              </div>
              <Check className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Позицій в запитах</p>
                <p className="text-3xl font-bold">{requests.reduce((sum, req) => sum + req.products.length, 0)}</p>
              </div>
              <Package className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-6 rounded-lg border border-muted bg-muted/50 text-center text-sm text-muted-foreground">Завантаження запитів...</div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-center text-sm text-destructive">{error}</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isExpanded = expandedRequest === request.id;
            const allProductsReceived = request.products.every((p) => p.receivedQuantity > 0);

            return (
              <Card key={request.id} className={request.status === "completed" ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">Запит #{request.id}</CardTitle>
                        <Badge variant={request.status === "completed" ? "default" : "outline"}>
                          {request.status === "completed" ? "Завершено" : request.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Склад: {request.warehouseName} • Замовник: {request.requestedByName}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                    >
                      {isExpanded ? "Згорнути" : "Прийняти товар"}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead className="hidden sm:table-cell">Очікується</TableHead>
                          <TableHead>Прийнято</TableHead>
                          <TableHead className="hidden md:table-cell">Вага</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {request.products.map((product) => (
                          <TableRow key={product.productId}>
                            <TableCell className="font-medium">{product.productName || `#${product.productId}`}</TableCell>
                            <TableCell className="hidden sm:table-cell">{product.quantity}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  value={product.receivedQuantity || ""}
                                  onChange={(e) => handleReceiveProduct(
                                    request.id,
                                    product.productId,
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="w-24"
                                  placeholder="0"
                                  disabled={request.status === "completed"}
                                />
                                <span className="text-sm text-muted-foreground">шт</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{product.weight ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {request.status !== "completed" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            request.products.forEach((product) => {
                              handleReceiveProduct(request.id, product.productId, product.quantity);
                            });
                            toast.success("Заповнено очікувані значення");
                          }}
                        >
                          Заповнити всі
                        </Button>
                        <Button
                          onClick={() => handleCompleteRequest(request.id)}
                          disabled={!allProductsReceived}
                          className="gap-2"
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                          Завершити приймання
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
