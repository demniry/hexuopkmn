// Supabase Edge Function: update-all-prices
// Cron job that updates market prices for all items with eBay queries
// Schedule: Run daily at 6:00 AM UTC
// Cron expression: 0 6 * * *

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

// Validate that the request comes from an authorized source (cron or service role)
function validateCronAuth(req: Request): void {
  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  // Allow requests with service role key (from Supabase cron or admin)
  if (authHeader === `Bearer ${serviceRoleKey}`) {
    return;
  }

  // Check for cron secret header (for external cron services)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const requestSecret = req.headers.get("x-cron-secret");
  if (cronSecret && requestSecret === cronSecret) {
    return;
  }

  throw new Error("Unauthorized: invalid credentials for cron job");
}

// Search for completed/sold items using eBay Finding API
async function searchSoldItems(query: string): Promise<number[]> {
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
    `&paginationInput.entriesPerPage=50` +
    `&sortOrder=EndTimeSoonest` +
    `&itemFilter(0).name=SoldItemsOnly` +
    `&itemFilter(0).value=true` +
    `&itemFilter(1).name=Currency` +
    `&itemFilter(1).value=EUR`;

  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const searchResult = data.findCompletedItemsResponse?.[0];

  if (!searchResult || searchResult.ack?.[0] !== "Success") {
    return [];
  }

  const items = searchResult.searchResult?.[0]?.item || [];

  const prices: number[] = items
    .filter((item: any) => item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__)
    .map((item: any) => parseFloat(item.sellingStatus[0].currentPrice[0].__value__))
    .filter((price: number) => !isNaN(price) && price > 0);

  return prices;
}

// Calculate median
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// Delay function to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate that this is an authorized cron/admin request
    validateCronAuth(req);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all items with ebay_query set
    const { data: items, error: fetchError } = await supabase
      .from("items")
      .select("id, ebay_query")
      .not("ebay_query", "is", null)
      .neq("ebay_query", "");

    if (fetchError) {
      throw new Error(`Failed to fetch items: ${fetchError.message}`);
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: "No items with eBay queries found", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${items.length} items to update`);

    let updated = 0;
    let errors = 0;

    // Process each item with a delay to avoid rate limiting
    for (const item of items) {
      try {
        console.log(`Updating item ${item.id}: ${item.ebay_query}`);

        const prices = await searchSoldItems(item.ebay_query);

        if (prices.length > 0) {
          const median = calculateMedian(prices);
          const min = Math.min(...prices);
          const max = Math.max(...prices);

          const { error: updateError } = await supabase
            .from("items")
            .update({
              market_price: Math.round(median * 100) / 100,
              market_price_min: Math.round(min * 100) / 100,
              market_price_max: Math.round(max * 100) / 100,
              market_price_sales_count: prices.length,
              market_price_updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          if (updateError) {
            console.error(`Failed to update item ${item.id}:`, updateError);
            errors++;
          } else {
            updated++;
            console.log(`Updated item ${item.id}: median=${median}, count=${prices.length}`);
          }
        } else {
          console.log(`No prices found for item ${item.id}`);
        }

        // Wait 1 second between requests to avoid rate limiting
        await delay(1000);

      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Price update completed",
        total: items.length,
        updated,
        errors,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
