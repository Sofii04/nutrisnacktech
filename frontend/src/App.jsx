import { useEffect, useState } from "react";
import "./index.css";

const API_BASE = "http://127.0.0.1:8000/api";

function App() {
  // =========================
  // AUTH
  // =========================
  const [authToken, setAuthToken] = useState(() => {
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

  const isLoggedIn = !!authToken;
  const isAdmin = !!(user && user.is_admin);

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login" ? "/auth/login" : "/auth/register";

      const payload =
        authMode === "login"
          ? {
              email: authEmail,
              password: authPassword,
            }
          : {
              name: authName,
              email: authEmail,
              password: authPassword,
              password_confirmation: authPasswordConfirm,
            };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          errorData.message ||
          "No se pudo completar la autenticación. Revisa tus datos.";
        throw new Error(msg);
      }

      const data = await response.json();

      // API devuelve: { message, user, token }
      if (data.token && data.user) {
        setAuthToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setAuthPassword("");
        setAuthPasswordConfirm("");
      }
    } catch (error) {
      console.error(error);
      setAuthError(error.message || "Ocurrió un error inesperado.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    } catch (e) {
      console.warn("Error al cerrar sesión en el backend (se ignora)", e);
    } finally {
      setAuthToken("");
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // =========================
// FRASE MOTIVACIONAL (API externa)
// =========================
const [quote, setQuote] = useState(null);
const [loadingQuote, setLoadingQuote] = useState(false);
const [quoteError, setQuoteError] = useState("");

const fetchMotivationalQuote = async () => {
  try {
    setLoadingQuote(true);
    setQuoteError("");

    const response = await fetch(`${API_BASE}/motivation`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo obtener la frase motivacional.");
    }

    if (data.text) {
      setQuote({
        text: data.text,
        author: data.author || "Anónimo",
      });
      setQuoteError("");
    } else {
      setQuoteError("No se recibió una frase válida.");
    }
  } catch (error) {
    console.error("Error al cargar la frase motivacional:", error);
    setQuote({
      text: "Cree en ti misma; cada pequeño paso cuenta 💚",
      author: "NutriSnackTech",
    });
    setQuoteError("");
  } finally {
    setLoadingQuote(false);
  }
};

  // =========================
  // CATÁLOGO DE PRODUCTOS
  // =========================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) {
        throw new Error("No se pudo cargar el catálogo de productos.");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setProductsError("Ocurrió un error al cargar los productos.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Cargar una frase motivacional al entrar a la app
useEffect(() => {
  fetchMotivationalQuote();
}, []);

  // =========================
  // FAVORITOS
  // =========================
  const [favoriteProductIds, setFavoriteProductIds] = useState([]);

  const loadFavorites = async () => {
    if (!authToken) {
      setFavoriteProductIds([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/favorites`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los favoritos.");
      }
      const data = await response.json();
      // Soportar tanto {product_id} como {product: {id}}
      const ids = data
        .map((item) => item.product_id ?? item.product?.id)
        .filter(Boolean);
      setFavoriteProductIds(ids);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [authToken]);

  const handleFavoriteToggle = async (productId) => {
    if (!authToken) {
      alert("Debes iniciar sesión para marcar favoritos.");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/products/${productId}/favorite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo actualizar el favorito.");
      }

      // Toggle local
      setFavoriteProductIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al marcar como favorito.");
    }
  };

  const isFavorite = (productId) => favoriteProductIds.includes(productId);

  // =========================
  // ADMIN: CRUD PRODUCTOS
  // =========================
  const [editingProduct, setEditingProduct] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminPrice, setAdminPrice] = useState("");
  const [adminImageFile, setAdminImageFile] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const resetAdminForm = () => {
    setEditingProduct(null);
    setAdminName("");
    setAdminDescription("");
    setAdminPrice("");
    setAdminImageFile(null);
    setAdminError("");
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setAdminName(product.name || "");
    setAdminDescription(product.description || "");
    setAdminPrice(product.price || "");
    setAdminImageFile(null);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!authToken) {
      alert("Debes iniciar sesión como admin.");
      return;
    }
    setAdminError("");
    setAdminLoading(true);

    try {
      const isEdit = !!editingProduct;
      const url = isEdit
        ? `${API_BASE}/products/${editingProduct.id}`
        : `${API_BASE}/products`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        name: adminName,
        description: adminDescription,
        price: adminPrice,
        is_active: true,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          errorData.message || "No se pudo guardar el producto en el backend.";
        throw new Error(msg);
      }

      const savedProduct = await response.json();

      // Si hay imagen, subirla
      if (adminImageFile) {
        const formData = new FormData();
        formData.append("image", adminImageFile);

        const imageResponse = await fetch(
          `${API_BASE}/products/${savedProduct.id}/image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            body: formData,
          }
        );

        if (!imageResponse.ok) {
          console.warn("El producto se guardó, pero falló la subida de imagen");
        }
      }

      // Refrescar productos
      await fetchProducts();
      resetAdminForm();
    } catch (error) {
      console.error(error);
      setAdminError(error.message || "Error al guardar el producto.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!authToken) {
      alert("Debes iniciar sesión como admin.");
      return;
    }
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el producto.");
      }
      await fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al eliminar el producto.");
    }
  };

  // =========================
  // DETALLE DE PRODUCTO + COMENTARIOS
  // =========================
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Comentarios
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [newComment, setNewComment] = useState("");

  const loadComments = async (productId) => {
    try {
      setLoadingComments(true);
      setCommentsError("");
      const response = await fetch(
        `${API_BASE}/products/${productId}/comments`
      );
      if (!response.ok) {
        throw new Error("No se pudieron cargar los comentarios");
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error(error);
      setCommentsError("Ocurrió un error al cargar los comentarios.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
    setNewComment("");
    loadComments(product.id);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedProduct(null);
    setComments([]);
    setNewComment("");
    setCommentsError("");
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    if (!selectedProduct) return;
    if (!authToken) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }
    if (!newComment.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/products/${selectedProduct.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo guardar el comentario");
      }

      const created = await response.json();
      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar tu comentario.");
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-emerald-100 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-900">
              NutriSnackTech
            </h1>
            <p className="text-sm sm:text-base text-emerald-800/80 mt-1">
              Catálogo de frutos deshidratados · Frontend React + Laravel API
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isLoggedIn && user ? (
              <>
                <span className="text-xs sm:text-sm text-emerald-900">
                  Sesión iniciada como{" "}
                  <span className="font-semibold">{user.name}</span>{" "}
                  {isAdmin && (
                    <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      ADMIN
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs sm:text-sm px-3 py-1 rounded-md border border-emerald-400 text-emerald-900 hover:bg-emerald-50"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <span className="text-xs sm:text-sm text-emerald-900">
                Inicia sesión o crea tu cuenta para administrar productos,
                comentar y marcar favoritos.
              </span>
            )}
          </div>
        </header>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Columna IZQUIERDA: Catálogo */}
          <section className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-emerald-900">
                    Catálogo de productos
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    Vista pública. Cualquiera puede ver los productos.
                  </p>
                </div>
              </div>

              {loadingProducts ? (
                <p className="text-sm text-emerald-800">Cargando productos…</p>
              ) : productsError ? (
                <p className="text-sm text-red-600">{productsError}</p>
              ) : products.length === 0 ? (
                <p className="text-sm text-emerald-800">
                  Aún no hay productos en el catálogo. Inicia sesión como
                  administrador para crear el primero.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="group bg-gradient-to-b from-white to-emerald-50/60 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                    >
                      <div
                        className="relative aspect-[4/3] bg-emerald-100/40 cursor-pointer"
                        onClick={() => handleOpenProduct(product)}
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-emerald-700/70">
                            Imagen no disponible
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-sm px-2 py-1 rounded-full bg-white/90 text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle(product.id);
                          }}
                        >
                          <span className="mr-1">
                            {isFavorite(product.id) ? "❤️" : "🤍"}
                          </span>
                          <span className="text-[11px]">
                            {isFavorite(product.id) ? "Favorito" : "Favorito"}
                          </span>
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col p-3 sm:p-4">
                        <h3 className="font-semibold text-emerald-900 text-sm sm:text-base line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-emerald-700 line-clamp-3">
                          {product.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-emerald-900">
                            {product.price ? `$${product.price}` : "—"}
                          </span>
                          <button
                            onClick={() => handleOpenProduct(product)}
                            className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Columna DERECHA: Auth + Admin */}
          <aside className="space-y-4">
             {/* Frase motivacional */}
  <div className="bg-emerald-900 text-emerald-50 rounded-2xl shadow-sm border border-emerald-700/60 p-4 sm:p-5">
    <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
      <span>✨ Frase motivacional</span>
    </h2>

    {loadingQuote ? (
      <p className="mt-2 text-xs sm:text-sm text-emerald-100/90">
        Cargando frase…
      </p>
    ) : quoteError ? (
      <p className="mt-2 text-xs sm:text-sm text-red-200">{quoteError}</p>
    ) : quote ? (
      <>
        <p className="mt-2 text-sm sm:text-base leading-snug">
          “{quote.text}”
        </p>
        <p className="mt-1 text-xs text-emerald-100/70 text-right">
          — {quote.author || "Anónimo"}
        </p>
      </>
    ) : (
      <p className="mt-2 text-xs sm:text-sm text-emerald-100/90">
        No se pudo cargar la frase. Intenta de nuevo.
      </p>
    )}

    <button
      type="button"
      onClick={fetchMotivationalQuote}
      className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-900 px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-emerald-200 transition"
    >
      Otra frase
    </button>
  </div>

            {/* Tarjeta de Autenticación */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-emerald-900">
                  {authMode === "login"
                    ? "Iniciar sesión"
                    : "Crear cuenta nueva"}
                </h2>
                <button
                  onClick={() =>
                    setAuthMode((prev) =>
                      prev === "login" ? "register" : "login"
                    )
                  }
                  className="text-[11px] px-2 py-1 rounded-full border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  {authMode === "login" ? "Registrarme" : "Ya tengo cuenta"}
                </button>
              </div>

              {authError && (
                <p className="text-xs text-red-600 mb-2">{authError}</p>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-2">
                {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-800">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs text-emerald-800">Correo</label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-emerald-800">Contraseña</label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>
                {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-800">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      value={authPasswordConfirm}
                      onChange={(e) => setAuthPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {authLoading
                    ? "Procesando..."
                    : authMode === "login"
                    ? "Iniciar sesión"
                    : "Registrarme"}
                </button>
              </form>
            </div>

            {/* Panel Admin */}
            {isAdmin && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-2">
                  Panel administrador
                </h2>
                <p className="text-xs text-emerald-700 mb-3">
                  Crea, edita y elimina productos. Sube una imagen para cada
                  producto.
                </p>

                {adminError && (
                  <p className="text-xs text-red-600 mb-2">{adminError}</p>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-800">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-800">
                      Descripción
                    </label>
                    <textarea
                      className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      rows={2}
                      value={adminDescription}
                      onChange={(e) => setAdminDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-800">
                      Precio (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      value={adminPrice}
                      onChange={(e) => setAdminPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-800">
                      Imagen (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs"
                      onChange={(e) =>
                        setAdminImageFile(e.target.files?.[0] || null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={adminLoading}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {adminLoading
                        ? "Guardando..."
                        : editingProduct
                        ? "Actualizar producto"
                        : "Crear producto"}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={resetAdminForm}
                        className="text-[11px] px-2 py-1 rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>

                {/* Lista rápida de productos para editar/eliminar */}
                <div className="mt-4 border-t border-emerald-100 pt-3">
                  <h3 className="text-xs font-semibold text-emerald-900 mb-2">
                    Productos existentes
                  </h3>
                  {products.length === 0 ? (
                    <p className="text-xs text-emerald-700">
                      No hay productos todavía.
                    </p>
                  ) : (
                    <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
                      {products.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between text-xs bg-emerald-50/60 rounded-md px-2 py-1"
                        >
                          <span className="truncate max-w-[55%]">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditProduct(p)}
                              className="px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2 py-0.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* MODAL DETALLE PRODUCTO */}
        {showDetailModal && selectedProduct && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="relative max-w-xl w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 sm:p-6">
              <button
                onClick={handleCloseModal}
                className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              >
                Cerrar
              </button>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/2">
                  <div className="aspect-[4/3] rounded-xl bg-emerald-100 overflow-hidden mb-2">
                    {selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-emerald-700/70">
                        Imagen no disponible
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 flex items-center gap-1"
                    onClick={() => handleFavoriteToggle(selectedProduct.id)}
                  >
                    <span>{isFavorite(selectedProduct.id) ? "❤️" : "🤍"}</span>
                    <span>
                      {isFavorite(selectedProduct.id)
                        ? "Quitar de favoritos"
                        : "Agregar a favoritos"}
                    </span>
                  </button>
                </div>

                <div className="sm:w-1/2 flex flex-col">
                  <h2 className="text-lg sm:text-xl font-semibold text-emerald-900">
                    {selectedProduct.name}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-800">
                    {selectedProduct.description}
                  </p>
                  <p className="mt-2 text-base font-semibold text-emerald-900">
                    {selectedProduct.price
                      ? `$${selectedProduct.price}`
                      : "—"}
                  </p>

                  {/* Sección de comentarios */}
                  <div className="mt-4 border-t border-emerald-100 pt-3 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-emerald-900 mb-2">
                      Comentarios
                    </h3>

                    {loadingComments && (
                      <p className="text-xs text-emerald-700">
                        Cargando comentarios…
                      </p>
                    )}

                    {commentsError && (
                      <p className="text-xs text-red-600">{commentsError}</p>
                    )}

                    {!loadingComments && comments.length === 0 && !commentsError && (
                      <p className="text-xs text-emerald-700">
                        Aún no hay comentarios para este producto. ¡Sé la
                        primera en comentar!
                      </p>
                    )}

                    <ul className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                      {comments.map((comment) => (
                        <li
                          key={comment.id}
                          className="bg-emerald-50/80 rounded-lg px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-emerald-900">
                              {comment.user?.name ?? "Usuario"}
                            </span>
                            <span className="text-[10px] text-emerald-700/80">
                              {comment.created_at
                                ? new Date(
                                    comment.created_at
                                  ).toLocaleString()
                                : ""}
                            </span>
                          </div>
                          <p className="text-emerald-900 break-words">
                            {comment.content}
                          </p>
                        </li>
                      ))}
                    </ul>

                    {isLoggedIn ? (
                      <form
                        onSubmit={handleSubmitComment}
                        className="mt-auto space-y-1"
                      >
                        <label className="block text-[11px] text-emerald-800">
                          Escribe tu comentario (máx. 200 caracteres)
                        </label>
                        <textarea
                          className="w-full rounded-md border border-emerald-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                          rows={3}
                          maxLength={200}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Me encantó este snack, es perfecto para llevar al trabajo…"
                        />
                        <div className="flex items-center justify-between text-[10px] text-emerald-700/80">
                          <span>{newComment.length}/200</span>
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Publicar comentario
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-1 text-[11px] text-emerald-700/90">
                        Inicia sesión para dejar un comentario sobre este
                        producto.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

