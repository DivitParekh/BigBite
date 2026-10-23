
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

const ORDERS_COLLECTION = "orders";
const MENU_COLLECTION = "menuItems";

export const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
];

export const PAYMENT_STATUSES = [
  "Pending Verification",
  "Paid",
  "Rejected",
];

/**
 * Create an order after the student has entered a UPI transaction reference.
 */
export async function createOrder(
  user,
  cartItems,
  notes = "",
  paymentReference = ""
) {
  if (!user?.uid) {
    throw new Error("Please log in before placing your order.");
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Your cart is empty. Please add items before checkout.");
  }

  const reference = String(paymentReference).trim();

  if (reference.length < 6 || reference.length > 100) {
    throw new Error("Please enter a valid UPI transaction reference.");
  }

  // Validate and combine duplicate menu item IDs.
  const quantities = new Map();

  for (const item of cartItems) {
    const id = String(item?.id || "").trim();
    const quantity = Number(item?.quantity);

    if (!id) {
      throw new Error("An item in your cart is invalid. Please try again.");
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("One of your item quantities is invalid.");
    }

    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }

  const items = [];
  let total = 0;

  // Re-read menu prices from Firestore to avoid trusting browser prices.
  for (const [itemId, quantity] of quantities.entries()) {
    const menuRef = doc(db, MENU_COLLECTION, itemId);
    const menuSnapshot = await getDoc(menuRef);

    if (!menuSnapshot.exists()) {
      throw new Error(
        `A selected menu item no longer exists. Please refresh the menu and try again.`
      );
    }

    const menuItem = menuSnapshot.data();

    // Only reject an item when it is explicitly marked unavailable.
    // This allows older menu documents without an "available" field.
    if (menuItem.available === false) {
      throw new Error(
        `${menuItem.name || "A selected item"} is currently unavailable. Please remove it from your cart.`
      );
    }

    const price = Number(menuItem.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        `The price for ${menuItem.name || "a selected item"} is invalid. Please contact the canteen administrator.`
      );
    }

    const itemTotal = price * quantity;
    total += itemTotal;

    items.push({
      id: itemId,
      name: String(menuItem.name || "Menu item"),
      price,
      quantity,
      subtotal: itemTotal,
      category: String(menuItem.category || ""),
      emoji: String(menuItem.emoji || "🍽️"),
    });
  }

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("The order total is invalid. Please check your cart.");
  }

  const orderData = {
    userId: user.uid,
    customerName: String(
      user.displayName || user.email || "Student"
    ),
    customerEmail: String(user.email || ""),
    items,
    total,
    notes: String(notes || "").trim().slice(0, 250),
    status: "Pending",
    paymentStatus: "Pending Verification",
    paymentMethod: "UPI QR",
    paymentReference: reference,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const orderRef = await addDoc(
      collection(db, ORDERS_COLLECTION),
      orderData
    );

    return {
      id: orderRef.id,
      ...orderData,
    };
  } catch (error) {
    console.error("Firestore order creation failed:", error);

    if (
      error.code === "permission-denied" ||
      error.code === "firestore/permission-denied"
    ) {
      throw new Error(
        "Firestore rejected this order. Please check your Firestore security rules and make sure students are allowed to create their own orders."
      );
    }

    if (
      error.code === "unavailable" ||
      error.code === "firestore/unavailable"
    ) {
      throw new Error(
        "The canteen service is temporarily unavailable. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Unable to save your order. Please try again."
    );
  }
}

/**
 * Get a student's orders once.
 */
export async function getMyOrders(userId) {
  if (!userId) {
    throw new Error("User ID is required to retrieve orders.");
  }

  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((orderDoc) => ({
    id: orderDoc.id,
    ...orderDoc.data(),
  }));
}

/**
 * Subscribe to a student's orders for live status updates.
 * Returns an unsubscribe function.
 */
export function subscribeToMyOrders(userId, onOrders, onError) {
  if (!userId) {
    throw new Error("User ID is required to subscribe to orders.");
  }

  if (typeof onOrders !== "function") {
    throw new Error("An orders callback function is required.");
  }

  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      }));

      onOrders(orders);
    },
    (error) => {
      console.error("Student order subscription failed:", error);

      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}

/**
 * Get all orders. Use only in the administrator interface.
 */
export async function getAllOrders() {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((orderDoc) => ({
    id: orderDoc.id,
    ...orderDoc.data(),
  }));
}

/**
 * Subscribe to all orders for the administrator dashboard.
 * Firestore security rules must restrict this to administrators.
 */
export function subscribeToAllOrders(onOrders, onError) {
  if (typeof onOrders !== "function") {
    throw new Error("An orders callback function is required.");
  }

  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      }));

      onOrders(orders);
    },
    (error) => {
      console.error("Admin order subscription failed:", error);

      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}

/**
 * Update an order's preparation status.
 * Only an authorized administrator should be allowed by Firestore rules.
 */
export async function updateOrderStatus(orderId, status) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid order status.");
  }

  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    status,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Update payment verification status.
 * Only an authorized administrator should be allowed by Firestore rules.
 */
export async function updatePaymentStatus(orderId, paymentStatus) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new Error("Invalid payment status.");
  }

  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });

  return true;
}
