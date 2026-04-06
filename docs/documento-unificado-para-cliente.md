# Documento unificado para cliente

## My Light Gallery Art

Este documento reúne:

- un resumen del sitio ya desarrollado;
- una guía simple de uso;
- una propuesta de siguiente etapa con O7 IA Chat y CRM O7.

## 1. Resumen del sitio actual

El sitio web de **My Light Gallery Art** ya funciona como una plataforma profesional de presentación de la galería y del trabajo artístico de Layla.

Actualmente el sitio permite:

- mostrar la galería en español e inglés;
- presentar la biografía de la artista;
- exhibir obras disponibles;
- mostrar un catálogo organizado por piezas;
- abrir una ficha individual por obra;
- recibir mensajes desde el formulario de contacto;
- captar suscriptores desde el formulario de newsletter;
- compartir obras en redes;
- generar un certificado de autenticidad para cada obra con acceso restringido.

### Frontend ya implementado

La parte visual y pública del sitio incluye:

- página principal en español;
- página principal en inglés;
- hero visual con slider;
- sección de colecciones;
- sección de obras destacadas;
- sección biográfica de Layla;
- catálogo de obras con paginación;
- páginas individuales por obra;
- páginas de contacto;
- páginas de newsletter;
- páginas legales en ambos idiomas.

### Backend e integraciones

Aunque este proyecto no tiene un backend complejo propio, sí trabaja con varias integraciones activas:

- **WordPress/WooCommerce API** como fuente del catálogo;
- **Formspree** para formularios;
- **Google Analytics** para medición;
- **chat embebido actual** para atención inicial;
- **Vercel** para despliegue del sitio.

### Cómo funciona el catálogo

Las obras no se cargan directamente dentro de este repositorio. El sitio consulta el catálogo desde un entorno conectado de **WordPress/WooCommerce**.

Eso permite mostrar:

- nombre de la obra;
- imágenes;
- descripción;
- dimensiones;
- técnica;
- precio, cuando aplica.

Además, el sitio cuenta con una lógica de respaldo para no quedarse vacío si la API no responde temporalmente.

### Certificado de autenticidad

Cada obra tiene un panel para generar un **Certificado de Autenticidad (COA)**.

Este acceso está protegido mediante credenciales. Una vez autenticado, el usuario autorizado puede:

- ingresar el nombre del cliente;
- definir la fecha de emisión;
- generar el certificado;
- descargarlo como PDF desde el navegador.

## 2. Estado actual del proyecto

### Lo que ya está listo

- sitio visual profesional;
- navegación bilingüe;
- catálogo conectado;
- fichas dinámicas de obra;
- formularios operativos;
- certificado COA protegido;
- base SEO técnica;
- estructura preparada para seguir creciendo.

### Lo que conviene aclarar

Hoy el sitio debe presentarse principalmente como:

- vitrina digital;
- catálogo de obras;
- canal de contacto;
- herramienta de captación de leads.

Por transparencia, también es importante señalar que actualmente:

- no hay carrito funcional activo dentro de este repositorio;
- no hay checkout de pago implementado aquí;
- no existe una página pública de login realmente operativa para clientes;
- no hay un CRM propio integrado todavía;
- la administración del catálogo depende del entorno WordPress/WooCommerce.

## 3. Guía simple de uso para la cliente

## Navegación del sitio

En la página principal, los visitantes pueden:

- conocer la galería;
- ver obras destacadas;
- entrar al catálogo completo;
- leer sobre Layla;
- cambiar de idioma.

En el catálogo de obras, los visitantes pueden:

- recorrer varias piezas;
- moverse entre páginas;
- abrir el detalle de cada obra.

En la ficha individual de una obra, pueden:

- ver la imagen;
- consultar técnica y dimensiones;
- compartir la obra;
- contactar a la galería.

## Cómo actualizar obras

El catálogo se actualiza desde el sistema conectado de **WordPress/WooCommerce**.

Para que una obra se muestre correctamente, conviene completar:

