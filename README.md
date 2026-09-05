# 🔥 DealHunter

DealHunter es una plataforma inteligente de comparación y detección de ofertas en tiempo real. Analiza precios actuales, históricos, mínimos históricos y competencia entre tiendas para calcular un **Deal Score** objetivo y alertar al usuario cuando realmente existe una oportunidad de compra extraordinaria.

---

## 📌 Estado del Proyecto: FASE 1 Completada

En esta primera fase se ha establecido la base arquitectónica del monorepo, la infraestructura contenerizada y el primer microservicio funcional:

- ✅ **Estructura Monorepo** escalable para albergar `apps/`, `services/` y `packages/`.
- ✅ **Contenedores de Infraestructura**:
  - **PostgreSQL 16** (Base de datos relacional principal)
  - **Redis 7** (Caché y rate limiting)
  - **RabbitMQ 3.13** con panel de administración web (Bus de eventos asíncronos)
- ✅ **API Gateway con NestJS**:
  - TypeScript estricto.
  - Versionado de API configurado (`/api/v1`).
  - Endpoint de salud: `GET /api/v1/health`.
  - Pruebas unitarias y pruebas End-to-End (E2E).
  - Manejo de variables de entorno seguras (`.env.example` y `.env`).

---

## 🛠️ Stack Tecnológico (Fase 1)

| Componente | Tecnología | Versión / Detalle |
|---|---|---|
| **Runtime** | Node.js | v20+ / v22 LTS |
| **Framework API Gateway** | NestJS | v10 + TypeScript |
| **Base de Datos** | PostgreSQL | 16-alpine (puerto `5432`) |
| **Caché** | Redis | 7-alpine (puerto `6379`) |
| **Message Broker** | RabbitMQ | 3.13-management-alpine (puertos `5672` y `15672`) |
| **Contenedores** | Docker & Docker Compose | Red aislada `dealhunter_network` |

---

## 📂 Estructura del Monorepo

```
dealhunter/
├── apps/
│   └── api-gateway/            # API Gateway con NestJS
│       ├── src/
│       │   ├── health/         # Módulo y controlador de Health Check
│       │   │   ├── health.controller.ts
│       │   │   ├── health.controller.spec.ts
│       │   │   └── health.module.ts
│       │   ├── app.module.ts   # Módulo raíz de NestJS
│       │   └── main.ts         # Punto de entrada y configuración de NestJS
│       ├── test/               # Pruebas End-to-End
│       │   ├── app.e2e-spec.ts
│       │   └── jest-e2e.json
│       ├── Dockerfile          # Imagen Docker para el API Gateway
│       ├── nest-cli.json
│       ├── package.json
│       ├── tsconfig.json
│       └── tsconfig.build.json
├── packages/                   # Librerías y tipos compartidos (fases futuras)
├── services/                   # Scrapers y workers (fases futuras)
├── .env.example                # Plantilla de variables de entorno
├── .env                        # Variables de entorno locales
├── .gitignore                  # Reglas de exclusión de Git
├── docker-compose.yml          # Configuración de PostgreSQL, Redis y RabbitMQ
├── package.json                # Monorepo root con scripts y workspaces
└── README.md                   # Documentación principal
```

---

## ⚙️ Configuración y Variables de Entorno

Copia el archivo `.env.example` a `.env` si aún no existe:

```bash
cp .env.example .env
```

Variables disponibles:

```env
# Entorno
NODE_ENV=development

# API Gateway
API_GATEWAY_PORT=3000
API_PREFIX=api/v1

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dealhunter
POSTGRES_USER=dealhunter_user
POSTGRES_PASSWORD=dealhunter_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672
RABBITMQ_DEFAULT_USER=dealhunter_admin
RABBITMQ_DEFAULT_PASS=dealhunter_admin_pass
```

---

## 🚀 Guía de Ejecución

### 1. Iniciar Infraestructura (Docker)

> **Nota para Windows**: Asegúrate de tener **Docker Desktop** abierto y en ejecución.

Ejecuta el siguiente comando para levantar PostgreSQL, Redis y RabbitMQ en segundo plano:

```bash
# Desde la raíz del proyecto:
docker compose up -d

# O usando el script pnpm:
pnpm run infra:up
```

Para verificar el estado de los contenedores:

```bash
docker compose ps
```

Acceso al panel de administración de RabbitMQ:
- **URL**: [http://localhost:15672](http://localhost:15672)
- **Usuario**: `dealhunter_admin`
- **Contraseña**: `dealhunter_admin_pass`

---

### 2. Iniciar API Gateway

Instala las dependencias y corre el servidor en modo desarrollo con recarga automática:

```bash
# Desde la raíz:
pnpm run gateway:dev

# O directamente dentro de apps/api-gateway:
cd apps/api-gateway
pnpm run start:dev
```

El servicio estará disponible en:
- **Base URL**: `http://localhost:3000/api/v1`
- **Health Check**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

Respuesta esperada del Health Check:
```json
{
  "status": "ok",
  "service": "api-gateway"
}
```

---

## 🧪 Pruebas

### Pruebas Unitarias

Para ejecutar las pruebas del controlador de salud y componentes:

```bash
pnpm run gateway:test
```

### Pruebas End-to-End (E2E)

Para validar el ciclo completo de petición HTTP sobre `/api/v1/health`:

```bash
pnpm run gateway:test:e2e
```

### Detener Infraestructura

Cuando termines tu sesión de desarrollo:

```bash
pnpm run infra:down
```

---

## 🗺️ Roadmap por Fases

- [x] **FASE 1**: Estructura Monorepo, Docker Compose (PostgreSQL, Redis, RabbitMQ) y API Gateway NestJS con `/api/v1/health`.
- [ ] **FASE 2**: Configuración avanzada de API Gateway (Routing, Interceptores, Global Exception Filter, Swagger/OpenAPI y Logger estructurado).
- [ ] **FASE 3**: PostgreSQL + Product Service (Modelado TypeORM/Prisma, CRUD inicial de productos e identificadores EAN/ASIN).
- [ ] **FASE 4**: Store Service (Gestión de tiendas: Amazon, Mercado Libre, etc.).
- [ ] **FASE 5**: Scraper Service (Python + Scrapy, primer scraper modular).
- [ ] **FASE 6**: RabbitMQ + Eventos (Pipeline asíncrono `PRODUCT_FOUND`, `PRICE_CHANGED`).
- [ ] **FASE 7**: Price Service + Historial de Precios.
- [ ] **FASE 8**: Deal Service + Algoritmo de Deal Score.
- [ ] **FASE 9**: User Service + Autenticación JWT y Refresh Tokens.
- [ ] **FASE 10**: Alert Service.
- [ ] **FASE 11**: Notification Service.
- [ ] **FASE 12**: Frontend Web Next.js / PWA.
- [ ] **FASE 13**: Wishlist + Dashboard.
- [ ] **FASE 14**: App Móvil Flutter.
- [ ] **FASE 15**: Suite de Pruebas Completa.
- [ ] **FASE 16**: Observabilidad y Monitoreo.
- [ ] **FASE 17**: Optimización de Rendimiento.
- [ ] **FASE 18**: IA y Recomendaciones Semánticas.
