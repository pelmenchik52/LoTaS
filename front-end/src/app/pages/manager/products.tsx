import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Edit, Trash2, Plus, Loader2, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../../../api";
import type { ProductDto } from "../../../api";

const typeColors: Record<string, string> = {
    "Швидкопсувний": "text-red-600 border-red-600",
    "Заморожений": "text-blue-600 border-blue-600",
    "Звичайний": "text-green-600 border-green-600",
    "Хімічний": "text-orange-600 border-orange-600",
};

export default function ManagerProductsPage() {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        name: "",
        type: "",
        weight: "",
        urgencyCoefficient: "",
        expirationDays: "",
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await managerApi.getProducts();
            setProducts(data);
        } catch {
            toast.error("Помилка завантаження товарів");
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingProduct(null);
        setForm({ name: "", type: "", weight: "", urgencyCoefficient: "", expirationDays: "" });
        setIsDialogOpen(true);
    };

    const openEdit = (p: ProductDto) => {
        setEditingProduct(p);
        setForm({
            name: p.name,
            type: p.type,
            weight: p.weight.toString(),
            urgencyCoefficient: p.urgencyCoefficient.toString(),
            expirationDays: p.expirationDays?.toString() || "",
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.type || !form.weight || !form.urgencyCoefficient) {
            toast.error("Заповніть обов'язкові поля");
            return;
        }
        try {
            setSaving(true);
            const data = {
                name: form.name,
                type: form.type,
                weight: parseFloat(form.weight),
                urgencyCoefficient: parseInt(form.urgencyCoefficient),
                expirationDays: form.expirationDays ? parseInt(form.expirationDays) : undefined,
                active: true,
            };
            if (editingProduct) {
                await managerApi.updateProduct(editingProduct.id, data);
                toast.success("Товар оновлено");
            } else {
                await managerApi.createProduct(data);
                toast.success("Товар додано");
            }
            await loadData();
            setIsDialogOpen(false);
        } catch {
            toast.error("Помилка збереження");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setSaving(true);
            await managerApi.deleteProduct(id);
            toast.success("Товар видалено");
            await loadData();
        } catch {
            toast.error("Помилка видалення");
        } finally {
            setSaving(false);
        }
    };

    const filtered = search
        ? products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase()))
        : products;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Асортимент товарів</h1>
                <p className="text-muted-foreground">Управління каталогом товарів для доставки</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Всього товарів</p>
                        <p className="text-3xl font-bold">{products.length}</p>
                    </CardContent>
                </Card>
                {["Швидкопсувний", "Заморожений", "Звичайний"].map(type => (
                    <Card key={type}>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground mb-1">{type}</p>
                            <p className="text-3xl font-bold">{products.filter(p => p.type === type).length}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Каталог товарів
                            </CardTitle>
                            <CardDescription>Додавайте, редагуйте та видаляйте товари</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Пошук..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-8 w-48"
                                />
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={openAdd} className="gap-2">
                                        <Plus className="h-4 w-4" /> Додати товар
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingProduct ? "Редагувати товар" : "Новий товар"}</DialogTitle>
                                        <DialogDescription>Заповніть інформацію про товар</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Назва *</Label>
                                            <Input
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="Назва товару"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Тип товару *</Label>
                                            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                                <SelectTrigger><SelectValue placeholder="Оберіть тип" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Швидкопсувний">Швидкопсувний</SelectItem>
                                                    <SelectItem value="Заморожений">Заморожений</SelectItem>
                                                    <SelectItem value="Звичайний">Звичайний</SelectItem>
                                                    <SelectItem value="Хімічний">Хімічний</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Вага (кг) *</Label>
                                                <Input type="number" step="0.1" value={form.weight}
                                                    onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="1.0" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Терміновість (1-10) *</Label>
                                                <Input type="number" min="1" max="10" value={form.urgencyCoefficient}
                                                    onChange={e => setForm({ ...form, urgencyCoefficient: e.target.value })} placeholder="5" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Термін придатності (днів)</Label>
                                            <Input type="number" value={form.expirationDays}
                                                onChange={e => setForm({ ...form, expirationDays: e.target.value })} placeholder="Опціонально" />
                                        </div>
                                        <Button onClick={handleSave} className="w-full" disabled={saving}>
                                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            {editingProduct ? "Зберегти зміни" : "Додати товар"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Завантаження...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Назва</TableHead>
                                        <TableHead>Тип</TableHead>
                                        <TableHead>Вага (кг)</TableHead>
                                        <TableHead>Терміновість</TableHead>
                                        <TableHead className="hidden md:table-cell">Термін (днів)</TableHead>
                                        <TableHead className="w-24">Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={typeColors[p.type] ?? ""}>
                                                    {p.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{p.weight}</TableCell>
                                            <TableCell>{p.urgencyCoefficient}/10</TableCell>
                                            <TableCell className="hidden md:table-cell">{p.expirationDays || "—"}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} disabled={saving}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={saving}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
