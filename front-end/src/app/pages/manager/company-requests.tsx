import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Building2, Clock, CheckCircle, XCircle, Package, RefreshCw, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { companyRequestApi, type CompanyRequestDto } from "../../../api";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    new: { label: "Новий", icon: Clock, color: "text-blue-600 border-blue-600" },
    processing: { label: "В обробці", icon: Loader2, color: "text-yellow-600 border-yellow-600" },
    approved: { label: "Схвалено", icon: CheckCircle, color: "text-green-600 border-green-600" },
    rejected: { label: "Відхилено", icon: XCircle, color: "text-red-600 border-red-600" },
    completed: { label: "Виконано", icon: CheckCircle, color: "text-emerald-600 border-emerald-600" },
};

const urgencyLabels: Record<number, string> = { 1: "Нормальний", 2: "Підвищений", 3: "Критичний" };
const urgencyColors: Record<number, string> = {
    1: "text-green-600 border-green-600",
    2: "text-orange-600 border-orange-600",
    3: "text-red-600 border-red-600",
};

export default function ManagerCompanyRequestsPage() {
    const [requests, setRequests] = useState<CompanyRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<CompanyRequestDto | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    const load = async () => {
        try {
            setLoading(true);
            const data = await companyRequestApi.getAll();
            setRequests(data);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await companyRequestApi.updateStatus(id, newStatus);
            toast.success("Статус оновлено");
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            if (selectedRequest?.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const filtered = statusFilter === "all" ? requests : requests.filter(r => r.status === statusFilter);

    const newCount = requests.filter(r => r.status === "new").length;
    const processingCount = requests.filter(r => r.status === "processing").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Запити від компаній</h1>
                    <p className="text-muted-foreground">Управління запитами на доставку від зовнішніх клієнтів</p>
                </div>
                <Button variant="outline" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Оновити
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Всього</p>
                                <p className="text-3xl font-bold">{requests.length}</p>
                            </div>
                            <Building2 className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Нових</p>
                                <p className="text-3xl font-bold">{newCount}</p>
                            </div>
                            <Clock className="h-10 w-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">В обробці</p>
                                <p className="text-3xl font-bold">{processingCount}</p>
                            </div>
                            <Loader2 className="h-10 w-10 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Схвалених</p>
                                <p className="text-3xl font-bold">{requests.filter(r => r.status === "approved").length}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <CardTitle>Список запитів</CardTitle>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Фільтр" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всі статуси</SelectItem>
                                <SelectItem value="new">Нові</SelectItem>
                                <SelectItem value="processing">В обробці</SelectItem>
                                <SelectItem value="approved">Схвалені</SelectItem>
                                <SelectItem value="rejected">Відхилені</SelectItem>
                                <SelectItem value="completed">Виконані</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Завантаження...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>№</TableHead>
                                        <TableHead>Компанія</TableHead>
                                        <TableHead className="hidden md:table-cell">Контакт</TableHead>
                                        <TableHead>Товари</TableHead>
                                        <TableHead>Терміновість</TableHead>
                                        <TableHead className="hidden lg:table-cell">Дата</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(r => {
                                        const sc = statusConfig[r.status] ?? statusConfig.new;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-mono text-sm">#{r.id}</TableCell>
                                                <TableCell className="font-medium">{r.companyName}</TableCell>
                                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                                    {r.contactPerson}<br />{r.phone}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {r.products.slice(0, 3).map(p => (
                                                            <Badge key={p.productId} variant="secondary" className="text-xs">
                                                                <Package className="h-3 w-3 mr-1" />
                                                                {p.productName ?? `#${p.productId}`} × {p.quantity}
                                                            </Badge>
                                                        ))}
                                                        {r.products.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">+{r.products.length - 3}</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={urgencyColors[r.urgency]}>
                                                        {urgencyLabels[r.urgency] ?? "Нормальний"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                                    {new Date(r.createdAt).toLocaleDateString("uk-UA")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={sc.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(r)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                Запитів не знайдено
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent className="max-w-lg">
                    {selectedRequest && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Запит #{selectedRequest.id} — {selectedRequest.companyName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-muted-foreground">Контакт:</span> {selectedRequest.contactPerson}</div>
                                    <div><span className="text-muted-foreground">Телефон:</span> {selectedRequest.phone}</div>
                                    <div><span className="text-muted-foreground">Email:</span> {selectedRequest.email}</div>
                                    <div>
                                        <span className="text-muted-foreground">Терміновість:</span>{" "}
                                        <Badge variant="outline" className={urgencyColors[selectedRequest.urgency]}>
                                            {urgencyLabels[selectedRequest.urgency]}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2"><span className="text-muted-foreground">Адреса:</span> {selectedRequest.deliveryAddress}</div>
                                    {selectedRequest.notes && (
                                        <div className="col-span-2"><span className="text-muted-foreground">Примітки:</span> {selectedRequest.notes}</div>
                                    )}
                                </div>

                                <div className="border rounded-md divide-y">
                                    {selectedRequest.products.map(p => (
                                        <div key={p.productId} className="flex items-center justify-between p-3 text-sm">
                                            <span className="font-medium">{p.productName ?? `#${p.productId}`}</span>
                                            <span className="text-muted-foreground">{p.quantity} шт · {p.weight.toFixed(1)} кг</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Змінити статус</p>
                                    <div className="flex flex-wrap gap-2">
                                        {["processing", "approved", "rejected", "completed"].map(s => {
                                            const sc = statusConfig[s];
                                            const Icon = sc.icon;
                                            return (
                                                <Button
                                                    key={s}
                                                    variant={selectedRequest.status === s ? "default" : "outline"}
                                                    size="sm"
                                                    className="gap-1"
                                                    disabled={selectedRequest.status === s}
                                                    onClick={() => handleStatusChange(selectedRequest.id, s)}
                                                >
                                                    <Icon className="h-3 w-3" /> {sc.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
