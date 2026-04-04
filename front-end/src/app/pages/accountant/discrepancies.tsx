import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, FileText, Download, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";

interface Discrepancy {
  id: string;
  date: string;
  warehouse: string;
  auditor: string;
  type: "shortage" | "surplus" | "damaged";
  products: DiscrepancyProduct[];
  status: "pending" | "reviewed" | "resolved";
}

interface DiscrepancyProduct {
  name: string;
  expected: number;
  actual: number;
  difference: number;
  unit: string;
  value: number;
}

const discrepancies: Discrepancy[] = [
  {
    id: "1",
    date: "2026-03-31",
    warehouse: "Склад 1 (Центральний)",
    auditor: "Іван Петренко",
    type: "shortage",
    status: "pending",
    products: [
      { name: "Молоко 2.5%", expected: 240, actual: 235, difference: -5, unit: "л", value: 150 },
      { name: "Йогурт", expected: 8, actual: 6, difference: -2, unit: "шт", value: 80 },
    ],
  },
  {
    id: "2",
    date: "2026-03-30",
    warehouse: "Склад 2 (Південний)",
    auditor: "Марина Іванова",
    type: "surplus",
    status: "reviewed",
    products: [
      { name: "Макарони", expected: 200, actual: 205, difference: 5, unit: "уп", value: 125 },
    ],
  },
  {
    id: "3",
    date: "2026-03-29",
    warehouse: "Склад 1 (Центральний)",
    auditor: "Іван Петренко",
    type: "damaged",
    status: "resolved",
    products: [
      { name: "Хліб білий", expected: 85, actual: 80, difference: -5, unit: "шт", value: 75 },
    ],
  },
  {
    id: "4",
    date: "2026-03-28",
    warehouse: "Склад 3 (Західний)",
    auditor: "Олег Сидоренко",
    type: "shortage",
    status: "resolved",
    products: [
      { name: "Сир твердий", expected: 15, actual: 13, difference: -2, unit: "кг", value: 340 },
      { name: "Сметана", expected: 30, actual: 28, difference: -2, unit: "кг", value: 180 },
    ],
  },
];

const typeConfig = {
  shortage: { label: "Недостача", color: "text-red-600 border-red-600", icon: AlertCircle },
  surplus: { label: "Надлишок", color: "text-orange-600 border-orange-600", icon: AlertCircle },
  damaged: { label: "Пошкодження", color: "text-yellow-600 border-yellow-600", icon: AlertCircle },
};

const statusConfig = {
  pending: { label: "Нова", color: "text-blue-600 border-blue-600" },
  reviewed: { label: "Переглянуто", color: "text-purple-600 border-purple-600" },
  resolved: { label: "Вирішено", color: "text-green-600 border-green-600" },
};

export default function AccountantDiscrepanciesPage() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);

  const filteredDiscrepancies = filter === "all" 
    ? discrepancies 
    : discrepancies.filter(d => d.status === filter);

  const pendingCount = discrepancies.filter(d => d.status === "pending").length;
  const totalValue = discrepancies
    .filter(d => d.type === "shortage" || d.type === "damaged")
    .reduce((sum, d) => sum + d.products.reduce((s, p) => s + p.value, 0), 0);
  
  const shortageCount = discrepancies.filter(d => d.type === "shortage").length;
  const surplusCount = discrepancies.filter(d => d.type === "surplus").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Акти розбіжностей</h1>
          <p className="text-muted-foreground">
            Звіти про недостачі, надлишки та пошкоджений товар
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Експортувати звіт
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Нових актів</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Сума збитків</p>
                <p className="text-3xl font-bold">{(totalValue / 1000).toFixed(1)}к</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Гривень</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Недостач</p>
                <p className="text-3xl font-bold">{shortageCount}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600" />
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
              <AlertCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Список актів розбіжностей</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі акти</SelectItem>
                <SelectItem value="pending">Нові</SelectItem>
                <SelectItem value="reviewed">Переглянуті</SelectItem>
                <SelectItem value="resolved">Вирішені</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead className="hidden md:table-cell">Склад</TableHead>
                  <TableHead className="hidden lg:table-cell">Комірник</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="hidden sm:table-cell">Позицій</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscrepancies.map((disc) => {
                  const TypeIcon = typeConfig[disc.type].icon;
                  const totalDiscValue = disc.products.reduce((sum, p) => sum + p.value, 0);
                  
                  return (
                    <TableRow key={disc.id}>
                      <TableCell className="font-medium">{disc.date}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {disc.warehouse}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {disc.auditor}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={typeConfig[disc.type].color}
                        >
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig[disc.type].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {disc.products.length}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={statusConfig[disc.status].color}
                        >
                          {statusConfig[disc.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedDiscrepancy(disc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Діалог деталей */}
      <Dialog open={!!selectedDiscrepancy} onOpenChange={() => setSelectedDiscrepancy(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Акт розбіжностей</DialogTitle>
            <DialogDescription>
              {selectedDiscrepancy && (
                <>
                  {selectedDiscrepancy.warehouse} • {selectedDiscrepancy.date}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDiscrepancy && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Комірник</p>
                  <p className="font-medium">{selectedDiscrepancy.auditor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Тип</p>
                  <Badge variant="outline" className={typeConfig[selectedDiscrepancy.type].color}>
                    {typeConfig[selectedDiscrepancy.type].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Статус</p>
                  <Badge variant="outline" className={statusConfig[selectedDiscrepancy.status].color}>
                    {statusConfig[selectedDiscrepancy.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Загальна сума</p>
                  <p className="font-bold text-lg">
                    {selectedDiscrepancy.products.reduce((sum, p) => sum + p.value, 0)} грн
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Товари з розбіжностями</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>Очікувалось</TableHead>
                      <TableHead>Фактично</TableHead>
                      <TableHead>Різниця</TableHead>
                      <TableHead>Вартість</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDiscrepancy.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.expected} {product.unit}</TableCell>
                        <TableCell>{product.actual} {product.unit}</TableCell>
                        <TableCell>
                          <span className={product.difference < 0 ? "text-red-600" : "text-orange-600"}>
                            {product.difference > 0 ? "+" : ""}{product.difference} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{product.value} грн</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedDiscrepancy(null)}>
                  Закрити
                </Button>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Завантажити акт
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
