# 🚀 Plan de Progreso: Evolución a PWA, Offline-First y Microservicios

Este documento detalla los pasos, características y refactorizaciones que **faltan implementar** en el repositorio actual (`DealHunter`) para alcanzar una arquitectura de **Microservicios completa** y convertir las aplicaciones cliente (Web y Móvil) en **Aplicaciones Progresivas** con soporte **Offline-First**.

---

## 🌐 1. Aplicación Web Progresiva (PWA)
Actualmente, el proyecto `apps/web` es una Single Page Application (SPA) tradicional en React + Vite. Para convertirla en una verdadera PWA que funcione offline:

- [ ] **Web App Manifest (`manifest.json`)**: Definir la identidad de la aplicación (nombre, colores de tema, íconos de diferentes resoluciones) para permitir que los usuarios "instalen" la aplicación web en sus dispositivos (escritorio y móviles).
- [ ] **Service Workers & Caché de Activos**: Integrar `vite-plugin-pwa` para generar automáticamente Service Workers con Workbox. Esto cacheará el "App Shell" (HTML, CSS, JS, imágenes estáticas), permitiendo que la aplicación cargue instantáneamente y sin conexión a internet.
- [ ] **Estrategias de Caché de Datos (API)**: Utilizar herramientas como React Query (`@tanstack/react-query`) o SWR con complementos de persistencia (ej. IndexedDB). Esto permitirá que los usuarios consulten el catálogo de ofertas y su historial cacheados previamente, incluso estando en "modo avión".
- [ ] **Sincronización en Segundo Plano (Background Sync)**: Si un usuario intenta realizar una acción sin internet (ej. crear una alerta de precio), interceptar la petición, guardarla en una cola local en IndexedDB y enviarla automáticamente cuando el Service Worker detecte que la conexión ha regresado.
- [ ] **Notificaciones Push Nativas (Web Push API)**: Complementar los WebSockets actuales (`Socket.io`) con Web Push Notifications, permitiendo que las alertas de bajadas de precio lleguen al dispositivo del usuario incluso cuando tenga la pestaña del navegador cerrada.

---

## 📱 2. Aplicación Móvil Progresiva y Offline-First
La app en `apps/mobile` está construida con Expo y React Native. Para ofrecer una experiencia offline fluida (similar al enfoque progresivo de la web):

- [ ] **Base de Datos Local Sincronizada**: Abandonar las consultas directas a la API como única fuente de verdad. Integrar una base de datos local rápida (ej. **WatermelonDB**, **Realm** o **SQLite**). La UI móvil leerá exclusivamente de la base de datos local (cero latencia y offline siempre disponible), mientras procesos en segundo plano sincronizan estos datos con el servidor.
- [ ] **Detección de Red y Encolado Mutacional**: Utilizar `@react-native-community/netinfo` para detectar cambios de red. Implementar una cola local de operaciones (crear alertas, marcar favoritos) que se sincronicen de forma asíncrona una vez el dispositivo recupere la conexión (`offline mutations`).
- [ ] **Descarga Preventiva en Segundo Plano (Prefetching)**: Configurar tareas en segundo plano (`expo-background-fetch`) para que la aplicación, estando cerrada, descargue periódicamente el 'Top de Ofertas'. Así, al abrir la app, el contenido será el más reciente inmediatamente.

---

## ⚙️ 3. Evolución de la Arquitectura de Microservicios
El sistema actual ya implementa algunos patrones distribuidos (RabbitMQ, un servicio `scraper` en Python), pero el componente `apps/api-gateway` funciona realmente como un **Monolito Modular**, concentrando toda la lógica de negocio, base de datos y WebSockets. Para alcanzar una arquitectura pura de microservicios:

- [ ] **Desacoplamiento en Dominios Independientes**: Extraer los módulos anidados de `apps/api-gateway/src` hacia verdaderos servicios independientes dentro del monorepo (`apps/` o `services/`). Por ejemplo:
  - `auth-service`: Manejo de identidad, JWT y usuarios.
  - `deals-service`: Gestión del catálogo, motor de IA, puntuaciones y Postgres.
  - `alerts-service`: Motor de evaluación de reglas de caída de precio.
  - `notification-service`: Envío final de correos, push y WebSockets.
- [ ] **API Gateway Puro (BFF - Backend For Frontend)**: Transformar el actual `api-gateway` en un simple enrutador y agregador (usando GraphQL Federation, Kong, o un NestJS Gateway ligero) que únicamente reciba peticiones externas y las delegue a los microservicios internos.
- [ ] **Comunicación Síncrona Inter-Servicios (gRPC)**: Mientras que RabbitMQ ya se usa para eventos asíncronos (como el scrapeo), se debe implementar **gRPC** para las consultas síncronas de alta velocidad entre los nuevos microservicios (ej. `alerts-service` pidiendo datos a `deals-service`).
- [ ] **Service Discovery & Configuración Centralizada**: Añadir un sistema como **Consul** o **Eureka** para el descubrimiento de servicios dinámico, y centralizar los archivos `.env` dispersos.
- [ ] **Bases de Datos por Servicio (Database per Service)**: Dividir la gran base de datos PostgreSQL actual. Cada microservicio debe ser dueño exclusivo de sus tablas (ej. `auth-service` maneja los usuarios, `deals-service` maneja los productos).

---

## 📈 Siguientes Pasos Recomendados

1. **Corto Plazo**: Instalar `vite-plugin-pwa` en la Web y añadir el `manifest.json`. Es el paso más rápido (Quick Win).
2. **Mediano Plazo**: Integrar React Query con persistencia en IndexedDB/AsyncStorage para dar soporte de lectura offline tanto en Web como en Móvil.
3. **Largo Plazo**: Iniciar la refactorización backend, extrayendo primero el servicio de notificaciones (`notification-service`) del monolito para probar la comunicación gRPC/RabbitMQ con el resto del sistema.
