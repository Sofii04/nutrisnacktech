import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  is_active: true,
  imageFile: null,
};

function App() {
  // =========================
  //   AUTENTICACIÓN
  // =========================
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || "";
  });

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // =========================
  //   CATÁLOGO
  // =========================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // =========================
  //   ADMIN (CRUD)
  // =========================
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // =========================
  //   FAVORITOS
  // =========================
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // =========================
  //   CARGAR PRODUCTOS
  // =========================
  const refreshProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");
      const resp = await fetch(`${API_BASE}/products`);
      if (!resp.ok) {
        setProductsError("No se pudo cargar el catálogo.");
        console.error("Error productos:", await resp.text());
        return;
      }
      const data = await resp.json();
      setProducts(data);
    } catch (err) {
      console.error("Error obteniendo productos", err);
      setProductsError("Error de conexión al cargar productos.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // =========================
  //   CARGAR FAVORITOS
  // =========================
  useEffect(() => {
    if (!token) {
      setFavoriteIds([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoadingFavorites(true);
        const resp = await fetch(`${API_BASE}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          console.error("Error al obtener favoritos", await resp.text());
          return;
        }

        const data = await resp.json();
        const ids = data.map((p) => p.id);
        setFavoriteIds(ids);
      } catch (err) {
        console.error("Error al cargar favoritos", err);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [token]);

  // =========================
  //   LOGIN / REGISTER
  // =========================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "register") {
        const resp = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: authName,
            email: authEmail,
            password: authPassword,
            password_confirmation: authPassword,
          }),
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error("Error register:", text);
          setAuthError("No se pudo crear la cuenta. Revisa los datos.");
          return;
        }

        const data = await resp.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        const resp = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
          }),
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error("Error login:", text);
          setAuthError("Credenciales incorrectas.");
          return;
        }

        const data = await resp.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Limpiar campos
      setAuthPassword("");
      if (authMode === "register") {
        setAuthName("");
      }
    } catch (err) {
      console.error("Error auth:", err);
      setAuthError("Error de conexión con el servidor.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Error en logout:", err);
    } finally {
      setToken("");
      setUser(null);
      setFavoriteIds([]);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // =========================
  //   FORMULARIO PRODUCTO
  // =========================
  const startCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      is_active: product.is_active ?? true,
      imageFile: null,
    });
  };

  const handleProductFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProductForm((prev) => ({
      ...prev,
      imageFile: file,
    }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!token || !user?.is_admin) {
      alert("Solo el administrador puede gestionar productos.");
      return;
    }

    try {
      setSavingProduct(true);
      const formData = new FormData();
      formData.append("name", productForm.name);
      formData.append("description", productForm.description);
      formData.append("price", productForm.price);
      formData.append("is_active", productForm.is_active ? "1" : "0");
      if (productForm.imageFile) {
        formData.append("image", productForm.imageFile);
      }

      let url = `${API_BASE}/products`;
      let method = "POST";

      if (editingProduct) {
        url = `${API_BASE}/products/${editingProduct.id}`;
        method = "POST"; // Laravel a veces usa spoofing, pero aquí usamos PUT directamente:
      }

      // Mejor: usar PUT cuando editamos
      const resp = await fetch(
        editingProduct ? `${API_BASE}/products/${editingProduct.id}` : url,
        {
          method: editingProduct ? "POST" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // No poner Content-Type, el navegador lo añade con boundary
            "X-HTTP-Method-Override": editingProduct ? "PUT" : "POST",
          },
          body: formData,
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Error guardando producto:", text);
        alert("No se pudo guardar el producto.");
        return;
      }

      await refreshProducts();
      setProductForm(emptyProductForm);
      setEditingProduct(null);
    } catch (err) {
      console.error("Error guardando producto:", err);
      alert("Error de conexión al guardar el producto.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!token || !user?.is_admin) {
      alert("Solo el administrador puede eliminar productos.");
      return;
    }

    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
      setDeletingProductId(productId);
      const resp = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        console.error("Error eliminando producto:", await resp.text());
        alert("No se pudo eliminar el producto.");
        return;
      }

      await refreshProducts();
    } catch (err) {
      console.error("Error delete:", err);
      alert("Error al eliminar el producto.");
    } finally {
      setDeletingProductId(null);
    }
  };

  // =========================
  //   FAVORITOS (toggle)
  // =========================
  const handleToggleFavorite = async (productId) => {
    if (!token) {
      alert("Debes iniciar sesión para guardar favoritos 😊");
      return;
    }

    try {
      const resp = await fetch(
        `${API_BASE}/products/${productId}/favorite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resp.ok) {
        console.error("Error al cambiar favorito", await resp.text());
        alert("No se pudo actualizar el favorito.");
        return;
      }

      const result = await resp.json();

      setFavoriteIds((prev) => {
        if (result.status === "added") {
          return [...prev, productId];
        } else if (result.status === "removed") {
          return prev.filter((id) => id !== productId);
        }
        return prev;
      });
    } catch (err) {
      console.error("Error alternar favorito:", err);
      alert("Ocurrió un error al marcar como favorito.");
    }
  };

  // =========================
  //   FILTRO DE VISUALIZACIÓN
  // =========================
  const visibleProducts = showOnlyFavorites
    ? products.filter((p) => favoriteIds.includes(p.id))
    : products;

  // =========================
  //   UI
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* HEADER */}
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-100">
            NutriSnackTech ·{" "}
            <span className="text-emerald-300">
              Catálogo de frutos deshidratados
            </span>
          </h1>
          <p className="text-emerald-200/80">
            Frontend en React + Tailwind consumiendo tu API Laravel. 💚
          </p>
        </header>

        {/* AUTH CARD */}
        <section className="bg-emerald-900/60 border border-emerald-700/60 rounded-2xl p-4 sm:p-6 shadow-lg shadow-emerald-950/50">
          {!user ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-emerald-100">
                  {authMode === "login"
                    ? "Iniciar sesión"
                    : "Crear una cuenta"}
                </h2>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`px-3 py-1 rounded-full ${
                      authMode === "login"
                        ? "bg-emerald-500 text-white"
                        : "bg-transparent border border-emerald-500 text-emerald-200"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`px-3 py-1 rounded-full ${
                      authMode === "register"
                        ? "bg-emerald-500 text-white"
                        : "bg-transparent border border-emerald-500 text-emerald-200"
                    }`}
                  >
                    Registro
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleAuthSubmit}
                className="grid gap-3 sm:grid-cols-3 sm:items-end"
              >
                {authMode === "register" && (
                  <div className="sm:col-span-1">
                    <label className="block text-xs mb-1 text-emerald-200">
                      Nombre
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-emerald-950/60 border border-emerald-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="sm:col-span-1">
                  <label className="block text-xs mb-1 text-emerald-200">
                    Correo
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg bg-emerald-950/60 border border-emerald-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs mb-1 text-emerald-200">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-lg bg-emerald-950/60 border border-emerald-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {authLoading
                      ? "Enviando..."
                      : authMode === "login"
                      ? "Entrar"
                      : "Crear cuenta"}
                  </button>
                </div>
              </form>

              {authError && (
                <p className="mt-2 text-sm text-red-300">{authError}</p>
              )}
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-emerald-200">
                  Bienvenida,{" "}
                  <span className="font-semibold text-emerald-100">
                    {user.name}
                  </span>
                  .
                </p>
                <p className="text-xs text-emerald-300/80">
                  Rol:{" "}
                  {user.is_admin ? "Administrador/a del catálogo" : "Cliente"}
                </p>
                {loadingFavorites && (
                  <p className="text-xs text-emerald-300 mt-1">
                    Cargando tus favoritos...
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-emerald-800 text-sm font-medium text-emerald-50 hover:bg-emerald-700"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </section>

        {/* ADMIN PANEL */}
        {user?.is_admin && (
          <section className="bg-emerald-900/60 border border-emerald-700/60 rounded-2xl p-4 sm:p-6 shadow-lg shadow-emerald-950/50 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-100">
                Panel administrador
              </h2>
              <button
                type="button"
                onClick={startCreateProduct}
                className="text-xs px-3 py-2 rounded-full border border-emerald-500 text-emerald-100 hover:bg-emerald-800"
              >
                Nuevo producto
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="grid gap-3 sm:grid-cols-4"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1 text-emerald-200">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full rounded-lg bg-emerald-950/60 border border-emerald-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={productForm.name}
                  onChange={handleProductFieldChange}
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs mb-1 text-emerald-200">
                  Precio (USD)
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg bg-emerald-950/60 border border-emerald-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={productForm.price}
                  onChange={handleProductFieldChange}
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs mb-1 text-emerald-200">
                  Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageChange}
                  className="w-full text-xs text-emerald-100 file:text-xs file:bg-emerald-800 file:border-0 file:px-3 file:py-1.5 file:rounded-lg file:text-emerald-50"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs mb-1 text-emerald-200">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full rounded-lg bg-emerald-950/60 border border-emerald-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={productForm.description}
                  onChange={handleProductFieldChange}
                  required
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  name="is_active"
                  checked={productForm.is_active}
                  onChange={handleProductFieldChange}
                  className="h-4 w-4 rounded border-emerald-500 bg-emerald-950"
                />
                <label
                  htmlFor="is_active"
                  className="text-xs text-emerald-200"
                >
                  Producto activo visible en el catálogo
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2">
                {editingProduct && (
                  <span className="self-center text-xs text-emerald-300">
                    Editando:{" "}
                    <span className="font-semibold">
                      {editingProduct.name}
                    </span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
                >
                  {savingProduct
                    ? "Guardando..."
                    : editingProduct
                    ? "Guardar cambios"
                    : "Crear producto"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* CATÁLOGO */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-emerald-100">
                Catálogo de productos{" "}
                <span className="text-emerald-300 text-sm">
                  (lectura pública)
                </span>
              </h2>
              {productsError && (
                <p className="text-sm text-red-300 mt-1">{productsError}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <label className="flex items-center gap-2 text-xs text-emerald-200">
                  <input
                    type="checkbox"
                    checked={showOnlyFavorites}
                    onChange={(e) =>
                      setShowOnlyFavorites(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-emerald-500 bg-emerald-950"
                  />
                  Ver solo mis favoritos
                </label>
              )}
              <span className="text-xs text-emerald-300">
                {visibleProducts.length} producto
                {visibleProducts.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {loadingProducts ? (
            <p className="text-sm text-emerald-200">
              Cargando catálogo...
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-sm text-emerald-200">
              {products.length === 0
                ? "Aún no hay productos en el catálogo. Crea algunos desde el panel administrador."
                : "No hay productos en esta vista (revisa el filtro de favoritos)."}
            </p>
          ) : (
            <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const isFavorite = favoriteIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className="rounded-xl bg-emerald-900/50 border border-emerald-700/60 shadow-lg shadow-emerald-950/40 overflow-hidden flex flex-col"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-40 w-full object-cover"
                      />
                    )}

                    <div className="flex-1 p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-emerald-50">
                          {product.name}
                        </h3>

                        {/* BOTÓN FAVORITO */}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleFavorite(product.id)
                          }
                          className={`text-xs px-2 py-1 rounded-full border transition ${
                            isFavorite
                              ? "border-emerald-300 bg-emerald-600/80 text-white"
                              : "border-emerald-500/60 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-800/80"
                          }`}
                        >
                          {isFavorite ? "💚 Favorito" : "🤍 Guardar"}
                        </button>
                      </div>

                      <p className="text-sm text-emerald-100/80 line-clamp-3">
                        {product.description}
                      </p>

                      <p className="mt-1 text-emerald-200 font-semibold">
                        ${Number(product.price).toFixed(2)}
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="flex-1 rounded-lg bg-emerald-500 text-white text-sm font-medium py-2 hover:bg-emerald-400 transition"
                        >
                          Ver detalle
                        </button>

                        {user?.is_admin && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditProduct(product)}
                              className="rounded-lg bg-emerald-800 text-emerald-50 text-xs px-3 py-2 hover:bg-emerald-700"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteProduct(product.id)
                              }
                              disabled={
                                deletingProductId === product.id
                              }
                              className="rounded-lg bg-red-700/80 text-red-50 text-xs px-3 py-2 hover:bg-red-600 disabled:opacity-60"
                            >
                              {deletingProductId === product.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MODAL DETALLE DE PRODUCTO */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-emerald-950 border border-emerald-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl shadow-black/70 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-50">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-sm text-emerald-300 mt-1">
                    ${Number(selectedProduct.price).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-sm text-emerald-200 hover:text-emerald-100"
                >
                  ✕ Cerrar
                </button>
              </div>

              {selectedProduct.image_url && (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-52 object-cover rounded-xl border border-emerald-700/60"
                />
              )}

              <p className="text-sm text-emerald-100">
                {selectedProduct.description}
              </p>

              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleFavorite(selectedProduct.id);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    favoriteIds.includes(selectedProduct.id)
                      ? "border-emerald-300 bg-emerald-600/80 text-white"
                      : "border-emerald-500/60 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-800/80"
                  }`}
                >
                  {favoriteIds.includes(selectedProduct.id)
                    ? "💚 Quitar de favoritos"
                    : "🤍 Guardar como favorito"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-lg bg-emerald-800 text-sm text-emerald-50 hover:bg-emerald-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

