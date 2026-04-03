import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Warehouse, MapPin, Package, Check } from "lucide-react";
import { useNavigate } from "react-router";

interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  stockCount: number;
  lastActivity: string;
}

const warehouses: WarehouseLocation[] = [
  { id: "1", name: "Склад 1 (Центральний)", address: "вул. Промислова, 15, Київ", stockCount: 1247, lastActivity: "5 хв тому" },
  { id: "2", name: "Склад 2 (Південний)", address: "вул. Складська, 42, Одеса", stockCount: 892, lastActivity: "2 год тому" },
  { id: "3", name: "Склад 3 (Західний)", address: "вул. Логістична, 8, Львів", stockCount: 1056, lastActivity: "1 год тому" },
];

export default function WarehouseSelectPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelectWarehouse = (id: string) => {
    setSelectedWarehouse(id);
    localStorage.setItem("selectedWarehouse", id);
    setTimeout(() => {
      navigate("/warehouse/stock");
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Вибір складу</h1>
        <p className="text-muted-foreground">
          Оберіть склад, на якому ви зараз працюєте
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((warehouse) => (
          <Card
            key={warehouse.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedWarehouse === warehouse.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleSelectWarehouse(warehouse.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Warehouse className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2">{warehouse.name}</h3>
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{warehouse.address}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{warehouse.stockCount}</span>
                      <span className="text-muted-foreground">товарів</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {warehouse.lastActivity}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Швидкий доступ
          </CardTitle>
          <CardDescription>
            Останній вибраний склад буде збережено для швидкого доступу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ви можете змінити склад у будь-який момент, повернувшись на цю сторінку через меню навігації.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
