import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/dashboard-store";
import { getProductCount, searchProducts } from "@/lib/woocommerce";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}` || auth === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agentId = req.nextUrl.searchParams.get("agentId");
  const action = req.nextUrl.searchParams.get("action");
  const query = req.nextUrl.searchParams.get("q");

  if (!agentId || !action) {
    return NextResponse.json({ error: "agentId and action required" }, { status: 400 });
  }

  const agent = await getAgent(agentId);
  if (!agent?.woocommerce?.enabled) {
    return NextResponse.json({ error: "WooCommerce not configured" }, { status: 400 });
  }

  const config = {
    siteUrl: agent.woocommerce.siteUrl,
    consumerKey: agent.woocommerce.consumerKey,
    consumerSecret: agent.woocommerce.consumerSecret,
  };

  try {
    if (action === "count") {
      const count = await getProductCount(config);
      return NextResponse.json({ count });
    }
    if (action === "search" && query) {
      const products = await searchProducts(config, query);
      return NextResponse.json({ products });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
