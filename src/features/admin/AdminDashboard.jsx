
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UtensilsCrossed,
  IndianRupee,
  Search,
  RefreshCw,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Leaf,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  PackageCheck,
  ClipboardList,
  Truck,
  UserRound,
  CreditCard,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setMenuItemAvailability,
} from "../../services/menuService";

import {
  ORDER_STATUSES,
  subscribeToAllOrders,
  updateOrderStatus,
} from "../../services/orderService";

const categories = ["Snacks", "Meals", "Beverages", "Fast Food"];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Snacks",
  imageUrl: "",
  available: true,
  isVeg: true,
  emoji: "🍽️",
  color: "peach",
  time: "10-15 min",
  tag: "",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8f7f4",
    color: "#24211f",
    padding: "28px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  brand: {
    color: "#f46532",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "2px",
    marginBottom: "8px",
  },
  heading: {
    fontSize: "30px",
    margin: 0,
  },
  subtitle: {
    color: "#77716b",
    marginTop: "8px",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  button: {
    border: "1px solid #e8dfd5",
    borderRadius: "10px",
    background: "#fff",
    color: "#292521",
    padding: "11px 15px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "13px",
  },
  primaryButton: {
    border: "1px solid #f46532",
    borderRadius: "10px",
    background: "#f46532",
    color: "#fff",
    padding: "12px 16px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 700,
    fontSize: "13px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "26px",
  },
  card: {
    background: "#fff",
    border: "1px solid #eee7df",
    borderRadius: "16px",
    padding: "22px",
  },
  statLabel: {
    color: "#77716b",
    fontSize: "13px",
    marginBottom: "14px",
  },
  statValue: {
    fontSize: "30px",
    fontWeight: 750,
    margin: 0,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
  },
  search: {
    padding: "12px 14px",
    border: "1px solid #e8dfd5",
    borderRadius: "10px",
    background: "#fff",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    fontSize: "14px",
    outlineColor: "#f46532",
  },
  tableWrap: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "920px",
  },
  th: {
    color: "#77716b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    padding: "14px 12px",
    borderBottom: "1px solid #eee7df",
  },
  td: {
    padding: "15px 12px",
    borderBottom: "1px solid #f0ebe5",
    fontSize: "13px",
    verticalAlign: "middle",
  },
  message: {
    textAlign: "center",
    padding: "35px 18px",
    color: "#77716b",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "7px",
    color: "#39332f",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #e5ddd4",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    outlineColor: "#f46532",
  },
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.card}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        <span style={styles.statLabel}>{label}</span>

        <span
          style={{
            display: "inline-flex",
            padding: "10px",
            borderRadius: "10px",
            background: `${color}18`,
            color,
          }}
        >
          <Icon size={21} />
        </span>
      </div>

      <p style={styles.statValue}>{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }) {
  const colors = {
    Pending: ["#fff5df", "#8a5b12"],
    Preparing: ["#f0eaff", "#6545a5"],
    "Ready for Pickup": ["#e7f1ff", "#2459a9"],
    Completed: ["#e8f7ef", "#176b46"],
    Cancelled: ["#fff0ed", "#a63828"],
    Paid: ["#e8f7ef", "#176b46"],
    Rejected: ["#fff0ed", "#a63828"],
    "Pending Verification": ["#fff5df", "#8a5b12"],
  };

  const [background, color] = colors[status] || [
    "#f1efeb",
    "#514b45",
  ];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 10px",
        borderRadius: "20px",
        background,
        color,
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {status || "Unknown"}
    </span>
  );
}

