import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Fuel, Clock, DollarSign, TrendingUp, Calculator as CalcIcon, User } from "lucide-react";
import type { Vehicle, Driver } from "../../types";

const mockVehicles: Vehicle[] = [
  { id: "1", model: "Mercedes Actros", plateNumber: "AA 1234 BB", fuelConsumption: 28.5, power: 450, trailerId: "1", fuelType: "diesel", capacity: 20000, active: true },
  { id: "2", model: "Volvo FH16", plateNumber: "AA 5678 BB", fuelConsumption: 30.0, power: 540, trailerId: "2", fuelType: "diesel", capacity: 18000, active: true },
  { id: "3", model: "MAN TGX", plateNumber: "AA 9012 CC", fuelConsumption: 27.5, power: 500, trailerId: null, fuelType: "diesel", capacity: 19000, active: true },
];

const mockDrivers: Driver[] = [
  { id: "1", name: "Дмитро Іваненко", phone: "+380 67 123 4567", license: "ABC123456", vehicleId: "1", hourlyRate: 150, workHoursPerDay: 8, workHoursThisWeek: 32, maxHoursPerWeek: 48, isBusy: false, tckStatus: "active", active: true },
  { id: "2", name: "Андрій Мельник", phone: "+380 63 987 6543", license: "DEF789012", vehicleId: "2", hourlyRate: 160, workHoursPerDay: 8, workHoursThisWeek: 40, maxHoursPerWeek: 48, isBusy: false, tckStatus: "active", active: true },
  { id: "3", name: "Василь Петров", phone: "+380 50 555 1234", license: "GHI345678", vehicleId: null, hourlyRate: 145, workHoursPerDay: 8, workHoursThisWeek: 24, maxHoursPerWeek: 48, isBusy: false, tckStatus: "active", active: true },
];

const AMORTIZATION_RATE = 5; // грн за км

