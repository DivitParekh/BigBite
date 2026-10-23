
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

const MENU_COLLECTION = "menuItems";

const allowedCategories = [
  "Snacks",
  "Meals",
  "Beverages",
  "Fast Food",
];

function validateMenuItem(item) {
  if (!item.name?.trim()) {
    throw new Error("Food name is required.");
  }

  if (!allowedCategories.includes(item.category)) {
    throw new Error("Please select a valid food category.");
  }

  const price = Number(item.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Price must be greater than zero.");
  }

  if (typeof item.isVeg !== "boolean") {
    throw new Error("Please select whether the item is vegetarian.");
  }

  return {
    name: item.name.trim(),
    description: (item.description ?? "").trim(),
    price,
    category: item.category,
    imageUrl: (item.imageUrl ?? "").trim(),
    available: item.available !== false,
    isVeg: item.isVeg,
    emoji: (item.emoji ?? "🍽️").trim() || "🍽️",
    color: (item.color ?? "peach").trim() || "peach",
    time: (item.time ?? "10-15 min").trim() || "10-15 min",
    tag: (item.tag ?? "").trim(),
  };
}

// Get available items for the student-facing menu.
export async function getMenuItems() {
  const menuQuery = query(
    collection(db, MENU_COLLECTION),
    where("available", "==", true),
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(menuQuery);

  return snapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      name: data.name ?? "Unnamed item",
      description: data.description ?? "",
      category: data.category ?? "Snacks",
      price: Number(data.price ?? 0),
      imageUrl: data.imageUrl ?? "",
      available: data.available === true,
      isVeg: data.isVeg ?? true,
      emoji: data.emoji ?? "🍽️",
      color: data.color ?? "peach",
      time: data.time ?? "10-15 min",
      tag: data.tag ?? "",
    };
  });
}

// Get every item, including unavailable items.
// Use this in the admin dashboard.
export async function getAllMenuItems() {
  const menuQuery = query(
    collection(db, MENU_COLLECTION),
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(menuQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

// Create a menu item.
export async function createMenuItem(item) {
  const data = validateMenuItem(item);

  const documentRef = await addDoc(
    collection(db, MENU_COLLECTION),
    {
      ...data,
      createdAt: serverTimestamp(),
    }
  );

  return documentRef.id;
}

// Update an existing menu item.
export async function updateMenuItem(itemId, changes) {
  if (!itemId) {
    throw new Error("Menu item ID is required.");
  }

  const data = validateMenuItem(changes);

  await updateDoc(doc(db, MENU_COLLECTION, itemId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Change only the item's availability.
export async function setMenuItemAvailability(itemId, available) {
  if (!itemId) {
    throw new Error("Menu item ID is required.");
  }

  if (typeof available !== "boolean") {
    throw new Error("Availability must be true or false.");
  }

  await updateDoc(doc(db, MENU_COLLECTION, itemId), {
    available,
    updatedAt: serverTimestamp(),
  });
}

// Delete a menu item permanently.
export async function deleteMenuItem(itemId) {
  if (!itemId) {
    throw new Error("Menu item ID is required.");
  }

  await deleteDoc(doc(db, MENU_COLLECTION, itemId));
}
