import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getAllOrders, updatePaymentStatus } from "../../services/orderService";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const dateLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN");
};

export default function PaymentVerification() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("Pending Verification");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const allOrders = await getAllOrders();
      setOrders(allOrders);
    } catch (err) {
      console.error("Unable to load payment orders:", err);
      setError("Could not load orders. Check your admin access and Firestore rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleDecision(order, decision) {
    const action = decision === "Paid" ? "verify this payment" : "reject this payment";
    const reference = order.paymentReference || "No reference supplied";

    if (
      !window.confirm(
        `Are you sure you want to ${action}?\n\nOrder: ${order.id}\nAmount: ${money(order.total)}\nReference: ${reference}\n\nConfirm only after checking the actual UPI transaction.`
      )
    ) {
      return;
    }

    setBusyId(order.id);
    setError("");
    setNotice("");

    try {
      await updatePaymentStatus(order.id, decision);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, paymentStatus: decision } : item
        )
      );
      setNotice(
        decision === "Paid"
          ? `Payment verified for order ${order.id}.`
          : `Payment rejected for order ${order.id}.`
      );
    } catch (err) {
      console.error("Unable to update payment status:", err);
      setError(err.message || "Could not update payment status.");
    } finally {
      setBusyId("");
    }
  }

  const filteredOrders = orders
    .filter((order) => {
      if (filter === "All") return true;
      if (filter === "Pending Verification") {
        return order.paymentStatus === "Pending Verification";
      }
      return order.paymentStatus === filter;
    })
    .sort((a, b) => {
      const time = (value) =>
        value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
      return time(b.createdAt) - time(a.createdAt);
    });

  const pendingCount = orders.filter(
    (order) => order.paymentStatus === "Pending Verification"
  ).length;
  const paidCount = orders.filter((order) => order.paymentStatus === "Paid").length;
  const rejectedCount = orders.filter(
    (order) => order.paymentStatus === "Rejected"
  ).length;

  return (
    <main className="payment-verification-page">
      <header className="payment-page-heading">
        <div>
          <span className="section-kicker">ADMINISTRATION</span>
          <h1>Payment Verification</h1>
          <p>Review UPI references and reconcile payments against your receiving account.</p>
        </div>
        <button
          className="payment-refresh-button"
          onClick={loadOrders}
          disabled={loading || Boolean(busyId)}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div className="payment-stat-grid">
        <div className="payment-stat-card">
          <Clock3 size={21} />
          <span>Pending verification</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="payment-stat-card">
          <CheckCircle2 size={21} />
          <span>Verified payments</span>
          <strong>{paidCount}</strong>
        </div>
        <div className="payment-stat-card">
          <XCircle size={21} />
          <span>Rejected payments</span>
          <strong>{rejectedCount}</strong>
        </div>
      </div>

      {notice && <div className="payment-message success">{notice}</div>}
      {error && <div className="payment-message error">{error}</div>}

      <div className="payment-list-toolbar">
        <h2>Payment submissions</h2>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>Pending Verification</option>
          <option>Paid</option>
          <option>Rejected</option>
          <option>All</option>
        </select>
      </div>

      {loading ? (
        <div className="payment-empty-state">Loading payments…</div>
      ) : filteredOrders.length === 0 ? (
        <div className="payment-empty-state">
          <ShieldCheck size={34} />
          <h3>No payments in this view</h3>
          <p>New submissions will appear here when students submit their orders.</p>
        </div>
      ) : (
        <div className="payment-order-list">
          {filteredOrders.map((order) => (
            <article className="payment-order-card" key={order.id}>
              <div className="payment-order-top">
                <div>
                  <span className="payment-order-label">ORDER ID</span>
                  <strong className="payment-order-id">{order.id}</strong>
                  <span className="payment-order-date">{dateLabel(order.createdAt)}</span>
                </div>
                <span
                  className={`payment-status ${
                    order.paymentStatus === "Paid"
                      ? "paid"
                      : order.paymentStatus === "Rejected"
                        ? "rejected"
                        : "pending"
                  }`}
                >
                  {order.paymentStatus || "Unknown"}
                </span>
              </div>

              <div className="payment-order-details">
                <div>
                  <span>Student</span>
                  <strong>{order.customerName || "Name unavailable"}</strong>
                  <small>{order.customerEmail || order.userId || "No student ID"}</small>
                </div>
                <div>
                  <span>Order total</span>
                  <strong className="payment-order-total">{money(order.total)}</strong>
                </div>
              </div>

              <div className="payment-reference-box">
                <span>UPI transaction reference / UTR</span>
                <strong>{order.paymentReference || "No reference submitted"}</strong>
                <span>Recipient: divitparekh@fam</span>
              </div>

              {Array.isArray(order.items) && (
                <div className="payment-items">
                  {order.items.map((item, index) => (
                    <span key={`${item.itemId || item.name}-${index}`}>
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              )}

              {order.paymentStatus === "Pending Verification" && (
                <div className="payment-actions">
                  <button
                    className="payment-approve-button"
                    onClick={() => handleDecision(order, "Paid")}
                    disabled={Boolean(busyId)}
                  >
                    <CheckCircle2 size={16} />
                    {busyId === order.id ? "Updating…" : "Verify payment"}
                  </button>
                  <button
                    className="payment-reject-button"
                    onClick={() => handleDecision(order, "Rejected")}
                    disabled={Boolean(busyId)}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}

              {order.paymentStatus === "Pending Verification" && (
                <p className="payment-warning">
                  Check the successful transaction in your receiving UPI app before approving.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}