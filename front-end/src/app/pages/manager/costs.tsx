import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Fuel, Clock, DollarSign, TrendingUp, Calculator as CalcIcon, User } from "lucide-react";
import { toast } from "sonner";
import { managerApi, type DriverDto, type VehicleDto, type CostResultDto } from "../../../api";

const AMORTIZATION_RATE = 5; // грн за км
const AVERAGE_SPEED = 50; // км/год

export default function ManagerCostsPage() {
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [distance, setDistance] = useState<string>("200");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [fuelPrice, setFuelPrice] = useState<string>("52");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [cargoWeight, setCargoWeight] = useState<string>("1000");
  const [costResult, setCostResult] = useState<CostResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [salaryDistance, setSalaryDistance] = useState<string>("500");
  const [salaryDriverId, setSalaryDriverId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [driversData, vehiclesData] = await Promise.all([
          managerApi.getDrivers(),
          managerApi.getVehicles(),
        ]);
        setDrivers(driversData);
        setVehicles(vehiclesData);
        if (!selectedDriver && driversData.length > 0) {
          setSelectedDriver(String(driversData[0].id));
        }
        if (!selectedVehicle && vehiclesData.length > 0) {
          setSelectedVehicle(String(vehiclesData[0].id));
        }
        if (!salaryDriverId && driversData.length > 0) {
          setSalaryDriverId(String(driversData[0].id));
        }
      } catch (err) {
        setFetchError((err as Error).message || "Не вдалося завантажити дані водіїв та транспорту");
      }
    };

    void loadData();
  }, []);

  const selectedVehicleDto = vehicles.find((v) => String(v.id) === selectedVehicle);
  const selectedDriverDto = drivers.find((d) => String(d.id) === selectedDriver);
  const salaryDriver = drivers.find((d) => String(d.id) === salaryDriverId);

  // Розрахунки маршруту
  const distanceNum = Math.max(0, parseFloat(distance) || 0);
  const fuelPriceNum = Math.max(0, parseFloat(fuelPrice) || 0);
  const distanceNum = parseFloat(distance) || 0;
  const fuelPriceNum = parseFloat(fuelPrice) || 0;
  const cargoWeightNum = parseFloat(cargoWeight) || 0;
  const estimatedHours = distanceNum / AVERAGE_SPEED;

  const fuelConsumption = selectedVehicleDto ? (distanceNum / 100) * selectedVehicleDto.fuelConsumption : 0;
  const travelTime = distanceNum / AVERAGE_SPEED;
  const driverCost = selectedDriverDto ? travelTime * selectedDriverDto.hourlyRate : 0;
  const amortization = distanceNum * AMORTIZATION_RATE;
  const totalCost = fuelConsumption * fuelPriceNum + driverCost + amortization;

  const salaryDistanceNum = parseFloat(salaryDistance) || 0;
  const salaryTravelTime = salaryDistanceNum / AVERAGE_SPEED;
  const driverSalary = salaryDriver ? salaryTravelTime * salaryDriver.hourlyRate : 0;

  const handleCalculateCosts = async () => {
    if (!selectedVehicleDto || !selectedDriverDto) {
      toast.error("Оберіть транспорт та водія");
      return;
    }

    if (distanceNum <= 0 || fuelPriceNum <= 0) {
      toast.error("Вкажіть коректну відстань та ціну палива");
      return;
    }

    setIsLoading(true);
    try {
      const result = await managerApi.calculateCosts({
        Distance: distanceNum,
        FuelConsumption: selectedVehicleDto.fuelConsumption,
        FuelPrice: fuelPriceNum,
        HourlyRate: selectedDriverDto.hourlyRate,
        EstimatedHours: estimatedHours,
        CargoWeight: cargoWeightNum,
        VehicleCapacity: selectedVehicleDto.capacity,
      });
      setCostResult(result);
      toast.success("Розрахунок витрат виконано");
    } catch (err) {
      toast.error((err as Error).message || "Помилка розрахунку витрат");
    } finally {
      setIsLoading(false);
    }
  };

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
                    <Input id="distance" type="number" min={0} value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="150" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelPrice">Ціна палива (грн/л)</Label>
                    <Input id="fuelPrice" type="number" min={0} step="0.1" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} placeholder="52" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Транспорт (фура)</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="Оберіть транспорт" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
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
                      <SelectValue placeholder="Оберіть водія" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name} - {d.hourlyRate} грн/год
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargoWeight">Вага вантажу (кг)</Label>
                  <Input
                    id="cargoWeight"
                    type="number"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    placeholder="1000"
                  />
                </div>

                {selectedVehicleDto && (
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Модель:</span> {selectedVehicleDto.model}
                    </p>
                    <p>
                      <span className="font-medium">Номер:</span> {selectedVehicleDto.plateNumber}
                    </p>
                    <p>
                      <span className="font-medium">Розхід палива:</span> {selectedVehicleDto.fuelConsumption} л/100км
                    </p>
                    <p>
                      <span className="font-medium">Потужність:</span> {selectedVehicleDto.power} к.с.
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
                    <p className="font-semibold text-blue-600">{(fuelConsumption * fuelPriceNum).toFixed(2)} грн</p>
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

                {costResult && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                    <p className="font-semibold">Результат з сервера:</p>
                    <p>Паливні витрати: {costResult.fuelCost.toFixed(2)} грн</p>
                    <p>Зарплата водія: {costResult.driverSalary.toFixed(2)} грн</p>
                    <p>Загальна сума: {costResult.totalCost.toFixed(2)} грн</p>
                    <p>Ефективність: {costResult.efficiencyPercent.toFixed(1)}%</p>
                  </div>
                )}

                <Button onClick={handleCalculateCosts} disabled={isLoading} className="w-full">
                  {isLoading ? "Розрахунок..." : "Розрахувати через сервер"}
                </Button>
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
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
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
                  <Input id="salaryDistance" type="number" min={0} value={salaryDistance} onChange={(e) => setSalaryDistance(e.target.value)} placeholder="500" />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">Приблизний час в дорозі</p>
                  <p className="text-2xl font-bold text-blue-600">{salaryTravelTime.toFixed(1)} годин</p>
                  <p className="text-xs text-muted-foreground">На основі середньої швидкості {AVERAGE_SPEED} км/год</p>
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
