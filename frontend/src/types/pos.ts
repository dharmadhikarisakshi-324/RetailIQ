export interface Product {
  id: number;
  product_code: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  price: number;
  is_active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  customer_code?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  total_amount: number;
  status: string;
  created_at?: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_method?: string;
  status?: string;
}

export interface ReceiptData {
  order: Order;
  customer?: Customer | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  payment?: Payment;
}