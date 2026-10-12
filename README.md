# LouLou & Luxe (`loulouandluxe.com`) — Print on Demand & Boutique E-Commerce (`development` branch)

> **Active Development Branch:** `development`
> **Live Domain:** [https://loulouandluxe.com](https://loulouandluxe.com)
> **Full Storefront Dev Preview:** [https://loulouandluxe.com/?view=storefront](https://loulouandluxe.com/?view=storefront)
> **Standalone Coming Soon Endpoint:** [https://automations.sbanerjee.cloud/webhook/loulouandluxe-coming-soon](https://automations.sbanerjee.cloud/webhook/loulouandluxe-coming-soon)

## Architecture & Key Features on `development`
1. **Original LouLou & Luxe Brand Identity Preserved:**
   - **Color Palette:** Warm Alabaster (`#FAF8F5`), Pure Editorial White (`#FFFFFF`), Warm Stone (`#F3EFEA`), Espresso Ink (`#18181B`), Botanical Rose (`#9E4758`), Soft Botanical Rose (`#F9EFF1`), Champagne Gold (`#B4833E`), Forest Sage (`#2D5A43`), and Warm Sand Hairline (`#E6E1DA`).
   - **Typography:** `Cormorant Garamond` (Display Headings) + `Plus Jakarta Sans` (Body/UI) + `Dancing Script` (Monogram Script) + `JetBrains Mono` (SKUs, Timers, Promo Codes).
   - **UI Structure:** Pink Lily (`pinklily.com`) UNO-theme editorial layout (`0px` sharp corners, `11px` tight product grid gap, `logo-left menu-left` single-row header, 3-up info cards, `new arrivals` / `best sellers` tabbed showcase, and 40/60 split Featured Products).
2. **Coming Soon Landing Page (`apps/storefront/public/coming-soon.html`):**
   - Live 4-tile launch countdown timer (`Days : Hours : Mins : Secs`).
   - VIP 25% OFF (`LULLUXE25`) waitlist signup with shopper role selector (`Everyday Boutique`, `Bride / Bridesmaid`, `Monogram Gifting`).
   - 3-card `0px`-corner editorial lookbook sneak peek (`Social Club Fleece`, `Bridal & Bachelorette`, `Monogram Studio`).
   - 1-click Dev Preview bar to toggle between `Coming Soon Page` and `Full Storefront (Dev)`.
3. **Mandatory Visitor Entry Cookie Disclaimer & Backend Gatekeeper (`GDPR / CCPA / PIPEDA / UK PECR`):**
   - Fires immediately on first visitor entry before any non-essential cookies (`analytics`, `marketing`) are written.
   - Granular consent options: **Accept All Cookies (`ALL`)**, **Decline Non-Essential (`NECESSARY_ONLY`)**, or **Customize Preferences (`CUSTOM`)**.
   - Backend PostgreSQL schema in `packages/db/migrations/004_visitor_cookie_consents.sql` and architecture spec in `docs/Banana-POD-and-Multi-Website-Manager-Reference.md` (Section 7).
