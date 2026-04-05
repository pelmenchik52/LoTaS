// Central API client for the logistics backend (ASP.NET + MySQL)
// All pages should import from this file instead of using mock data.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken(): string | null {
    return localStorage.getItem("authToken");
}

function authHeaders(): HeadersInit {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: authHeaders(),
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? "Помилка сервера");
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;
    return res.json();
}

const get = <T>(path: string) => request<T>("GET", path);
const post = <T>(path: string, body: unknown) => request<T>("POST", path, body);
const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
const del = <T>(path: string) => request<T>("DELETE", path);

// ─── Types (mirror backend DTOs) ─────────────────────────────────────────────

export interface AuthResponse {
    token: string;
    name: string;
    email: string;
    role: string;
    id: number;
    warehouseIds: number[];
}

export interface UserDto {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
    warehouseIds: number[];
}

export interface WarehouseDto {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    active: boolean;
}

export interface ProductDto {
    id: number;
    name: string;
    type: string;
    weight: number;
    urgencyCoefficient: number;
    expirationDays?: number;
    active: boolean;
}

export interface StockDto {
    id: number;
    warehouseId: number;
    warehouseName: string;
    productId: number;
    productName: string;
    productType: string;
    quantity: number;
    unit: string;
    shelf: string;
    status: "in-stock" | "low-stock" | "out-of-stock";
    expiryDate?: string;
    lastUpdated: string;
}

export interface DriverDto {
    id: number;
    name: string;
    phone: string;
    license: string;
    vehicleId?: number;
    vehicleModel?: string;
    plateNumber?: string;
    hourlyRate: number;
    workHoursPerDay: number;
    workHoursThisWeek: number;
    maxHoursPerWeek: number;
    isBusy: boolean;
    active: boolean;
}

export interface VehicleDto {
    id: number;
    model: string;
    plateNumber: string;
    fuelConsumption: number;
    power: number;
    trailerId?: number;
    trailerType?: string;
    fuelType: string;
    capacity: number;
    active: boolean;
}

export interface TrailerDto {
    id: number;
    type: string;
    length: number;
    width: number;
    maxWeight: number;
    active: boolean;
}

export interface OrderProductDto {
    productId: number;
    productName?: string;
    quantity: number;
    weight: number;
}

export interface OrderDto {
    id: number;
    routeId: number;
    from: string;
    to: string;
    status: string;
    urgency: number;
    products: OrderProductDto[];
}

export interface RouteDto {
    id: number;
    from: string;
    to: string;
    distance: number;
    estimatedTime: number;
    driverId?: number;
    driverName?: string;
    vehicleId?: number;
    vehicleModel?: string;
    status: string;
    totalCost?: number;
    fuelCost?: number;
    driverSalary?: number;
    createdAt: string;
    orders: OrderDto[];
}

export interface DeliveryRequestDto {
    id: number;
    warehouseId: number;
    warehouseName: string;
    requestedById: number;
    requestedByName: string;
    status: string;
    managerId?: number;
    notes?: string;
    urgency: number;
    createdAt: string;
    products: { productId: number; productName?: string; quantity: number; weight: number }[];
}

export interface TransactionDto {
    id: number;
    type: string;
    warehouseId: number;
    warehouseName: string;
    productId: number;
    productName: string;
    quantity: number;
    date: string;
    performedByName: string;
    notes?: string;
}

export interface AuditLogDto {
    id: number;
    userId: number;
    userName: string;
    action: string;
    entity: string;
    details?: string;
    timestamp: string;
    ipAddress: string;
}

export interface CostResultDto {
    fuelCost: number;
    driverSalary: number;
    totalCost: number;
    efficiencyPercent: number;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
    login: (email: string, password: string) =>
        post<AuthResponse>("/auth/login", { email, password }),

    register: (
        name: string,
        email: string,
        password: string,
        role: string,
        warehouseIds: number[]
    ) => post<AuthResponse>("/auth/register", { name, email, password, role, warehouseIds }),

    /** Save token + user info to localStorage after login/register */
    persist: (res: AuthResponse) => {
        localStorage.setItem("authToken", res.token);
        localStorage.setItem("userRole", res.role);
        localStorage.setItem("userName", res.name);
        localStorage.setItem("userId", String(res.id));
        localStorage.setItem("userEmail", res.email);
        localStorage.setItem("warehouseIds", JSON.stringify(res.warehouseIds));
    },

    logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("warehouseIds");
    },

    isAuthenticated: () => !!getToken(),
    getRole: () => localStorage.getItem("userRole") ?? "",
    getName: () => localStorage.getItem("userName") ?? "",
    getId: () => Number(localStorage.getItem("userId") ?? 0),
    getEmail: () => localStorage.getItem("userEmail") ?? "",
    getWarehouseIds: (): number[] => {
        try { return JSON.parse(localStorage.getItem("warehouseIds") ?? "[]"); }
        catch { return []; }
    },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
    // Users
    getUsers: () => get<UserDto[]>("/admin/users"),
    createUser: (data: Omit<UserDto, "id" | "active"> & { password: string }) =>
        post<UserDto>("/admin/users", data),
    updateUser: (id: number, data: Partial<UserDto> & { password?: string }) =>
        put<void>(`/admin/users/${id}`, data),
    deleteUser: (id: number) => del<void>(`/admin/users/${id}`),

    // Drivers
    getDrivers: () => get<DriverDto[]>("/admin/drivers"),
    createDriver: (data: object) => post<DriverDto>("/admin/drivers", data),
    updateDriver: (id: number, data: object) => put<void>(`/admin/drivers/${id}`, data),
    deleteDriver: (id: number) => del<void>(`/admin/drivers/${id}`),

    // Vehicles
    getVehicles: () => get<VehicleDto[]>("/admin/vehicles"),
    createVehicle: (data: object) => post<VehicleDto>("/admin/vehicles", data),
    updateVehicle: (id: number, data: object) => put<void>(`/admin/vehicles/${id}`, data),
    deleteVehicle: (id: number) => del<void>(`/admin/vehicles/${id}`),

    // Trailers
    getTrailers: () => get<TrailerDto[]>("/admin/trailers"),
    createTrailer: (data: object) => post<TrailerDto>("/admin/trailers", data),
    deleteTrailer: (id: number) => del<void>(`/admin/trailers/${id}`),

    // Warehouses
    getWarehouses: () => get<WarehouseDto[]>("/admin/warehouses"),
    createWarehouse: (data: { name: string; address: string; lat: number; lng: number }) =>
        post<WarehouseDto>("/admin/warehouses", data),
    updateWarehouse: (id: number, data: { name: string; address: string; lat: number; lng: number; active: boolean }) =>
        put<void>(`/admin/warehouses/${id}`, data),
    deleteWarehouse: (id: number) => del<void>(`/admin/warehouses/${id}`),

    // Products
    getProducts: () => get<ProductDto[]>("/admin/products"),
    createProduct: (data: object) => post<ProductDto>("/admin/products", data),
    updateProduct: (id: number, data: object) => put<void>(`/admin/products/${id}`, data),
    deleteProduct: (id: number) => del<void>(`/admin/products/${id}`),

    // Inventory
    getInventory: () => get<StockDto[]>("/admin/inventory"),
    createStock: (data: { warehouseId: number; productId: number; quantity: number; unit: string; shelf: string }) =>
        post<StockDto>("/admin/inventory", data),
    updateStock: (id: number, data: object) => put<void>(`/admin/inventory/${id}`, data),

    // Audit
    getAuditLogs: () => get<AuditLogDto[]>("/admin/audit"),
};

// ─── Manager API ──────────────────────────────────────────────────────────────

export const managerApi = {
    getRoutes: () => get<RouteDto[]>("/manager/routes"),
    getRoute: (id: number) => get<RouteDto>(`/manager/routes/${id}`),
    createRoute: (data: object) => post<RouteDto>("/manager/routes", data),
    updateRouteStatus: (id: number, status: string) =>
        put<void>(`/manager/routes/${id}/status`, { status }),
    deleteRoute: (id: number) => del<void>(`/manager/routes/${id}`),

    getRequests: () => get<DeliveryRequestDto[]>("/manager/requests"),
    updateRequestStatus: (id: number, status: string, managerId?: number) =>
        put<void>(`/manager/requests/${id}/status`, { status, managerId }),

    getDrivers: () => get<DriverDto[]>("/manager/drivers"),
    getVehicles: () => get<VehicleDto[]>("/manager/vehicles"),

    calculateCosts: (data: object) => post<CostResultDto>("/manager/costs/calculate", data),
};

// ─── Warehouse API ────────────────────────────────────────────────────────────

export const warehouseApi = {
    getWarehouses: () => get<WarehouseDto[]>("/warehouse"),
    getStock: (warehouseId: number) => get<StockDto[]>(`/warehouse/${warehouseId}/stock`),
    updateStock: (id: number, data: object) => put<void>(`/warehouse/stock/${id}`, data),

    getProducts: () => get<ProductDto[]>("/warehouse/products"),

    getNearestStock: (productId: number, excludeWarehouseId: number) =>
        get<StockDto[]>(`/warehouse/nearest-stock?productId=${productId}&excludeWarehouseId=${excludeWarehouseId}`),

    getRequests: (warehouseId: number) =>
        get<DeliveryRequestDto[]>(`/warehouse/${warehouseId}/requests`),
    createRequest: (data: object) =>
        post<DeliveryRequestDto>("/warehouse/requests", data),

    getTransactions: (warehouseId: number) =>
        get<TransactionDto[]>(`/warehouse/${warehouseId}/transactions`),
    createTransaction: (data: object) => post<void>("/warehouse/transactions", data),
};

// ─── Accountant API ───────────────────────────────────────────────────────────

export const accountantApi = {
    getArchive: () => get<TransactionDto[]>("/accountant/archive"),
    getReports: () => get<RouteDto[]>("/accountant/reports"),
    getCosts: () => get<object[]>("/accountant/costs"),
    getDiscrepancies: () => get<StockDto[]>("/accountant/discrepancies"),
};

// ─── Company Requests API ─────────────────────────────────────────────────────

export interface CompanyRequestProductDto {
    productId: number;
    productName?: string;
    quantity: number;
    weight: number;
}

export interface CompanyRequestDto {
    id: number;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    deliveryLat: number;
    deliveryLng: number;
    status: string;
    urgency: number;
    notes?: string;
    managerId?: number;
    managerName?: string;
    createdAt: string;
    products: CompanyRequestProductDto[];
}

export const companyRequestApi = {
    getProducts: () => get<ProductDto[]>("/company-requests/products"),
    create: (data: object) => post<CompanyRequestDto>("/company-requests", data),
    getAll: () => get<CompanyRequestDto[]>("/company-requests"),
    getById: (id: number) => get<CompanyRequestDto>(`/company-requests/${id}`),
    updateStatus: (id: number, status: string, managerId?: number) =>
        put<void>(`/company-requests/${id}/status`, { status, managerId }),
};