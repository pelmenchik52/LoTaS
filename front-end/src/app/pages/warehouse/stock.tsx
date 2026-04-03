//import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Search, Package, AlertTriangle, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  shelf: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
  expiryDate?: string;
}

import { useEffect, useState } from "react";
import { stockService } from "../../services/products.service";

const categories = ["Всі категорії", "Молочні", "Хлібобулочні", "Фрукти", "Овочі", "Бакалія"];

const statusConfig = {
  "in-stock": { label: "В наявності", color: "text-green-600 border-green-600", icon: CheckCircle },
  "low-stock": { label: "Мало", color: "text-orange-600 border-orange-600", icon: AlertTriangle },
  "out-of-stock": { label: "Відсутній", color: "text-red-600 border-red-600", icon: AlertTriangle },
};

const warehouseId = localStorage.getItem("warehouseId") ?? "";

export default function WarehouseStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    stockService.getByWarehouse(warehouseId)
      .then(setProducts)
      .catch(() => toast.error("Не вдалося завантажити товари"))
      .finally(() => setIsLoading(false));
  }, [warehouseId]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Всі категорії");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.shelf.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Всі категорії" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalProducts = products.length;
  const inStock = products.filter(p => p.status === "in-stock").length;
  const lowStock = products.filter(p => p.status === "low-stock").length;
  const outOfStock = products.filter(p => p.status === "out-of-stock").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Складські залишки</h1>
        <p className="text-muted-foreground">
          Перегляд та управління товарами на складі
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Всього товарів</p>
                <p className="text-3xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">В наявності</p>
                <p className="text-3xl font-bold">{inStock}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Мало залишків</p>
                <p className="text-3xl font-bold">{lowStock}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Відсутні</p>
                <p className="text-3xl font-bold">{outOfStock}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <CardTitle>Товари на складі</CardTitle>
          <CardDescription>
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Пошук товару або стелажу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="in-stock">В наявності</SelectItem>
                  <SelectItem value="low-stock">Мало залишків</SelectItem>
                  <SelectItem value="out-of-stock">Відсутні</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва товару</TableHead>
                  <TableHead className="hidden md:table-cell">Категорія</TableHead>
                  <TableHead>Кількість</TableHead>
                  <TableHead className="hidden sm:table-cell">Стелаж</TableHead>
                  <TableHead className="hidden lg:table-cell">Термін придатності</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const StatusIcon = statusConfig[product.status].icon;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {product.category}
                      </TableCell>
                      <TableCell>
                        <span className={product.status === "out-of-stock" ? "text-red-600" : ""}>
                          {product.quantity} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{product.shelf}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {product.expiryDate || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={statusConfig[product.status].color}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
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