- nombre de la obra;
- slug;
- imagen principal;
- descripción;
- técnica;
- dimensiones;
- precio, si se desea mostrar.

### Recomendaciones prácticas

- usar imágenes claras y de buena calidad;
- mantener nombres consistentes;
- revisar que la descripción no quede vacía;
- verificar técnica y dimensiones antes de publicar.

Si un cambio no aparece de inmediato en el sitio, puede tardar unos minutos por caché.

## Formularios

El sitio cuenta con:

- formulario de contacto;
- formulario de newsletter.

Estos formularios sirven para captar:

- consultas comerciales;
- dudas sobre obras;
- datos de personas interesadas;
- suscriptores para novedades y promociones.

### Recomendación operativa

- revisar frecuentemente el correo receptor;
- responder lo antes posible a consultas de compra;
- revisar también spam o promociones.

## Cómo generar el certificado de autenticidad

### Pasos

1. Entrar a la ficha de la obra.
2. Hacer clic en **Generar certificado COA**.
3. Ingresar el usuario y contraseña autorizados.
4. Escribir el nombre del cliente.
5. Confirmar la fecha.
6. Hacer clic en **Descargar certificado en PDF**.

### Importante

- el acceso es restringido;
- la sesión permanece activa por varias horas;
- el PDF se genera desde el navegador;
- si se cierra la sesión o cambia el navegador, puede ser necesario volver a ingresar credenciales.

## 4. Propuesta de siguiente etapa: O7 IA Chat + CRM O7

Como siguiente fase de crecimiento, proponemos incorporar dos soluciones en modalidad de **renta mensual**:

- **O7 IA Chat**
- **CRM O7**

El objetivo es que el sitio no solo muestre la galería, sino que también se convierta en una herramienta activa de atención, seguimiento comercial y generación de oportunidades.

## O7 IA Chat

O7 IA Chat es un asistente conversacional que puede atender visitantes en tiempo real.

### Qué puede hacer

- responder preguntas frecuentes;
- orientar sobre obras, técnicas y disponibilidad;
- captar datos de contacto;
- calificar prospectos;
- canalizar conversaciones relevantes al equipo humano;
- atender en español e inglés.

### Beneficios

- atención inmediata 24/7;
- mejor experiencia para visitantes;
- menos oportunidades perdidas;
- mayor captación de leads desde la web.

## CRM O7

El CRM O7 permite organizar y dar seguimiento a los contactos que llegan desde el sitio.

### Qué permite

- registrar leads y clientes;
- centralizar historial de interacciones;
- seguir oportunidades comerciales;
- ordenar prospectos por etapa;
- asignar tareas y recordatorios;
- medir actividad comercial.

### Beneficios

- mayor orden;
- mejor seguimiento;
- menos pérdida de contactos;
- proceso comercial más profesional.

## Valor para My Light Gallery Art

La combinación de **O7 IA + CRM O7** permitiría:

- responder mejor a los visitantes;
- captar más oportunidades;
- organizar consultas sobre obras, precios, envíos o citas;
- dar seguimiento real a compradores potenciales;
- profesionalizar la operación comercial de la galería.

## Modalidad sugerida

La renta mensual puede incluir:

- configuración inicial;
- conexión con el sitio;
- entrenamiento del chat con información de la galería;
- activación del CRM;
- soporte y mantenimiento;
- ajustes evolutivos menores.

## 5. Texto breve de propuesta para compartir con la cliente

**Como siguiente etapa, nos gustaría proponerle la incorporación de O7 IA Chat y nuestro CRM en modalidad de renta mensual. Esta solución le permitiría atender mejor a sus visitantes, responder consultas en tiempo real, captar prospectos y dar seguimiento comercial de forma mucho más organizada. La idea es que su sitio no solo muestre la galería, sino que también se convierta en una herramienta activa para generar oportunidades y ventas. Si le interesa, con gusto le presentamos el alcance recomendado para su operación y una propuesta económica adaptada a su caso.**
