import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { ArrowUpFromLine, Package, Truck, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ShippingOrder {
  id: string;
  orderNumber: string;
  route: string;
  driver: string;
  vehicle: string;
  products: ShippingProduct[];
  status: "pending" | "in-progress" | "completed";
  deadline: string;
}

interface ShippingProduct {
  id: string;
  name: string;
  quantity: number;
  loaded: number;
  unit: string;
  shelf: string;
}

const shippingOrders: ShippingOrder[] = [
  {
    id: "1",
    orderNumber: "ВД-2026-0401-001",
    route: "Маршрут #147 (Київ)",
    driver: "Дмитро Іваненко",
    vehicle: "Mercedes Sprinter (AA 1234 BB)",
    deadline: "15:00",
    status: "pending",
    products: [
      { id: "1", name: "Молоко 2.5%", quantity: 120, loaded: 0, unit: "л", shelf: "A-12" },
      { id: "2", name: "Хліб білий", quantity: 85, loaded: 0, unit: "шт", shelf: "B-05" },
      { id: "3", name: "Яблука Голден", quantity: 50, loaded: 0, unit: "кг", shelf: "C-08" },
    ],
  },
  {
    id: "2",
    orderNumber: "ВД-2026-0401-002",
    route: "Маршрут #148 (Київ)",
    driver: "Андрій Мельник",
    vehicle: "Ford Transit (AA 5678 BB)",
    deadline: "16:00",
    status: "pending",
    products: [
      { id: "4", name: "Сир твердий", quantity: 15, loaded: 0, unit: "кг", shelf: "A-15" },
      { id: "5", name: "Макарони", quantity: 100, loaded: 0, unit: "уп", shelf: "D-03" },
    ],
  },
];

export default function WarehouseShippingPage() {
  const [orders, setOrders] = useState(shippingOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleLoadProduct = (orderId: string, productId: string, isLoaded: boolean) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedProducts = order.products.map(product => {
          if (product.id === productId) {
            return { ...product, loaded: isLoaded ? product.quantity : 0 };
          }
          return product;
        });
        
        // Перевіряємо, чи всі товари завантажені
        const allLoaded = updatedProducts.every(p => p.loaded === p.quantity);
        
        return {
          ...order,
          products: updatedProducts,
          status: allLoaded ? "in-progress" as const : order.status,
        };
      }
      return order;
    }));
  };

  const handleCompleteShipping = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const allLoaded = order.products.every(p => p.loaded === p.quantity);
    if (!allLoaded) {
      toast.error("Не всі товари завантажені");
      return;
    }

    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: "completed" as const } : o
    ));
    toast.success("Відвантаження завершено, машина може виїжджати");
  };

  const getOrderProgress = (order: ShippingOrder) => {
    const totalProducts = order.products.length;
    const loadedProducts = order.products.filter(p => p.loaded === p.quantity).length;
    return (loadedProducts / totalProducts) * 100;
  };

  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "in-progress").length;
  const completedToday = orders.filter(o => o.status === "completed").length;
  const totalProducts = orders.reduce((sum, o) => sum + o.products.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Відвантаження</h1>
        <p className="text-muted-foreground">
          Завантаження товарів у транспорт за планом менеджера
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">До відвантаження</p>
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
                <p className="text-sm text-muted-foreground mb-1">Відвантажено</p>
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
                <p className="text-3xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список замовлень */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id;
          const progress = getOrderProgress(order);
          const allLoaded = order.products.every(p => p.loaded === p.quantity);
          
          return (
            <Card key={order.id} className={order.status === "completed" ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                      <Badge variant={
                        order.status === "completed" ? "default" :
                        order.status === "in-progress" ? "outline" :
                        "secondary"
                      }>
                        {order.status === "completed" ? "Завершено" :
                         order.status === "in-progress" ? "В процесі" :
                         "Очікує"}
                      </Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div>Маршрут: {order.route}</div>
                      <div>Водій: {order.driver} • {order.vehicle}</div>
                      <div>Дедлайн: {order.deadline}</div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    disabled={order.status === "completed"}
                  >
                    {isExpanded ? "Згорнути" : "Завантажити"}
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
                        <TableHead className="hidden sm:table-cell">Стелаж</TableHead>
                        <TableHead>Кількість</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.products.map((product) => {
                        const isLoaded = product.loaded === product.quantity;
                        return (
                          <TableRow key={product.id} className={isLoaded ? "opacity-60" : ""}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{product.shelf}</Badge>
                            </TableCell>
                            <TableCell>
                              {product.quantity} {product.unit}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={isLoaded ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleLoadProduct(order.id, product.id, !isLoaded)}
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
    </div>
  );
}
