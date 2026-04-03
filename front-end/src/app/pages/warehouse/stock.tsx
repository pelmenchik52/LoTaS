import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Search, Package, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi, type StockDto } from "../../../api";
import { authApi } from "../../../api";

const statusConfig = {
    "in-stock": { label: "В наявності", color: "text-green-600 border-green-600", icon: CheckCircle },
    "low-stock": { label: "Мало", color: "text-orange-600 border-orange-600", icon: AlertTriangle },
    "out-of-stock": { label: "Відсутній", color: "text-red-600 border-red-600", icon: AlertTriangle },
};

export default function WarehouseStockPage() {
    const [products, setProducts] = useState<StockDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("Всі категорії");
    const [statusFilter, setStatusFilter] = useState("all");

    const warehouseIds = authApi.getWarehouseIds();
    const warehouseId = warehouseIds[0] ?? 1;

    const load = async () => {
        try {
            setLoading(true);
            const data = await warehouseApi.getStock(warehouseId);
            setProducts(data);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [warehouseId]);

    const categories = ["Всі категорії", ...Array.from(new Set(products.map(p => p.productType)))];

    const filtered = products.filter(p => {
        const matchSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.shelf.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = categoryFilter === "Всі категорії" || p.productType === categoryFilter;
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchCat && matchStatus;
    });

    const inStock = products.filter(p => p.status === "in-stock").length;
    const lowStock = products.filter(p => p.status === "low-stock").length;
    const outOfStock = products.filter(p => p.status === "out-of-stock").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Складські залишки</h1>
                    <p className="text-muted-foreground">Перегляд та управління товарами на складі</p>
                </div>
                <Button variant="outline" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Оновити
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Всього товарів", value: products.length, icon: Package, color: "text-blue-600" },
                    { label: "В наявності", value: inStock, icon: CheckCircle, color: "text-green-600" },
                    { label: "Мало залишків", value: lowStock, icon: AlertTriangle, color: "text-orange-600" },
                    { label: "Відсутні", value: outOfStock, icon: AlertTriangle, color: "text-red-600" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                                    <p className="text-3xl font-bold">{value}</p>
                                </div>
                                <Icon className={`h-10 w-10 ${color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Товари на складі</CardTitle>
                    <CardDescription>
                        <div className="flex flex-col sm:flex-row gap-3 mt-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Пошук товару або стелажу..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="sm:w-48"><SelectValue placeholder="Статус" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всі статуси</SelectItem>
                                    <SelectItem value="in-stock">В наявності</SelectItem>
                                    <SelectItem value="low-stock">Мало залишків</SelectItem>
                                    <SelectItem value="out-of-stock">Відсутні</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Завантаження...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Назва товару</TableHead>
                                        <TableHead className="hidden md:table-cell">Категорія</TableHead>
                                        <TableHead>Кількість</TableHead>
                                        <TableHead className="hidden sm:table-cell">Стелаж</TableHead>
                                        <TableHead className="hidden lg:table-cell">Термін придатності</TableHead>
                                        <TableHead>Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(p => {
                                        const cfg = statusConfig[p.status];
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.productName}</TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">{p.productType}</TableCell>
                                                <TableCell>
                                                    <span className={p.status === "out-of-stock" ? "text-red-600" : ""}>
                                                        {p.quantity} {p.unit}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <Badge variant="outline">{p.shelf}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("uk-UA") : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cfg.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                Товарів не знайдено
                                            </TableCell>
                                        </TableRow>
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