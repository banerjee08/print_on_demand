# LouLou & Luxe (`loulouandluxe.com`) — Print on Demand & Boutique E-Commerce (`development` branch)

## Environment Separation
1. **Public Production Domain ([https://loulouandluxe.com](https://loulouandluxe.com)):**
   - Displays **ONLY** the public-facing **Launching Soon / Coming Soon** page (`apps/storefront/public/coming-soon.html`) featuring our bespoke **LouLou & Luxe Botanical Atelier Crest** graphic, 3-panel lookbook artwork, live launch countdown timer, VIP 25% OFF (`LULLUXE25`) waitlist signup, and mandatory Visitor Entry Cookie Disclaimer popup.
2. **Development & Testing Branch on `sbanerjee.cloud`:**
   - **Dedicated Subdomain:** [https://loulou-dev.sbanerjee.cloud](https://loulou-dev.sbanerjee.cloud)
   - **Direct n8n Dev Endpoint:** [https://automations.sbanerjee.cloud/webhook/loulouandluxe-dev](https://automations.sbanerjee.cloud/webhook/loulouandluxe-dev)
   - Hosts the full interactive LouLou & Luxe Storefront (`apps/storefront/public/index.html`) for ongoing UI, catalog, Bridal Concierge, and checkout development and testing.
