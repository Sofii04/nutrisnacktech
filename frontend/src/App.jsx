import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  // Estado de autenticación
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Campos del formulario de login
  const [email, setEmail] = useState("sofy@test.com");
  const [password, setPassword] = useState("password123");

  // Estado del catálogo
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  // Estado del panel admin (crear / editar producto)
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");

  // Producto en edición (null = creando)
  const [editingProduct, setEditingProduct] = useState(null);

  // Estado de subida de imagen
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  // Cargar productos (público)
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError("");

        const res = await fetch(`${API_BASE}/api/products`);

        if (!res.ok) {
          throw new Error(`Error al cargar productos: ${res.status}`);
        }

        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setProductsError("No se pudo cargar el catálogo de productos.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  // Recuperar token desde localStorage al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("nutrisnacktech_token");
    if (storedToken) {
      setAuthToken(storedToken);
      fetchCurrentUser(storedToken);
    }
  }, []);

  async function fetchCurrentUser(token) {
    try {
      setAuthLoading(true);
      setAuthError("");

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo recuperar la sesión.");
      }

      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error(err);
      setAuthError("La sesión no es válida. Inicia sesión de nuevo.");
      setAuthToken(null);
      setCurrentUser(null);
      localStorage.removeItem("nutrisnacktech_token");
    } finally {
      setAuthLoading(false);
    }
  }

  // Login
  async function handleLogin(event) {
    event.preventDefault();
    try {
      setAuthLoading(true);
      setAuthError("");

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        if (res.status === 422) {
          setAuthError("Credenciales inválidas. Verifica tu correo y contraseña.");
          return;
        }
        throw new Error(`Error en login: ${res.status}`);
      }

      const data = await res.json();

      const token = data.token;
      setAuthToken(token);
      setCurrentUser(data.user);
      localStorage.setItem("nutrisnacktech_token", token);
    } catch (err) {
      console.error(err);
      setAuthError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout
  async function handleLogout() {
    if (!authToken) {
      setAuthToken(null);
      setCurrentUser(null);
      localStorage.removeItem("nutrisnacktech_token");
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError("");

      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (err) {
      console.error(err);
      // aunque falle, limpiamos el lado cliente
    } finally {
      setAuthLoading(false);
      setAuthToken(null);
      setCurrentUser(null);
      localStorage.removeItem("nutrisnacktech_token");
    }
  }

  const isAdmin = !!(currentUser && currentUser.is_admin);

  // Limpiar formulario y estado de edición
  function resetAdminForm() {
    setNewName("");
    setNewDescription("");
    setNewPrice("");
    setNewImageUrl("");
    setNewIsActive(true);
    setEditingProduct(null);
    setAdminMessage("");
    setAdminError("");
    setUploadingImage(false);
    setImageUploadError("");
  }

  // Preparar formulario para editar
  function startEditing(product) {
    setEditingProduct(product);
    setNewName(product.name || "");
    setNewDescription(product.description || "");
    setNewPrice(String(product.price ?? ""));
    setNewImageUrl(product.image_url || "");
    setNewIsActive(product.is_active ?? true);
    setAdminMessage("");
    setAdminError("");
    setUploadingImage(false);
    setImageUploadError("");
  }

  // Subir imagen usando el backend de Laravel
  async function handleImageChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!authToken || !isAdmin) {
      setImageUploadError(
        "Debes iniciar sesión como administrador para subir imágenes."
      );
      return;
    }

    try {
      setUploadingImage(true);
      setImageUploadError("");
      setAdminMessage("");

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/api/products/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // 👇 NO ponemos Content-Type, lo pone el navegador (multipart/form-data)
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 422) {
          setImageUploadError("La imagen no es válida o es muy grande (máx. 2MB).");
          return;
        }
        if (res.status === 403) {
          setImageUploadError("Solo el administrador puede subir imágenes.");
          return;
        }
        throw new Error(`Error al subir imagen: ${res.status}`);
      }

      const data = await res.json();

      // Guardar URL devuelta por Laravel
      setNewImageUrl(data.url);
      setAdminMessage("Imagen subida correctamente. No olvides guardar el producto.");
    } catch (err) {
      console.error(err);
      setImageUploadError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploadingImage(false);
    }
  }

  // Crear o actualizar producto (solo admin)
  async function handleSubmitProduct(event) {
    event.preventDefault();

    if (!authToken || !isAdmin) {
      setAdminError(
        "Debes iniciar sesión como administrador para crear o editar productos."
      );
      return;
    }

    try {
      setAdminSaving(true);
      setAdminError("");

      const body = {
        name: newName,
        description: newDescription || null,
        price: Number(newPrice),
        image_url: newImageUrl || null,
        is_active: newIsActive,
      };

      let res;
      let method;
      let url;

      if (editingProduct) {
        // Modo edición
        method = "PUT";
        url = `${API_BASE}/api/products/${editingProduct.id}`;
      } else {
        // Modo creación
        method = "POST";
        url = `${API_BASE}/api/products`;
      }

      res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 422) {
          setAdminError("Datos inválidos. Revisa nombre y precio.");
          return;
        }
        if (res.status === 403) {
          setAdminError(
            "Solo el administrador puede crear o editar productos."
          );
          return;
        }
        throw new Error(
          `Error al ${editingProduct ? "actualizar" : "crear"} producto: ${
            res.status
          }`
        );
      }

      const saved = await res.json();

      if (editingProduct) {
        // Actualizar en la lista
        setProducts((prev) =>
          prev.map((p) => (p.id === saved.id ? saved : p))
        );
        setAdminMessage(`Producto "${saved.name}" actualizado correctamente.`);
      } else {
        // Insertar al inicio
        setProducts((prev) => [saved, ...prev]);
        setAdminMessage(`Producto "${saved.name}" creado correctamente.`);
      }

      // Reset
      resetAdminForm();
    } catch (err) {
      console.error(err);
      setAdminError(
        `No se pudo ${
          editingProduct ? "actualizar" : "crear"
        } el producto. Intenta de nuevo.`
      );
    } finally {
      setAdminSaving(false);
    }
  }

  // Eliminar producto (solo admin)
  async function handleDeleteProduct(productId, productName) {
    if (!authToken || !isAdmin) {
      alert("Debes iniciar sesión como administrador para eliminar productos.");
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el producto "${productName}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          alert("Solo el administrador puede eliminar productos.");
          return;
        }
        throw new Error(`Error al eliminar producto: ${res.status}`);
      }

      // Quitar el producto de la lista en memoria
      setProducts((prev) => prev.filter((p) => p.id !== productId));

      // Si estabas editando ese producto, resetear formulario
      if (editingProduct && editingProduct.id === productId) {
        resetAdminForm();
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el producto. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              NutriSnackTech · Catálogo de frutos deshidratados
            </h1>
            <p className="text-sm text-slate-300">
              Frontend en React + Tailwind consumiendo tu API Laravel.
            </p>
          </div>

          {/* Estado de sesión en el header */}
          <div className="mt-3 flex flex-col items-start gap-2 md:mt-0 md:items-end">
            {currentUser ? (
              <>
                <div className="text-right text-xs md:text-sm">
                  <p className="font-medium">
                    Sesión iniciada como{" "}
                    <span className="text-amber-300">{currentUser.name}</span>
                  </p>
                  <p className="text-slate-300">
                    Rol:{" "}
                    <span className="font-semibold">
                      {isAdmin ? "Administrador" : "Usuario"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="rounded-full border border-slate-600 px-3 py-1 text-xs font-medium text-slate-100 hover:border-red-400 hover:text-red-300 disabled:opacity-60"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-300 md:text-sm">
                No has iniciado sesión.
              </p>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Tarjeta de autenticación */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <h2 className="mb-3 text_base font-semibold md:text-lg">
            Autenticación
          </h2>

          {currentUser ? (
            <p className="text-sm text-emerald-300">
              Ya has iniciado sesión. Si eres administrador, puedes gestionar el
              catálogo en el panel de administración.
            </p>
          ) : (
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-3 md:flex-row md:items-end"
            >
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="mt-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60 md:mt-0"
              >
                {authLoading ? "Iniciando..." : "Iniciar sesión"}
              </button>
            </form>
          )}

          {authError && (
            <p className="mt-2 text-xs text-red-400">{authError}</p>
          )}
        </section>

        {/* Panel administrador (solo visible si eres admin) */}
        <section className="rounded-xl border border-amber-500/40 bg-slate-900/70 p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-amber-300 md:text-lg">
              Panel administrador · Gestión de productos
            </h2>
            <span className="rounded-full border border-amber-400/60 px-3 py-1 text-xs font-medium text-amber-300">
              Solo administrador
            </span>
          </div>

          {!currentUser && (
            <p className="text-sm text-slate-300">
              Inicia sesión como administrador para crear, editar o eliminar
              productos.
            </p>
          )}

          {currentUser && !isAdmin && (
            <p className="text-sm text-slate-300">
              Has iniciado sesión, pero no tienes rol de administrador. Solo un
              administrador puede gestionar el catálogo.
            </p>
          )}

          {currentUser && isAdmin && (
            <>
              <p className="mb-3 text-sm text-slate-300">
                {editingProduct
                  ? `Editando producto: "${editingProduct.name}"`
                  : "Crea nuevos productos para el catálogo de NutriSnackTech."}
              </p>

              <form
                onSubmit={handleSubmitProduct}
                className="grid gap-3 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Mango deshidratado 100 g"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Descripción
                  </label>
                  <textarea
                    className="min-h-[60px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Breve descripción del producto..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Precio (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Ej: 3.50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Imagen del producto (Laravel Storage)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-200"
                  />
                  {uploadingImage && (
                    <p className="mt-1 text-[11px] text-slate-300">
                      Subiendo imagen...
                    </p>
                  )}
                  {imageUploadError && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {imageUploadError}
                    </p>
                  )}
                  {newImageUrl && (
                    <div className="mt-2">
                      <p className="mb-1 text-[11px] text-emerald-300">
                        Imagen subida. Vista previa:
                      </p>
                      <img
                        src={newImageUrl}
                        alt="Vista previa producto"
                        className="h-20 w-20 rounded-lg object-cover border border-slate-700"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                  />
                  <label
                    htmlFor="is_active"
                    className="text-xs font-medium text-slate-300"
                  >
                    Producto activo / visible en catálogo
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={resetAdminForm}
                      className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                    >
                      Cancelar edición
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={adminSaving || uploadingImage}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                  >
                    {adminSaving
                      ? editingProduct
                        ? "Guardando..."
                        : "Guardando..."
                      : editingProduct
                      ? "Guardar cambios"
                      : "Crear producto"}
                  </button>
                </div>
              </form>

              {adminMessage && (
                <p className="mt-2 text-xs text-emerald-300">{adminMessage}</p>
              )}
              {adminError && (
                <p className="mt-2 text-xs text-red-400">{adminError}</p>
              )}
            </>
          )}
        </section>

        {/* Tarjeta del catálogo público */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold md:text-xl">
                Catálogo de productos
              </h2>
              <p className="text-xs text-slate-300 md:text-sm">
                Vista pública de los frutos deshidratados de NutriSnackTech.
              </p>
            </div>
            <span className="rounded-full border border-amber-400/60 px-3 py-1 text-xs font-medium text-amber-300">
              {products.length} productos
            </span>
          </div>

          {loadingProducts && (
            <p className="text-sm text-slate-300">Cargando productos...</p>
          )}

          {productsError && (
            <p className="text-sm text-red-400">{productsError}</p>
          )}

          {!loadingProducts && !productsError && products.length === 0 && (
            <p className="text-sm text-slate-300">
              Aún no hay productos en el catálogo. Crea algunos desde el panel
              de administración.
            </p>
          )}

          {!loadingProducts && !productsError && products.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-md transition hover:border-amber-400/70 hover:shadow-amber-400/20"
                >
                  {/* Imagen o degradado */}
                  {product.image_url ? (
                    <div className="h-32 w-full overflow-hidden border-b border-slate-800 bg-slate-900">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-amber-400/40 via-amber-500/20 to-amber-900/30" />
                  )}

                  <div className="flex flex-1 flex-col gap-2 px-4 py-3">
                    <h3 className="text-sm font-semibold md:text-base">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-slate-300 md:text-sm">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold text-amber-300">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                        Disponible
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="mt-3 flex justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(product)}
                          className="rounded-lg border border-amber-400/70 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name)
                          }
                          className="rounded-lg border border-red-500/60 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

