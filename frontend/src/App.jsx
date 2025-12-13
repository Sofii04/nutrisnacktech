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
          <h2 className="mb-3 text-base font-semibold md:text-lg">
            Autenticación
          </h2>

          {currentUser ? (
            <p className="text-sm text-emerald-300">
              Ya has iniciado sesión. Más adelante aquí podrás gestionar el catálogo
              (crear/editar/eliminar) solo si eres administrador.
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

        {/* Tarjeta del catálogo */}
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
              Aún no hay productos en el catálogo. Crea algunos desde el backend.
            </p>
          )}

          {!loadingProducts && !productsError && products.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-md transition hover:border-amber-400/70 hover:shadow-amber-400/20"
                >
                  <div className="h-28 bg-gradient-to-br from-amber-400/40 via-amber-500/20 to-amber-900/30" />

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

