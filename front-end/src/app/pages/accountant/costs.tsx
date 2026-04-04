import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Fuel, DollarSign, TrendingDown, Download, Loader2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { accountantApi } from "../../api/api";
import type { RouteDto } from "../../api/api";

export default function AccountantCostsPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const reportsData = await accountantApi.getReports();
      setRoutes(reportsData);
    } catch (error) {
      console.error("Помилка завантаження даних:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals from routes data
  const totalMileage = routes.reduce((sum, r) => sum + r.distance, 0);
  const totalFuelCost = routes.reduce((sum, r) => sum + (r.fuelCost || 0), 0);
  const totalDriverSalary = routes.reduce((sum, r) => sum + (r.driverSalary || 0), 0);
  const totalCost = routes.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  // Mock cost breakdown for now (could be enhanced with real API data)
  const costBreakdown = [
    { name: "Паливо", value: totalFuelCost, color: "#3b82f6" },
    { name: "Зарплата водіїв", value: totalDriverSalary, color: "#10b981" },
    { name: "Амортизація", value: Math.round(totalCost * 0.2), color: "#f59e0b" },
    { name: "Обслуговування", value: Math.round(totalCost * 0.1), color: "#ef4444" },
  ];

  // Mock fuel comparison data (could be enhanced with real API data)
  const fuelComparisonData = routes.slice(0, 7).map((route, index) => ({
    date: new Date(route.createdAt).toLocaleDateString('uk-UA'),
    planned: Math.round((route.fuelCost || 0) * 0.9), // Mock planned as 90% of actual
    actual: Math.round(route.fuelCost || 0),
  }));

  const totalPlannedFuel = fuelComparisonData.reduce((sum, d) => sum + d.planned, 0);
  const totalActualFuel = fuelComparisonData.reduce((sum, d) => sum + d.actual, 0);
  const fuelDeviation = totalPlannedFuel > 0 ? ((totalActualFuel - totalPlannedFuel) / totalPlannedFuel) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Аналіз витрат</h1>
          <p className="text-muted-foreground">
            Звіти по кілометражу, паливу та загальним витратам
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">За день</SelectItem>
              <SelectItem value="week">За тиждень</SelectItem>
              <SelectItem value="month">За місяць</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Експорт</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Завантаження даних...</span>
        </div>
      ) : (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Пробіг</p>
                    <p className="text-3xl font-bold">{totalMileage.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="h-10 w-10 text-blue-600" />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Кілометрів
                </div>
              </CardContent>
            </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Витрати на паливо</p>
                <p className="text-3xl font-bold">{totalFuelCost.toLocaleString()}</p>
              </div>
              <Fuel className="h-10 w-10 text-green-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Гривень
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Загальні витрати</p>
                <p className="text-3xl font-bold">{(totalCost / 1000).toFixed(0)}к</p>
              </div>
              <DollarSign className="h-10 w-10 text-orange-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Гривень
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Зарплата водіїв</p>
                <p className="text-3xl font-bold">{totalDriverSalary.toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Гривень
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Порівняння плану та факту */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Витрата палива: план vs факт</CardTitle>
              <CardDescription>Порівняння запланованих та фактичних витрат</CardDescription>
            </div>
            <Badge variant={fuelDeviation > 5 ? "destructive" : "outline"}>
              {fuelDeviation > 0 ? "+" : ""}{fuelDeviation.toFixed(1)}% від плану
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fuelComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="#94a3b8" name="План (л)" />
              <Bar dataKey="actual" fill="#3b82f6" name="Факт (л)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Графіки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Пробіг по транспорту</CardTitle>
            <CardDescription>Кілометраж за обраний період</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mileageData.map((vehicle, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{vehicle.vehicle}</span>
                    <span className="text-muted-foreground">
                      {vehicle.mileage.toLocaleString()} км
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${(vehicle.mileage / totalMileage) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Паливо: {vehicle.fuel.toFixed(1)} л</span>
                    <span>Витрати: {vehicle.cost.toLocaleString()} грн</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Структура витрат</CardTitle>
            <CardDescription>Розподіл витрат по категоріях</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} грн`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {costBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value.toLocaleString()} грн</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Детальна таблиця */}
      <Card>
        <CardHeader>
          <CardTitle>Детальний звіт по транспорту</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Транспорт</th>
                  <th className="text-right p-3 font-semibold">Пробіг (км)</th>
                  <th className="text-right p-3 font-semibold">Паливо (л)</th>
                  <th className="text-right p-3 font-semibold">Витрата (л/100км)</th>
                  <th className="text-right p-3 font-semibold">Вартість палива</th>
                  <th className="text-right p-3 font-semibold">Загальні витрати</th>
                </tr>
              </thead>
              <tbody>
                {mileageData.map((vehicle, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">{vehicle.vehicle}</td>
                    <td className="text-right p-3">{vehicle.mileage.toLocaleString()}</td>
                    <td className="text-right p-3">{vehicle.fuel.toFixed(1)}</td>
                    <td className="text-right p-3">
                      {((vehicle.fuel / vehicle.mileage) * 100).toFixed(1)}
                    </td>
                    <td className="text-right p-3">
                      {(vehicle.fuel * 52).toLocaleString()} грн
                    </td>
                    <td className="text-right p-3 font-semibold">
                      {vehicle.cost.toLocaleString()} грн
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-muted/50">
                  <td className="p-3">Всього</td>
                  <td className="text-right p-3">{totalMileage.toLocaleString()}</td>
                  <td className="text-right p-3">{totalFuel.toFixed(1)}</td>
                  <td className="text-right p-3">{avgFuelConsumption.toFixed(1)}</td>
                  <td className="text-right p-3">
                    {(totalFuel * 52).toLocaleString()} грн
                  </td>
                  <td className="text-right p-3">
                    {mileageData.reduce((sum, v) => sum + v.cost, 0).toLocaleString()} грн
                  </td>
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
