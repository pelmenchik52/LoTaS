import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Plus, Clock, CheckCircle, XCircle, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi, authApi, type DeliveryRequestDto, type ProductDto } from "../../../api/api.ts";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    pending: { label: "Очікує", icon: Clock, color: "text-yellow-600 border-yellow-600" },
    approved: { label: "Схвалено", icon: CheckCircle, color: "text-blue-600 border-blue-600" },
    rejected: { label: "Відхилено", icon: XCircle, color: "text-red-600 border-red-600" },
    completed: { label: "Виконано", icon: CheckCircle, color: "text-green-600 border-green-600" },
};

const urgencyLabels: Record<number, string> = { 1: "Нормальний", 2: "Підвищений", 3: "Критичний" };
const urgencyColors: Record<number, string> = {
    1: "text-green-600 border-green-600",
    2: "text-orange-600 border-orange-600",
    3: "text-red-600 border-red-600",
};

export default function WarehouseRequestsPage() {
    const [requests, setRequests] = useState<DeliveryRequestDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<{ productId: number; quantity: number; weight: number }[]>([]);
    const [currentProductId, setCurrentProductId] = useState("");
    const [currentQuantity, setCurrentQuantity] = useState("");
    const [notes, setNotes] = useState("");
    const [urgency, setUrgency] = useState("1");

    const warehouseId = authApi.getWarehouseIds()[0] ?? 1;

    const load = async () => {
        try {
            setLoading(true);
            const [reqs, prods] = await Promise.all([
                warehouseApi.getRequests(warehouseId),
                warehouseApi.getProducts(),
            ]);
            setRequests(reqs);
            setProducts(prods);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleAddProduct = () => {
        if (!currentProductId || !currentQuantity) { toast.error("Оберіть товар та вкажіть кількість"); return; }
        const product = products.find(p => p.id === Number(currentProductId));
        if (!product) return;
        const qty = parseFloat(currentQuantity);
        setSelectedProducts(prev => [...prev, { productId: product.id, quantity: qty, weight: qty * product.weight }]);
        setCurrentProductId(""); setCurrentQuantity("");
    };

    const handleSubmit = async () => {
        if (selectedProducts.length === 0) { toast.error("Додайте хоча б один товар"); return; }
        try {
            await warehouseApi.createRequest({ warehouseId, products: selectedProducts, notes, urgency: Number(urgency) });
            toast.success("Запит доставки створено");
            setIsDialogOpen(false);
            setSelectedProducts([]); setNotes(""); setUrgency("1");
            load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Запити доставки</h1>
                    <p className="text-muted-foreground">Управління запитами на поставку товарів</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Оновити
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="h-4 w-4 mr-2" />Новий запит</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Створити запит доставки</DialogTitle>
                                <DialogDescription>Вкажіть необхідні товари та рівень терміновості</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Терміновість</Label>
                                    <Select value={urgency} onValueChange={setUrgency}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Нормальний</SelectItem>
                                            <SelectItem value="2">Підвищений</SelectItem>
                                            <SelectItem value="3">Критичний</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                                    <div className="space-y-2">
                                        <Label>Товар</Label>
                                        <Select value={currentProductId} onValueChange={setCurrentProductId}>
                                            <SelectTrigger><SelectValue placeholder="Оберіть товар" /></SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 w-24">
                                        <Label>Кількість</Label>
                                        <Input type="number" min="1" value={currentQuantity}
                                            onChange={e => setCurrentQuantity(e.target.value)} placeholder="0" />
                                    </div>
                                    <Button onClick={handleAddProduct} type="button">Додати</Button>
                                </div>
                                {selectedProducts.length > 0 && (
                                    <div className="border rounded-md divide-y">
                                        {selectedProducts.map((sp, i) => {
                                            const p = products.find(x => x.id === sp.productId);
                                            return (
                                                <div key={i} className="flex items-center justify-between p-2 text-sm">
                                                    <span>{p?.name}</span>
                                                    <span className="text-muted-foreground">{sp.quantity} шт · {sp.weight.toFixed(1)} кг</span>
                                                    <Button variant="ghost" size="sm" className="text-red-500 h-6 px-2"
                                                        onClick={() => setSelectedProducts(prev => prev.filter((_, j) => j !== i))}>✕</Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Примітки</Label>
                                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Додаткова інформація..." />
                                </div>
                                <Button className="w-full" onClick={handleSubmit}>Надіслати запит</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>Список запитів</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Завантаження...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>№</TableHead>
                                        <TableHead>Товари</TableHead>
                                        <TableHead>Терміновість</TableHead>
                                        <TableHead className="hidden md:table-cell">Дата</TableHead>
                                        <TableHead>Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map(r => {
                                        const sc = statusConfig[r.status] ?? statusConfig.pending;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-mono text-sm">#{r.id}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {r.products.map(p => (
                                                            <Badge key={p.productId} variant="secondary" className="text-xs">
                                                                <Package className="h-3 w-3 mr-1" />
                                                                {p.productName ?? `#${p.productId}`} × {p.quantity}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={urgencyColors[r.urgency]}>
                                                        {urgencyLabels[r.urgency] ?? "Нормальний"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                                    {new Date(r.createdAt).toLocaleDateString("uk-UA")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={sc.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {requests.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Запитів немає</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}