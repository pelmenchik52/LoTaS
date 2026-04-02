import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Plus, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryRequest, Product, OrderProduct } from "../../types";

const mockProducts: Product[] = [
  { id: "1", name: "Молоко", type: "Швидкопсувний", weight: 1, urgencyCoefficient: 9, expirationDays: 7, active: true },
  { id: "2", name: "Хліб", type: "Швидкопсувний", weight: 0.5, urgencyCoefficient: 8, expirationDays: 3, active: true },
  { id: "3", name: "М'ясо", type: "Заморожений", weight: 2, urgencyCoefficient: 10, expirationDays: 1, active: true },
  { id: "4", name: "Консерви", type: "Звичайний", weight: 0.4, urgencyCoefficient: 3, active: true },
  { id: "5", name: "Крупи", type: "Звичайний", weight: 1, urgencyCoefficient: 2, active: true },
];

const initialRequests: DeliveryRequest[] = [
  {
    id: "1",
    warehouseId: "Склад 1",
    requestedBy: "Іван Петренко",
    products: [
      { productId: "1", quantity: 200, weight: 200 },
      { productId: "2", quantity: 150, weight: 75 },
    ],
    status: "pending",
    createdAt: new Date(2026, 3, 1),
    managerId: null,
  },
  {
    id: "2",
    warehouseId: "Склад 1",
    requestedBy: "Іван Петренко",
    products: [{ productId: "3", quantity: 100, weight: 200 }],
    status: "approved",
    createdAt: new Date(2026, 2, 28),
    managerId: "manager1",
  },
  {
    id: "3",
    warehouseId: "Склад 1",
    requestedBy: "Іван Петренко",
    products: [{ productId: "4", quantity: 300, weight: 120 }],
    status: "completed",
    createdAt: new Date(2026, 2, 25),
    managerId: "manager1",
  },
];

export default function WarehouseRequestsPage() {
  const [requests, setRequests] = useState<DeliveryRequest[]>(initialRequests);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const currentWarehouse = "Склад 1"; // В реальності буде з localStorage

  const getProductById = (id: string) => mockProducts.find((p) => p.id === id);

  const handleAddProduct = () => {
    if (!currentProduct || !currentQuantity) {
      toast.error("Оберіть товар та вкажіть кількість");
      return;
    }

    const product = getProductById(currentProduct);
    if (!product) return;

    const quantity = parseInt(currentQuantity);
    const weight = quantity * product.weight;

    setSelectedProducts([...selectedProducts, { productId: currentProduct, quantity, weight }]);
    setCurrentProduct("");
    setCurrentQuantity("");
    toast.success("Товар додано до запиту");
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
  };

  const handleSubmitRequest = () => {
    if (selectedProducts.length === 0) {
      toast.error("Додайте хоча б один товар");
      return;
    }

    const newRequest: DeliveryRequest = {
      id: Date.now().toString(),
      warehouseId: currentWarehouse,
      requestedBy: "Іван Петренко", // В реальності з localStorage
      products: selectedProducts,
      status: "pending",
      createdAt: new Date(),
      managerId: null,
    };

    setRequests([newRequest, ...requests]);
    setSelectedProducts([]);
    setNotes("");
    setIsDialogOpen(false);
    toast.success("Запит на доставку відправлено менеджеру");
  };

  const statusLabels = {
    pending: "Очікує",
    approved: "Схвалено",
    rejected: "Відхилено",
    completed: "Виконано",
  };

  const statusVariants = {
    pending: "default" as const,
    approved: "default" as const,
    rejected: "destructive" as const,
    completed: "secondary" as const,
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    completed: CheckCircle,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Запити на доставку</h1>
          <p className="text-muted-foreground">Створення запитів до менеджера на поповнення складу</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Новий запит
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новий запит на доставку</DialogTitle>
              <DialogDescription>Створення запиту на поповнення складу {currentWarehouse}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Додавання товарів */}
              <div className="space-y-4">
                <h4 className="font-semibold">Додати товари</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Товар</Label>
                    <Select value={currentProduct} onValueChange={setCurrentProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть товар" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Кількість</Label>
                    <Input type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} placeholder="100" />
                  </div>
                </div>
                <Button onClick={handleAddProduct} variant="outline" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Додати товар
                </Button>
              </div>

              {/* Список обраних товарів */}
              {selectedProducts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Товари в запиті</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead>Кількість</TableHead>
                          <TableHead>Вага</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map((item) => {
                          const product = getProductById(item.productId);
                          if (!product) return null;
                          return (
                            <TableRow key={item.productId}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{item.quantity} од.</TableCell>
                              <TableCell>{item.weight} кг</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(item.productId)}>
                                  Видалити
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p>
                      <span className="font-medium">Загальна вага:</span> {selectedProducts.reduce((sum, p) => sum + p.weight, 0)} кг
                    </p>
                  </div>
                </div>
              )}

              {/* Примітки */}
              <div className="space-y-2">
                <Label>Примітки (опціонально)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Додаткова інформація для менеджера..." rows={3} />
              </div>

              <Button onClick={handleSubmitRequest} className="w-full" size="lg">
                Відправити запит менеджеру
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Таблиця запитів */}
      <Card>
        <CardHeader>
          <CardTitle>Історія запитів</CardTitle>
          <CardDescription>Всі запити на доставку для {currentWarehouse}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Товари</TableHead>
                  <TableHead className="hidden md:table-cell">Загальна вага</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Менеджер</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const StatusIcon = statusIcons[request.status];
                  const totalWeight = request.products.reduce((sum, p) => sum + p.weight, 0);

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.createdAt.toLocaleDateString("uk-UA")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {request.products.length} {request.products.length === 1 ? "товар" : "товарів"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{totalWeight} кг</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[request.status]} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[request.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{request.managerId ? "Призначено" : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{requests.filter((r) => r.status === "pending").length}</p>
              <p className="text-sm text-muted-foreground">Очікують</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{requests.filter((r) => r.status === "approved").length}</p>
              <p className="text-sm text-muted-foreground">Схвалено</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{requests.filter((r) => r.status === "completed").length}</p>
              <p className="text-sm text-muted-foreground">Виконано</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{requests.length}</p>
              <p className="text-sm text-muted-foreground">Всього</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
