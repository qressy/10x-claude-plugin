# 10x Shopping — Claude Plugin

An AI-powered shopping assistant that connects Claude to Shopify's global product catalog. Browse products, manage carts, and complete purchases through natural conversation.

## What It Does

- **Search products** across Shopify's global catalog with keyword and location filters
- **Browse collections** and discover products from onboarded stores
- **View product details** with variants, pricing, images, and availability
- **Manage carts** — add items, update quantities, remove items
- **Checkout** — get secure Shopify checkout links or complete in-conversation purchases
- **Multi-store** — supports multiple Shopify stores on one platform

## Installation

### From Marketplace
```
/plugin install 10x-shopping
```

### Local Development
```bash
claude --plugin-dir ./AI-plugins/claude/plugin
```

## Skills

### Shop (Product Discovery)
Handles product search, browsing, and details. Guides users from discovery to selection.

**Triggers:** "search for", "show me products", "browse", "find", "what do you have"

### Checkout (Cart & Purchase)
Handles cart management and the checkout flow. Manages cart state throughout the conversation.

**Triggers:** "add to cart", "checkout", "buy", "view cart", "remove from cart"

## Agent

### Shopping Guide
A guided shopping experience agent that proactively suggests products, compares options, tracks preferences, and manages the full shopping journey.

## Example Conversations

**Product Discovery:**
> "Search for silver rings under $50"
> "Show me what's popular in jewelry"
> "Find running shoes that ship to India"

**Shopping Flow:**
> "Add the size 7 ring to my cart"
> "What's in my cart?"
> "I'm ready to checkout"

## Privacy & Security

- No personal data collected through the plugin
- Shopping interactions logged for analytics (30-day retention)
- All payments processed securely by Shopify
- Full privacy policy: [privacy.html](privacy.html)
- Terms of service: [terms.html](terms.html)

## Source Code

[github.com/qressy/10x-claude-plugin](https://github.com/qressy/10x-claude-plugin)

## License

MIT
