import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product, WarehouseStock } from "../../types";

const warehouses = ["Склад 1", "Склад 2", "Склад 3", "Склад 4", "Склад 5"];

const initialProducts: Product[] = [
  { id: "1", name: "Молоко", type: "Швидкопсувний", weight: 1, urgencyCoefficient: 9, expirationDays: 7, active: true },
  { id: "2", name: "Хліб", type: "Швидкопсувний", weight: 0.5, urgencyCoefficient: 8, expirationDays: 3, active: true },
  { id: "3", name: "Консерви", type: "Звичайний", weight: 0.4, urgencyCoefficient: 3, active: true },
  { id: "4", name: "М'ясо", type: "Заморожений", weight: 2, urgencyCoefficient: 10, expirationDays: 1, active: true },
  { id: "5", name: "Крупи", type: "Звичайний", weight: 1, urgencyCoefficient: 2, active: true },
];

const initialStock: WarehouseStock[] = [
  { id: "1", warehouseId: "Склад 1", productId: "1", quantity: 150, lastUpdated: new Date() },
  { id: "2", warehouseId: "Склад 1", productId: "2", quantity: 200, lastUpdated: new Date() },
  { id: "3", warehouseId: "Склад 1", productId: "3", quantity: 300, lastUpdated: new Date() },
  { id: "4", warehouseId: "Склад 2", productId: "1", quantity: 100, lastUpdated: new Date() },
  { id: "5", warehouseId: "Склад 2", productId: "4", quantity: 80, lastUpdated: new Date() },
];

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stock, setStock] = useState<WarehouseStock[]>(initialStock);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(warehouses[0]);
  const [editingStock, setEditingStock] = useState<WarehouseStock | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Форма для товару
  const [productForm, setProductForm] = useState({
    name: "",
    type: "",
    weight: "",
    urgencyCoefficient: "",
    expirationDays: "",
  });

  // Форма для залишків
  const [stockForm, setStockForm] = useState({
    productId: "",
    quantity: "",
  });

  const warehouseStock = stock.filter((s) => s.warehouseId === selectedWarehouse);

  const getProductById = (id: string) => products.find((p) => p.id === id);

  const handleDeleteStock = (id: string) => {
    setStock(stock.filter((s) => s.id !== id));
    toast.success("Залишок видалено");
  };

  const handleEditStock = (stockItem: WarehouseStock) => {
    setEditingStock(stockItem);
    setStockForm({
      productId: stockItem.productId,
      quantity: stockItem.quantity.toString(),
    });
    setIsStockDialogOpen(true);
  };

  const handleSaveStock = () => {
    if (!stockForm.productId || !stockForm.quantity) {
      toast.error("Заповніть усі поля");
      return;
    }

    if (editingStock) {
      // Оновлення
      setStock(
        stock.map((s) =>
          s.id === editingStock.id
            ? { ...s, productId: stockForm.productId, quantity: parseInt(stockForm.quantity), lastUpdated: new Date() }
            : s
        )
      );
      toast.success("Залишок оновлено");
    } else {
      // Додавання
      const newStock: WarehouseStock = {
        id: Date.now().toString(),
        warehouseId: selectedWarehouse,
        productId: stockForm.productId,
        quantity: parseInt(stockForm.quantity),
        lastUpdated: new Date(),
      };
      setStock([...stock, newStock]);
      toast.success("Залишок додано");
    }

    setIsStockDialogOpen(false);
    setEditingStock(null);
    setStockForm({ productId: "", quantity: "" });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Товар видалено");
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      type: product.type,
      weight: product.weight.toString(),
      urgencyCoefficient: product.urgencyCoefficient.toString(),
      expirationDays: product.expirationDays?.toString() || "",
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.type || !productForm.weight || !productForm.urgencyCoefficient) {
      toast.error("Заповніть обов'язкові поля");
      return;
    }

    if (editingProduct) {
      // Оновлення
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name,
                type: productForm.type,
                weight: parseFloat(productForm.weight),
                urgencyCoefficient: parseFloat(productForm.urgencyCoefficient),
                expirationDays: productForm.expirationDays ? parseInt(productForm.expirationDays) : undefined,
              }
            : p
        )
      );
      toast.success("Товар оновлено");
    } else {
      // Додавання
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productForm.name,
        type: productForm.type,
        weight: parseFloat(productForm.weight),
        urgencyCoefficient: parseFloat(productForm.urgencyCoefficient),
        expirationDays: productForm.expirationDays ? parseInt(productForm.expirationDays) : undefined,
        active: true,
      };
      setProducts([...products, newProduct]);
      toast.success("Товар додано");
    }

    setIsProductDialogOpen(false);
    setEditingProduct(null);
    setProductForm({ name: "", type: "", weight: "", urgencyCoefficient: "", expirationDays: "" });
  };

  const openAddStockDialog = () => {
    setEditingStock(null);
    setStockForm({ productId: "", quantity: "" });
    setIsStockDialogOpen(true);
  };

  const openAddProductDialog = () => {
    setEditingProduct(null);
    setProductForm({ name: "", type: "", weight: "", urgencyCoefficient: "", expirationDays: "" });
    setIsProductDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управління складськими залишками</h1>
        <p className="text-muted-foreground">Перегляд та редагування товарів і залишків</p>
      </div>

      {/* Управління товарами */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Каталог товарів</CardTitle>
              <CardDescription>Список всіх товарів у системі</CardDescription>
            </div>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddProductDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Додати товар
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Редагувати товар" : "Новий товар"}</DialogTitle>
                  <DialogDescription>Заповніть інформацію про товар</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Назва</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Назва товару"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тип товару</Label>
                    <Select value={productForm.type} onValueChange={(value) => setProductForm({ ...productForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Швидкопсувний">Швидкопсувний</SelectItem>
                        <SelectItem value="Заморожений">Заморожений</SelectItem>
                        <SelectItem value="Звичайний">Звичайний</SelectItem>
                        <SelectItem value="Хімічний">Хімічний</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Вага (кг)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={productForm.weight}
                        onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                        placeholder="1.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Коеф. терміновості (1-10)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={productForm.urgencyCoefficient}
                        onChange={(e) => setProductForm({ ...productForm, urgencyCoefficient: e.target.value })}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Термін придатності (днів)</Label>
                    <Input
                      type="number"
                      value={productForm.expirationDays}
                      onChange={(e) => setProductForm({ ...productForm, expirationDays: e.target.value })}
                      placeholder="Опціонально"
                    />
                  </div>
                  <Button onClick={handleSaveProduct} className="w-full">
                    {editingProduct ? "Зберегти зміни" : "Додати товар"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Вага (кг)</TableHead>
                <TableHead>Терміновість</TableHead>
                <TableHead className="hidden md:table-cell">Термін (днів)</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>{product.weight}</TableCell>
                  <TableCell>{product.urgencyCoefficient}/10</TableCell>
                  <TableCell className="hidden md:table-cell">{product.expirationDays || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Управління залишками */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Залишки на складі</CardTitle>
              <CardDescription>Кількість товарів по складах</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddStockDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Додати
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingStock ? "Редагувати залишок" : "Додати залишок"}</DialogTitle>
                    <DialogDescription>Оновлення даних для {selectedWarehouse}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Товар</Label>
                      <Select value={stockForm.productId} onValueChange={(value) => setStockForm({ ...stockForm, productId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть товар" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Кількість (одиниць)</Label>
                      <Input
                        type="number"
                        value={stockForm.quantity}
                        onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <Button onClick={handleSaveStock} className="w-full">
                      {editingStock ? "Зберегти зміни" : "Додати залишок"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Кількість</TableHead>
                <TableHead className="hidden md:table-cell">Оновлено</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouseStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Немає залишків на цьому складі
                  </TableCell>
                </TableRow>
              ) : (
                warehouseStock.map((stockItem) => {
                  const product = getProductById(stockItem.productId);
                  return (
                    <TableRow key={stockItem.id}>
                      <TableCell className="font-medium">{product?.name || "—"}</TableCell>
                      <TableCell>{product?.type || "—"}</TableCell>
                      <TableCell>{stockItem.quantity} од.</TableCell>
                      <TableCell className="hidden md:table-cell">{stockItem.lastUpdated.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditStock(stockItem)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(stockItem.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
  );
}
