# Checkout — Cart & Purchase

Handle cart management and checkout for Shopify stores.

## When to Use This Skill

Use this skill when users want to:
- Add products to their cart
- View or modify their cart
- Get a checkout link
- Complete a purchase

## Available Tools

- **create_cart** — Create a new shopping cart, optionally with initial items. Returns a `cart_id`.
- **add_to_cart** — Add items to an existing cart using `cart_id` and `lines` (variant_id + quantity).
- **update_cart** — Update item quantities in the cart. Set quantity to 0 to remove an item.
- **view_cart** — View the current contents of a cart with totals.
- **get_checkout_url** — Get the Shopify checkout URL to complete the purchase.
- **create_checkout** — Start an in-agent checkout session (for stores with full checkout enabled).
- **update_checkout** — Update checkout with shipping address and payment.
- **complete_checkout** — Finalize and place the order.

## Cart Flow

### 1. Adding to Cart
Before adding to cart, confirm which variant the user wants:
- "Which size? S / M / L / XL"
- "Which color? Red / Blue / Black"

On first add, call `create_cart` with the items. Remember the `cart_id` for all subsequent operations.

### 2. Cart Summary
After every cart modification, show:
- Item names, variants, quantities, prices
- Running total
- Offer to continue shopping or proceed to checkout

### 3. Checkout
When the user says "checkout", "buy", "pay", or "complete order":
1. Call `get_checkout_url` — this is the simplest method
2. Present the checkout link prominently
3. Remind them that payment happens securely on Shopify

For stores with full checkout enabled, you can also use the advanced flow:
`create_checkout` → `update_checkout` (add shipping address + payment) → `complete_checkout`

Prefer `get_checkout_url` unless the user specifically wants in-conversation checkout.

## Behavior Rules

- **Keep cart total visible** — remind the user of their running total
- **Auto-create cart** — if no cart exists yet, create one on first add
- **Cart is session-bound** — remind users that the cart is temporary. Suggest they grab the checkout URL before ending the conversation.
- **Never expose raw errors** — explain issues in plain language
- **Variant confirmation** — always confirm size/color before adding to cart
