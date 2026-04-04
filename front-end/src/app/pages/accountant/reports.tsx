import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, TrendingUp, Truck, Download } from "lucide-react";
import { accountantApi, type RouteDto } from "../../../api";

const statusLabels: Record<string, { label: string; color: string }> = {
  planned: { label: "Заплановано", color: "text-blue-600" },
  "in-progress": { label: "В процесі", color: "text-orange-600" },
  completed: { label: "Завершено", color: "text-green-600" },
  cancelled: { label: "Скасовано", color: "text-red-600" },
};

export default function AccountantReportsPage() {
  const [reports, setReports] = useState<RouteDto[]>([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await accountantApi.getReports();
        setReports(data);
      } catch (err) {
        setError((err as Error).message || "Не вдалося завантажити звіти");
      } finally {
        setLoading(false);
      }
    };
    void loadReports();
  }, []);

  const summary = useMemo(() => {
    const totalRoutes = reports.length;
    const totalDeliveries = reports.reduce((sum, route) => sum + route.orders.length, 0);
    const totalProducts = reports.reduce(
      (sum, route) => sum + route.orders.reduce(
        (orderSum, order) => orderSum + order.products.reduce((prodSum, prod) => prodSum + prod.Quantity, 0),
        0
      ),
      0
    );
    const totalDistance = reports.reduce((sum, route) => sum + route.Distance, 0);
    const totalCost = reports.reduce((sum, route) => sum + Number(route.TotalCost ?? 0), 0);

    return {
      totalRoutes,
      totalDeliveries,
      totalProducts,
      averageDelivery: totalDeliveries > 0 ? Math.round(totalProducts / totalDeliveries) : 0,
      totalDistance,
      totalCost,
    };
  }, [reports]);

  const reportData = useMemo(
    () => reports.map((route) => ({
      name: `${route.From} → ${route.To}`,
      deliveries: route.orders.length,
      products: route.orders.reduce((sum, order) => sum + order.products.reduce((count, prod) => count + prod.Quantity, 0), 0),
      distance: route.Distance,
      cost: Number(route.TotalCost ?? 0),
    })),
    [reports]
  );

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((route) => {
      counts[route.Status] = (counts[route.Status] ?? 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      label: statusLabels[status]?.label ?? status,
    }));
  }, [reports]);

  const filteredReportData = reportData.slice(0, period === "day" ? 7 : period === "week" ? 14 : 30);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Звітність по доставках</h1>
          <p className="text-muted-foreground">Аналіз роботи маршрутів і доставки</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Останні 7 днів</SelectItem>
              <SelectItem value="week">Останні 14 днів</SelectItem>
              <SelectItem value="month">Останні 30 днів</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" disabled={loading || !!error}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Експорт</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Маршрутів</p>
                <p className="text-3xl font-bold">{summary.totalRoutes}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Доставок</p>
                <p className="text-3xl font-bold">{summary.totalDeliveries}</p>
              </div>
              <Package className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Середній розмір</p>
                <p className="text-3xl font-bold">{summary.averageDelivery}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-6 rounded-lg border border-muted bg-muted/50 text-center text-sm text-muted-foreground">Завантаження звітів...</div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-center text-sm text-destructive">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Динаміка доставок</CardTitle>
                <CardDescription>Кількість доставок за маршрутами</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={filteredReportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="deliveries" stroke="#3b82f6" name="Доставок" strokeWidth={2} />
                    <Line type="monotone" dataKey="products" stroke="#10b981" name="Товарів" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Загальні витрати</CardTitle>
                <CardDescription>Вартість маршрутів за вибраний період</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredReportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cost" fill="#8b5cf6" name="Вартість" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Статистика за статусом</CardTitle>
              <CardDescription>Розподіл маршрутів за станом</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {statusData.map((item) => (
                  <div key={item.status} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-lg font-semibold">{item.count}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(item.count / Math.max(reports.length, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Детальна статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Маршрут</th>
                      <th className="text-right p-3 font-semibold">Доставок</th>
                      <th className="text-right p-3 font-semibold">Товарів</th>
                      <th className="text-right p-3 font-semibold">Відстань</th>
                      <th className="text-right p-3 font-semibold">Вартість</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">{row.name}</td>
                        <td className="text-right p-3">{row.deliveries}</td>
                        <td className="text-right p-3">{row.products}</td>
                        <td className="text-right p-3">{row.distance.toFixed(1)} км</td>
                        <td className="text-right p-3">{row.cost.toFixed(2)} грн</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-muted/50">
                      <td className="p-3">Всього</td>
                      <td className="text-right p-3">{summary.totalDeliveries}</td>
                      <td className="text-right p-3">{summary.totalProducts}</td>
                      <td className="text-right p-3">{summary.totalDistance.toFixed(1)} км</td>
                      <td className="text-right p-3">{summary.totalCost.toFixed(2)} грн</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
