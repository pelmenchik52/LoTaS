import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, TrendingUp, Truck, Download } from "lucide-react";

const deliveryData = [
  { date: "25.03", deliveries: 42, products: 1240 },
  { date: "26.03", deliveries: 38, products: 1150 },
  { date: "27.03", deliveries: 45, products: 1380 },
  { date: "28.03", deliveries: 51, products: 1520 },
  { date: "29.03", deliveries: 48, products: 1410 },
  { date: "30.03", deliveries: 44, products: 1290 },
  { date: "31.03", deliveries: 47, products: 1360 },
];

const categoryData = [
  { category: "Молочні", quantity: 3420, percentage: 28 },
  { category: "Хлібобулочні", quantity: 2850, percentage: 23 },
  { category: "Фрукти", quantity: 2140, percentage: 17 },
  { category: "Овочі", quantity: 1980, percentage: 16 },
  { category: "Бакалія", quantity: 1960, percentage: 16 },
];

export default function AccountantReportsPage() {
  const [period, setPeriod] = useState("week");

  const totalDeliveries = deliveryData.reduce((sum, d) => sum + d.deliveries, 0);
  const totalProducts = deliveryData.reduce((sum, d) => sum + d.products, 0);
  const avgDeliverySize = Math.round(totalProducts / totalDeliveries);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Звітність по доставках</h1>
          <p className="text-muted-foreground">
            Аналіз кількості доставлених товарів за період
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

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Всього доставок</p>
                <p className="text-3xl font-bold">{totalDeliveries}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              За обраний період
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Доставлено товарів</p>
                <p className="text-3xl font-bold">{totalProducts.toLocaleString()}</p>
              </div>
              <Package className="h-10 w-10 text-green-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Одиниць продукції
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Середній розмір</p>
                <p className="text-3xl font-bold">{avgDeliverySize}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Товарів на доставку
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графіки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Динаміка доставок</CardTitle>
            <CardDescription>Кількість доставок за днями</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#3b82f6" 
                  name="Доставок"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Обсяг товарів</CardTitle>
            <CardDescription>Кількість доставлених товарів</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="products" 
                  fill="#10b981" 
                  name="Товарів"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Розподіл по категоріях */}
      <Card>
        <CardHeader>
          <CardTitle>Розподіл по категоріях</CardTitle>
          <CardDescription>Структура доставок за типами товарів</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((cat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-muted-foreground">
                    {cat.quantity.toLocaleString()} од. ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Детальна таблиця */}
      <Card>
        <CardHeader>
          <CardTitle>Детальна статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Дата</th>
                  <th className="text-right p-3 font-semibold">Доставок</th>
                  <th className="text-right p-3 font-semibold">Товарів</th>
                  <th className="text-right p-3 font-semibold">Середній розмір</th>
                </tr>
              </thead>
              <tbody>
                {deliveryData.map((day, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">{day.date}</td>
                    <td className="text-right p-3">{day.deliveries}</td>
                    <td className="text-right p-3">{day.products.toLocaleString()}</td>
                    <td className="text-right p-3">{Math.round(day.products / day.deliveries)}</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-muted/50">
                  <td className="p-3">Всього</td>
                  <td className="text-right p-3">{totalDeliveries}</td>
                  <td className="text-right p-3">{totalProducts.toLocaleString()}</td>
                  <td className="text-right p-3">{avgDeliverySize}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
