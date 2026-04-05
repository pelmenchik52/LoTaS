import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { MapPin, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../../api/api";
import type { WarehouseDto } from "../../../api/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

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

  // Geocoding
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const placeMarkerOnMap = useCallback((lat: number, lng: number) => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }
    mapRef.current?.setView([lat, lng], 14);
  }, []);

  // Initialize/destroy map when dialog opens/closes
  useEffect(() => {
    if (!isDialogOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }
    // Small timeout to let dialog render the container
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;
      const lat = formData.lat ? parseFloat(formData.lat) : 50.4501;
      const lng = formData.lng ? parseFloat(formData.lng) : 30.5234;
      const zoom = formData.lat && formData.lng ? 14 : 6;
      mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
      if (formData.lat && formData.lng) {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setFormData((prev) => ({
          ...prev,
          lat: clickLat.toFixed(6),
          lng: clickLng.toFixed(6),
        }));
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else if (mapRef.current) {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(mapRef.current);
        }
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [isDialogOpen]);

  const geocodeAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setGeocoding(true);
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "5",
        countrycodes: "ua",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { "Accept-Language": "uk" } }
      );
      const data: NominatimResult[] = await res.json();
      setAddressSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleAddressInput = (value: string) => {
    setFormData((prev) => ({ ...prev, address: value }));
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(() => geocodeAddress(value), 400);
  };

  const handleSelectSuggestion = (result: NominatimResult) => {
    setFormData((prev) => ({
      ...prev,
      address: result.display_name,
      lat: result.lat,
      lng: result.lon,
    }));
    placeMarkerOnMap(parseFloat(result.lat), parseFloat(result.lon));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        // Update existing warehouse
        await adminApi.updateWarehouse(editingWarehouse.id, {
          name: formData.name,
          address: formData.address,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          active: editingWarehouse.active, // Keep current active status
        });
        toast.success("Склад оновлено успішно");
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

  const handleDeleteWarehouse = async (id: number) => {
    if (!confirm("Ви впевнені, що хочете деактивувати цей склад?")) return;

    try {
      setSaving(true);
      await adminApi.deleteWarehouse(id);
      toast.success("Склад деактивовано");
      await loadWarehouses(); // Reload data
    } catch (error) {
      toast.error("Помилка видалення складу");
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
          <DialogContent className="max-w-lg">
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
              <div className="space-y-2 relative" ref={addressWrapperRef}>
                <Label>Адреса</Label>
                <div className="relative">
                  <Input
                    value={formData.address}
                    onChange={(e) => handleAddressInput(e.target.value)}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="вул. Промислова, 15, Київ"
                    autoComplete="off"
                  />
                  {geocoding && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((s) => (
                      <button
                        key={s.place_id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
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
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Розташування на карті
                </Label>
                <p className="text-xs text-muted-foreground">
                  Натисніть на карту або оберіть адресу для встановлення точки
                </p>
                <div className="h-[220px] w-full rounded-lg overflow-hidden border" ref={mapContainerRef} />
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
        <>
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
        </>
      )}

    </div>
  );
}
