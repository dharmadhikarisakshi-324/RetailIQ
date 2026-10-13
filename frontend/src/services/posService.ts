import axios from "axios";

import type {
  Customer,
  Order,
  Payment,
  Product,
} from "../types/pos";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8002/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("retailiq_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }

  return [];
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get("/products");

  return extractList<Product>(response.data).filter(
    (product) => product.is_active,
  );
}

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get("/customers");

  return extractList<Customer>(response.data);
}

export async function createOrder(payload: {
  customer_id?: number | null;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}): Promise<Order> {
  const response = await api.post("/orders", payload);

  return response.data as Order;
}

export async function createPayment(payload: {
  order_id: number;
  amount: number;
  payment_method: string;
  status: string;
}): Promise<Payment> {
  const response = await api.post("/payments", payload);

  return response.data as Payment;
}