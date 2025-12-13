<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // GET /api/products  -> lista de productos activos (público)
    public function index()
    {
        $products = Product::where('is_active', true)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($products);
    }

    // GET /api/products/{product} -> detalle (público)
    public function show(Product $product)
    {
        return response()->json($product);
    }

    /**
     * Verifica que el usuario autenticado sea admin.
     */
    protected function ensureIsAdmin(Request $request): void
    {
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            abort(403, 'Solo el administrador puede realizar esta acción.');
        }
    }

    // POST /api/products  (requiere login + admin)
    public function store(Request $request)
    {
        $this->ensureIsAdmin($request);

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price'       => ['required', 'numeric', 'min:0'],
            'image_url'   => ['nullable', 'string', 'max:2048'],
            'is_active'   => ['boolean'],
        ]);

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    // PUT /api/products/{product}  (requiere login + admin)
    public function update(Request $request, Product $product)
    {
        $this->ensureIsAdmin($request);

        $data = $request->validate([
            'name'        => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price'       => ['sometimes', 'required', 'numeric', 'min:0'],
            'image_url'   => ['nullable', 'string', 'max:2048'],
            'is_active'   => ['boolean'],
        ]);

        $product->update($data);

        return response()->json($product);
    }

    // DELETE /api/products/{product}  (requiere login + admin)
    public function destroy(Request $request, Product $product)
    {
        $this->ensureIsAdmin($request);

        $product->delete();

        return response()->json([
            'message' => 'Producto eliminado correctamente',
        ]);
    }
}

