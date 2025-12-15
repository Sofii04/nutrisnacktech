<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\CommentController;

/*
|--------------------------------------------------------------------------
| API Routes - NutriSnackTech
|--------------------------------------------------------------------------
*/

// -------------------------
// Auth pública
// -------------------------
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// -------------------------
// Productos públicos
// -------------------------
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);

// Comentarios públicos (solo lectura)
Route::get('/products/{product}/comments', [CommentController::class, 'index']);

// -------------------------
// Frase motivacional (API externa, siempre pública)
// -------------------------
Route::get('/motivation', function () {
    try {
        // Llamamos a la API Quotable (no requiere API key)
        $response = Http::timeout(5)->get('https://api.quotable.io/random');

        if (! $response->ok()) {
            return response()->json([
                'message' => 'No se pudo obtener la frase motivacional desde la API externa.',
            ], 502);
        }

        $data = $response->json();

        return response()->json([
            'text'   => $data['content'] ?? 'Sigue adelante, Sofy ✨',
            'author' => $data['author'] ?? 'Anónimo',
        ]);
    } catch (\Throwable $e) {
        \Log::error('Error al obtener frase motivacional', [
            'error' => $e->getMessage(),
        ]);

        // Frase local aunque falle la API externa
        return response()->json([
            'text'   => 'Cree en ti misma; cada pequeño paso cuenta 💚',
            'author' => 'NutriSnackTech',
        ], 200);
    }
});

// -------------------------
// Rutas protegidas con Sanctum
// -------------------------
Route::middleware('auth:sanctum')->group(function () {

    // Perfil
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // CRUD de productos (el controlador valida is_admin)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    // Favoritos
    Route::post('/products/{product}/favorite', [FavoriteController::class, 'toggle']);
    Route::get('/favorites', [FavoriteController::class, 'index']);

    // Comentarios (crear)
    Route::post('/products/{product}/comments', [CommentController::class, 'store']);
});

