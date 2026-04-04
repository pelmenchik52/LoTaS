import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../api/api";
import type { ProductDto, StockDto } from "../../api/api";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [inventory, setInventory] = useState<StockDto[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [editingStock, setEditingStock] = useState<StockDto | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, inventoryData] = await Promise.all([
        adminApi.getProducts(),
        adminApi.getInventory()
      ]);
      setProducts(productsData);
      setInventory(inventoryData);

      // Extract unique warehouse names
      const warehouseNames = [...new Set(inventoryData.map(item => item.warehouseName))];
      setWarehouses(warehouseNames);
      if (warehouseNames.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(warehouseNames[0]);
      }
    } catch (error) {
      toast.error("Помилка завантаження даних");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const warehouseStock = inventory.filter((s) => s.warehouseName === selectedWarehouse);

  const getProductById = (id: number) => products.find((p) => p.id === id);

  const handleDeleteStock = async (id: number) => {
    try {
      setSaving(true);
      await adminApi.updateStock(id, { quantity: 0 });
      await loadData(); // Reload data
      toast.success("Залишок видалено");
    } catch (error) {
      toast.error("Помилка видалення залишку");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditStock = (stockItem: StockDto) => {
    setEditingStock(stockItem);
    setStockForm({
      productId: stockItem.productId.toString(),
      quantity: stockItem.quantity.toString(),
    });
    setIsStockDialogOpen(true);
  };

  const handleSaveStock = async () => {
    if (!stockForm.productId || !stockForm.quantity) {
      toast.error("Заповніть усі поля");
      return;
    }

    try {
      setSaving(true);
      if (editingStock) {
        // Update existing stock
        await adminApi.updateStock(editingStock.id, {
          quantity: parseInt(stockForm.quantity)
        });
        toast.success("Залишок оновлено");
      } else {
        // This would require a new endpoint for adding stock to a warehouse
        // For now, we'll show an error
        toast.error("Додавання нових залишків поки не підтримується");
        return;
      }

      await loadData(); // Reload data
      setIsStockDialogOpen(false);
      setEditingStock(null);
      setStockForm({ productId: "", quantity: "" });
    } catch (error) {
      toast.error("Помилка збереження залишку");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      setSaving(true);
      await adminApi.deleteProduct(id);
      await loadData(); // Reload data
      toast.success("Товар видалено");
    } catch (error) {
      toast.error("Помилка видалення товару");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: ProductDto) => {
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

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.type || !productForm.weight || !productForm.urgencyCoefficient) {
      toast.error("Заповніть обов'язкові поля");
      return;
    }

    try {
      setSaving(true);
      const productData = {
        name: productForm.name,
        type: productForm.type,
        weight: parseFloat(productForm.weight),
        urgencyCoefficient: parseFloat(productForm.urgencyCoefficient),
        expirationDays: productForm.expirationDays ? parseInt(productForm.expirationDays) : undefined,
        active: true,
      };

      if (editingProduct) {
        // Update existing product
        await adminApi.updateProduct(editingProduct.id, productData);
        toast.success("Товар оновлено");
      } else {
        // Create new product
        await adminApi.createProduct(productData);
        toast.success("Товар додано");
      }

      await loadData(); // Reload data
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ name: "", type: "", weight: "", urgencyCoefficient: "", expirationDays: "" });
    } catch (error) {
      toast.error("Помилка збереження товару");
      console.error(error);
    } finally {
      setSaving(false);
    }
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Завантаження даних...</span>
        </div>
      ) : (

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
                <Button onClick={openAddProductDialog} className="gap-2" disabled={saving}>
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
                  <Button onClick={handleSaveProduct} className="w-full" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} disabled={saving}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} disabled={saving}>
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
                    <Button onClick={handleSaveStock} className="w-full" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                warehouseStock.map((stockItem) => (
                  <TableRow key={stockItem.id}>
                    <TableCell className="font-medium">{stockItem.productName}</TableCell>
                    <TableCell>{stockItem.productType}</TableCell>
                    <TableCell>{stockItem.quantity} {stockItem.unit}</TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(stockItem.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStock(stockItem)} disabled={saving}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(stockItem.id)} disabled={saving}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    )}
  );
}
