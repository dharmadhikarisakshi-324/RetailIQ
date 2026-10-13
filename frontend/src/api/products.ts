import apiClient from './client'

// ============================================================
// PRODUCT INTERFACE
// ============================================================

export interface Product {
  id: number
  product_code: string
  barcode: string | null
  name: string
  description: string | null
  category_id: number | null
  price: number
  supplier: string | null
  aisle: string | null
  shelf: string | null
  is_active: boolean
}

// ============================================================
// GET ALL PRODUCTS
// ============================================================

export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/api/products', {
    params: {
      skip: 0,
      limit: 5000,
    },
  })

  return response.data
}

// ============================================================
// GET PRODUCT BY ID
// ============================================================

export async function getProduct(
  productId: number,
): Promise<Product> {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('Invalid product ID.')
  }

  const response = await apiClient.get<Product>(
    `/api/products/${productId}`,
  )

  return response.data
}

// ============================================================
// FIND PRODUCT BY BARCODE
// ============================================================

export function findProductByBarcode(
  products: Product[],
  barcode: string,
): Product | undefined {
  const normalizedBarcode = barcode.trim()

  if (!normalizedBarcode) {
    return undefined
  }

  return products.find(
    (product) =>
      product.is_active &&
      product.barcode?.trim() === normalizedBarcode,
  )
}

// ============================================================
// SEARCH PRODUCTS
// ============================================================

export function searchProducts(
  products: Product[],
  query: string,
): Product[] {
  const normalizedQuery = query.trim().toLowerCase()

  return products.filter((product) => {
    if (!product.is_active) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.product_code.toLowerCase().includes(normalizedQuery) ||
      (product.barcode ?? '').toLowerCase().includes(normalizedQuery) ||
      (product.description ?? '').toLowerCase().includes(normalizedQuery)
    )
  })
}

// ============================================================
// UPDATE PRODUCT
// ============================================================

export async function updateProduct(
  productId: number,
  productData: Partial<Omit<Product, 'id'>>,
): Promise<Product> {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('Invalid product ID.')
  }

  const response = await apiClient.put<Product>(
    `/api/products/${productId}`,
    productData,
  )

  return response.data
}

// ============================================================
// DELETE PRODUCT
// ============================================================

export async function deleteProduct(
  productId: number,
): Promise<void> {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('Invalid product ID.')
  }

  await apiClient.delete(`/api/products/${productId}`)
}