import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  type: "warehouse" | "delivery";
  address: string;
  coordinates: string;
  active: boolean;
}

const initialLocations: Location[] = [
  { id: "1", name: "Склад 1 (Центральний)", type: "warehouse", address: "вул. Промислова, 15, Київ", coordinates: "50.4501, 30.5234", active: true },
  { id: "2", name: "Склад 2 (Південний)", type: "warehouse", address: "вул. Складська, 42, Одеса", coordinates: "46.4825, 30.7233", active: true },
  { id: "3", name: "Склад 3 (Західний)", type: "warehouse", address: "вул. Логістична, 8, Львів", coordinates: "49.8397, 24.0297", active: true },
  { id: "4", name: "Точка доставки - Сільпо Центр", type: "delivery", address: "вул. Хрещатик, 44, Київ", coordinates: "50.4501, 30.5234", active: true },
  { id: "5", name: "Точка доставки - АТБ Подол", type: "delivery", address: "вул. Спаська, 12, Київ", coordinates: "50.4651, 30.5134", active: true },
  { id: "6", name: "Точка доставки - Наш Край", type: "delivery", address: "просп. Перемоги, 67, Київ", coordinates: "50.4501, 30.4234", active: true },
];

export default function AdminNetworkPage() {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "warehouse" | "delivery">("all");

  const filteredLocations = filter === "all" 
    ? locations 
    : locations.filter(loc => loc.type === filter);

  const handleAddLocation = () => {
    toast.success("Локацію додано успішно");
    setIsDialogOpen(false);
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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Додати локацію
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Нова локація</DialogTitle>
              <DialogDescription>Додавання складу або точки доставки</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Назва</Label>
                <Input placeholder="Склад 4 (Східний)" />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <select className="w-full border rounded-md p-2 bg-background">
                  <option value="warehouse">Склад</option>
                  <option value="delivery">Точка доставки</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Адреса</Label>
                <Input placeholder="вул. Промислова, 15, Київ" />
              </div>
              <div className="space-y-2">
                <Label>Координати</Label>
                <Input placeholder="50.4501, 30.5234" />
              </div>
              <Button onClick={handleAddLocation} className="w-full">
                Додати локацію
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Мережа локацій</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant={filter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("all")}
              >
                Всі ({locations.length})
              </Button>
              <Button 
                variant={filter === "warehouse" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("warehouse")}
              >
                Склади ({locations.filter(l => l.type === "warehouse").length})
              </Button>
              <Button 
                variant={filter === "delivery" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("delivery")}
              >
                Точки доставки ({locations.filter(l => l.type === "delivery").length})
              </Button>
            </div>
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
                  <TableHead>Тип</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {location.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {location.address}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {location.coordinates}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        location.type === "warehouse" 
                          ? "border-blue-600 text-blue-600"
                          : "border-green-600 text-green-600"
                      }>
                        {location.type === "warehouse" ? "Склад" : "Доставка"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              <span className="font-bold text-2xl">{locations.filter(l => l.type === "warehouse").length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Точок доставки</span>
              <span className="font-bold text-2xl">{locations.filter(l => l.type === "delivery").length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Активних локацій</span>
              <span className="font-bold text-2xl">{locations.filter(l => l.active).length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Швидкі дії</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Експортувати координати
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Показати на карті
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Імпортувати локації
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
