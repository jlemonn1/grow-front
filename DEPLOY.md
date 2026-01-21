# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar el frontend de Growshop en Vercel.

## Prerrequisitos

1. Una cuenta en [Vercel](https://vercel.com)
2. El código del frontend en un repositorio de Git (GitHub, GitLab o Bitbucket)
3. La URL de tu backend API desplegado

## Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en un repositorio Git y que esté actualizado:

```bash
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New..."** → **"Project"**
3. Importa tu repositorio de Git
4. Selecciona el repositorio que contiene el frontend

### 3. Configurar el Proyecto

Vercel detectará automáticamente que es un proyecto Vite. Configura lo siguiente:

#### Configuración del Proyecto:
- **Framework Preset**: Vite (debería detectarse automáticamente)
- **Root Directory**: `frontend` (si el frontend está en una subcarpeta)
- **Build Command**: `npm run build` (ya configurado en `vercel.json`)
- **Output Directory**: `dist` (ya configurado en `vercel.json`)
- **Install Command**: `npm install` (ya configurado en `vercel.json`)

### 4. Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_API_URL` | `https://tu-backend.com/api/v1` | URL completa de tu API backend |

**Importante**: 
- Reemplaza `https://tu-backend.com/api/v1` con la URL real de tu backend
- Asegúrate de incluir el protocolo (`https://`) y la ruta completa (`/api/v1`)
- Esta variable debe estar disponible para **Production**, **Preview** y **Development**

### 5. Desplegar

1. Haz clic en **"Deploy"**
2. Vercel comenzará a construir y desplegar tu aplicación
3. Espera a que termine el proceso (generalmente toma 1-3 minutos)

### 6. Verificar el Despliegue

Una vez completado el despliegue:

1. Vercel te proporcionará una URL (ej: `tu-proyecto.vercel.app`)
2. Visita la URL y verifica que la aplicación funcione correctamente
3. Prueba hacer login y verificar que las peticiones al backend funcionen

## Configuración Continua

### Despliegues Automáticos

Vercel desplegará automáticamente cada vez que hagas push a:
- **main/master**: Despliegue en producción
- **Otras ramas**: Despliegues de preview

### Variables de Entorno por Entorno

Puedes configurar diferentes valores de `VITE_API_URL` para:
- **Production**: URL de producción del backend
- **Preview**: URL de staging del backend (opcional)
- **Development**: URL local (solo para desarrollo local con `vercel dev`)

### Dominio Personalizado

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Vercel

## Solución de Problemas

### Error: "Cannot find module"

- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `package-lock.json` esté actualizado

### Error: "Failed to fetch" o errores de CORS

- Verifica que `VITE_API_URL` esté configurada correctamente
- Asegúrate de que tu backend permita peticiones desde el dominio de Vercel
- Revisa la configuración de CORS en tu backend

### La aplicación carga pero no se conecta al backend

- Verifica que la variable `VITE_API_URL` esté configurada en Vercel
- Revisa la consola del navegador para ver errores de red
- Asegúrate de que la URL del backend sea accesible públicamente

### Rutas no funcionan al recargar la página

- El archivo `vercel.json` ya incluye la configuración de rewrites necesaria
- Si persiste el problema, verifica que el archivo `vercel.json` esté en la raíz del proyecto

## Comandos Útiles

### Desarrollo Local con Variables de Producción

```bash
# Crear archivo .env.local con tus variables
echo "VITE_API_URL=https://tu-backend.com/api/v1" > .env.local

# Ejecutar en modo desarrollo
npm run dev
```

### Verificar Build Localmente

```bash
npm run build
npm run preview
```

## Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Vite](https://vitejs.dev/)
- [Variables de Entorno en Vite](https://vitejs.dev/guide/env-and-mode.html)
