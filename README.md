# NutriSnackTech · Catálogo de frutos deshidratados

Aplicación web full-stack para gestionar el catálogo de productos de **NutriSnackTech**, una marca de frutos deshidratados.

La solución está dividida en:

- **Backend**: API REST en **Laravel 11** con autenticación mediante **Sanctum**.
- **Frontend**: SPA en **React + Vite + Tailwind CSS**.

La app permite:

- Ver un catálogo público de frutos deshidratados.
- Ver el detalle de cada producto.
- Registrarse, iniciar sesión y comentar productos.
- Marcar productos como favoritos.
- Administrar productos (solo rol administrador).
- Subir imágenes de productos (guardadas en `storage` de Laravel).
- Mostrar una **frase motivacional** consumida desde una API externa.

---

## 🧱 Estructura del proyecto

```bash
mini-catalogo/
├── backend/        # API Laravel (Sanctum, productos, favoritos, comentarios, motivación)
└── frontend/       # SPA React + Vite + Tailwind
⚙️ Backend (Laravel)
Requisitos previos
PHP 8.2+ (tú usas 8.5)

Composer

SQLite (o cualquier BD soportada por Laravel)

Instalación
bash
Copiar código
cd backend

# 1. Instalar dependencias
composer install

# 2. Copiar archivo de entorno
cp .env.example .env

# 3. Generar APP_KEY
php artisan key:generate
Base de datos (SQLite recomendado)
En .env configura algo como:

env
Copiar código
DB_CONNECTION=sqlite
DB_DATABASE=/ruta/completa/a/mini-catalogo/backend/database/database.sqlite
Crear el archivo si no existe:

bash
Copiar código
touch database/database.sqlite
Luego ejecutar migraciones:

bash
Copiar código
php artisan migrate
Esto crea:

users

personal_access_tokens

products

favorites

comments

tablas de cache / jobs de Laravel.

Storage de imágenes
Para servir imágenes desde /storage:

bash
Copiar código
php artisan storage:link
Las imágenes de productos se guardan en:

text
Copiar código
storage/app/public/products
y se exponen bajo:

text
Copiar código
http://127.0.0.1:8000/storage/products/xxxx.jpg
Usuario administrador
El rol se maneja con el campo is_admin en la tabla users.

Puedes marcar un usuario como admin desde Tinker:

bash
Copiar código
php artisan tinker

$user = \App\Models\User::where('email', 'tu_correo@test.com')->first();
$user->is_admin = true;
$user->save();
exit
Ese usuario verá el panel de administración en el frontend.

Levantar el servidor
bash
Copiar código
php artisan serve
Por defecto:

text
Copiar código
http://127.0.0.1:8000
La API se expone bajo /api/....

🧩 Endpoints principales (API)
Autenticación
POST /api/auth/register
Registra un usuario nuevo y devuelve token + datos.

POST /api/auth/login
Devuelve token + datos del usuario.

GET /api/auth/me
Devuelve el usuario autenticado (requiere Authorization: Bearer <token>).

POST /api/auth/logout
Revoca el token actual.

Productos
Públicos:

GET /api/products
Lista productos activos.

GET /api/products/{product}
Devuelve el detalle de un producto.

Solo admin (autenticado):

POST /api/products
Crea un producto (nombre, descripción, precio, image_url, etc.).

PUT /api/products/{product}
Actualiza producto.

DELETE /api/products/{product}
Elimina producto.

Imágenes de productos
La creación/edición de productos desde el frontend admin envía el archivo al backend, que:

Lo guarda en storage/app/public/products.

Actualiza el campo image_url en la tabla products.

Favoritos
Autenticado:

POST /api/products/{product}/favorite
Marca/desmarca producto como favorito para el usuario.

GET /api/favorites
Lista los productos favoritos del usuario logueado.

Comentarios
GET /api/products/{product}/comments
Lista comentarios de ese producto con nombre del autor.

POST /api/products/{product}/comments
Crea un comentario (requiere estar logueado).

Frase motivacional (API externa)
GET /api/motivation

Llama a la API pública de Quotable (https://api.quotable.io/random).
Si falla, devuelve una frase local:

json
Copiar código
{
  "text": "Cree en ti misma; cada pequeño paso cuenta 💚",
  "author": "NutriSnackTech"
}
💻 Frontend (React + Vite + Tailwind)
Requisitos previos
Node.js 18+ (tú usas v23.9.0)

npm

Instalación
bash
Copiar código
cd frontend

# Instalar dependencias
npm install
Ejecutar en desarrollo
bash
Copiar código
npm run dev
Por defecto:

text
Copiar código
http://localhost:5173
Asegúrate de que el backend está levantado en:

text
Copiar código
http://127.0.0.1:8000
La app usa:

js
Copiar código
const API_BASE = "http://127.0.0.1:8000/api";
🧑‍💻 Funcionalidades del frontend
Landing / Catálogo

Diseño juvenil con fondo verde claro.

Lista de productos con imagen, nombre, descripción corta y precio.

Vista de detalle del producto con:

Imagen grande.

Descripción.

Precio.

Comentarios del producto.

Formulario para comentar (si estás logueada).

Autenticación

Registro de usuarios (nombre, email, password).

Login con email/password.

Manejo de token con Authorization: Bearer <token> en las peticiones protegidas.

Cierre de sesión.

Rol administrador

Solo el admin ve el panel de administración.

Desde ahí puede:

Crear productos nuevos.

Editar productos existentes.

Eliminar productos.

Subir imagen para cada producto.

Favoritos

Botón para marcar/desmarcar favorito en las tarjetas/detalles.

El estado se guarda en el backend (tabla favorites).

Comentarios

Cada producto muestra sus comentarios.

Usuarios logueados pueden enviar nuevos comentarios.

Frase motivacional

Tarjeta “✨ Frase motivacional” en el frontend.

Consume GET /api/motivation.

Botón “Otra frase” que vuelve a llamar a la API.

Si algo falla, se muestra una frase local de NutriSnackTech.

🧪 Flujo recomendado para probar
Levantar backend:

bash
Copiar código
cd backend
php artisan serve
Levantar frontend:

bash
Copiar código
cd frontend
npm run dev
En el navegador (http://localhost:5173):

Crear una cuenta desde el frontend.

Marcar ese usuario como admin en BD (si quieres administrar productos).

Crear productos desde el panel admin.

Subir imágenes.

Ver catálogo público.

Probar login/logout.

Marcar productos como favoritos.

Agregar comentarios.

Probar el botón de “Otra frase” en la tarjeta motivacional.

📝 Notas
El proyecto está pensado como base para un examen de Aplicaciones Web, por lo que prioriza:

Organización del código (backend y frontend separados).

Uso de buenas prácticas (rutas protegidas, roles, migraciones).

Diseño limpio y juvenil con Tailwind CSS.

La API externa utilizada no requiere API Key, lo que simplifica la configuración.