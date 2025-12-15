<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Listar todos los productos (catálogo público).
     */
    public function index()
    {
        // Puedes filtrar solo activos si quieres:
        // return Product::where('is_active', true)->orderBy('created_at', 'desc')->get();

        return Product::orderBy('created_at', 'desc')->get();
    }

    /**
     * Crear un nuevo producto (solo administrador).
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            return response()->json([
                'message' => 'Solo el administrador puede crear productos.',
            ], 403);
        }

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price'       => ['required', 'numeric', 'min:0'],
            'image_url'   => ['nullable', 'string'], // url generada por backend o subida externa
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $product = Product::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price'       => $validated['price'],
            'image_url'   => $validated['image_url'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json($product, 201);
    }

    /**
     * Ver un producto concreto.
     */
    public function show(Product $product)
    {
        return response()->json($product);
    }

    /**
     * Actualizar un producto (solo administrador).
     */
    public function update(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            return response()->json([
                'message' => 'Solo el administrador puede editar productos.',
            ], 403);
        }

        $validated = $request->validate([
            'name'        => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price'       => ['sometimes', 'required', 'numeric', 'min:0'],
            'image_url'   => ['nullable', 'string'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $product->update($validated);

        return response()->json($product);
    }

    /**
     * Eliminar un producto (solo administrador).
     */
    public function destroy(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            return response()->json([
                'message' => 'Solo el administrador puede eliminar productos.',
            ], 403);
        }

        $product->delete();

        return response()->json(null, 204);
    }

    /**
     * Subir una imagen y devolver su URL (solo administrador).
     *
     * Guarda la imagen en storage/app/public/products
     * y devuelve la URL pública http://127.0.0.1:8000/storage/products/...
     */
    public function uploadImage(Request $request)
    {
        $user = $request->user();

        // Solo administrador
        if (!$user || !$user->is_admin) {
            return response()->json([
                'message' => 'Solo el administrador puede subir imágenes.',
            ], 403);
        }

        // Validar archivo de imagen, máx. ~2MB (2048 KB)
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:2048'],
        ]);

        // Guardar en storage/app/public/products
        $path = $request->file('image')->store('products', 'public');

        // Generar URL pública
        $url = asset('storage/' . $path);

        return response()->json([
            'message' => 'Imagen subida correctamente.',
            'url'     => $url,
        ], 201);
    }
}

