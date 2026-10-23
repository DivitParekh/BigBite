
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Clock,
  Utensils,
  Plus,
  Minus,
  Flame,
  Coffee,
  Sandwich,
  Pizza,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import "./index.css";
import "./payment-checkout.css";

import { useAuth } from "./features/auth/AuthContext";
import { logoutUser } from "./features/auth/authService";
import { getMenuItems } from "./services/menuService";
import { createOrder } from "./services/orderService";
import { QRCodeSVG } from "qrcode.react";

import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import AdminDashboard from "./features/admin/AdminDashboard";
import PaymentVerification from "./features/payment/PaymentVerification";
import MyOrders from "./features/orders/MyOrders";

const categories = [
  { name: "All", icon: Utensils },
  { name: "Snacks", icon: Sandwich },
  { name: "Meals", icon: Utensils },
  { name: "Beverages", icon: Coffee },
  { name: "Fast Food", icon: Pizza },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [allFoods, setAllFoods] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

const { user, profile, loading, isAdmin, isStudent } = useAuth();

  async function loadMenu() {
    setMenuLoading(true);
    setMenuError("");

    try {
      const items = await getMenuItems();
      setAllFoods(items);
    } catch (error) {
      console.error("Unable to load menu:", error);
      setMenuError(
        "We couldn't load the menu. Please check your connection and try again."
      );
    } finally {
      setMenuLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function fetchMenu() {
      try {
        setMenuLoading(true);
        setMenuError("");

        const items = await getMenuItems();

        if (active) {
          setAllFoods(items);
        }
      } catch (error) {
        console.error("Unable to load menu:", error);

        if (active) {
          setMenuError(
            "We couldn't load the menu. Please check your connection and try again."
          );
        }
      } finally {
        if (active) {
          setMenuLoading(false);
        }
      }
    }

    fetchMenu();

    return () => {
      active = false;
    };
  }, []);

useEffect(() => {
  if (!isAdmin && ["admin", "payments"].includes(activePage)) {
    setActivePage("home");
    return;
  }

  if (!user && activePage === "orders") {
    setActivePage("home");
  }
}, [isAdmin, Boolean(user), activePage]);

  const foods = useMemo(
    () =>
      allFoods.filter((food) => {
        const matchesCategory =
          activeCategory === "All" || food.category === activeCategory;

        const matchesSearch = (food.name || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase());

        return matchesCategory && matchesSearch;
      }),
    [allFoods, activeCategory, search]
  );

  const cartCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const cartTotal = allFoods.reduce(
    (total, food) =>
      total + (Number(food.price) || 0) * (cart[food.id] || 0),
    0
  );

  function updateCart(id, change) {
    const food = allFoods.find((item) => item.id === id);

    if (!food || food.available === false || checkoutLoading) return;

    setCart((current) => {
      const nextQuantity = (current[id] || 0) + change;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[id];
      } else {
        next[id] = nextQuantity;
      }

      return next;
    });

    setNotice("");
  }

  function scrollToMenu() {
    setActivePage("home");
    setMobileMenu(false);

    window.setTimeout(() => {
      document.getElementById("menu")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 0);
  }

  function goHome() {
    setActivePage("home");
    setNotice("");
    setMobileMenu(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goAdmin() {
    if (!isAdmin) {
      setNotice("You need administrator access to open this page.");
      return;
    }

    setActivePage("admin");
    setNotice("");
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPayments() {
    if (!isAdmin) {
      setNotice("You need administrator access to open this page.");
      return;
    }

    setActivePage("payments");
    setNotice("");
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goMyOrders() {
    if (!user) {
      setShowCart(false);
      openAuth("login");
      setNotice("Please log in to view your orders.");
      return;
    }

    setActivePage("orders");
    setNotice("");
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAuth(mode) {
    setAuthError("");
    setAuthMode(mode);
    setMobileMenu(false);
  }

  function closeAuth() {
    setAuthMode(null);
    setAuthError("");
  }

  async function handleLogout() {
    setLoggingOut(true);
    setNotice("");

    try {
      await logoutUser();
      setActivePage("home");
      setShowCart(false);
      setShowPayment(false);
      setNotice("You have been logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
      setNotice("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }


const handleCheckout = () => {
  console.log("BigBite checkout clicked");
  console.log("User:", user);
  console.log("Profile:", profile);
  console.log("Student role:", profile?.role);
  console.log("Cart count:", cartCount);

  setNotice("");

  if (loading) {
    console.log("Checkout blocked: account is loading");
    setNotice("Please wait while your account loads.");
    return;
  }

  if (!user) {
    setShowCart(false);
    setAuthMode("login");
    return;
  }

  if (!profile || user.uid !== profile.uid) {
    setNotice("Your account profile is not ready. Please log in again.");
    return;
  }

  if (profile.role !== "student") {
    setNotice("Please log in with a student account to place an order.");
    return;
  }

  if (cartCount === 0) {
    setNotice("Your cart is empty.");
    return;
  }

  console.log("Checkout passed. Opening payment modal.");
  setPaymentReference("");
  setShowPayment(true);
};


  async function submitPaymentReference(event) {
    event.preventDefault();

    if (checkoutLoading) return;

    if (loading) {
      setNotice("Please wait while your account is loading.");
      return;
    }

    if (!user) {
      setShowPayment(false);
      openAuth("login");
      setNotice("Please log in before submitting your order.");
      return;
    }

    if (user.uid !== profile?.uid) {
      setNotice(
        "Your account profile is still loading. Please try again."
      );
      return;
    }

    const reference = paymentReference.trim();

    if (reference.length < 6 || reference.length > 100) {
      setNotice(
        "Enter a valid UPI transaction reference (6–100 characters)."
      );
      return;
    }

    const cartItems = Object.entries(cart)
      .map(([id, quantity]) => ({
        id,
        quantity: Number(quantity),
      }))
      .filter(
        (item) =>
          item.id &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );

    if (cartItems.length === 0) {
      setNotice("Your cart is empty. Please add items again.");
      setShowPayment(false);
      return;
    }

    setCheckoutLoading(true);
    setNotice("");

    try {
      const order = await createOrder(
        user,
        cartItems,
        orderNotes.trim(),
        reference
      );

      setCart({});
      setOrderNotes("");
      setPaymentReference("");
      setShowPayment(false);
      setShowCart(false);
      setActivePage("orders");

      setNotice(
        `Order ${order.id} submitted successfully. Payment is pending canteen verification.`
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Order submission failed:", error);

      const errorCode = error?.code || "";

      if (
        errorCode === "permission-denied" ||
        errorCode === "firestore/permission-denied"
      ) {
        setNotice(
          "Order rejected by Firestore security rules. Check that students can create orders with their own user ID."
        );
      } else {
        setNotice(
          error?.message ||
            "We couldn't submit your order. Please check your connection and try again."
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a
          className="brand"
          href="#home"
          aria-label="BigBite home"
          onClick={(event) => {
            event.preventDefault();
            goHome();
          }}
        >
          <span className="brand-icon">B</span>
          <span>
            Big<span className="brand-accent">Bite</span>
            <small>CAMPUS CANTEEN</small>
          </span>
        </a>

        <nav className={`nav-links ${mobileMenu ? "nav-open" : ""}`}>
          <a
            className={activePage === "home" ? "nav-active" : ""}
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              goHome();
            }}
          >
            Home
          </a>

          <a
            href="#menu"
            onClick={(event) => {
              event.preventDefault();
              scrollToMenu();
            }}
          >
            Explore Menu
          </a>

          {/* <a
            href="#offers"
            onClick={(event) => {
              event.preventDefault();
              setActivePage("home");
              setMobileMenu(false);

              window.setTimeout(() => {
                document.getElementById("offers")?.scrollIntoView({
                  behavior: "smooth",
                });
              }, 0);
            }}
          >
            Offers
          </a> */}

          {user && (
            <a
              className={activePage === "orders" ? "nav-active" : ""}
              href="#my-orders"
              onClick={(event) => {
                event.preventDefault();
                goMyOrders();
              }}
            >
              My Orders
            </a>
          )}

          {isAdmin && (
            <a
              className={activePage === "admin" ? "nav-active" : ""}
              href="#admin"
              onClick={(event) => {
                event.preventDefault();
                goAdmin();
              }}
            >
              Admin
            </a>
          )}

          {isAdmin && (
            <a
              className={activePage === "payments" ? "nav-active" : ""}
              href="#payment-verification"
              onClick={(event) => {
                event.preventDefault();
                goPayments();
              }}
            >
              Payment Verification
            </a>
          )}

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </nav>

        <div className="nav-actions">
          {loading ? (
            <button className="login-button" disabled>
              Loading...
            </button>
          ) : user ? (
            <div className="nav-user">
              <span className="nav-user-name" title={user.email}>
                <UserRound size={17} />
                <span>
                  {profile?.name || user.displayName || user.email}
                </span>
              </span>

              {isAdmin && (
                <span className="admin-indicator">
                  <ShieldCheck size={15} />
                  Administrator
                </span>
              )}

              <button
                className="login-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={16} />
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          ) : (
            <button
              className="login-button"
              onClick={() => openAuth("login")}
            >
              Log in
            </button>
          )}

          <button
            className="cart-button"
            onClick={() => setShowCart(true)}
            aria-label={`Open cart with ${cartCount} items`}
          >
            <ShoppingBag size={18} />
            <span className="cart-label">My Cart</span>
            <span className="cart-count">{cartCount}</span>
          </button>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu((current) => !current)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {activePage === "admin" && isAdmin ? (
        <AdminDashboard />
      ) : activePage === "payments" && isAdmin ? (
        <PaymentVerification />
      ) : activePage === "orders" && user ? (
        <MyOrders />
      ) : (
        <main>
          <section className="hero" id="home">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR CAMPUS, YOUR FOOD
              </div>

              <h1>
                Big cravings.
                <br />
                <span>Little wait.</span>
              </h1>

              <p className="hero-description">
                Your college favourites, just a few clicks away.
                Order ahead, skip the queue and enjoy every bite.
              </p>

              <div className="hero-actions">
                <button className="primary-button" onClick={scrollToMenu}>
                  Explore menu <span>↗</span>
                </button>

                <div className="hero-delivery">
                  <Clock size={17} />
                  <span>Quick campus pickup</span>
                </div>
              </div>

              <div className="hero-trust">
                <span className="trust-icon">
                  <CheckCircle2 size={17} />
                </span>
                Freshly prepared on campus
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-food">🍔</div>

              <div className="floating-card floating-top">
                <span className="floating-emoji">🔥</span>
                <span>
                  <strong>Fresh & tasty</strong>
                  <small>Made when you order</small>
                </span>
              </div>

              <div className="floating-card floating-bottom">
                <span className="floating-emoji">⚡</span>
                <span>
                  <strong>Beat the queue</strong>
                  <small>Order ahead, pick up</small>
                </span>
              </div>

              <span className="decor decor-one">✳</span>
              <span className="decor decor-two">✦</span>
            </div>
          </section>

          <section className="benefits">
            <div className="benefit">
              <span className="benefit-icon orange">
                <Clock size={20} />
              </span>
              <span>
                <strong>Save your break</strong>
                <small>Order before the rush</small>
              </span>
            </div>

            <div className="benefit">
              <span className="benefit-icon green">
                <CheckCircle2 size={20} />
              </span>
              <span>
                <strong>Easy ordering</strong>
                <small>Simple and hassle-free</small>
              </span>
            </div>

            <div className="benefit">
              <span className="benefit-icon purple">
                <ShoppingBag size={20} />
              </span>
              <span>
                <strong>Easy pickup</strong>
                <small>Collect at the counter</small>
              </span>
            </div>
          </section>

          <section className="menu-section" id="menu">
            <div className="section-heading">
              <div>
                <div className="section-kicker">MADE FOR YOUR BREAK</div>
                <h2>What's on the menu?</h2>
                <p>Good food. Student-friendly prices.</p>
              </div>

              <div className="menu-search">
                <Search size={19} />
                <input
                  type="search"
                  placeholder="Search your cravings..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search menu"
                />
              </div>
            </div>

            <div className="category-list">
              {categories.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={`category-button ${
                    activeCategory === name ? "category-active" : ""
                  }`}
                  onClick={() => setActiveCategory(name)}
                >
                  <Icon size={17} />
                  {name}
                </button>
              ))}
            </div>

            {menuLoading && (
              <div className="menu-status" role="status">
                Loading the menu...
              </div>
            )}

            {!menuLoading && menuError && (
              <div className="menu-status" role="alert">
                <p>{menuError}</p>
                <button className="primary-button" onClick={loadMenu}>
                  Try again
                </button>
              </div>
            )}

            {!menuLoading && !menuError && allFoods.length === 0 && (
              <div className="menu-status">
                <p>No food items are available right now.</p>
              </div>
            )}

            {!menuLoading && !menuError && foods.length > 0 && (
              <div className="food-grid">
                {foods.map((food) => (
                  <article className="food-card" key={food.id}>
                    <div className={`food-image ${food.color || "peach"}`}>
                      {food.tag && (
                        <span className="food-tag">
                          {food.tag === "Bestseller" && <Flame size={13} />}
                          {food.tag}
                        </span>
                      )}

                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="food-photo"
                          loading="lazy"
                        />
                      ) : (
                        <span className="food-emoji">
                          {food.emoji || "🍽️"}
                        </span>
                      )}

                      <button
                        className="quick-add"
                        onClick={() => updateCart(food.id, 1)}
                        disabled={
                          food.available === false || checkoutLoading
                        }
                        aria-label={`Add ${food.name} to cart`}
                      >
                        <Plus size={19} />
                      </button>
                    </div>

                    <div className="food-details">
                      <span className="food-category">{food.category}</span>
                      <h3>{food.name}</h3>

                      {food.description && <p>{food.description}</p>}

                      <div className="food-meta">
                        <span>
                          <Clock size={14} /> {food.time || "10-15 min"}
                        </span>
                        <strong>{formatINR(food.price)}</strong>
                      </div>

                      {food.available === false ? (
                        <button className="add-button" disabled>
                          Currently unavailable
                        </button>
                      ) : cart[food.id] ? (
                        <div className="quantity-control">
                          <button
                            onClick={() => updateCart(food.id, -1)}
                            disabled={checkoutLoading}
                            aria-label={`Decrease ${food.name} quantity`}
                          >
                            <Minus size={15} />
                          </button>

                          <span>{cart[food.id]} in cart</span>

                          <button
                            onClick={() => updateCart(food.id, 1)}
                            disabled={checkoutLoading}
                            aria-label={`Increase ${food.name} quantity`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add-button"
                          onClick={() => updateCart(food.id, 1)}
                          disabled={checkoutLoading}
                        >
                          Add to order <Plus size={15} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!menuLoading &&
              !menuError &&
              allFoods.length > 0 &&
              foods.length === 0 && (
                <div className="empty-state">
                  <span>🍽️</span>
                  <h3>No dishes found</h3>
                  <p>Try another search or select a different category.</p>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("All");
                    }}
                  >
                    Show all food
                  </button>
                </div>
              )}
          </section>

          <section className="offer-section" id="offers">
            <div className="offer-copy">
              <span className="offer-label">A LITTLE EXTRA HAPPINESS</span>
              <h2>Your next favourite meal is waiting.</h2>
              <p>
                Explore the menu and discover something delicious for your
                next campus break.
              </p>
              <button className="offer-button" onClick={scrollToMenu}>
                Find your favourite ↗
              </button>
            </div>

            <div className="offer-art">🍟</div>
            <div className="offer-spark">✳</div>
          </section>
        </main>
      )}

      <footer className="footer">
        <a
          className="brand footer-brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            goHome();
          }}
        >
          <span className="brand-icon">B</span>
          <span>
            Big<span className="brand-accent">Bite</span>
            <small>CAMPUS CANTEEN</small>
          </span>
        </a>

        <p>Made for campus life. Served with a smile.</p>
        <span>© 2026 BigBite</span>
      </footer>

      {showCart && (
        <div
          className="cart-overlay"
          onClick={() => {
            if (!checkoutLoading) setShowCart(false);
          }}
        >
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-header">
              <div>
                <span className="section-kicker">YOUR ORDER</span>
                <h2>My Cart ({cartCount})</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setShowCart(false)}
                disabled={checkoutLoading}
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            <div className="cart-items">
              {allFoods
                .filter((food) => cart[food.id])
                .map((food) => (
                  <div className="cart-item" key={food.id}>
                    <div
                      className={`cart-item-emoji ${food.color || "peach"}`}
                    >
                      {food.emoji || "🍽️"}
                    </div>

                    <div className="cart-item-info">
                      <strong>{food.name}</strong>
                      <span>{formatINR(food.price)} each</span>

                      <div className="cart-quantity">
                        <button
                          onClick={() => updateCart(food.id, -1)}
                          disabled={checkoutLoading}
                          aria-label={`Decrease ${food.name} quantity`}
                        >
                          <Minus size={13} />
                        </button>

                        <span>{cart[food.id]}</span>

                        <button
                          onClick={() => updateCart(food.id, 1)}
                          disabled={checkoutLoading}
                          aria-label={`Increase ${food.name} quantity`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <strong>
                      {formatINR(food.price * cart[food.id])}
                    </strong>
                  </div>
                ))}

              {cartCount === 0 && (
                <div className="cart-empty">
                  <span>🛍️</span>
                  <h3>Your cart is empty</h3>
                  <p>Find something tasty on the menu.</p>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setShowCart(false);
                      scrollToMenu();
                    }}
                  >
                    Browse menu
                  </button>
                </div>
              )}
            </div>

            {cartCount > 0 && (
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{formatINR(cartTotal)}</strong>
                </div>

                <div className="summary-row">
                  <span>Pickup</span>
                  <strong>At canteen counter</strong>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatINR(cartTotal)}</strong>
                </div>

                <label htmlFor="order-notes" className="order-notes-label">
                  Special instructions (optional)
                </label>

                <textarea
                  id="order-notes"
                  className="order-notes-input"
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  placeholder="For example: less spicy, no onion..."
                  maxLength={250}
                  rows={3}
                  disabled={checkoutLoading}
                />

<button
  type="button"
  className="primary-button"
  onClick={handleCheckout}
  disabled={checkoutLoading || cartCount === 0}
>
  {checkoutLoading ? "Processing..." : "Place order"}
  {!checkoutLoading && <span> →</span>}
</button>

                <p className="checkout-note">
                  Scan the UPI QR code and submit your transaction reference
                  to send your order to the canteen.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {showPayment && (
        <div
          className="auth-overlay payment-overlay"
          onClick={() => {
            if (!checkoutLoading) setShowPayment(false);
          }}
        >
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="payment-close"
              onClick={() => setShowPayment(false)}
              disabled={checkoutLoading}
              aria-label="Close payment"
              type="button"
            >
              <X size={21} />
            </button>

            <div className="payment-header">
              <span className="payment-eyebrow">
                <ShieldCheck size={15} /> UPI CHECKOUT
              </span>
              <h2 id="payment-title">Pay with UPI</h2>
              <p>
                Scan the QR code using your UPI app. Verify the recipient
                and amount before paying.
              </p>
            </div>

            <div className="payment-main">
              <div className="payment-qr-frame">
                <QRCodeSVG
                  value={`upi://pay?pa=divitparekh%40fam&pn=${encodeURIComponent(
                    "BigBite Canteen"
                  )}&am=${Number(cartTotal).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
                    "BigBite canteen order"
                  )}`}
                  size={210}
                  level="M"
                  includeMargin
                />
              </div>

              <div className="payment-amount">{formatINR(cartTotal)}</div>

              <div className="payment-recipient">
                <span className="payment-recipient-label">Paying to</span>
                <strong>BigBite Canteen</strong>
                <span className="payment-upi-id">divitparekh@fam</span>
              </div>

              <div className="payment-tip">
                <ShieldCheck size={17} />
                <span>
                  Check the recipient and amount in your UPI app. An entered
                  reference is not proof of payment; the canteen must verify it.
                </span>
              </div>
            </div>

            <form className="payment-form" onSubmit={submitPaymentReference}>
              <label
                htmlFor="payment-reference"
                className="payment-field-label"
              >
                Transaction reference / UTR
              </label>

              <input
                id="payment-reference"
                className="payment-reference-input"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Enter the UTR from your payment app"
                minLength={6}
                maxLength={100}
                required
                disabled={checkoutLoading}
                autoComplete="off"
              />

              <p className="payment-disclaimer">
                Your order remains pending verification until the canteen
                confirms that payment was received.
              </p>

              <button
                className="primary-button payment-submit"
                type="submit"
                disabled={checkoutLoading || cartCount === 0}
              >
                {checkoutLoading
                  ? "Submitting order..."
                  : "I've paid — submit order"}
                {!checkoutLoading && <span>→</span>}
              </button>

              <button
                className="payment-cancel"
                type="button"
                onClick={() => setShowPayment(false)}
                disabled={checkoutLoading}
              >
                Back to menu
              </button>
            </form>
          </section>
        </div>
      )}

      {authMode && (
        <div className="auth-overlay" onClick={closeAuth}>
          <div
            className="auth-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button auth-close"
              onClick={closeAuth}
              aria-label="Close authentication"
            >
              <X size={22} />
            </button>

            {authError && (
              <div className="notice auth-error" role="alert">
                {authError}
              </div>
            )}

            {authMode === "login" ? (
              <Login
                onSuccess={() => {
                  closeAuth();
                  setNotice("Welcome back to BigBite!");
                }}
                onRegister={() => openAuth("register")}
              />
            ) : (
              <Register
                onSuccess={() => {
                  closeAuth();
                  setNotice("Your student account has been created.");
                }}
                onLogin={() => openAuth("login")}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
