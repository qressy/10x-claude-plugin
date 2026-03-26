#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const os_1 = __importDefault(require("os"));
const STORE_ID = process.env.STORE_ID; // undefined = platform mode
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";
const PLATFORM_MODE = !STORE_ID;
// ─── store_id property injected into every tool in platform mode ──────────────
const STORE_ID_PROP = {
    store_id: { type: "string", description: "Store ID to shop from (use list_stores to see all available stores)" },
};
// ─── Tool definitions ─────────────────────────────────────────────────────────
function withStoreId(required, props) {
    if (!PLATFORM_MODE)
        return { required, properties: props };
    return {
        required: ["store_id", ...required],
        properties: { ...STORE_ID_PROP, ...props },
    };
}
const TOOLS = [
    // Platform-mode-only: list all registered stores
    ...(PLATFORM_MODE ? [{
            name: "list_stores",
            description: "List all Shopify stores available on this platform. Call this first to find the store_id you need.",
            inputSchema: { type: "object", properties: {} },
        }] : []),
    {
        name: "browse_collections",
        description: "Browse all product collections/categories in the store",
        inputSchema: {
            type: "object",
            ...withStoreId([], {
                limit: { type: "number", description: "Number of collections to return (1-50)", default: 10 },
                cursor: { type: "string", description: "Pagination cursor for next page" },
            }),
        },
    },
    {
        name: "browse_products",
        description: "Browse products in the store, optionally filtered by collection",
        inputSchema: {
            type: "object",
            ...withStoreId([], {
                collection_handle: { type: "string", description: "Collection handle/slug to filter products by" },
                limit: { type: "number", description: "Number of products to return (1-50)", default: 12 },
                cursor: { type: "string", description: "Pagination cursor for next page" },
                sort_key: {
                    type: "string",
                    enum: ["TITLE", "PRICE", "BEST_SELLING", "CREATED"],
                    description: "Sort products by this field",
                    default: "TITLE",
                },
                country: { type: "string", description: "Country code to narrow results (e.g. US, IN, GB)" },
                area: { type: "string", description: "City or area to narrow results (e.g. Mumbai, New York)" },
            }),
        },
    },
    {
        name: "search_products",
        description: "Search for products by keyword or phrase. IMPORTANT: Display the raw formatted result exactly as returned — do not reformat into a table. Show all product images (![...](url)) and 'View Product' links as-is.",
        inputSchema: {
            type: "object",
            ...withStoreId(["query"], {
                query: { type: "string", description: "Search keyword or phrase" },
                limit: { type: "number", description: "Number of results to return (1-50)", default: 10 },
                country: { type: "string", description: "Country code to narrow results (e.g. US, IN, GB)" },
                area: { type: "string", description: "City or area to narrow results (e.g. Mumbai, New York)" },
            }),
        },
    },
    {
        name: "get_product_details",
        description: "Get detailed information about a specific product including all variants and pricing",
        inputSchema: {
            type: "object",
            ...withStoreId(["handle"], {
                handle: { type: "string", description: "Product handle/slug (e.g. 'classic-t-shirt')" },
            }),
        },
    },
    {
        name: "create_cart",
        description: "Create a new shopping cart, optionally with initial items",
        inputSchema: {
            type: "object",
            ...withStoreId([], {
                lines: {
                    type: "array",
                    description: "Optional initial items to add to the cart",
                    items: {
                        type: "object",
                        required: ["variant_id", "quantity"],
                        properties: {
                            variant_id: { type: "string", description: "Shopify variant GID (e.g. gid://shopify/ProductVariant/123)" },
                            quantity: { type: "number", description: "Quantity to add" },
                        },
                    },
                },
            }),
        },
    },
    {
        name: "add_to_cart",
        description: "Add items to an existing cart",
        inputSchema: {
            type: "object",
            ...withStoreId(["cart_id", "lines"], {
                cart_id: { type: "string", description: "Cart ID returned from create_cart" },
                lines: {
                    type: "array",
                    description: "Items to add to the cart",
                    items: {
                        type: "object",
                        required: ["variant_id", "quantity"],
                        properties: {
                            variant_id: { type: "string", description: "Shopify variant GID" },
                            quantity: { type: "number", description: "Quantity to add" },
                        },
                    },
                },
            }),
        },
    },
    {
        name: "update_cart",
        description: "Update item quantities in the cart (set quantity to 0 to remove)",
        inputSchema: {
            type: "object",
            ...withStoreId(["cart_id", "lines"], {
                cart_id: { type: "string", description: "Cart ID to update" },
                lines: {
                    type: "array",
                    description: "Lines to update. Set quantity to 0 to remove an item.",
                    items: {
                        type: "object",
                        required: ["line_id", "quantity"],
                        properties: {
                            line_id: { type: "string", description: "Cart line ID to update" },
                            quantity: { type: "number", description: "New quantity (0 to remove the item)" },
                        },
                    },
                },
            }),
        },
    },
    {
        name: "view_cart",
        description: "View the current contents of a cart",
        inputSchema: {
            type: "object",
            ...withStoreId(["cart_id"], {
                cart_id: { type: "string", description: "Cart ID to view" },
            }),
        },
    },
    {
        name: "get_checkout_url",
        description: "Get the checkout URL for a cart to complete purchase",
        inputSchema: {
            type: "object",
            ...withStoreId(["cart_id"], {
                cart_id: { type: "string", description: "Cart ID to get checkout URL for" },
            }),
        },
    },
    {
        name: "create_checkout",
        description: "Start a new Agents Checkout session with items and buyer email. Returns checkout_id and status. Use this for in-agent checkout without leaving the conversation.",
        inputSchema: {
            type: "object",
            ...withStoreId(["line_items", "buyer_email"], {
                line_items: {
                    type: "array",
                    description: "Items to purchase",
                    items: {
                        type: "object",
                        required: ["variant_id", "quantity"],
                        properties: {
                            variant_id: { type: "string", description: "Shopify variant GID (e.g. gid://shopify/ProductVariant/123)" },
                            quantity: { type: "number", description: "Quantity to purchase" },
                        },
                    },
                },
                buyer_email: { type: "string", description: "Buyer's email address" },
                currency: { type: "string", description: "Currency code (default: USD)", default: "USD" },
            }),
        },
    },
    {
        name: "update_checkout",
        description: "Update checkout with shipping address and/or payment instrument. IMPORTANT: Always send the complete state — include all line_items and buyer_email along with any new fields.",
        inputSchema: {
            type: "object",
            ...withStoreId(["checkout_id", "line_items", "buyer_email"], {
                checkout_id: { type: "string", description: "Checkout ID returned from create_checkout" },
                line_items: {
                    type: "array",
                    description: "All items in the checkout (full state required)",
                    items: {
                        type: "object",
                        required: ["variant_id", "quantity"],
                        properties: {
                            variant_id: { type: "string", description: "Shopify variant GID" },
                            quantity: { type: "number", description: "Quantity" },
                        },
                    },
                },
                buyer_email: { type: "string", description: "Buyer's email address" },
                shipping_address: {
                    type: "object",
                    description: "Shipping address for the order",
                    properties: {
                        first_name: { type: "string" },
                        last_name: { type: "string" },
                        street_address: { type: "string" },
                        address_locality: { type: "string", description: "City" },
                        address_region: { type: "string", description: "State/province code" },
                        postal_code: { type: "string" },
                        address_country: { type: "string", description: "Country code (e.g. US)" },
                    },
                },
                payment_instrument_id: { type: "string", description: "Payment instrument ID from buyer" },
            }),
        },
    },
    {
        name: "complete_checkout",
        description: "Finalize and place the order. Only call when checkout status is ready_for_complete. An idempotency key is generated automatically to prevent duplicate orders.",
        inputSchema: {
            type: "object",
            ...withStoreId(["checkout_id"], {
                checkout_id: { type: "string", description: "Checkout ID to complete" },
                payment_instrument_id: { type: "string", description: "Payment instrument ID (if not already set via update_checkout)" },
            }),
        },
    },
];
// ─── Backend API calls ────────────────────────────────────────────────────────
async function listStores() {
    let response;
    try {
        response = await fetch(`${BACKEND_URL}/stores`);
    }
    catch {
        throw new Error(`Failed to reach backend at ${BACKEND_URL}. Is it running?`);
    }
    const json = await response.json();
    if (json.total === 0)
        return "No stores are registered on this platform yet.";
    const lines = [`## Available Stores (${json.total})\n`];
    for (const s of json.stores) {
        const checkout = s.has_checkout ? "✅ full checkout" : "🔗 buy-now links only";
        lines.push(`- **${s.name}** — store_id: \`${s.store_id}\` · ${checkout}`);
    }
    lines.push("\nUse the **store_id** when calling any shopping tool.");
    lines.push("For stores without full checkout, share the 🛒 Buy Now link from product results instead of using cart/checkout tools.");
    return lines.join("\n");
}
const USER_META = {
    _username: os_1.default.userInfo().username,
    _hostname: os_1.default.hostname(),
    _platform: os_1.default.platform(),
    _source: "claude",
};
async function callBackendTool(storeId, toolName, args) {
    let response;
    try {
        response = await fetch(`${BACKEND_URL}/tools/${storeId}/${toolName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...args, ...USER_META }),
        });
    }
    catch {
        throw new Error(`Failed to reach backend at ${BACKEND_URL}. Is it running?`);
    }
    const json = await response.json();
    if (!response.ok)
        throw new Error(json.error ?? `Backend returned HTTP ${response.status}`);
    return json.result ?? "";
}
// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new index_js_1.Server({ name: "10x-shopping-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {});
    try {
        let text;
        if (name === "list_stores") {
            text = await listStores();
        }
        else if (PLATFORM_MODE) {
            // Extract store_id from args, pass remaining args to backend
            const storeId = a.store_id;
            if (!storeId)
                throw new Error("store_id is required. Use list_stores to find available stores.");
            const { store_id: _, ...rest } = a;
            text = await callBackendTool(storeId, name, rest);
        }
        else {
            text = await callBackendTool(STORE_ID, name, a);
        }
        return { content: [{ type: "text", text }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
});
// ─── Start ────────────────────────────────────────────────────────────────────
async function pingInstall() {
    if (!STORE_ID)
        return;
    try {
        await fetch(`${BACKEND_URL}/api/v1/ping`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                store_id: STORE_ID,
                username: USER_META._username,
                hostname: USER_META._hostname,
                platform: USER_META._platform,
            }),
            signal: AbortSignal.timeout(5000),
        });
    }
    catch { /* silent — ping is best-effort */ }
}
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    if (PLATFORM_MODE) {
        console.error(`10x Shopping MCP — PLATFORM MODE (all stores, backend: ${BACKEND_URL})`);
    }
    else {
        console.error(`10x Shopping MCP — STORE MODE (store: ${STORE_ID}, backend: ${BACKEND_URL})`);
        pingInstall();
    }
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
