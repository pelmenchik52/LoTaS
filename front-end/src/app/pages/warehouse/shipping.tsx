import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { ArrowUpFromLine, Package, Truck, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { authApi, warehouseApi, type RouteDto, type OrderDto } from "../../../api";
import { WarehouseSelector } from "../../components/warehouse-selector";

interface ShippingOrder extends OrderDto {
  routeName: string;
  driverName: string;
  vehicleModel: string;
  products: (OrderDto["products"][number] & { loaded: number })[];
}

export default function WarehouseShippingPage() {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [warehouseId, setWarehouseId] = useState(() => authApi.getWarehouseIds()[0] ?? 1);
  const [warehouseName, setWarehouseName] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get warehouse name
        const warehouses = await warehouseApi.getWarehouses();
        const wh = warehouses.find(w => w.id === warehouseId);
        if (!wh) throw new Error("Склад не знайдено");
        setWarehouseName(wh.name);

        // Get routes and filter orders for this warehouse
        const routes = await warehouseApi.getRoutes();
        const shippingOrders: ShippingOrder[] = [];

        for (const route of routes) {
          if (route.status === "assigned" || route.status === "in-progress") {
            for (const order of route.orders) {
              if (order.from === wh.name && order.status === "pending") {
                shippingOrders.push({
                  ...order,
                  routeName: `Маршрут #${route.id} (${route.to})`,
                  driverName: route.driverName || "Не призначено",
                  vehicleModel: route.vehicleModel || "Не призначено",
                  products: order.products.map(p => ({ ...p, loaded: 0 })),
                });
              }
            }
          }
        }

        setOrders(shippingOrders);
      } catch (err) {
        setError((err as Error)?.message || "Не вдалося завантажити дані");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [warehouseId]);

  const handleLoadProduct = (orderId: number, productId: number, isLoaded: boolean) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedProducts = order.products.map(product => {
        if (product.productId !== productId) return product;
        return { ...product, loaded: isLoaded ? product.quantity : 0 };
      });

      const allLoaded = updatedProducts.every(p => p.loaded === p.quantity);

      return {
        ...order,
        products: updatedProducts,
        status: allLoaded ? "in-progress" : order.status,
      };
    }));
  };

  const handleCompleteShipping = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const allLoaded = order.products.every(p => p.loaded === p.quantity);
    if (!allLoaded) {
      toast.error("Не всі товари завантажені");
      return;
    }

    try {
      for (const product of order.products) {
        await warehouseApi.createTransaction({
          type: "shipping",
          warehouseId,
          productId: product.productId,
          quantity: product.loaded,
          notes: `Відвантаження для замовлення ${order.id}`,
        });
      }

      // Update order status in backend
      await warehouseApi.updateOrderStatus(orderId, "shipped");

      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: "shipped" } : o
      ));
      toast.success("Відвантаження завершено, машина може виїжджати");
    } catch (err) {
      toast.error((err as Error)?.message || "Помилка під час відвантаження");
    }
  };

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedToday = orders.filter(o => o.status === "shipped").length;

  const getOrderProgress = (order: ShippingOrder) => {
    const totalProducts = order.products.length;
    const loadedProducts = order.products.filter(p => p.loaded === p.quantity).length;
    return (loadedProducts / totalProducts) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Відвантаження товарів</h1>
          <p className="text-muted-foreground">
            Завантаження товарів на транспорт для доставки
          </p>
        </div>
        <WarehouseSelector value={warehouseId} onChange={setWarehouseId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Очікують</p>
                <p className="text-3xl font-bold">{pendingOrders}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Завантажено сьогодні</p>
                <p className="text-3xl font-bold">{completedToday}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Товарних позицій</p>
                <p className="text-3xl font-bold">
                  {orders.reduce((sum, o) => sum + o.products.length, 0)}
                </p>
              </div>
              <Package className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-6 rounded-lg border border-muted bg-muted/50 text-center text-sm text-muted-foreground">Завантаження замовлень...</div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-center text-sm text-destructive">{error}</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const allLoaded = order.products.every(p => p.loaded === p.quantity);
            const progress = order.products.length > 0
              ? (order.products.filter(p => p.loaded === p.quantity).length / order.products.length) * 100
              : 0;

            return (
              <Card key={order.id} className={order.status === "completed" ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">Замовлення #{order.id}</CardTitle>
                        <Badge variant={order.status === "completed" ? "default" : "outline"}>
                          {order.status === "completed" ? "Завантажено" : order.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {order.routeName} • Водій: {order.driverName} • Транспорт: {order.vehicleModel}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      {isExpanded ? "Згорнути" : "Завантажити товар"}
                    </Button>
                  </div>

                  {order.status !== "completed" && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Прогрес завантаження</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead className="hidden sm:table-cell">Кількість</TableHead>
                          <TableHead>Статус</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.products.map((product) => {
                          const isLoaded = product.loaded === product.quantity;
                          return (
                            <TableRow key={product.productId} className={isLoaded ? "opacity-60" : ""}>
                              <TableCell className="font-medium">{product.productName || `#${product.productId}`}</TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {product.quantity} шт
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant={isLoaded ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleLoadProduct(order.id, product.productId, !isLoaded)}
                                  disabled={order.status === "completed"}
                                >
                                  {isLoaded ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Завантажено
                                    </>
                                  ) : (
                                    "Завантажити"
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {order.status !== "completed" && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleCompleteShipping(order.id)}
                          disabled={!allLoaded}
                          className="gap-2"
                        >
                          <ArrowUpFromLine className="h-4 w-4" />
                          Завершити відвантаження
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
