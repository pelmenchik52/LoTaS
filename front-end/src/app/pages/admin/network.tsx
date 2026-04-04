import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { MapPin, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../api/api";
import type { WarehouseDto } from "../../api/api";

export default function AdminNetworkPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDto | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
  });

  // Load warehouses on component mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getWarehouses();
      setWarehouses(data);
    } catch (error) {
      toast.error("Помилка завантаження складів");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = () => {
    setEditingWarehouse(null);
    setFormData({ name: "", address: "", lat: "", lng: "" });
    setIsDialogOpen(true);
  };

  const handleEditWarehouse = (warehouse: WarehouseDto) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      lat: warehouse.lat.toString(),
      lng: warehouse.lng.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSaveWarehouse = async () => {
    if (!formData.name || !formData.address || !formData.lat || !formData.lng) {
      toast.error("Заповніть усі поля");
      return;
    }

    try {
      setSaving(true);
      const warehouseData = {
        name: formData.name,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        active: true,
      };

      if (editingWarehouse) {
        // Update existing warehouse - Note: API might not have update endpoint
        toast.error("Оновлення складів поки не підтримується API");
      } else {
        // Create new warehouse
        await adminApi.createWarehouse(warehouseData);
        toast.success("Склад додано успішно");
      }

      await loadWarehouses(); // Reload data
      setIsDialogOpen(false);
      setFormData({ name: "", address: "", lat: "", lng: "" });
    } catch (error) {
      toast.error("Помилка збереження складу");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Структура мережі</h1>
          <p className="text-muted-foreground">
            Управління складами та точками доставки
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddWarehouse} className="gap-2" disabled={saving}>
              <Plus className="h-4 w-4" />
              Додати склад
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingWarehouse ? "Редагувати склад" : "Новий склад"}</DialogTitle>
              <DialogDescription>Додавання або редагування складу</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Назва</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Склад 4 (Східний)"
                />
              </div>
              <div className="space-y-2">
                <Label>Адреса</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="вул. Промислова, 15, Київ"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Широта</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="50.4501"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Довгота</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="30.5234"
                  />
                </div>
              </div>
              <Button onClick={handleSaveWarehouse} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingWarehouse ? "Зберегти зміни" : "Додати склад"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Завантаження складів...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Мережа складів</CardTitle>
            <CardDescription>
              Список всіх складів у системі ({warehouses.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва</TableHead>
                    <TableHead className="hidden md:table-cell">Адреса</TableHead>
                    <TableHead className="hidden lg:table-cell">Координати</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Немає складів у системі
                      </TableCell>
                    </TableRow>
                  ) : (
                    warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {warehouse.name}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {warehouse.address}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {warehouse.lat}, {warehouse.lng}
                        </TableCell>
                        <TableCell>
                          <Badge variant={warehouse.active ? "default" : "secondary"}>
                            {warehouse.active ? "Активний" : "Неактивний"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditWarehouse(warehouse)}
                              disabled={saving}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Статистика мережі</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Всього складів</span>
              <span className="font-bold text-2xl">{warehouses.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Активних складів</span>
              <span className="font-bold text-2xl">{warehouses.filter(w => w.active).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
