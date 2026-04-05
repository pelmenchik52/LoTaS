import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Warehouse } from "lucide-react";
import { warehouseApi, authApi, type WarehouseDto } from "../../api";

interface WarehouseSelectorProps {
  value: number;
  onChange: (warehouseId: number) => void;
}

export function WarehouseSelector({ value, onChange }: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await warehouseApi.getWarehouses();
        const myIds = authApi.getWarehouseIds();
        setWarehouses(myIds.length > 0 ? data.filter((w) => myIds.includes(w.id)) : data);
      } catch {
        // silent
      }
    };
    void load();
  }, []);

  if (warehouses.length <= 1) return null;

  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-56">
        <Warehouse className="h-4 w-4 mr-2 shrink-0" />
        <SelectValue placeholder="Оберіть склад" />
      </SelectTrigger>
      <SelectContent>
        {warehouses.map((w) => (
          <SelectItem key={w.id} value={String(w.id)}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
