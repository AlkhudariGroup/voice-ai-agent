/**
 * WooCommerce REST API Client
 */

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  stock_quantity?: number;
  categories?: { id: number; name: string }[];
}

export interface WooCommerceOrder {
  id: number;
  status: string;
  total: string;
  date_created: string;
  customer_id?: number;
}

export interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

function getAuthHeader(config: WooCommerceConfig): string {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  return `Basic ${auth}`;
}

export async function fetchProducts(
  config: WooCommerceConfig,
  params?: { per_page?: number; search?: string; category?: string }
): Promise<WooCommerceProduct[]> {
  const base = config.siteUrl.replace(/\/$/, "");
  const url = new URL(`${base}/wp-json/wc/v3/products`);
  if (params?.per_page) url.searchParams.set("per_page", String(params.per_page));
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.category) url.searchParams.set("category", params.category);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(config),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
  return res.json();
}

export async function getProductCount(config: WooCommerceConfig): Promise<number> {
  const base = config.siteUrl.replace(/\/$/, "");
  const url = new URL(`${base}/wp-json/wc/v3/products`);
  url.searchParams.set("per_page", "1");
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(config),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
  const total = res.headers.get("x-wp-total");
  return total ? parseInt(total, 10) : 0;
}

export async function searchProducts(
  config: WooCommerceConfig,
  query: string,
  limit = 10
): Promise<WooCommerceProduct[]> {
  return fetchProducts(config, { search: query, per_page: limit });
}
