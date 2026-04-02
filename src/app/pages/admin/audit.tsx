import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Clock, User, FileEdit, Trash2, Eye } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  details: string;
}

const auditLogs: AuditLog[] = [
  { id: "1", timestamp: "2026-04-01 14:35:22", user: "Марія Шевченко", role: "Менеджер", action: "Створення", entity: "Маршрут", details: "Створено маршрут #147 (Київ-Одеса)" },
  { id: "2", timestamp: "2026-04-01 14:20:15", user: "Іван Петренко", role: "Комірник", action: "Зміна статусу", entity: "Замовлення", details: "Замовлення #8821 змінено на 'Відвантажено'" },
  { id: "3", timestamp: "2026-04-01 13:45:08", user: "Олександр Коваленко", role: "Адміністратор", action: "Створення", entity: "Користувач", details: "Додано користувача 'Петро Іваненко'" },
  { id: "4", timestamp: "2026-04-01 12:30:44", user: "Іван Петренко", role: "Комірник", action: "Видалення", entity: "Товар", details: "Видалено товар 'Молоко 2.5%' (протерміноване)" },
  { id: "5", timestamp: "2026-04-01 11:15:33", user: "Ольга Сидоренко", role: "Бухгалтер", action: "Перегляд", entity: "Звіт", details: "Переглянуто звіт витрат за березень 2026" },
  { id: "6", timestamp: "2026-04-01 10:05:19", user: "Марія Шевченко", role: "Менеджер", action: "Редагування", entity: "Маршрут", details: "Змінено маршрут #145 - додано 2 точки" },
  { id: "7", timestamp: "2026-04-01 09:30:55", user: "Іван Петренко", role: "Комірник", action: "Створення", entity: "Ревізія", details: "Розпочато ревізію складу 'Склад 1'" },
  { id: "8", timestamp: "2026-03-31 18:45:12", user: "Олександр Коваленко", role: "Адміністратор", action: "Зміна", entity: "Користувач", details: "Змінено права доступу для 'Іван Петренко'" },
];

const actionColors: Record<string, string> = {
  "Створення": "green",
  "Редагування": "blue",
  "Видалення": "red",
  "Зміна статусу": "orange",
  "Перегляд": "gray",
  "Зміна": "purple",
};

export default function AdminAuditPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = filter === "all" || log.action === filter;
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Аудит системи</h1>
        <p className="text-muted-foreground">
          Історія всіх дій користувачів у системі
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Дій сьогодні</p>
                <p className="text-3xl font-bold">127</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Активних користувачів</p>
                <p className="text-3xl font-bold">18</p>
              </div>
              <User className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Редагувань</p>
                <p className="text-3xl font-bold">42</p>
              </div>
              <FileEdit className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Видалень</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <Trash2 className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Журнал аудиту</CardTitle>
          <CardDescription>
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <Input
                placeholder="Пошук..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:max-w-xs"
              />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Тип дії" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі дії</SelectItem>
                  <SelectItem value="Створення">Створення</SelectItem>
                  <SelectItem value="Редагування">Редагування</SelectItem>
                  <SelectItem value="Видалення">Видалення</SelectItem>
                  <SelectItem value="Зміна статусу">Зміна статусу</SelectItem>
                  <SelectItem value="Перегляд">Перегляд</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Час</TableHead>
                  <TableHead>Користувач</TableHead>
                  <TableHead className="hidden md:table-cell">Роль</TableHead>
                  <TableHead>Дія</TableHead>
                  <TableHead className="hidden lg:table-cell">Об'єкт</TableHead>
                  <TableHead className="hidden xl:table-cell">Деталі</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {log.role}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`border-${actionColors[log.action]}-600 text-${actionColors[log.action]}-600`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{log.entity}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
