import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowDownToLine, ArrowUpFromLine, Download, Filter, Package } from "lucide-react";
import type { TransactionArchive, Product } from "../../types";

const mockProducts: Product[] = [
  { id: "1", name: "Молоко", type: "Швидкопсувний", weight: 1, urgencyCoefficient: 9, expirationDays: 7, active: true },
  { id: "2", name: "Хліб", type: "Швидкопсувний", weight: 0.5, urgencyCoefficient: 8, expirationDays: 3, active: true },
  { id: "3", name: "М'ясо", type: "Заморожений", weight: 2, urgencyCoefficient: 10, expirationDays: 1, active: true },
  { id: "4", name: "Консерви", type: "Звичайний", weight: 0.4, urgencyCoefficient: 3, active: true },
  { id: "5", name: "Крупи", type: "Звичайний", weight: 1, urgencyCoefficient: 2, active: true },
];

const mockArchive: TransactionArchive[] = [
  // Прийоми
  {
    id: "1",
    type: "receiving",
    warehouseId: "Склад 1",
    productId: "1",
    quantity: 200,
    date: new Date(2026, 3, 2, 10, 30),
    performedBy: "Іван Петренко",
    notes: "Прийом від постачальника ТОВ 'Молокопродукт'",
  },
  {
    id: "2",
    type: "receiving",
    warehouseId: "Склад 1",
    productId: "2",
    quantity: 300,
    date: new Date(2026, 3, 2, 11, 15),
    performedBy: "Іван Петренко",
    notes: "Прийом від постачальника ТОВ 'Хлібозавод №1'",
  },
  {
    id: "3",
    type: "receiving",
    warehouseId: "Склад 2",
    productId: "3",
    quantity: 150,
    date: new Date(2026, 3, 1, 14, 0),
    performedBy: "Марія Коваленко",
    notes: "Прийом від постачальника ТОВ 'М'ясопродукт'",
  },
  {
    id: "4",
    type: "receiving",
    warehouseId: "Склад 1",
    productId: "4",
    quantity: 500,
    date: new Date(2026, 2, 31, 9, 45),
    performedBy: "Іван Петренко",
  },
  
  // Відвантаження
  {
    id: "5",
    type: "shipping",
    warehouseId: "Склад 1",
    productId: "1",
    quantity: 120,
    date: new Date(2026, 3, 2, 15, 30),
    performedBy: "Іван Петренко",
    notes: "Відвантаження для Сільпо Центр",
  },
  {
    id: "6",
    type: "shipping",
    warehouseId: "Склад 1",
    productId: "2",
    quantity: 200,
    date: new Date(2026, 3, 2, 16, 0),
    performedBy: "Іван Петренко",
    notes: "Відвантаження для АТБ Подол",
  },
  {
    id: "7",
    type: "shipping",
    warehouseId: "Склад 2",
    productId: "3",
    quantity: 80,
    date: new Date(2026, 3, 1, 17, 20),
    performedBy: "Марія Коваленко",
    notes: "Відвантаження для Novus Оболонь",
  },
  {
    id: "8",
    type: "shipping",
    warehouseId: "Склад 1",
    productId: "4",
    quantity: 150,
    date: new Date(2026, 2, 31, 13, 10),
    performedBy: "Іван Петренко",
    notes: "Відвантаження для Varus",
  },
  {
    id: "9",
    type: "shipping",
    warehouseId: "Склад 1",
    productId: "5",
    quantity: 100,
    date: new Date(2026, 2, 30, 14, 30),
    performedBy: "Іван Петр��нко",
  },
];

const warehouses = ["Всі склади", "Склад 1", "Склад 2", "Склад 3", "Склад 4", "Склад 5"];

