<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // GET /api/products  -> lista de productos activos
    public function index()
    {
        $products = Product::where('is_active', true)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($products);
    }

    // GET /api/products/{product} -> detalle
    public function show(Product $product)
    {
        return response()->json($product);
    }

    // POST /api/products  (requiere login)
    public function store(Request $request)
    {
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

    // PUT /api/products/{product}  (requiere login)
    public function update(Request $request, Product $product)
    {
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

    // DELETE /api/products/{product}  (requiere login)
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => 'Producto eliminado correctamente',
        ]);
    }
}

