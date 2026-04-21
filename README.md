# 🧵 ConfeccionArte

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Bun](https://img.shields.io/badge/Bun-212121?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)

**ConfeccionArte** es una plataforma de comercio electrónico de alta gama construida bajo una estética **brutalista**. Diseñada para ofrecer una experiencia de usuario cruda, funcional y extremadamente rápida, utiliza las tecnologías más modernas de renderizado en el servidor (SSR) para maximizar el SEO y el rendimiento.

---

## ✨ Características Principales

- 🚀 **Astro 6.x SSR**: Renderizado ultrarrápido desde el servidor para un catálogo optimizado.
- 🏗️ **Estética Brutalista**: Diseño audaz basado en tipografía fuerte y contrastes marcados.
- 🔐 **Admin Dashboard**: Panel de administración protegido con autenticación de Supabase para gestión de inventario.
- 📊 **Click Tracking**: Sistema personalizado de analíticas para medir el interés en productos específicos.
- 🌑 **Arquitectura Híbrida**: Componentes de Astro para el frontend estático y React para formularios complejos.
- ☁️ **Backend Serverless**: Integración profunda con Supabase (Auth, Database, Storage).

---

## 🛠 Tech Stack

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | [Astro](https://astro.build/) (v6) |
| **UI Library** | [React](https://react.dev/) (Admin Forms) |
| **Backend** | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| **Runtime** | [Bun](https://bun.sh/) |
| **Estilos** | Vanilla CSS (Brutalist Design System) |
| **Despliegue** | Node.js Adapter (Standalone) |

---

## 🚀 Inicio Rápido

### Requisitos Previos
- [Bun](https://bun.sh/) instalado.
- Una instancia de [Supabase](https://supabase.com/).

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/ConfeccionArte.git
   cd ConfeccionArte
   ```

2. **Instalar dependencias:**
   ```bash
   bun install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz con las siguientes claves:
   ```env
   PUBLIC_SUPABASE_URL=tu_url_de_supabase
   PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   bun dev
   ```
   La aplicación estará disponible en `http://localhost:4321`.

---

## 📁 Estructura del Proyecto

```text
├── src/
│   ├── components/      # Componentes reutilizables (Astro/React)
│   ├── layouts/         # Plantillas base de la aplicación
│   ├── lib/             # Clientes de Supabase y tipos TS
│   ├── pages/           # Rutas y endpoints de la API
│   │   ├── admin/       # Panel de administración protegido
│   │   ├── api/         # Endpoints de seguimiento y utilidades
│   │   └── producto/    # Páginas dinámicas de producto
│   └── middleware.ts    # Gestión de sesiones y protección de rutas
├── database-setup.sql   # Esquema de base de datos y migraciones
└── astro.config.mjs     # Configuración central del framework
```

---

## 🎨 Identidad Visual

El proyecto se encuentra en una fase de transición de marca hacia **ConfeccionArte**. El diseño prioriza:
- Tipografías *bold* y *uppercase*.
- Layouts asimétricos y bordes marcados.
- Ausencia de adornos innecesarios (fiel al estilo *Brutalist*).

---

## 🤝 Contribución

Si deseas contribuir a este proyecto:
1. Haz un **Fork** del repositorio.
2. Crea una rama para tu característica (`git checkout -b feature/MejoraIncreible`).
3. Haz un **Commit** de tus cambios (`git commit -m 'Add some feature'`).
4. Haz un **Push** a la rama (`git push origin feature/MejoraIncreible`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

