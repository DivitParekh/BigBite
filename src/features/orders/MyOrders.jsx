
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  Utensils,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { subscribeToMyOrders } from "../../services/orderService";

const ORDER_STEPS = [
  "Pending",
  "Preparing",
  "Ready for Pickup",
  "Completed",
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function OrderBadge({ status }) {
  const colors = {
    Pending: ["#fff5df", "#8a5b12"],
    Preparing: ["#f0eaff", "#6545a5"],
    "Ready for Pickup": ["#e7f1ff", "#2459a9"],
    Completed: ["#e8f7ef", "#176b46"],
    Cancelled: ["#fff0ed", "#a63828"],
    "Pending Verification": ["#fff5df", "#8a5b12"],
    Paid: ["#e8f7ef", "#176b46"],
    Rejected: ["#fff0ed", "#a63828"],
  };

  const [background, color] = colors[status] || [
    "#f1efeb",
    "#514b45",
  ];

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "7px 11px",
        borderRadius: "20px",
        background,
        color,
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {status || "Unknown"}
    </span>
  );
}

function OrderProgress({ status }) {
  if (status === "Cancelled") {
    return (
      <div
        style={{
          padding: "13px",
          borderRadius: "10px",
          background: "#fff0ed",
          color: "#a63828",
          fontSize: "13px",
        }}
      >
        <AlertCircle
          size={17}
          style={{ verticalAlign: "middle", marginRight: "7px" }}
        />
        This order has been cancelled. Please contact the canteen if you
        need assistance.
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.indexOf(status);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "8px",
        marginTop: "18px",
      }}
    >
      {ORDER_STEPS.map((step, index) => {
        const completed =
          currentIndex >= 0 && index <= currentIndex;

        const Icon =
          index === 0
            ? Clock
            : index === 1
              ? Utensils
              : index === 2
                ? PackageCheck
                : CheckCircle2;

        return (
          <div
            key={step}
            style={{
              textAlign: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                margin: "0 auto 8px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: completed ? "#e8f7ef" : "#f1efeb",
                color: completed ? "#176b46" : "#99918a",
              }}
            >
              <Icon size={17} />
            </div>

            <div
              style={{
                fontSize: "11px",
                lineHeight: 1.4,
                fontWeight: completed ? 700 : 500,
                color: completed ? "#176b46" : "#77716b",
                overflowWrap: "anywhere",
              }}
            >
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setOrders([]);
      setLoadingOrders(false);
      setError("Please log in to view your orders.");
      return;
    }

    setLoadingOrders(true);
    setError("");

    const unsubscribe = subscribeToMyOrders(
      user.uid,
      (latestOrders) => {
        setOrders(latestOrders);
        setLoadingOrders(false);
        setError("");
      },
      (err) => {
        console.error("Student order tracking failed:", err);

        setError(
          err.code === "permission-denied"
            ? "You don't have permission to view these orders. Please check your account and Firestore rules."
            : "Unable to load your orders. Please check your connection."
        );

        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, authLoading]);

  const sortedOrders = [...orders].sort((a, b) => {
    const getTime = (value) => {
      if (!value) return 0;
      if (typeof value.toMillis === "function") return value.toMillis();

      const date = new Date(value).getTime();
      return Number.isNaN(date) ? 0 : date;
    };

    return getTime(b.createdAt) - getTime(a.createdAt);
  });

  return (
    <main
      style={{
        minHeight: "70vh",
        padding: "32px 20px 60px",
        background: "#f8f7f4",
        color: "#24211f",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: "28px" }}>
          <div
            style={{
              color: "#f46532",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "2px",
              marginBottom: "8px",
            }}
          >
            BIGBITE · YOUR ORDERS
          </div>

          <h1 style={{ fontSize: "32px", margin: 0 }}>
            My Orders
          </h1>

          <p
            style={{
              color: "#77716b",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Track your food, check your payment status, and see when your
            order is ready for pickup.
          </p>
        </header>

        {!authLoading && !user && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #eee7df",
              borderRadius: "16px",
              padding: "35px 20px",
              textAlign: "center",
            }}
          >
            <ShoppingBag size={38} color="#f46532" />
            <h2>Log in to view your orders</h2>
            <p style={{ color: "#77716b" }}>
              Your order history will appear here after you sign in.
            </p>
          </div>
        )}

        {error && user && (
          <div
            role="alert"
            style={{
              padding: "15px",
              borderRadius: "10px",
              background: "#fff0ed",
              color: "#a63828",
              marginBottom: "18px",
            }}
          >
            {error}
          </div>
        )}

        {user && loadingOrders && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#77716b",
            }}
          >
            <RefreshCw size={25} />
            <p>Loading your orders...</p>
          </div>
        )}

        {user &&
          !loadingOrders &&
          !error &&
          sortedOrders.length === 0 && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee7df",
                borderRadius: "16px",
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <ShoppingBag size={40} color="#f46532" />
              <h2>No orders yet</h2>
              <p style={{ color: "#77716b", lineHeight: 1.6 }}>
                Once you place an order from the BigBite menu, you can
                track it here.
              </p>
            </div>
          )}

        {user && !loadingOrders && sortedOrders.length > 0 && (
          <div style={{ display: "grid", gap: "20px" }}>
            {sortedOrders.map((order) => (
              <article
                key={order.id}
                style={{
                  background: "#fff",
                  border: "1px solid #eee7df",
                  borderRadius: "16px",
                  padding: "22px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                    paddingBottom: "18px",
                    borderBottom: "1px solid #f0ebe5",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#77716b",
                        fontWeight: 700,
                        letterSpacing: "1px",
                      }}
                    >
                      ORDER ID
                    </div>

                    <strong
                      style={{
                        display: "block",
                        margin: "5px 0",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {order.id}
                    </strong>

                    <span
                      style={{ fontSize: "12px", color: "#77716b" }}
                    >
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <OrderBadge status={order.status} />
                </div>

                <div style={{ padding: "18px 0" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                    Order progress
                  </h3>

                  <OrderProgress status={order.status} />
                </div>

                <div
                  style={{
                    background: "#f8f7f4",
                    borderRadius: "10px",
                    padding: "15px",
                    marginBottom: "18px",
                  }}
                >
                  <strong style={{ fontSize: "14px" }}>
                    Items in your order
                  </strong>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      marginTop: "12px",
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

                  <div
                    style={{
                      borderTop: "1px solid #e8dfd5",
                      marginTop: "14px",
                      paddingTop: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <strong>Total</strong>
                    <strong style={{ fontSize: "18px" }}>
                      {formatMoney(order.total)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "13px",
                        fontWeight: 700,
                        marginBottom: "9px",
                      }}
                    >
                      <CreditCard size={16} color="#f46532" />
                      Payment status
                    </div>

                    <OrderBadge
                      status={order.paymentStatus || "Unknown"}
                    />

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#77716b",
                        lineHeight: 1.5,
                        marginBottom: 0,
                      }}
                    >
                      The canteen must verify receipt of your payment.
                    </p>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        marginBottom: "9px",
                      }}
                    >
                      Payment reference
                    </div>

                    <span
                      style={{
                        fontSize: "12px",
                        color: "#77716b",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {order.paymentReference || "Not provided"}
                    </span>
                  </div>
                </div>

                {order.notes && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "12px",
                      background: "#fffaf6",
                      borderLeft: "3px solid #f46532",
                      fontSize: "13px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <strong>Your instructions:</strong> {order.notes}
                  </div>
                )}

                {order.status === "Ready for Pickup" && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "10px",
                      background: "#e7f1ff",
                      color: "#2459a9",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <PackageCheck
                      size={18}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "8px",
                      }}
                    />
                    Your order is ready! Please collect it from the canteen
                    counter.
                  </div>
                )}

                {order.status === "Completed" && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "10px",
                      background: "#e8f7ef",
                      color: "#176b46",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2
                      size={18}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "8px",
                      }}
                    />
                    Order completed. Thank you for choosing BigBite!
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