export default function AccountantArchivePage() {
  const [archive] = useState<TransactionArchive[]>(mockArchive);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("Всі склади");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const getProductById = (id: string) => mockProducts.find((p) => p.id === id);

  const filterTransactions = (type: "receiving" | "shipping") => {
    return archive
      .filter((t) => t.type === type)
      .filter((t) => selectedWarehouse === "Всі склади" || t.warehouseId === selectedWarehouse)
      .filter((t) => selectedProduct === "all" || t.productId === selectedProduct)
      .filter((t) => {
        if (!dateFrom && !dateTo) return true;
        const transactionDate = t.date.toISOString().split("T")[0];
        if (dateFrom && dateTo) {
          return transactionDate >= dateFrom && transactionDate <= dateTo;
        }
        if (dateFrom) return transactionDate >= dateFrom;
        if (dateTo) return transactionDate <= dateTo;
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const receivingTransactions = filterTransactions("receiving");
  const shippingTransactions = filterTransactions("shipping");

  const calculateTotals = (transactions: TransactionArchive[]) => {
    return transactions.reduce((sum, t) => sum + t.quantity, 0);
  };

  const handleExport = (type: "receiving" | "shipping") => {
    const transactions = type === "receiving" ? receivingTransactions : shippingTransactions;
    const typeName = type === "receiving" ? "Прийом" : "Відвантаження";
    console.log(`Експорт даних: ${typeName}`, transactions);
    alert(`Експорт ${transactions.length} записів у файл (функція демонстраційна)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Архів операцій</h1>
          <p className="text-muted-foreground">Історія прийому та відвантаження товарів зі складів</p>
        </div>
      </div>

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фільтри
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Склад</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label>Товар</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі товари</SelectItem>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Дата від</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Дата до</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всього прийомів</p>
                <p className="text-2xl font-bold">{receivingTransactions.length}</p>
              </div>
              <ArrowDownToLine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Прийнято одиниць</p>
                <p className="text-2xl font-bold">{calculateTotals(receivingTransactions)}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всього відвантажень</p>
                <p className="text-2xl font-bold">{shippingTransactions.length}</p>
              </div>
              <ArrowUpFromLine className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Відвантажено одиниць</p>
                <p className="text-2xl font-bold">{calculateTotals(shippingTransactions)}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблиці */}
      <Tabs defaultValue="receiving" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receiving" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Прийом товарів
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Відвантаження
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receiving">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Прийом товарів</CardTitle>
                  <CardDescription>Історія всіх операцій прийому</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => handleExport("receiving")}>
                  <Download className="h-4 w-4" />
                  Експорт
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата/Час</TableHead>
                      <TableHead>Склад</TableHead>
                      <TableHead>Товар</TableHead>
                      <TableHead>Кількість</TableHead>
                      <TableHead className="hidden md:table-cell">Виконав</TableHead>
                      <TableHead className="hidden lg:table-cell">Примітки</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivingTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Немає записів за обраними фільтрами
                        </TableCell>
                      </TableRow>
                    ) : (
                      receivingTransactions.map((transaction) => {
                        const product = getProductById(transaction.productId);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {transaction.date.toLocaleString("uk-UA", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.warehouseId}</Badge>
                            </TableCell>
                            <TableCell>{product?.name || "—"}</TableCell>
                            <TableCell className="text-green-600 font-medium">+{transaction.quantity} од.</TableCell>
                            <TableCell className="hidden md:table-cell">{transaction.performedBy}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{transaction.notes || "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Відвантаження товар��в</CardTitle>
                  <CardDescription>Історія всіх операцій відвантаження</CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => handleExport("shipping")}>
                  <Download className="h-4 w-4" />
                  Експорт
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата/Час</TableHead>
                      <TableHead>Склад</TableHead>
                      <TableHead>Товар</TableHead>
                      <TableHead>Кількість</TableHead>
                      <TableHead className="hidden md:table-cell">Виконав</TableHead>
                      <TableHead className="hidden lg:table-cell">Примітки</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shippingTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Немає записів за обраними фільтрами
                        </TableCell>
                      </TableRow>
                    ) : (
                      shippingTransactions.map((transaction) => {
                        const product = getProductById(transaction.productId);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {transaction.date.toLocaleString("uk-UA", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.warehouseId}</Badge>
                            </TableCell>
                            <TableCell>{product?.name || "—"}</TableCell>
                            <TableCell className="text-blue-600 font-medium">-{transaction.quantity} од.</TableCell>
                            <TableCell className="hidden md:table-cell">{transaction.performedBy}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{transaction.notes || "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
