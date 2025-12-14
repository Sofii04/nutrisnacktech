# NutriSnackTech · Catálogo de frutos deshidratados

Proyecto de Aplicaciones Web: mini catálogo de productos para **NutriSnackTech**, una marca ficticia de frutos deshidratados.

La aplicación está dividida en dos partes:

- **Backend**: API REST en Laravel con autenticación vía **Sanctum**.
- **Frontend**: SPA en **React + Vite + Tailwind CSS** que consume la API.

---

## 1. Funcionalidades principales

### Autenticación

- Crear cuenta (registro) desde el frontend.
- Iniciar sesión.
- Cerrar sesión.
- Manejo de sesión con **tokens de Laravel Sanctum** guardados en `localStorage`.

### Roles y permisos

- Campo `is_admin` en la tabla `users`.
- Solo el **administrador** puede:
  - Crear productos.
  - Editar productos.
  - Eliminar productos.
  - Subir una imagen por producto.
- Los **usuarios normales** solo pueden:
  - Registrarse / iniciar sesión.
  - Ver el catálogo público de productos.

### Gestión de productos

- CRUD completo de productos desde un panel administrador:
  - Nombre.
  - Descripción.
  - Precio.
  - URL de imagen.
  - Estado `is_active` (visible o no en el catálogo).
- Catálogo público que lista los productos activos.

### Imágenes de productos

- Las imágenes se suben desde el frontend mediante un `input type="file"`.
- El archivo se envía al backend mediante una petición `POST` a:

  ```http
  POST /api/products/upload-image

2. Tecnologías utilizadas
Backend

PHP 8.5

Laravel (versión del proyecto composer.json)

Laravel Sanctum (auth por token)

MySQL / MariaDB (o el motor configurado en .env)

Frontend

Node.js 23 + npm

Vite

React

Tailwind CSS (@tailwindcss/postcss)

3. Cómo ejecutar el proyecto
3.1. Clonar el repositorio
git clone https://github.com/Sofii04/nutrisnacktech.git
cd nutrisnacktech

3.2. Backend (Laravel)

Entrar al directorio del backend:

cd backend

1) Instalar dependencias de PHP
composer install

2) Crear archivo .env
cp .env.example .env


Editar .env para configurar:

Conexión a base de datos (DB_DATABASE, DB_USERNAME, DB_PASSWORD, etc.).

Opcionalmente el APP_URL (ej: http://127.0.0.1:8000).

3) Generar la key de la aplicación
php artisan key:generate

4) Ejecutar migraciones
php artisan migrate


Esto crea las tablas:

users

personal_access_tokens

products

etc.

5) Crear enlace de storage (solo una vez)
php artisan storage:link

6) Levantar el servidor de Laravel
php artisan serve


Por defecto la API quedará disponible en:

http://127.0.0.1:8000

3.3. Frontend (React + Vite)

En otra terminal, desde la raíz del repositorio:

cd frontend
npm install
npm run dev


Vite mostrará algo como:

VITE vX.X.X  ready in XXX ms
  ➜  Local:   http://localhost:5173/


Abrir el navegador en:

http://localhost:5173/

4. Flujo de uso

Registrar usuario (opcional)
Desde la tarjeta de Autenticación en el frontend:

Cambiar a pestaña Crear cuenta.

Ingresar nombre, correo y contraseña.

Se crea el usuario y queda logueado automáticamente.

Convertir un usuario en administrador
En la práctica, se marca el campo is_admin = 1 directamente desde tinker o la BD:

php artisan tinker

>>> $user = \App\Models\User::where('email', 'sofy@test.com')->first();
>>> $user->is_admin = 1;
>>> $user->save();


Iniciar sesión
Desde la pestaña Iniciar sesión, ingresar correo y contraseña.
El token se guarda en localStorage y el encabezado muestra:

Nombre de usuario.

Rol (Administrador / Usuario).

Panel administrador
Visible solo si el usuario tiene is_admin = 1:

Crear nuevos productos.

Editar productos existentes.

Eliminar productos.

Subir imágenes (input file → se envía al endpoint /api/products/upload-image).

Catálogo público
Siempre visible:

Lista los productos (nombre, descripción, precio, imagen si existe).

Los usuarios no administradores solo consumen la información.

5. Endpoints principales de la API
Autenticación

POST /api/auth/register
Registra un nuevo usuario y devuelve token.

POST /api/auth/login
Inicia sesión y devuelve token.

POST /api/auth/logout
Cierra sesión (requiere token).

GET /api/auth/me
Devuelve los datos del usuario autenticado.

Productos

GET /api/products
Lista de productos (catálogo).

GET /api/products/{id}
Detalle de un producto.

POST /api/products
Crear producto (solo admin, requiere token).

PUT /api/products/{id}
Actualizar producto (solo admin, requiere token).

DELETE /api/products/{id}
Eliminar producto (solo admin, requiere token).

POST /api/products/upload-image
Subir imagen y devolver URL pública (solo admin, requiere token).
