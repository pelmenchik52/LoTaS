# Використовуємо .NET 8 SDK для збірки
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Копіюємо файл проекту і відновлюємо залежності
COPY *.csproj ./
RUN dotnet restore

# Копіюємо весь інший код і збираємо реліз
COPY . ./
RUN dotnet publish -c Release -o out

# Використовуємо легший образ тільки з runtime для запуску
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Запускаємо скомпільовану dll (переконайся, що назва файлу співпадає з назвою твого проекту)
ENTRYPOINT ["dotnet", "back-end.dll"]