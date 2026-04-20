const { useState, useEffect } = React;

const API_BASE = window.APP_CONFIG?.API_BASE_URL || "http://localhost:8000/api";

// ─── useSiteData hook — fetches config + products once ────────────────────────
function useSiteData() {
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/config/`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${API_BASE}/products/`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([cfg, prods]) => {
        setConfig(cfg);
        setProducts(prods.map(p => ({ ...p, price: parseFloat(p.price) })));
      })
      .catch(() => setError("Cannot connect to backend. Make sure it is running on port 8000."))
      .finally(() => setLoading(false));
  }, []);

  return { config, products, loading, error };
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ siteName, tagline, cartCount, onCartClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="bg-[#003078] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#f3a712] rounded-full w-10 h-10 flex items-center justify-center font-bold text-[#003078] text-lg">UK</div>
          <div>
            <div className="font-bold text-xl tracking-wide">{siteName}</div>
            <div className="text-xs text-blue-200">{tagline}</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#home" className="hover:text-[#f3a712] transition">Home</a>
          <a href="#services" className="hover:text-[#f3a712] transition">Services</a>
          <a href="#products" className="hover:text-[#f3a712] transition">Fees</a>
          <a href="#contact" className="hover:text-[#f3a712] transition">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCartClick} className="relative bg-[#f3a712] hover:bg-yellow-400 text-[#003078] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition">
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#d4351c] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
            )}
          </button>
          <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#002060] px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          <a href="#home" className="hover:text-[#f3a712]">Home</a>
          <a href="#services" className="hover:text-[#f3a712]">Services</a>
          <a href="#products" className="hover:text-[#f3a712]">Fees</a>
          <a href="#contact" className="hover:text-[#f3a712]">Contact</a>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ config }) {
  const stats = [
    { value: config.stat_1_value, label: config.stat_1_label },
    { value: config.stat_2_value, label: config.stat_2_label },
    { value: config.stat_3_value, label: config.stat_3_label },
  ];
  return (
    <section id="home" className="bg-gradient-to-br from-[#003078] via-[#004aad] to-[#0066cc] text-white py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-block bg-[#f3a712] text-[#003078] text-xs font-bold px-4 py-1 rounded-full mb-6 uppercase tracking-widest">
          Official UKVI Fee Payment Portal
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          {config.hero_title.split('Fee Payment').length > 1 ? (
            <>
              {config.hero_title.split('Fee Payment')[0]}
              <span className="text-[#f3a712]">Fee Payment</span>
              {config.hero_title.split('Fee Payment')[1]}
            </>
          ) : config.hero_title}
        </h1>
        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          {config.hero_subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#products" className="bg-[#f3a712] hover:bg-yellow-400 text-[#003078] font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg">
            View Fee Options →
          </a>
          <a href="#services" className="border-2 border-white hover:bg-white hover:text-[#003078] text-white font-bold px-8 py-4 rounded-xl text-lg transition">
            Learn More
          </a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-extrabold text-[#f3a712]">{s.value}</div>
              <div className="text-blue-200 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
function Services() {
  const items = [
    { icon: "🛂", title: "Visa Fee Payment", desc: "Pay your UK visa application fee quickly and securely online." },
    { icon: "🏥", title: "IHS Payment", desc: "Immigration Health Surcharge — access NHS services during your stay." },
    { icon: "🔒", title: "Secure Transactions", desc: "All payments are encrypted and processed via trusted gateways." },
    { icon: "📧", title: "Instant Confirmation", desc: "Receive your payment receipt instantly via email." },
  ];
  return (
    <section id="services" className="py-20 bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#003078] mb-3">Our Services</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Everything you need to complete your UK visa application fees in one place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition border border-gray-100 text-center">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="font-bold text-[#003078] text-lg mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 ${product.is_popular ? 'border-[#f3a712]' : 'border-gray-100'} overflow-hidden flex flex-col`}>
      {product.is_popular && (
        <div className="absolute top-4 right-4 bg-[#f3a712] text-[#003078] text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
      )}
      <div className="bg-gradient-to-br from-[#003078] to-[#0066cc] p-6 text-center">
        <div className="text-5xl mb-2">{product.icon}</div>
        <span className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full">{product.category_display}</span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-[#003078] text-lg mb-2">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-4 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-3xl font-extrabold text-[#003078]">£{product.price.toLocaleString()}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-[#003078] hover:bg-[#004aad] text-white font-semibold px-5 py-2 rounded-xl transition text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────
function ProductsSection({ products, onAddToCart }) {
  const [filter, setFilter] = useState("All");

  // Build category list dynamically from products
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category_display)))];
  const filtered = filter === "All" ? products : products.filter(p => p.category_display === filter);

  return (
    <section id="products" className="py-20 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#003078] mb-3">Fee Options</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Select the fee type that applies to your application and add it to your cart.</p>
        </div>
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${filter === c ? 'bg-[#003078] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Cart Modal ───────────────────────────────────────────────────────────────
function CartModal({ cart, onClose, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#003078]">🛒 Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <div className="text-5xl mb-3">🛒</div>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <div className="font-semibold text-[#003078] text-sm">{item.name}</div>
                    <div className="text-gray-400 text-xs">{item.category_display}</div>
                    <div className="text-[#003078] font-bold mt-1">£{item.price.toLocaleString()} × {item.qty}</div>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="text-[#d4351c] hover:bg-red-50 rounded-lg p-2 transition">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-600">Total</span>
              <span className="text-2xl font-extrabold text-[#003078]">£{total.toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-[#003078] hover:bg-[#004aad] text-white font-bold py-4 rounded-xl transition text-lg">
              Proceed to Payment →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/orders/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order creation failed. Please try again.");
        return;
      }
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else if (data.order_id) {
        onSuccess(data.order_id);
      } else {
        setError("Unexpected response from server.");
      }
    } catch {
      setError("Cannot connect to server. Make sure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#003078]">💳 Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "John Smith" },
            { label: "Email Address", key: "email", type: "email", placeholder: "john@example.com" },
            { label: "Phone Number", key: "phone", type: "tel", placeholder: "+44 7700 000000" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{f.label}</label>
              <input required type={f.type} value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm"
                placeholder={f.placeholder} />
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-gray-600 font-semibold">Total Amount</span>
            <span className="text-2xl font-extrabold text-[#003078]">£{total.toLocaleString()}</span>
          </div>
          {error && <div className="bg-red-50 text-[#d4351c] text-sm rounded-xl p-3">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#003078] hover:bg-[#004aad] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition text-lg">
            {loading ? "Processing..." : "Pay Now 🔒"}
          </button>
          <p className="text-center text-xs text-gray-400">🔒 Secured by Stripe. Your data is safe.</p>
        </form>
      </div>
    </div>
  );
}

// ─── Success Banner ───────────────────────────────────────────────────────────
function SuccessBanner({ orderId, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-10">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-extrabold text-[#003078] mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-2">Your order has been placed.</p>
        <p className="text-sm text-gray-400 mb-6">Order ID: <span className="font-bold text-[#003078]">#{orderId}</span></p>
        <button onClick={onClose} className="bg-[#003078] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#004aad] transition">
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    { icon: "🔒", label: "SSL Encrypted" },
    { icon: "🏦", label: "Stripe Secured" },
    { icon: "📋", label: "UKVI Compliant" },
    { icon: "⚡", label: "Instant Receipt" },
  ];
  return (
    <section className="bg-[#003078] text-white py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {items.map((t, i) => (
          <div key={i}>
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="text-sm font-semibold text-blue-100">{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact({ config }) {
  const items = [
    { icon: "📧", title: "Email Us", value: config.contact_email },
    { icon: "📞", title: "Call Us", value: config.contact_phone },
    { icon: "💬", title: "Live Chat", value: "Available 24/7" },
  ];
  return (
    <section id="contact" className="py-20 bg-gray-50 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#003078] mb-3">Need Help?</h2>
        <p className="text-gray-500 mb-10">Our support team is available 24/7 to assist you with your application.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow border border-gray-100">
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="font-bold text-[#003078] mb-1">{c.title}</div>
              <div className="text-gray-500 text-sm">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ config }) {
  return (
    <footer className="bg-[#001a4d] text-white py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#f3a712] rounded-full w-9 h-9 flex items-center justify-center font-bold text-[#003078]">UK</div>
          <div>
            <div className="font-bold">{config.site_name}</div>
            <div className="text-xs text-blue-300">{config.site_tagline}</div>
          </div>
        </div>
        <div className="text-blue-300 text-sm text-center">
          © {new Date().getFullYear()} {config.site_name}. All rights reserved. | {config.footer_text}
        </div>
        <div className="flex gap-4 text-sm text-blue-300">
          <a href="#" className="hover:text-white transition">Privacy</a>
          <a href="#" className="hover:text-white transition">Terms</a>
          <a href="#" className="hover:text-white transition">Refunds</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#003078] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4 animate-pulse">🛂</div>
        <div className="text-xl font-bold">Loading UKVI Services...</div>
      </div>
    </div>
  );
}

// ─── Error Screen ─────────────────────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#d4351c] mb-2">Connection Error</h2>
        <p className="text-gray-500 text-sm">{message}</p>
        <button onClick={() => window.location.reload()} className="mt-6 bg-[#003078] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004aad] transition">
          Retry
        </button>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function App() {
  const { config, products, loading, error } = useSiteData();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const handleSuccess = (orderId) => {
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
    setSuccessOrderId(orderId);
  };

  return (
    <div className="min-h-screen font-sans">
      <Navbar
        siteName={config.site_name}
        tagline={config.site_tagline}
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onCartClick={() => setShowCart(true)}
      />
      <Hero config={config} />
      <Services />
      <ProductsSection products={products} onAddToCart={addToCart} />
      <TrustBar />
      <Contact config={config} />
      <Footer config={config} />

      {showCart && (
        <CartModal
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={removeFromCart}
          onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccess}
        />
      )}
      {successOrderId && (
        <SuccessBanner orderId={successOrderId} onClose={() => setSuccessOrderId(null)} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
