<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Product;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Listar comentarios de un producto (ruta pública).
     */
    public function index(Product $product)
    {
        $comments = Comment::where('product_id', $product->id)
            ->with('user:id,name')
            ->latest()
            ->get(['id', 'user_id', 'product_id', 'content', 'created_at']);

        return response()->json($comments);
    }

    /**
     * Crear comentario para un producto (requiere auth:sanctum).
     */
    public function store(Request $request, Product $product)
    {
        // Validación: máximo 200 caracteres
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:200'],
        ]);

        $user = $request->user(); // usuario autenticado por Sanctum

        $comment = Comment::create([
            'user_id'    => $user->id,
            'product_id' => $product->id,
            'content'    => $validated['content'],
        ]);

        // Cargar relación de usuario (para devolver nombre)
        $comment->load('user:id,name');

        return response()->json($comment, 201);
    }
}
