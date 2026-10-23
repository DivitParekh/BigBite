
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

initializeApp({
  credential: cert(serviceAccount),
});




const db = getFirestore();

const menuItems = [
  {
    id: "veg-sandwich",
    name: "Veg Sandwich",
    description: "Fresh vegetable sandwich",
    price: 60,
    category: "Snacks",
    emoji: "🥪",
    isVeg: true,
    time: "5-10 min",
    tag: "Bestseller",
  },
  {
    id: "vada-pav",
    name: "Vada Pav",
    description: "Mumbai-style vada pav",
    price: 20,
    category: "Snacks",
    emoji: "🍔",
    isVeg: true,
    time: "5 min",
    tag: "Popular",
  },
  {
    id: "samosa",
    name: "Samosa",
    description: "Crispy potato-filled samosa",
    price: 20,
    category: "Snacks",
    emoji: "🥟",
    isVeg: true,
    time: "5 min",
    tag: "",
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa",
    description: "Crispy dosa with potato masala",
    price: 70,
    category: "Meals",
    emoji: "🥞",
    isVeg: true,
    time: "15 min",
    tag: "",
  },
  {
    id: "veg-thali",
    name: "Veg Thali",
    description: "A filling Indian vegetarian meal",
    price: 100,
    category: "Meals",
    emoji: "🍛",
    isVeg: true,
    time: "15-20 min",
    tag: "Popular",
  },
  {
    id: "cold-coffee",
    name: "Cold Coffee",
    description: "Chilled creamy coffee",
    price: 50,
    category: "Beverages",
    emoji: "🥤",
    isVeg: true,
    time: "5 min",
    tag: "",
  },
  {
    id: "lemon-juice",
    name: "Fresh Lemon Juice",
    description: "Refreshing lemon drink",
    price: 30,
    category: "Beverages",
    emoji: "🍋",
    isVeg: true,
    time: "5 min",
    tag: "",
  },
  {
    id: "veg-burger",
    name: "Veg Burger",
    description: "Vegetable patty burger with sauces",
    price: 80,
    category: "Fast Food",
    emoji: "🍔",
    isVeg: true,
    time: "10 min",
    tag: "Popular",
  },
  {
    id: "french-fries",
    name: "French Fries",
    description: "Crispy golden potato fries",
    price: 60,
    category: "Fast Food",
    emoji: "🍟",
    isVeg: true,
    time: "10 min",
    tag: "",
  },
];

async function seedMenu() {
  let added = 0;
  let skipped = 0;

  for (const item of menuItems) {
    const { id, ...data } = item;
    const itemRef = db.collection("menuItems").doc(id);
    const existing = await itemRef.get();

    if (existing.exists) {
      console.log(`Skipped existing item: ${data.name}`);
      skipped++;
      continue;
    }

    await itemRef.set({
      ...data,
      imageUrl: "",
      color: "peach",
      available: true,
      createdAt: Timestamp.now(),
    });

    console.log(`Added: ${data.name}`);
    added++;
  }

  console.log(
    `Menu seeding complete. Added: ${added}, skipped: ${skipped}`
  );
}

seedMenu().catch((error) => {
  console.error("Menu seeding failed:", error);
  process.exitCode = 1;
});
