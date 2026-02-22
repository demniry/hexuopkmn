// Supabase Edge Function: ebay-price
// Fetches sold listings from eBay and calculates median price

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Validate JWT from the Authorization header
async function validateAuth(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Invalid or expired token");
  }

  return user.id;
}

// Get OAuth2 access token from eBay
async function getEbayAccessToken(): Promise<string> {
  const clientId = Deno.env.get("EBAY_CLIENT_ID");
  const clientSecret = Deno.env.get("EBAY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("eBay credentials not configured");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get eBay access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Search for completed/sold items using eBay Browse API
async function searchSoldItems(query: string, accessToken: string): Promise<number[]> {
  const encodedQuery = encodeURIComponent(query);

  // Search on eBay France (EBAY_FR) for more relevant prices
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodedQuery}&limit=20&filter=deliveryCountry:FR,priceCurrency:EUR`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR",
      "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=FR",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("eBay API error:", error);

    // Try alternative: eBay Finding API for completed items
    return await searchCompletedItemsFindingAPI(query);
  }

  const data = await response.json();

  if (!data.itemSummaries || data.itemSummaries.length === 0) {
    // Fallback to Finding API
    return await searchCompletedItemsFindingAPI(query);
  }

  // Extract prices
  const prices: number[] = data.itemSummaries
    .filter((item: any) => item.price && item.price.value)
    .map((item: any) => parseFloat(item.price.value))
    .filter((price: number) => !isNaN(price) && price > 0);

  return prices;
}

// Fallback: Use eBay Finding API for completed items
async function searchCompletedItemsFindingAPI(query: string): Promise<number[]> {
  const clientId = Deno.env.get("EBAY_CLIENT_ID");

  if (!clientId) {
    throw new Error("eBay credentials not configured");
  }

  const encodedQuery = encodeURIComponent(query);

  const url = `https://svcs.ebay.com/services/search/FindingService/v1?` +
    `OPERATION-NAME=findCompletedItems` +
    `&SERVICE-VERSION=1.0.0` +
    `&SECURITY-APPNAME=${clientId}` +
    `&RESPONSE-DATA-FORMAT=JSON` +
    `&REST-PAYLOAD` +
    `&keywords=${encodedQuery}` +
    `&GLOBAL-ID=EBAY-FR` +
    `&paginationInput.entriesPerPage=20` +
    `&sortOrder=EndTimeSoonest` +
    `&itemFilter(0).name=SoldItemsOnly` +
    `&itemFilter(0).value=true` +
    `&itemFilter(1).name=Currency` +
    `&itemFilter(1).value=EUR`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`eBay Finding API error: ${error}`);
  }

  const data = await response.json();

  const searchResult = data.findCompletedItemsResponse?.[0];
  if (!searchResult || searchResult.ack?.[0] !== "Success") {
    console.error("Finding API response:", JSON.stringify(data));
    return [];
  }

  const items = searchResult.searchResult?.[0]?.item || [];

  const prices: number[] = items
    .filter((item: any) => item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__)
    .map((item: any) => parseFloat(item.sellingStatus[0].currentPrice[0].__value__))
    .filter((price: number) => !isNaN(price) && price > 0);

  return prices;
}

// Calculate median of an array of numbers
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    await validateAuth(req);

    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching eBay for: ${query}`);

    // Get access token
    const accessToken = await getEbayAccessToken();

    // Search for sold items
    const prices = await searchSoldItems(query.trim(), accessToken);

    if (prices.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No sold items found",
          query: query,
          salesCount: 0
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate statistics
    const median = calculateMedian(prices);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    console.log(`Found ${prices.length} prices. Median: ${median}, Min: ${min}, Max: ${max}`);

    return new Response(
      JSON.stringify({
        median: Math.round(median * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        salesCount: prices.length,
        query: query,
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const status = error.message?.includes("authorization") || error.message?.includes("token")
      ? 401
      : 500;
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
