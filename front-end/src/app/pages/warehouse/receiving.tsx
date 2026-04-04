import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { ArrowDownToLine, Check, Package, Truck } from "lucide-react";
import { toast } from "sonner";

interface IncomingDelivery {
  id: string;
  deliveryNumber: string;
  supplier: string;
  products: IncomingProduct[];
  arrivalTime: string;
  status: "pending" | "processing" | "completed";
}

interface IncomingProduct {
  id: string;
  name: string;
  expectedQuantity: number;
  receivedQuantity: number;
  unit: string;
  shelf: string;
}

const incomingDeliveries: IncomingDelivery[] = [
  {
    id: "1",
    deliveryNumber: "ПН-2026-0401-001",
    supplier: "Молокозавод №1",
    arrivalTime: "14:30",
    status: "pending",
    products: [
      { id: "1", name: "Молоко 2.5%", expectedQuantity: 120, receivedQuantity: 0, unit: "л", shelf: "A-12" },
      { id: "2", name: "Кефір", expectedQuantity: 80, receivedQuantity: 0, unit: "л", shelf: "A-13" },
      { id: "3", name: "Сметана", expectedQuantity: 50, receivedQuantity: 0, unit: "кг", shelf: "A-14" },
    ],
  },
  {
    id: "2",
    deliveryNumber: "ПН-2026-0401-002",
    supplier: "Хлібокомбінат",
    arrivalTime: "15:00",
    status: "pending",
    products: [
      { id: "4", name: "Хліб білий", expectedQuantity: 200, receivedQuantity: 0, unit: "шт", shelf: "B-05" },
      { id: "5", name: "Батон", expectedQuantity: 150, receivedQuantity: 0, unit: "шт", shelf: "B-06" },
    ],
  },
];

export default function WarehouseReceivingPage() {
  const [deliveries, setDeliveries] = useState(incomingDeliveries);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);

  const handleReceiveProduct = (deliveryId: string, productId: string, quantity: number) => {
    const clampedQuantity = Math.max(0, quantity);
    setDeliveries(prev => prev.map(delivery => {
      if (delivery.id === deliveryId) {
        return {
          ...delivery,
          products: delivery.products.map(product => {
            if (product.id === productId) {
              return { ...product, receivedQuantity: clampedQuantity };
            }
            return product;
          }),
        };
      }
      return delivery;
    }));
  };

  const handleCompleteDelivery = (deliveryId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    const allReceived = delivery.products.every(p => p.receivedQuantity > 0);
    if (!allReceived) {
      toast.error("Не всі товари прийнято");
      return;
    }

    setDeliveries(prev => prev.map(d => 
      d.id === deliveryId ? { ...d, status: "completed" as const } : d
    ));
    toast.success("Приймання завершено, товари додано на баланс");
  };

  const pendingDeliveries = deliveries.filter(d => d.status === "pending").length;
  const completedToday = deliveries.filter(d => d.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Прийом товарів</h1>
        <p className="text-muted-foreground">
          Приймання товарів на баланс складу
        </p>
      </div>

      {/* Статистика */}
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
                <p className="text-sm text-muted-foreground mb-1">Прийнято сьогодні</p>
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
                <p className="text-sm text-muted-foreground mb-1">Товарних позицій</p>
                <p className="text-3xl font-bold">
                  {deliveries.reduce((sum, d) => sum + d.products.length, 0)}
                </p>
              </div>
              <Package className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список поставок */}
      <div className="space-y-4">
        {deliveries.map((delivery) => {
          const isExpanded = expandedDelivery === delivery.id;
          const allProductsReceived = delivery.products.every(p => p.receivedQuantity > 0);
          
          return (
            <Card key={delivery.id} className={delivery.status === "completed" ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {delivery.deliveryNumber}
                      </CardTitle>
                      <Badge variant={delivery.status === "completed" ? "default" : "outline"}>
                        {delivery.status === "completed" ? "Завершено" : "Очікується"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Постачальник: {delivery.supplier} • Прибуття: {delivery.arrivalTime}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedDelivery(isExpanded ? null : delivery.id)}
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
                        <TableHead className="hidden md:table-cell">Стелаж</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delivery.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {product.expectedQuantity} {product.unit}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                value={product.receivedQuantity || ""}
                                onChange={(e) => handleReceiveProduct(
                                  delivery.id,
                                  product.id,
                                  parseInt(e.target.value) || 0
                                )}
                                className="w-24"
                                placeholder="0"
                                disabled={delivery.status === "completed"}
                              />
                              <span className="text-sm text-muted-foreground">{product.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{product.shelf}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {delivery.status !== "completed" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Заповнити всі очікувані значення
                          delivery.products.forEach(product => {
                            handleReceiveProduct(delivery.id, product.id, product.expectedQuantity);
                          });
                          toast.success("Заповнено очікувані значення");
                        }}
                      >
                        Заповнити всі
                      </Button>
                      <Button
                        onClick={() => handleCompleteDelivery(delivery.id)}
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
    </div>
  );
}
