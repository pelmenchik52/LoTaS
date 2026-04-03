import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AuditLogDto } from "../../../api/api.ts";

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<AuditLogDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = async () => {
        try { setLoading(true); setLogs(await adminApi.getAuditLogs()); }
        catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = logs.filter(l =>
        l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Аудит системи</h1>
                    <p className="text-muted-foreground">Журнал дій користувачів</p>
                </div>
                <Button variant="outline" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Оновити
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Журнал подій ({filtered.length})</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Пошук..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-center py-8 text-muted-foreground">Завантаження...</div> : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Час</TableHead>
                                        <TableHead>Користувач</TableHead>
                                        <TableHead>Дія</TableHead>
                                        <TableHead>Об'єкт</TableHead>
                                        <TableHead className="hidden md:table-cell">Деталі</TableHead>
                                        <TableHead className="hidden lg:table-cell">IP</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(l => (
                                        <TableRow key={l.id}>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(l.timestamp).toLocaleString("uk-UA")}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">{l.userName}</TableCell>
                                            <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{l.entity}</TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">{l.details ?? "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{l.ipAddress}</TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Записів не знайдено</TableCell></TableRow>
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