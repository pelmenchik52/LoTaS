import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { RefreshCw, Search, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { accountantApi, type TransactionDto } from "../../../api/api.ts";

export default function AccountantArchivePage() {
    const [transactions, setTransactions] = useState<TransactionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const load = async () => {
        try { setLoading(true); setTransactions(await accountantApi.getArchive()); }
        catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = transactions.filter(t =>
        (typeFilter === "all" || t.type === typeFilter) &&
        (t.productName.toLowerCase().includes(search.toLowerCase()) ||
            t.warehouseName.toLowerCase().includes(search.toLowerCase()))
    );

    const receiving = transactions.filter(t => t.type === "receiving").length;
    const shipping = transactions.filter(t => t.type === "shipping").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Архів операцій</h1>
                    <p className="text-muted-foreground">Всі транзакції прийому та відвантаження</p>
                </div>
                <Button variant="outline" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Оновити
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Всього операцій", value: transactions.length, color: "text-blue-600" },
                    { label: "Прийом товарів", value: receiving, color: "text-green-600" },
                    { label: "Відвантаження", value: shipping, color: "text-orange-600" },
                ].map(({ label, value, color }) => (
                    <Card key={label}><CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    </CardContent></Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Операції</CardTitle>
                    <div className="flex gap-3 mt-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="Пошук..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всі типи</SelectItem>
                                <SelectItem value="receiving">Прийом</SelectItem>
                                <SelectItem value="shipping">Відвантаження</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-center py-8 text-muted-foreground">Завантаження...</div> : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Тип</TableHead>
                                        <TableHead>Товар</TableHead>
                                        <TableHead>Склад</TableHead>
                                        <TableHead>Кількість</TableHead>
                                        <TableHead className="hidden md:table-cell">Виконав</TableHead>
                                        <TableHead className="hidden lg:table-cell">Примітки</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-sm whitespace-nowrap">
                                                {new Date(t.date).toLocaleString("uk-UA")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={t.type === "receiving" ? "text-green-600 border-green-600" : "text-orange-600 border-orange-600"}>
                                                    {t.type === "receiving" ? <ArrowDownToLine className="h-3 w-3 mr-1" /> : <ArrowUpFromLine className="h-3 w-3 mr-1" />}
                                                    {t.type === "receiving" ? "Прийом" : "Відвантаж."}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{t.productName}</TableCell>
                                            <TableCell className="text-muted-foreground">{t.warehouseName}</TableCell>
                                            <TableCell>{t.quantity}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{t.performedByName}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground">{t.notes ?? "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Операцій не знайдено</TableCell></TableRow>
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