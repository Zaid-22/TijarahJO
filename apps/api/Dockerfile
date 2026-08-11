FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY apps/api/ ./apps/api/
RUN dotnet restore ./apps/api/src/Api/TijarahJo.Api.csproj
RUN dotnet publish ./apps/api/src/Api/TijarahJo.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 5033
ENV ASPNETCORE_URLS=http://+:5033

# Run as non-root for defense-in-depth
RUN adduser --disabled-password --no-create-home --gecos "" appuser \
    && mkdir -p /var/lib/tijarahjo/uploads /var/lib/tijarahjo/private-uploads \
    && chown -R appuser:appuser /var/lib/tijarahjo/uploads /var/lib/tijarahjo/private-uploads

COPY --from=build /app/publish ./
USER appuser
ENTRYPOINT ["dotnet", "TijarahJo.Api.dll"]
