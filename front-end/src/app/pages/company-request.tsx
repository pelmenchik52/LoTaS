import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Package, Plus, Send, Trash2, CheckCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { companyRequestApi, type ProductDto } from "../../api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const urgencyLabels: Record<number, string> = { 1: "Нормальний", 2: "Підвищений", 3: "Критичний" };
const urgencyColors: Record<number, string> = {
    1: "text-green-600 border-green-600",
    2: "text-orange-600 border-orange-600",
    3: "text-red-600 border-red-600",
};

export default function CompanyRequestPage() {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form fields
    const [companyName, setCompanyName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
    const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const [urgency, setUrgency] = useState("1");

    // Map picker
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setDeliveryLat(lat);
        setDeliveryLng(lng);
        if (markerRef.current && mapRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else if (mapRef.current) {
            markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        }
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        mapRef.current = L.map(mapContainerRef.current).setView([50.4501, 30.5234], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);
        mapRef.current.on("click", handleMapClick);
        return () => {
            if (mapRef.current) {
                mapRef.current.off("click", handleMapClick);
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [handleMapClick]);

    // Product selection
    const [selectedProducts, setSelectedProducts] = useState<{ productId: number; productName: string; quantity: number; weight: number }[]>([]);
    const [currentProductId, setCurrentProductId] = useState("");
    const [currentQuantity, setCurrentQuantity] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const data = await companyRequestApi.getProducts();
                setProducts(data);
            } catch (e: any) {
                toast.error(e.message || "Помилка завантаження товарів");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    const handleAddProduct = () => {
        if (!currentProductId || !currentQuantity) {
            toast.error("Оберіть товар та вкажіть кількість");
            return;
        }
        const product = products.find(p => p.id === Number(currentProductId));
        if (!product) return;
        const qty = parseFloat(currentQuantity);
        if (qty <= 0) { toast.error("Кількість має бути більше 0"); return; }

        if (selectedProducts.some(sp => sp.productId === product.id)) {
            toast.error("Цей товар вже додано");
            return;
        }

        setSelectedProducts(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            quantity: qty,
            weight: qty * product.weight,
        }]);
        setCurrentProductId("");
        setCurrentQuantity("");
    };

    const handleRemoveProduct = (index: number) => {
        setSelectedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!companyName.trim()) { toast.error("Вкажіть назву компанії"); return; }
        if (!contactPerson.trim()) { toast.error("Вкажіть контактну особу"); return; }
        if (!phone.trim()) { toast.error("Вкажіть номер телефону"); return; }
        if (!email.trim()) { toast.error("Вкажіть email"); return; }
        if (!deliveryAddress.trim()) { toast.error("Вкажіть адресу доставки"); return; }
        if (deliveryLat === null || deliveryLng === null) { toast.error("Вкажіть точку доставки на карті"); return; }
        if (selectedProducts.length === 0) { toast.error("Додайте хоча б один товар"); return; }

        setSubmitting(true);
        try {
            await companyRequestApi.create({
                companyName: companyName.trim(),
                contactPerson: contactPerson.trim(),
                phone: phone.trim(),
                email: email.trim(),
                deliveryAddress: deliveryAddress.trim(),
                deliveryLat: deliveryLat,
                deliveryLng: deliveryLng,
                products: selectedProducts.map(sp => ({
                    productId: sp.productId,
                    quantity: sp.quantity,
                    weight: sp.weight,
                })),
                notes: notes.trim() || null,
                urgency: Number(urgency),
            });
            setSubmitted(true);
            toast.success("Запит успішно надіслано!");
        } catch (e: any) {
            toast.error(e.message || "Помилка надсилання запиту");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                        <h2 className="text-2xl font-bold">Запит надіслано!</h2>
                        <p className="text-muted-foreground">
                            Ваш запит на доставку товарів успішно прийнято. Менеджер зв'яжеться з вами найближчим часом.
                        </p>
                        <Button onClick={() => {
                            setSubmitted(false);
                            setCompanyName(""); setContactPerson(""); setPhone(""); setEmail("");
                            setDeliveryAddress(""); setDeliveryLat(null); setDeliveryLng(null);
                            setNotes(""); setUrgency("1"); setSelectedProducts([]);
                            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
                        }} className="mt-4">
                            Створити новий запит
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalWeight = selectedProducts.reduce((sum, p) => sum + p.weight, 0);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Запит на доставку товарів</h1>
                        <p className="text-muted-foreground">
                            Заповніть форму для замовлення доставки продукції
                        </p>
                    </div>
                    <Link to="/login">
                        <Button variant="outline" size="sm">Увійти в систему</Button>
                    </Link>
                </div>

                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Інформація про компанію</CardTitle>
                        <CardDescription>Контактні дані замовника</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Назва компанії *</Label>
                                <Input id="companyName" value={companyName}
                                    onChange={e => setCompanyName(e.target.value)} placeholder="ТОВ «Компанія»" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Контактна особа *</Label>
                                <Input id="contactPerson" value={contactPerson}
                                    onChange={e => setContactPerson(e.target.value)} placeholder="Іванов Іван Іванович" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Телефон *</Label>
                                <Input id="phone" type="tel" value={phone}
                                    onChange={e => setPhone(e.target.value)} placeholder="+380501234567" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" value={email}
                                    onChange={e => setEmail(e.target.value)} placeholder="info@company.ua" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Адреса доставки *</Label>
                            <Input id="address" value={deliveryAddress}
                                onChange={e => setDeliveryAddress(e.target.value)} placeholder="м. Київ, вул. Хрещатик, 1" />
                        </div>
                    </CardContent>
                </Card>

                {/* Map Picker */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Точка доставки на карті *
                        </CardTitle>
                        <CardDescription>
                            Натисніть на карту, щоб вказати точне місце доставки
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full rounded-lg overflow-hidden border" ref={mapContainerRef} />
                        {deliveryLat !== null && deliveryLng !== null && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Координати: {deliveryLat.toFixed(5)}, {deliveryLng.toFixed(5)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Товари для доставки</CardTitle>
                        <CardDescription>Оберіть товари та вкажіть необхідну кількість</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                            <div className="space-y-2">
                                <Label>Товар</Label>
                                <Select value={currentProductId} onValueChange={setCurrentProductId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loading ? "Завантаження..." : "Оберіть товар"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name} ({p.type}, {p.weight} кг/шт)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 w-28">
                                <Label>Кількість</Label>
                                <Input type="number" min="1" value={currentQuantity}
                                    onChange={e => setCurrentQuantity(e.target.value)} placeholder="0" />
                            </div>
                            <Button onClick={handleAddProduct} type="button" className="gap-1">
                                <Plus className="h-4 w-4" /> Додати
                            </Button>
                        </div>

                        {selectedProducts.length > 0 && (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Товар</TableHead>
                                            <TableHead>Кількість</TableHead>
                                            <TableHead>Вага</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedProducts.map((sp, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        {sp.productName}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{sp.quantity} шт</TableCell>
                                                <TableCell>{sp.weight.toFixed(1)} кг</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                                                        onClick={() => handleRemoveProduct(i)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-semibold text-right">Загальна вага:</TableCell>
                                            <TableCell className="font-semibold">{totalWeight.toFixed(1)} кг</TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Urgency & Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Додаткова інформація</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Терміновість</Label>
                            <Select value={urgency} onValueChange={setUrgency}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3].map(u => (
                                        <SelectItem key={u} value={String(u)}>
                                            <Badge variant="outline" className={urgencyColors[u]}>
                                                {urgencyLabels[u]}
                                            </Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Примітки</Label>
                            <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Додаткові побажання щодо доставки..." rows={3} />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <Button className="w-full gap-2 h-12 text-lg" onClick={handleSubmit} disabled={submitting}>
                    <Send className="h-5 w-5" />
                    {submitting ? "Надсилання..." : "Надіслати запит"}
                </Button>
            </div>
        </div>
    );
}
