export type UserRole = "admin" | "manager" | "warehouse" | "accountant";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  warehouses: string[];
  active: boolean;
}

export interface Trailer {
  id: string;
  type: string; // тип причепа
  length: number; // довжина в метрах
  width: number; // ширина в метрах
  maxWeight: number; // максимальна вага в кг
  active: boolean;
}

export interface Vehicle {
  id: string;
  model: string; // модель фури
  plateNumber: string; // номер
  fuelConsumption: number; // розхід л/100км
  power: number; // потужність в к.с.
  trailerId: string | null; // під'єднаний причеп
  fuelType: "diesel" | "petrol" | "electric"; // тип палива
  capacity: number; // вантажопідйомність кг
  active: boolean;
}

export interface Driver {
  id: string;
  name: string; // ПІБ
  phone: string;
  license: string;
  vehicleId: string | null; // машина
  hourlyRate: number; // ставка за годину
  workHoursPerDay: number; // години роботи на день
  workHoursThisWeek: number; // відпрацьовано годин цього тижня
  maxHoursPerWeek: number; // максимум годин на тиждень
  isBusy: boolean; // зайнятість
  active: boolean;
}

export interface Product {
  id: string;
  name: string; // назва
  type: string; // тип товару (швидкопсувний, звичайний тощо)
  weight: number; // вага в кг
  urgencyCoefficient: number; // коефіцієнт терміновості (1-10)
  expirationDays?: number; // днів до псування
  active: boolean;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  lastUpdated: Date;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  distance: number; // км
  estimatedTime: number; // години
  driverId: string | null;
  vehicleId: string | null;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  orders: Order[];
  totalCost?: number;
  fuelCost?: number;
  driverSalary?: number;
}

export interface Order {
  id: string;
  routeId: string;
  products: OrderProduct[];
  from: string;
  to: string;
  status: "pending" | "in-transit" | "delivered";
  urgency: number;
}

export interface OrderProduct {
  productId: string;
  quantity: number;
  weight: number;
}

export interface DeliveryRequest {
  id: string;
  warehouseId: string;
  requestedBy: string; // комірник
  products: OrderProduct[];
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: Date;
  managerId: string | null;
}

export interface TransactionArchive {
  id: string;
  type: "receiving" | "shipping";
  warehouseId: string;
  productId: string;
  quantity: number;
  date: Date;
  performedBy: string;
  notes?: string;
}