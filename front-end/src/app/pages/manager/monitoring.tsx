import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Truck, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { managerApi, type RouteDto, type DeliveryRequestDto } from "../../../api";

const routeStatusConfig: Record<string, { label: string; icon: any; color: string }> = {
    planned: { label: "Заплановано", icon: Clock, color: "text-blue-600 border-blue-600" },
    assigned: { label: "Призначено (відвантаження)", icon: PackageCheck, color: "text-purple-600 border-purple-600" },
    "in-progress": { label: "В дорозі", icon: Truck, color: "text-orange-600 border-orange-600" },
    completed: { label: "Завершено", icon: CheckCircle, color: "text-green-600 border-green-600" },
    cancelled: { label: "Скасовано", icon: XCircle, color: "text-red-600 border-red-600" },
};

const urgencyLabels: Record<number, string> = { 1: "Нормальний", 2: "Підвищений", 3: "Критичний" };
const urgencyColors: Record<number, string> = {
    1: "text-green-600 border-green-600",
    2: "text-orange-600 border-orange-600",
    3: "text-red-600 border-red-600",
};

export default function ManagerMonitoringPage() {
    const [routes, setRoutes] = useState<RouteDto[]>([]);
    const [requests, setRequests] = useState<DeliveryRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    const load = async () => {
        try {
            setLoading(true);
            const [r, req] = await Promise.all([managerApi.getRoutes(), managerApi.getRequests()]);
            setRoutes(r); setRequests(req);
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleUpdateRoute = async (id: number, status: string) => {
        try {
            await managerApi.updateRouteStatus(id, status);
            toast.success("Статус оновлено");
            load();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleUpdateRequest = async (id: number, status: string) => {
        try {
            await managerApi.updateRequestStatus(id, status);
            toast.success("Статус запиту оновлено");
            load();
        } catch (e: any) { toast.error(e.message); }
    };

    const filteredRoutes = statusFilter === "all" ? routes : routes.filter(r => r.status === statusFilter);
    const activeRoutes = routes.filter(r => r.status === "in-progress").length;
    const pendingRequests = requests.filter(r => r.status === "pending").length;
    const criticalRequests = requests.filter(r => r.urgency === 3 && r.status === "pending").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Моніторинг виконання</h1>
                    <p className="text-muted-foreground">Відстеження маршрутів та запитів</p>
                </div>
                <Button variant="outline" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Оновити
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Всього маршрутів", value: routes.length, icon: Truck, color: "text-blue-600" },
                    { label: "Активних", value: activeRoutes, icon: Truck, color: "text-orange-600" },
                    { label: "Очікують рішення", value: pendingRequests, icon: Clock, color: "text-yellow-600" },
                    { label: "Критичних запитів", value: criticalRequests, icon: AlertTriangle, color: "text-red-600" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}><CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm text-muted-foreground mb-1">{label}</p><p className="text-3xl font-bold">{value}</p></div>
                            <Icon className={`h-10 w-10 ${color}`} />
                        </div>
                    </CardContent></Card>
                ))}
            </div>

            {/* Delivery Requests */}
            {pendingRequests > 0 && (
                <Card>
                    <CardHeader><CardTitle>Запити на доставку ({pendingRequests} очікують)</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Склад</TableHead>
                                    <TableHead>Товари</TableHead>
                                    <TableHead>Терміновість</TableHead>
                                    <TableHead>Дата</TableHead>
                                    <TableHead className="text-right">Дії</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.filter(r => r.status === "pending")
                                    .sort((a, b) => b.urgency - a.urgency)
                                    .map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">{r.warehouseName}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {r.products.map(p => `${p.productName ?? `#${p.productId}`} × ${p.quantity}`).join(", ")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={urgencyColors[r.urgency]}>
                                                    {urgencyLabels[r.urgency]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(r.createdAt).toLocaleDateString("uk-UA")}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" onClick={() => handleUpdateRequest(r.id, "approved")}>Схвалити</Button>
                                                <Button size="sm" variant="outline" className="text-red-500"
                                                    onClick={() => handleUpdateRequest(r.id, "rejected")}>Відхилити</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Routes */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Маршрути</CardTitle>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Всі статуси</SelectItem>
                            <SelectItem value="planned">Заплановані</SelectItem>
                            <SelectItem value="assigned">Призначені</SelectItem>
                            <SelectItem value="in-progress">В дорозі</SelectItem>
                            <SelectItem value="completed">Завершені</SelectItem>
                            <SelectItem value="cancelled">Скасовані</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-center py-8 text-muted-foreground">Завантаження...</div> : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Маршрут</TableHead>
                                        <TableHead className="hidden md:table-cell">Водій</TableHead>
                                        <TableHead className="hidden md:table-cell">Авто</TableHead>
                                        <TableHead className="hidden lg:table-cell">Відстань</TableHead>
                                        <TableHead className="hidden lg:table-cell">Вартість</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead className="text-right">Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRoutes.map(r => {
                                        const sc = routeStatusConfig[r.status] ?? routeStatusConfig.planned;
                                        const Icon = sc.icon;
                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.from} → {r.to}</TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">{r.driverName ?? "—"}</TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">{r.vehicleModel ?? "—"}</TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground">{r.distance > 0 ? `${r.distance} км` : "—"}</TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground">{r.totalCost ? `${r.totalCost.toFixed(2)} грн` : "—"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={sc.color}>
                                                        <Icon className="h-3 w-3 mr-1" />{sc.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {r.status === "planned" && (
                                                        <Button size="sm" onClick={() => handleUpdateRoute(r.id, "assigned")}>Передати на склад</Button>
                                                    )}
                                                    {r.status === "assigned" && (
                                                        <Button size="sm" onClick={() => handleUpdateRoute(r.id, "in-progress")}>Відправити</Button>
                                                    )}
                                                    {r.status === "in-progress" && (
                                                        <Button size="sm" onClick={() => handleUpdateRoute(r.id, "completed")}>Завершити</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredRoutes.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Маршрутів немає</TableCell></TableRow>
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