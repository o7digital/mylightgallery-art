# Resumen técnico del sitio

## 1. Visión general

El sitio de **My Light Gallery Art** está construido con **Astro 5** y se despliega en **Vercel** con salida tipo **server-side rendering**. Su función principal hoy es servir como:

- escaparate digital de la galería;
- catálogo bilingüe de obras;
- punto de contacto comercial;
- base para futuras automatizaciones comerciales.

El proyecto combina un frontend visual con integraciones externas ligeras. No tiene un backend complejo dentro de este repositorio, pero sí consume datos y servicios externos para operar.

## 2. Frontend ya implementado

### Sitio público

- Página principal en español y en inglés.
- Hero visual con slider de obras.
- Sección de colecciones.
- Sección “Qué hay / What’s on” con obras destacadas.
- Sección biográfica de la artista Layla.
- Página de exhibiciones con listado de obras.
- Paginación del catálogo.
- Fichas individuales por obra con URL dinámica.
- Páginas de contacto y newsletter.
- Páginas legales en español e inglés.

### Funcionalidades visibles para el visitante

- Navegación fija con selector de idioma.
- Diseño responsive para desktop y móvil.
- Metadatos SEO por página.
- Etiquetas Open Graph y Twitter Card.
- Datos estructurados tipo `ArtGallery` y `VisualArtwork`.
- Integración de chat en sitio.
- Integración de analítica de Google.

### Página de obra

Cada obra tiene una ficha individual que incluye:

- imagen principal;
- título;
- descripción;
- dimensiones;
- técnica;
- enlaces de contacto;
- botones para compartir en redes;
- lightbox con zoom;
- panel para generar certificado de autenticidad.

## 3. Backend e integraciones reales

### Fuente de datos del catálogo

El catálogo no está almacenado en este repositorio. El sitio consulta una **API REST de WordPress/WooCommerce** mediante variables de entorno:

- `WP_API_BASE`
- `WP_USERNAME`
- `WP_APP_PASSWORD`

Los datos que el frontend aprovecha hoy son:

- nombre de la obra;
- slug;
- imágenes;
- precio;
- dimensiones;
- descripción;
- atributos del producto, sobre todo técnica y medidas.

### Caché y tolerancia a fallos

La integración con WordPress tiene una caché en memoria de aproximadamente **5 minutos** para reducir llamadas repetidas.

Si la API no responde o no devuelve productos válidos, el sitio usa un **catálogo local de respaldo** con varias obras precargadas. Esto evita que la web quede vacía ante una caída temporal del origen.

### Endpoint interno del sitio

Existe un endpoint propio:

- `/api/coa-auth`

Su función es proteger el acceso al panel de **Certificado de Autenticidad (COA)**. El flujo actual es:

- el usuario introduce credenciales;
- el endpoint valida usuario y contraseña definidos por variables de entorno;
- si son correctos, genera un token firmado con HMAC;
- la sesión dura 8 horas;
- el token se guarda en `sessionStorage` del navegador.

### Formularios

Los formularios de:

- contacto;
- newsletter;

envían la información mediante **Formspree**, no a un backend propio dentro de este repositorio.

### Servicios externos conectados

- **Vercel** para despliegue.
- **WordPress/WooCommerce API** para catálogo.
- **Formspree** para formularios.
- **Google Analytics** para medición.
- **Tidio** como chat embebido actual.

## 4. Estado funcional actual

### Lo que ya está resuelto

- Estructura pública del sitio lista.
- Navegación bilingüe.
- Catálogo conectado a WooCommerce.
- Fichas dinámicas de obra.
- Contacto y newsletter operativos por servicio externo.
- Certificado COA protegido por acceso.
- SEO técnico base ya implementado.
- Despliegue preparado para producción.

### Limitaciones o puntos a tener presentes

- **No hay checkout real implementado en este repositorio.**
- **No hay carrito funcional implementado en este repositorio.**
- **No existe una página real de login público aunque el header muestra el icono.**
- La sección de noticias contiene contenido estático de ejemplo.
- El PDF del certificado se genera con la función de impresión del navegador; no se guarda en servidor.
- No existe un CRM interno en este proyecto.
- No existe una base de datos propia dentro de este repositorio.
- La administración real del catálogo depende del entorno WordPress/WooCommerce.

## 5. Lectura ejecutiva recomendada

En su estado actual, el sitio ya funciona bien como **web de presentación + catálogo conectado + captación de contactos**, pero todavía no debe venderse como un e-commerce completo.

La base técnica está bien preparada para una segunda fase con:

- automatización comercial;
- CRM;
- chat inteligente con IA;
- seguimiento de leads;
- procesos de venta asistida.
