import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, FileText, Download, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { accountantApi, type StockDto } from "../../../api";

const statusConfig = {
  "in-stock": { label: "В наявності", color: "text-green-600 border-green-600" },
  "low-stock": { label: "Мало на складі", color: "text-orange-600 border-orange-600" },
  "out-of-stock": { label: "Немає на складі", color: "text-red-600 border-red-600" },
};

export default function AccountantDiscrepanciesPage() {
  const [records, setRecords] = useState<StockDto[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<StockDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await accountantApi.getDiscrepancies();
        setRecords(response);
      } catch (err) {
        setError((err as Error).message || "Не вдалося завантажити дані");
      } finally {
        setLoading(false);
      }
    };

    void fetchRecords();
  }, []);

  const filteredRecords = filter === "all" ? records : records.filter((record) => record.status === filter);
  const lowStockCount = records.filter((record) => record.status === "low-stock").length;
  const outOfStockCount = records.filter((record) => record.status === "out-of-stock").length;
  const problemCount = records.filter((record) => record.status !== "in-stock").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Акти розбіжностей</h1>
          <p className="text-muted-foreground">Список товарів, що потребують уваги бухгалтерії</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Експорт
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Записи з проблемами</p>
                <p className="text-3xl font-bold">{problemCount}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Мало на складі</p>
                <p className="text-3xl font-bold">{lowStockCount}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Немає на складі</p>
                <p className="text-3xl font-bold">{outOfStockCount}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Всього записів</p>
                <p className="text-3xl font-bold">{records.length}</p>
              </div>
              <FileText className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Розбіжності за складами</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі</SelectItem>
                <SelectItem value="low-stock">Мало на складі</SelectItem>
                <SelectItem value="out-of-stock">Немає на складі</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Завантаження...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Склад</TableHead>
                    <TableHead className="hidden md:table-cell">Продукт</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="hidden sm:table-cell">Кількість</TableHead>
                    <TableHead className="hidden lg:table-cell">Оновлено</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.warehouseName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{record.productName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[record.status].color}>
                          {statusConfig[record.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{record.quantity}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(record.lastUpdated).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedRecord(record)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecord?.productName}</DialogTitle>
            <DialogDescription>{selectedRecord?.warehouseName}</DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Склад</p>
                  <p className="font-medium">{selectedRecord.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Статус</p>
                  <Badge variant="outline" className={statusConfig[selectedRecord.status].color}>
                    {statusConfig[selectedRecord.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Кількість</p>
                  <p className="font-medium">{selectedRecord.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Оновлено</p>
                  <p className="font-medium">{new Date(selectedRecord.lastUpdated).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Товар</p>
                  <p className="font-medium">{selectedRecord.productName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Тип продукту</p>
                  <p className="font-medium">{selectedRecord.productType || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Стан</p>
                  <p className="font-medium">{statusConfig[selectedRecord.status].label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Період придатності</p>
                  <p className="font-medium">{selectedRecord.expiryDate ? new Date(selectedRecord.expiryDate).toLocaleDateString() : "—"}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
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
