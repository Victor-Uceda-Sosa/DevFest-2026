# Flowglad setup for MedStudent Pro

This guide walks you through creating a price with slug `pro_monthly` and a feature with slug `pro` in the Flowglad dashboard so the “Upgrade to unlock” button works.

## 1. Open the Flowglad dashboard

1. Go to **[app.flowglad.com](https://app.flowglad.com)** and sign in.
2. Open **Store → Pricing Models** (or **Pricing Models** in the sidebar).

## 2. Create or use a pricing model

- If you already have a pricing model, open it.
- If not:
  - Click **Create pricing model** (or **New** / **From scratch**).
  - Give it a name (e.g. “MedStudent Pro default”) and save.

Make sure this pricing model is set as your **default** so new customers get it (dashboard usually has a “Set as default” or similar).

## 3. Create a product with a price (slug `pro_monthly`)

1. Inside the pricing model, click **Add product** / **New product** (or **Create product**).
2. Fill in:
   - **Name**: e.g. “MedStudent Pro”
   - **Description**: optional (e.g. “Full access to interviews, exams, and scheduling”)
3. When setting up the **price** for this product:
   - **Type**: **Subscription** (recurring monthly).
   - **Unit price**: e.g. `999` for $9.99 (amount in cents) or your chosen amount.
   - **Interval**: **Month**, count **1** (monthly).
   - **Slug**: set to **`pro_monthly`** (this is what the app uses in `createCheckoutSession({ priceSlug: 'pro_monthly' })`).
   - **Name** (if shown): e.g. “Pro Monthly”.
4. Save the product. The price is created with that product.

If your UI creates the product first and then adds a price:

- Open the product → **New price** / **Add price**.
- Choose **Subscription**, set amount, interval (month, 1), and set **slug** to **`pro_monthly`**.

Slugs are usually lowercase, with underscores (e.g. `pro_monthly`). Avoid spaces.

## 4. Create a feature (slug `pro`)

The app uses `checkFeatureAccess('pro')` to decide if the user has paid access. You need a feature with that slug attached to the product.

1. In Flowglad, go to **Features** (or the feature section under your pricing model / product).
2. **Create feature**:
   - **Name**: e.g. “Pro access”
   - **Slug**: **`pro`**
3. **Attach the feature to the product**:
   - Edit the product you created (e.g. “MedStudent Pro”).
   - In “Features” or “Product features”, add the feature you just created (slug `pro`).
   - Save.

So: the **product** has a **price** with slug `pro_monthly` and a **feature** with slug `pro`. When a customer subscribes to that price, they get the `pro` feature and the app will show the gated content.

## 5. Use your own slugs (optional)

If you prefer different slugs:

- Create the **price** with your chosen slug (e.g. `medstudent_pro_monthly`).
- Create the **feature** with your chosen slug (e.g. `full_access`).
- In the app, open **`src/components/BillingGate.tsx`** and change the defaults:

```ts
const PRO_FEATURE_SLUG = 'full_access';  // your feature slug
const PRICE_SLUG = 'medstudent_pro_monthly';  // your price slug
```

Or pass them per usage:

```tsx
<BillingGate featureSlug="full_access" priceSlug="medstudent_pro_monthly" title="..." description="...">
  {children}
</BillingGate>
```

## 6. Check that it works

1. Ensure the Flowglad API server is running: `npm run server`.
2. Run the app: `npm run dev`.
3. Go to a gated section (e.g. Interview, Exams, or Schedule) and click **Upgrade to unlock**.
4. You should be redirected to Flowglad checkout. If you see an error above the button, the message usually indicates a missing price/feature or wrong slug.

## 7. Troubleshooting

### "Invalid priceSlug: Price with slug 'pro_monthly' not found for customer's pricing model"

This means Flowglad cannot find a price with slug `pro_monthly` on the **pricing model assigned to your customer** (e.g. the default model for new customers). Fix it in the dashboard:

1. **Confirm the price exists and the slug is exact**
   - In [app.flowglad.com](https://app.flowglad.com), go to **Store → Pricing Models** (or **Pricing Models**).
   - Open the pricing model that is set as **default** (this is the one new/guest customers get).
   - Open the product that should have the Pro subscription.
   - Check the **price** on that product: its **slug** must be exactly `pro_monthly` (lowercase, underscore, no spaces). If the slug is different (e.g. `pro-monthly`, `Pro_Monthly`, or missing), edit the price and set the slug to `pro_monthly`, then save.

2. **Confirm the price is on the default pricing model**
   - The price with slug `pro_monthly` must live on a **product that belongs to the default pricing model**. If you created the product under a different model, either move/add it to the default model or set that model as the default so new customers use it.

3. **Create the price if it’s missing**
   - In the default pricing model: **Add product** (e.g. “MedStudent Pro”), then add a **price** to that product with:
     - **Slug**: `pro_monthly`
     - **Type**: Subscription, monthly
     - Save the product/price.

After changing anything, try **Upgrade to unlock** again. Slug matching is usually case-sensitive and must be exactly `pro_monthly`.

## Quick reference

| App expects   | In Flowglad dashboard |
|---------------|----------------------|
| Feature slug  | `pro`                |
| Price slug    | `pro_monthly`        |
| Price type    | Subscription (monthly) |
| Feature       | Attached to the product that has the price |