export default function AdminDashboard() {
  const {
    user,
    profile,
    loading: authLoading,
    isAdmin,
  } = useAuth();

  // Menu state
  const [items, setItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [changingId, setChangingId] = useState(null);

  // Order state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("All");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const authorizedAdmin =
    Boolean(user && isAdmin && profile?.uid === user.uid);

  // Load menu items
  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setError("");

    try {
      const menuItems = await getAllMenuItems();
      setItems(menuItems);
    } catch (err) {
      console.error("Admin menu loading failed:", err);

      setError(
        err.code === "permission-denied"
          ? "Firestore denied access to the menu. Check your admin permissions."
          : "Unable to load menu items. Check your connection and Firestore rules."
      );
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (authorizedAdmin) {
      loadMenu();
    } else {
      setMenuLoading(false);
    }
  }, [authLoading, authorizedAdmin, loadMenu]);

  // Listen to all orders in real time.
  useEffect(() => {
    if (authLoading) return;

    if (!authorizedAdmin) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");

    const unsubscribe = subscribeToAllOrders(
      (latestOrders) => {
        setOrders(latestOrders);
        setOrdersLoading(false);
        setOrdersError("");
      },
      (err) => {
        console.error("Order listener failed:", err);

        setOrdersError(
          err.code === "permission-denied"
            ? "Firestore denied access to orders. Check the admin order read rules."
            : "Unable to load orders. Check your connection and try again."
        );

        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, authorizedAdmin]);

  // Menu calculations
  const availableItems = items.filter(
    (item) => item.available === true
  );

  const unavailableItems = items.filter(
    (item) => item.available !== true
  );

  const averagePrice = items.length
    ? items.reduce(
        (total, item) => total + (Number(item.price) || 0),
        0
      ) / items.length
    : 0;

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const text = [
        item.name,
        item.category,
        item.description,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [items, search]);

  // Order calculations
  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const preparingOrders = orders.filter(
    (order) => order.status === "Preparing"
  ).length;

  const readyOrders = orders.filter(
    (order) => order.status === "Ready for Pickup"
  ).length;

  const pendingPayments = orders.filter(
    (order) => order.paymentStatus === "Pending Verification"
  ).length;

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        orderFilter === "All" || order.status === orderFilter;

      const searchableText = [
        order.id,
        order.customerName,
        order.customerEmail,
        order.paymentReference,
        order.userId,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(term);
    });
  }, [orders, orderFilter, orderSearch]);

  // Menu form functions
  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function openEditForm(item) {
    setEditingId(item.id);

    setForm({
      ...emptyForm,
      ...item,
      price: String(item.price ?? ""),
      available: item.available === true,
      isVeg: item.isVeg !== false,
    });

    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError("Please enter a food name.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      setError("Enter a valid price greater than zero.");
      return;
    }

    if (!categories.includes(form.category)) {
      setError("Please select a valid category.");
      return;
    }

    const itemData = {
      ...form,
      name: form.name.trim(),
      price: Number(form.price),
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateMenuItem(editingId, itemData);
        setNotice("Food item updated successfully.");
      } else {
        await createMenuItem(itemData);
        setNotice("New food item added successfully.");
      }

      setFormOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadMenu();
    } catch (err) {
      console.error("Saving menu item failed:", err);

      setError(
        err.code === "permission-denied"
          ? "Firestore denied this change. Check your admin write rules."
          : err.message || "Unable to save the food item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability(item) {
    setError("");
    setNotice("");
    setChangingId(item.id);

    try {
      await setMenuItemAvailability(item.id, !item.available);

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, available: !item.available }
            : entry
        )
      );

      setNotice(
        `${item.name} is now ${
          item.available ? "unavailable" : "available"
        }.`
      );
    } catch (err) {
      console.error("Changing availability failed:", err);

      setError(
        err.code === "permission-denied"
          ? "Firestore denied this change. Check your admin write rules."
          : err.message || "Unable to update availability."
      );
    } finally {
      setChangingId(null);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.name}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setDeletingId(item.id);

    try {
      await deleteMenuItem(item.id);

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id)
      );

      setNotice(`${item.name} was deleted.`);
    } catch (err) {
      console.error("Deleting menu item failed:", err);

      setError(
        err.code === "permission-denied"
          ? "Firestore denied deletion. Check your admin write rules."
          : err.message || "Unable to delete this food item."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Order status update
  async function handleOrderStatusChange(order, newStatus) {
    if (!authorizedAdmin) {
      setOrdersError("Administrator access is required.");
      return;
    }

    if (
      !ORDER_STATUSES.includes(newStatus) ||
      newStatus === order.status
    ) {
      return;
    }

    if (
      order.status === "Completed" ||
      order.status === "Cancelled"
    ) {
      setOrdersError(
        "Completed and cancelled orders cannot be changed from this dashboard."
      );
      return;
    }

    const confirmed = window.confirm(
      `Update order ${order.id}?\n\n` +
        `Current status: ${order.status}\n` +
        `New status: ${newStatus}`
    );

    if (!confirmed) return;

    setUpdatingOrderId(order.id);
    setOrdersError("");
    setError("");
    setNotice("");

    try {
      await updateOrderStatus(order.id, newStatus);

      setNotice(
        `Order ${order.id} updated to "${newStatus}".`
      );

      // The Firestore subscription refreshes the order automatically.
    } catch (err) {
      console.error("Order status update failed:", err);

      setOrdersError(
        err.code === "permission-denied"
          ? "Firestore denied this update. Check the admin order update rules."
          : err.message || "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (authLoading) {
    return (
      <main style={styles.page}>
        <div style={styles.message}>
          Checking administrator access...
        </div>
      </main>
    );
  }

  if (!authorizedAdmin) {
    return (
      <main style={styles.page}>
        <div
          style={{
            ...styles.card,
            ...styles.message,
            maxWidth: "520px",
            margin: "80px auto",
          }}
        >
          <ShieldAlert size={42} color="#f46532" />
          <h2>Admin access required</h2>
          <p>
            Please sign in with an authorized BigBite administrator account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Dashboard header */}
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>BIGBITE ADMIN</div>
            <h1 style={styles.heading}>Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome, {profile?.name || user.email || "Admin"}.
              Manage your canteen menu and incoming orders here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadMenu();
              setOrdersError("");
            }}
            disabled={menuLoading}
            style={{
              ...styles.button,
              opacity: menuLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} />
            {menuLoading ? "Refreshing..." : "Refresh menu"}
          </button>
        </header>

        {/* General notices */}
        {notice && (
          <div
            role="status"
            style={{
              padding: "13px 15px",
              marginBottom: "18px",
              borderRadius: "10px",
              background: "#e8f7ef",
              color: "#176b46",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <CheckCircle2 size={18} />
            <span style={{ flex: 1 }}>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
              style={{ ...styles.button, padding: "5px" }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "13px 15px",
              marginBottom: "18px",
              borderRadius: "10px",
              background: "#fff0ed",
              color: "#a63828",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <ShieldAlert size={18} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              style={{ ...styles.button, padding: "5px" }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Menu statistics */}
        <section style={styles.stats}>
          <StatCard
            icon={UtensilsCrossed}
            label="Total menu items"
            value={items.length}
            color="#f46532"
          />

          <StatCard
            icon={CheckCircle2}
            label="Available items"
            value={availableItems.length}
            color="#21865b"
          />

          <StatCard
            icon={XCircle}
            label="Unavailable items"
            value={unavailableItems.length}
            color="#c14e4e"
          />

          <StatCard
            icon={IndianRupee}
            label="Average menu price"
            value={formatMoney(averagePrice)}
            color="#7662c9"
          />
        </section>

        {/* Order management */}
        <section
          style={{
            ...styles.card,
            marginBottom: "26px",
          }}
        >
          <div style={styles.sectionHeader}>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                }}
              >
                <ClipboardList size={23} color="#f46532" />
                Order Management
              </h2>

              <p style={styles.subtitle}>
                Monitor incoming orders and update their preparation progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOrdersError("");
                setOrdersLoading(true);
                // The live Firestore subscription will supply the latest data.
                // Reloading the page is not necessary.
                setTimeout(() => setOrdersLoading(false), 1200);
              }}
              style={styles.button}
            >
              <RefreshCw size={15} />
              Refresh view
            </button>
          </div>

          <section style={styles.stats}>
            <StatCard
              icon={Clock}
              label="Pending orders"
              value={pendingOrders}
              color="#c17b19"
            />

            <StatCard
              icon={UtensilsCrossed}
              label="Preparing"
              value={preparingOrders}
              color="#7662c9"
            />

            <StatCard
              icon={Truck}
              label="Ready for pickup"
              value={readyOrders}
              color="#21865b"
            />

            <StatCard
              icon={CreditCard}
              label="Payments awaiting verification"
              value={pendingPayments}
              color="#c14e4e"
            />
          </section>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: "1 1 260px",
              }}
            >
              <Search size={17} color="#77716b" />

              <input
                type="search"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search order ID, student, email, or UTR..."
                aria-label="Search orders"
                style={{
                  ...styles.search,
                  width: "100%",
                }}
              />
            </div>

            <select
              value={orderFilter}
              onChange={(event) => setOrderFilter(event.target.value)}
              aria-label="Filter orders by status"
              style={{
                ...styles.search,
                flex: "0 1 220px",
              }}
            >
              <option value="All">All order statuses</option>

              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {ordersError && (
            <div
              role="alert"
              style={{
                padding: "13px 15px",
                marginBottom: "18px",
                borderRadius: "10px",
                background: "#fff0ed",
                color: "#a63828",
                overflowWrap: "anywhere",
              }}
            >
              <ShieldAlert
                size={17}
                style={{ verticalAlign: "middle", marginRight: "7px" }}
              />
              {ordersError}
            </div>
          )}

          {ordersLoading ? (
            <div style={styles.message}>
              <RefreshCw size={26} />
              <p>Loading orders from Firestore...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={styles.message}>
              <ClipboardList size={34} />
              <h3>No orders yet</h3>
              <p>
                Orders submitted by students will appear here.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={styles.message}>
              <Search size={30} />
              <h3>No matching orders</h3>
              <p>Try a different search or status filter.</p>

              <button
                type="button"
                style={styles.button}
                onClick={() => {
                  setOrderSearch("");
                  setOrderFilter("All");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {filteredOrders.map((order) => {
                const isTerminal = [
                  "Completed",
                  "Cancelled",
                ].includes(order.status);

                return (
                  <article
                    key={order.id}
                    style={{
                      border: "1px solid #eee7df",
                      borderRadius: "14px",
                      padding: "18px",
                      background: "#fff",
                      minWidth: 0,
                    }}
                  >
                    {/* Order heading */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: "#77716b",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                          }}
                        >
                          ORDER ID
                        </div>

                        <strong
                          style={{
                            display: "block",
                            overflowWrap: "anywhere",
                            margin: "5px 0",
                            fontSize: "14px",
                          }}
                        >
                          {order.id}
                        </strong>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#77716b",
                          }}
                        >
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <StatusBadge status={order.status} />
                    </div>

                    {/* Student and payment details */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            ...styles.statLabel,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "8px",
                          }}
                        >
                          <UserRound size={15} />
                          Student
                        </div>

                        <strong>
                          {order.customerName || "Name unavailable"}
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#77716b",
                            overflowWrap: "anywhere",
                            marginTop: "5px",
                          }}
                        >
                          {order.customerEmail ||
                            order.userId ||
                            "No student details"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            ...styles.statLabel,
                            marginBottom: "8px",
                          }}
                        >
                          Order total
                        </div>

                        <strong style={{ fontSize: "21px" }}>
                          {formatMoney(order.total)}
                        </strong>

                        <div style={{ marginTop: "8px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#77716b",
                              marginRight: "6px",
                            }}
                          >
                            Payment:
                          </span>

                          <StatusBadge status={order.paymentStatus} />
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div
                      style={{
                        background: "#f8f7f4",
                        padding: "14px",
                        borderRadius: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <strong style={{ fontSize: "13px" }}>
                        <PackageCheck
                          size={16}
                          style={{
                            verticalAlign: "middle",
                            marginRight: "7px",
                          }}
                        />
                        Items ordered
                      </strong>

                      <div
                        style={{
                          marginTop: "10px",
                          display: "grid",
                          gap: "8px",
                        }}
                      >
                        {(Array.isArray(order.items) ? order.items : []).map(
                          (item, index) => (
                            <div
                              key={`${item.itemId || item.name}-${index}`}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "12px",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ overflowWrap: "anywhere" }}>
                                {item.name || "Food item"} ×{" "}
                                {item.quantity || 1}
                              </span>

                              <strong style={{ whiteSpace: "nowrap" }}>
                                {formatMoney(
                                  item.subtotal ??
                                    Number(item.price || 0) *
                                      Number(item.quantity || 1)
                                )}
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderLeft: "3px solid #f46532",
                          marginBottom: "14px",
                          background: "#fffaf6",
                          fontSize: "13px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <strong>Special instructions:</strong>{" "}
                        {order.notes}
                      </div>
                    )}

                    {/* Payment reference */}
                    <div
                      style={{
                        border: "1px solid #eee7df",
                        borderRadius: "10px",
                        padding: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#77716b",
                          marginBottom: "5px",
                        }}
                      >
                        UPI transaction reference / UTR
                      </div>

                      <strong
                        style={{
                          fontSize: "13px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {order.paymentReference || "Not provided"}
                      </strong>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#77716b",
                          margin: "7px 0 0",
                        }}
                      >
                        Payment status is managed separately in Payment
                        Verification.
                      </p>
                    </div>

                    {/* Status update */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <label
                        htmlFor={`order-status-${order.id}`}
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        Update order status
                      </label>

                      <select
                        id={`order-status-${order.id}`}
                        value={order.status || "Pending"}
                        disabled={
                          Boolean(updatingOrderId) || isTerminal
                        }
                        onChange={(event) =>
                          handleOrderStatusChange(
                            order,
                            event.target.value
                          )
                        }
                        style={{
                          ...styles.search,
                          flex: "1 1 200px",
                          opacity:
                            updatingOrderId === order.id ? 0.6 : 1,
                        }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#77716b",
                          }}
                        >
                          Updating...
                        </span>
                      )}

                      {isTerminal && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#77716b",
                          }}
                        >
                          This order is closed.
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p
            style={{
              color: "#77716b",
              fontSize: "12px",
              marginTop: "18px",
            }}
          >
            Showing {filteredOrders.length} of {orders.length} orders.
            Updates are received from Firestore in real time.
          </p>
        </section>

        {/* Menu management */}
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={{ margin: 0, fontSize: "21px" }}>
                Menu management
              </h2>

              <p style={styles.subtitle}>
                Add, edit, and manage the food available at your canteen.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              style={styles.primaryButton}
            >
              <Plus size={17} />
              Add food item
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              maxWidth: "440px",
            }}
          >
            <Search size={17} color="#77716b" />

            <input
              type="search"
              placeholder="Search food, category, or description..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ ...styles.search, flex: 1, width: "100%" }}
              aria-label="Search menu items"
            />
          </div>

          {menuLoading ? (
            <div style={styles.message}>
              <RefreshCw size={25} />
              <p>Loading your menu...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={styles.message}>
              <UtensilsCrossed size={30} />
              <p>No menu items found in Firestore.</p>

              <button
                type="button"
                onClick={openAddForm}
                style={styles.primaryButton}
              >
                <Plus size={16} />
                Add your first food item
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={styles.message}>
              <Search size={28} />
              <p>No items match your search.</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Food item</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Availability</th>
                    <th style={styles.th}>Prep time</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              loading="lazy"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "10px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                width: "40px",
                                height: "40px",
                                flexShrink: 0,
                                borderRadius: "10px",
                                display: "grid",
                                placeItems: "center",
                                background: "#fff1e8",
                                fontSize: "22px",
                              }}
                            >
                              {item.emoji || "🍽️"}
                            </span>
                          )}

                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {item.name || "Unnamed item"}
                            </div>

                            {item.tag && (
                              <small style={{ color: "#f46532" }}>
                                {item.tag}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        {item.category || "Uncategorized"}
                      </td>

                      <td style={styles.td}>
                        {formatMoney(item.price)}
                      </td>

                      <td style={styles.td}>
                        {item.isVeg ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              color: "#21865b",
                            }}
                          >
                            <Leaf size={15} />
                            Veg
                          </span>
                        ) : (
                          "Non-veg"
                        )}
                      </td>

                      <td style={styles.td}>
                        <StatusBadge
                          status={
                            item.available ? "Available" : "Unavailable"
                          }
                        />
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Clock size={14} color="#77716b" />
                          {item.time || "Not set"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            title="Edit food item"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => openEditForm(item)}
                            style={styles.button}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            disabled={changingId === item.id}
                            title={
                              item.available
                                ? "Mark unavailable"
                                : "Mark available"
                            }
                            onClick={() => handleAvailability(item)}
                            style={{
                              ...styles.button,
                              color: item.available
                                ? "#a63828"
                                : "#21865b",
                              opacity:
                                changingId === item.id ? 0.5 : 1,
                            }}
                          >
                            {item.available ? (
                              <XCircle size={14} />
                            ) : (
                              <PackageCheck size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Delete food item"
                            aria-label={`Delete ${item.name}`}
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            style={{
                              ...styles.button,
                              color: "#b42318",
                              opacity:
                                deletingId === item.id ? 0.5 : 1,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              color: "#77716b",
              fontSize: "12px",
              marginTop: "18px",
            }}
          >
            Showing {filteredItems.length} of {items.length} menu items.
          </p>
        </section>

        {/* Add/edit menu form */}
        {formOpen && (
          <div
            role="presentation"
            onClick={closeForm}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(25, 21, 18, 0.55)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "18px",
              overflowY: "auto",
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="menu-form-title"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "680px",
                maxHeight: "92vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "18px",
                padding: "26px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <div style={styles.brand}>BIGBITE MENU</div>

                  <h2
                    id="menu-form-title"
                    style={{ margin: 0, fontSize: "24px" }}
                  >
                    {editingId ? "Edit food item" : "Add food item"}
                  </h2>

                  <p style={styles.subtitle}>
                    Enter the details that students will see on the menu.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close form"
                  onClick={closeForm}
                  disabled={saving}
                  style={styles.button}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "17px",
                  }}
                >
                  <Field label="Food name *">
                    <input
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      placeholder="e.g. Paneer Sandwich"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Price in ₹ *">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        updateField("price", event.target.value)
                      }
                      placeholder="e.g. 60"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Category *">
                    <select
                      required
                      value={form.category}
                      onChange={(event) =>
                        updateField("category", event.target.value)
                      }
                      style={styles.input}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Emoji">
                    <input
                      maxLength={12}
                      value={form.emoji}
                      onChange={(event) =>
                        updateField("emoji", event.target.value)
                      }
                      placeholder="🍽️"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Preparation time">
                    <input
                      maxLength={40}
                      value={form.time}
                      onChange={(event) =>
                        updateField("time", event.target.value)
                      }
                      placeholder="10-15 min"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Tag (optional)">
                    <input
                      maxLength={40}
                      value={form.tag}
                      onChange={(event) =>
                        updateField("tag", event.target.value)
                      }
                      placeholder="Bestseller, Popular..."
                      style={styles.input}
                    />
                  </Field>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Description">
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={form.description}
                        onChange={(event) =>
                          updateField("description", event.target.value)
                        }
                        placeholder="Describe the food item..."
                        style={{
                          ...styles.input,
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                      />
                    </Field>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Image URL (optional)">
                      <input
                        type="url"
                        value={form.imageUrl}
                        onChange={(event) =>
                          updateField("imageUrl", event.target.value)
                        }
                        placeholder="https://example.com/food.jpg"
                        style={styles.input}
                      />
                    </Field>
                  </div>

                  <Field label="Food type">
                    <select
                      value={form.isVeg ? "veg" : "nonveg"}
                      onChange={(event) =>
                        updateField("isVeg", event.target.value === "veg")
                      }
                      style={styles.input}
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="nonveg">Non-vegetarian</option>
                    </select>
                  </Field>

                  <Field label="Availability">
                    <select
                      value={form.available ? "available" : "unavailable"}
                      onChange={(event) =>
                        updateField(
                          "available",
                          event.target.value === "available"
                        )
                      }
                      style={styles.input}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </Field>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "26px",
                  }}
                >
                  <button
                    type="button"
                    disabled={saving}
                    onClick={closeForm}
                    style={styles.button}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      ...styles.primaryButton,
                      opacity: saving ? 0.65 : 1,
                    }}
                  >
                    <Save size={16} />
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Add food item"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
