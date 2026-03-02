FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY apps/api/ ./apps/api/
RUN dotnet restore ./apps/api/src/Api/TijarahJo.Api.csproj
RUN dotnet publish ./apps/api/src/Api/TijarahJo.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 5033
ENV ASPNETCORE_URLS=http://+:5033

COPY --from=build /app/publish ./
ENTRYPOINT ["dotnet", "TijarahJo.Api.dll"]
