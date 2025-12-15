<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * Listar los productos favoritos del usuario autenticado.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Traemos solo productos activos
        $favorites = $user->favoriteProducts()
            ->where('is_active', true)
            ->get();

        return response()->json($favorites);
    }

    /**
     * Alternar favorito (toggle):
     * - Si no está en favoritos -> lo agrega
     * - Si ya está en favoritos -> lo quita
     */
    public function toggle(Product $product, Request $request)
    {
        $user = $request->user();

        $exists = $user->favoriteProducts()
            ->wherePivot('product_id', $product->id)
            ->exists();

        if ($exists) {
            $user->favoriteProducts()->detach($product->id);

            return response()->json([
                'status' => 'removed',
                'message' => 'Producto eliminado de favoritos',
                'product_id' => $product->id,
            ]);
        } else {
            $user->favoriteProducts()->attach($product->id);

            return response()->json([
                'status' => 'added',
                'message' => 'Producto agregado a favoritos',
                'product_id' => $product->id,
            ]);
        }
    }
}

