<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\FavoriteController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí definimos las rutas de la API para NutriSnackTech:
| - Autenticación (registro, login, me, logout)
| - Catálogo de productos (público y admin)
| - Favoritos por usuario
|
*/

// Ruta de ejemplo de Laravel (opcional, pero no molesta)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// ------------------------
// AUTENTICACIÓN
// ------------------------
Route::prefix('auth')->group(function () {
    // Registro y login (no requieren token)
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    // Rutas protegidas por token
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// ------------------------
// PRODUCTOS
// ------------------------

// Rutas públicas (cualquier usuario puede ver el catálogo)
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show']);

// Rutas protegidas (se requiere token y el controlador valida admin)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{product}', [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);

    // ------------------------
    // FAVORITOS (⭐)
    // ------------------------
    Route::get('favorites', [FavoriteController::class, 'index']);
    Route::post('products/{product}/favorite', [FavoriteController::class, 'toggle']);
});