export default function ManagerCostsPage() {
  // Калькулятор маршруту
  const [distance, setDistance] = useState<string>("200");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("1");
  const [fuelPrice, setFuelPrice] = useState<string>("52");
  const [selectedDriver, setSelectedDriver] = useState<string>("1");

  // Калькулятор зарплатні
  const [salaryDistance, setSalaryDistance] = useState<string>("500");
  const [salaryDriverId, setSalaryDriverId] = useState<string>("1");

  const vehicle = mockVehicles.find((v) => v.id === selectedVehicle);
  const driver = mockDrivers.find((d) => d.id === selectedDriver);
  const salaryDriver = mockDrivers.find((d) => d.id === salaryDriverId);

  // Розрахунки маршруту
  const distanceNum = parseFloat(distance) || 0;
  const fuelPriceNum = parseFloat(fuelPrice) || 0;

  const fuelConsumption = vehicle ? (distanceNum / 100) * vehicle.fuelConsumption : 0;
  const fuelCost = fuelConsumption * fuelPriceNum;
  const avgSpeed = 50; // км/год
  const travelTime = distanceNum / avgSpeed;
  const driverCost = driver ? travelTime * driver.hourlyRate : 0;
  const amortization = distanceNum * AMORTIZATION_RATE;
  const totalCost = fuelCost + driverCost + amortization;

  // Розрахунок зарплатні водія
  const salaryDistanceNum = parseFloat(salaryDistance) || 0;
  const salaryTravelTime = salaryDistanceNum / avgSpeed;
  const driverSalary = salaryDriver ? salaryTravelTime * salaryDriver.hourlyRate : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Калькулятор витрат</h1>
        <p className="text-muted-foreground">Розрахунок витрат на доставку та зарплатні водіїв</p>
      </div>

      <Tabs defaultValue="route" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="route">Витрати маршруту</TabsTrigger>
          <TabsTrigger value="salary">Зарплата водія</TabsTrigger>
        </TabsList>

        {/* Калькулятор витрат маршруту */}
        <TabsContent value="route">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Параметри */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Параметри маршруту</CardTitle>
                <CardDescription>Введіть дані для розрахунку витрат</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">Відстань (км)</Label>
                    <Input id="distance" type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="150" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelPrice">Ціна палива (грн/л)</Label>
                    <Input id="fuelPrice" type="number" step="0.1" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} placeholder="52" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Транспорт (фура)</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger id="vehicle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.model} - {v.fuelConsumption} л/100км
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver">Водій</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger id="driver">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDrivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} - {d.hourlyRate} грн/год
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {vehicle && (
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Модель:</span> {vehicle.model}
                    </p>
                    <p>
                      <span className="font-medium">Номер:</span> {vehicle.plateNumber}
                    </p>
                    <p>
                      <span className="font-medium">Розхід палива:</span> {vehicle.fuelConsumption} л/100км
                    </p>
                    <p>
                      <span className="font-medium">Потужність:</span> {vehicle.power} к.с.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Результати */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalcIcon className="h-5 w-5" />
                  Результати
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Паливо</p>
                        <p className="text-xs text-muted-foreground">{fuelConsumption.toFixed(1)} л</p>
                      </div>
                    </div>
                    <p className="font-semibold text-blue-600">{fuelCost.toFixed(2)} грн</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Зарплата водія</p>
                        <p className="text-xs text-muted-foreground">{travelTime.toFixed(1)} год</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">{driverCost.toFixed(2)} грн</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Амортизація</p>
                        <p className="text-xs text-muted-foreground">{AMORTIZATION_RATE} грн/км</p>
                      </div>
                    </div>
                    <p className="font-semibold text-orange-600">{amortization.toFixed(2)} грн</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Час в дорозі</p>
                      </div>
                    </div>
                    <p className="font-semibold text-purple-600">{travelTime.toFixed(1)} год</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-primary" />
                      <p className="font-semibold">Загальні витрати</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">{totalCost.toFixed(2)} грн</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Витрати на км: {distanceNum > 0 ? (totalCost / distanceNum).toFixed(2) : "0"} грн</p>
                  <p>• Середня швидкість: {avgSpeed} км/год</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Калькулятор зарплатні */}
        <TabsContent value="salary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Розрахунок зарплатні водія</CardTitle>
                <CardDescription>Розрахунок оплати праці на основі відстані</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="salaryDriver">Водій</Label>
                  <Select value={salaryDriverId} onValueChange={setSalaryDriverId}>
                    <SelectTrigger id="salaryDriver">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDrivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {salaryDriver && (
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <p>
                      <span className="font-medium">ПІБ:</span> {salaryDriver.name}
                    </p>
                    <p>
                      <span className="font-medium">Телефон:</span> {salaryDriver.phone}
                    </p>
                    <p>
                      <span className="font-medium">Ставка:</span> {salaryDriver.hourlyRate} грн/год
                    </p>
                    <p>
                      <span className="font-medium">Години цього тижня:</span> {salaryDriver.workHoursThisWeek} / {salaryDriver.maxHoursPerWeek}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="salaryDistance">Відстань маршруту (км)</Label>
                  <Input id="salaryDistance" type="number" value={salaryDistance} onChange={(e) => setSalaryDistance(e.target.value)} placeholder="500" />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">Приблизний час в дорозі</p>
                  <p className="text-2xl font-bold text-blue-600">{salaryTravelTime.toFixed(1)} годин</p>
                  <p className="text-xs text-muted-foreground">На основі середньої швидкості {avgSpeed} км/год</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Зарплата
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-muted-foreground mb-2">Зарплата за маршрут</p>
                  <p className="text-4xl font-bold text-green-600 mb-1">{driverSalary.toFixed(2)} грн</p>
                  <p className="text-sm text-muted-foreground">
                    {salaryTravelTime.toFixed(1)} год × {salaryDriver?.hourlyRate || 0} грн/год
                  </p>
                </div>

                {salaryDriver && (
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Ставка за годину</span>
                      <span className="font-medium">{salaryDriver.hourlyRate} грн</span>
                    </div>

                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Часу в маршруті</span>
                      <span className="font-medium">{salaryTravelTime.toFixed(1)} год</span>
                    </div>

                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Відпрацьовано цього тижня</span>
                      <span className="font-medium">{salaryDriver.workHoursThisWeek} год</span>
                    </div>

                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Залишилось годин</span>
                      <span className="font-medium">{salaryDriver.maxHoursPerWeek - salaryDriver.workHoursThisWeek} год</span>
                    </div>

                    {salaryTravelTime > salaryDriver.maxHoursPerWeek - salaryDriver.workHoursThisWeek && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        ⚠️ Увага! Водій перевищить ліміт годин на тиждень
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
