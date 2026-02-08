# Flowglad Integration Guide — Application Analysis

This document describes how the MedStudent Pro application is structured and how it integrates with Flowglad for payments and billing. Use it to generate or extend a Flowglad integration guide.

---

## 1. Framework & Language Detection

| Item | Value |
|------|--------|
| **Frontend framework** | React (Vite), not Next.js. No App Router or Pages Router. |
| **Server framework** | Express 4.x |
| **Server language** | JavaScript (CommonJS: `require`/`module.exports`) |
| **Frontend language** | TypeScript (`.ts`, `.tsx`) |
| **Package manager** | npm |
| **Dependency file** | `package.json` (project root) |

Relevant scripts in `package.json`:

- `npm run dev` — Vite dev server (port 3000)
- `npm run server` — Express Flowglad API server (port 3001)
- `npm run build` — Vite production build

---

## 2. File Structure & Paths

All paths below are **relative to the project root**.

| Purpose | Location |
|--------|----------|
| **API routes** | Mounted under `/api/flowglad` in `server/index.js`. The app does not define custom API route files; Flowglad’s Express router handles all `/api/flowglad` requests. |
| **Utility / shared code** | `src/lib/` (e.g. `src/lib/guestId.ts`), and `src/components/ui/utils.ts` for UI helpers. |
| **UI components** | `src/components/` (e.g. `BillingGate.tsx`, `Home.tsx`, `MockInterview.tsx`). Reusable UI primitives in `src/components/ui/`. |
| **Main server file** | `server/index.js` |

There is no `src/app`, `pages`, or `routes` directory. The only server is the Express app in `server/`.

---

## 3. Authentication System

**Authentication library:** None. The app uses a **persistent guest ID** stored in `localStorage` to represent the customer until real auth is added.

**Server-side “auth”:** The server does not use sessions or JWT. The customer is identified by the `X-Customer-Id` request header, which the client sets from the guest ID (see Section 5).

**Client-side “auth”:** A guest ID is obtained via `getOrCreateGuestId()` from `src/lib/guestId.ts` and sent to the server as `X-Customer-Id` in the Flowglad provider config.

**Session / user extraction:**

- **Server:** There is no “current user” or “session” object. The customer ID is taken from the request in the Flowglad Express router’s `getCustomerExternalId` callback. Full code:

```javascript
// server/index.js (excerpt)
app.use(
  '/api/flowglad',
  expressRouter({
    flowglad,
    getCustomerExternalId: async (req) => {
      const id = req.headers['x-customer-id'];
      if (!id) {
        throw new Error('User not authenticated');
      }
      return id;
    },
  })
);
```

- **Client:** There is no auth hook or session hook. The “user” is represented only by the guest ID from `getOrCreateGuestId()`, which is passed into `FlowgladProvider` as the `X-Customer-Id` header. No user object (id, email, name) exists on the client except what the app might display (e.g. “Guest”).

**User/customer object structure (server-side only):** The server resolves customer details in `server/flowglad.js` via `getCustomerDetails(id)`. That function returns an object used by Flowglad’s `getRequestingCustomer`. Structure:

- `email` — string (e.g. `${id}@guest.medstudentpro.app`)
- `name` — string (e.g. `'Guest'`)

Flowglad’s API expects `externalId`, `name`, and `email`; `externalId` is the same as the `id` passed to `getCustomerDetails`. So the effective “user” shape for Flowglad is: `{ externalId, name, email }`.

---

## 4. Customer Model (B2C vs B2B)

**Model:** **B2C** — customers are individual users (or anonymous guests). There are no organizations, teams, or workspaces.

**Customer ID source (B2C):**

- **Client:** The value from `getOrCreateGuestId()` (a string, e.g. `guest_<uuid>`).
- **Server:** The same value is provided via the `X-Customer-Id` header and passed to `getCustomerExternalId` and then to `flowglad(customerExternalId)`.

So the field that identifies the customer is: **the guest ID string** (or, after you add auth, typically `user.id` or `session.user.id`).

**Organization derivation:** Not applicable (B2C only). There is no organization, team, or org ID in the codebase.

---

## 5. Frontend Framework

**Framework:** React 18 (from `package.json`: `"react": "^18.3.1"`).

**Provider pattern:**

- **Where providers are mounted:** The only provider relevant to Flowglad is mounted in `src/main.tsx`, which renders `FlowgladApp`. `FlowgladApp` wraps the app with `FlowgladProvider`; there is no separate `layout.tsx` or `providers.tsx`.
- **State management:** No global state library (no React Query, Zustand, or Redux). Local state is via `useState` (e.g. in `App.tsx` for current page, in `BillingGate` for loading/errors).

**Complete provider structure:**

```tsx
// src/FlowgladApp.tsx
import { FlowgladProvider } from '@flowglad/react';
import { getOrCreateGuestId } from './lib/guestId';
import App from './App';

export function FlowgladApp() {
  const guestId = getOrCreateGuestId();
  return (
    <FlowgladProvider
      requestConfig={{
        headers: {
          'X-Customer-Id': guestId,
        },
      }}
    >
      <App />
    </FlowgladProvider>
  );
}
```

```tsx
// src/main.tsx
import { createRoot } from "react-dom/client";
import { FlowgladApp } from "./FlowgladApp.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<FlowgladApp />);
```

**Client-side “auth”:** There is no `useSession`, `useAuth`, or `useUser` hook. The customer is represented by calling `getOrCreateGuestId()` once when rendering `FlowgladApp` and passing it to `FlowgladProvider` via `requestConfig.headers['X-Customer-Id']`.

---

## 6. Route Handler Pattern

**How API routes are defined:** The only API surface is the Flowglad Express router. Routes are not defined as separate handlers; they are mounted in one place:

```javascript
// server/index.js (full file)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { expressRouter } = require('@flowglad/server/express');
const { flowglad } = require('./flowglad');

const app = express();
const PORT = process.env.FLOWGLAD_SERVER_PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Log 500s so you can see the real error in the terminal
app.use('/api/flowglad', (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 500 && body?.error) {
      console.error('[Flowglad] 500 error:', JSON.stringify(body.error, null, 2));
    }
    return originalJson(body);
  };
  next();
});

app.use(
  '/api/flowglad',
  expressRouter({
    flowglad,
    getCustomerExternalId: async (req) => {
      const id = req.headers['x-customer-id'];
      if (!id) {
        throw new Error('User not authenticated');
      }
      return id;
    },
  })
);

// Catch async errors from the router (Express 4 doesn't await route handlers)
app.use('/api/flowglad', (err, req, res, next) => {
  console.error('[Flowglad] Unhandled error:', err?.message || err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', json: { message: err?.message || 'Internal server error' } },
    data: null,
  });
});

app.listen(PORT, () => {
  console.log(`Flowglad API server running at http://localhost:${PORT}`);
  if (!process.env.FLOWGLAD_SECRET_KEY) {
    console.warn('Warning: FLOWGLAD_SECRET_KEY is not set. Set it in .env for checkout to work.');
  }
});
```

**JSON responses:** Sent with `res.json(...)`. The Flowglad router and the error middleware both use this. The error middleware returns a body of the form: `{ error: { code, json }, data: null }`.

The app does not implement custom API route handlers with request parsing or validation; all `/api/flowglad` behavior comes from `@flowglad/server/express`.

---

## 7. Validation & Error Handling Patterns

**Validation library:** None in application code. `zod` appears only as a transitive dependency (e.g. via `react-hook-form`); it is not used for API request validation in this repo.

**Validation pattern:** Not applicable — there are no custom API route handlers that validate request bodies. The Flowglad router’s behavior is defined by the library.

**Error handling pattern:** Errors from the Flowglad router are caught by an Express error middleware and returned as JSON with status 500:

```javascript
// server/index.js
app.use('/api/flowglad', (err, req, res, next) => {
  console.error('[Flowglad] Unhandled error:', err?.message || err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', json: { message: err?.message || 'Internal server error' } },
    data: null,
  });
});
```

- **How errors are caught:** `express-async-errors` is required at the top so that async route handlers’ rejections are passed to this middleware.
- **Response shape:** `{ error: { code: 'INTERNAL_ERROR', json: { message: string } }, data: null }`.
- **HTTP status:** 500 for unhandled errors. Other status codes are determined by the Flowglad router, not by app code.

---

## 8. Type System

**Frontend:** TypeScript — `.ts` and `.tsx` with interfaces and types (e.g. `BillingGateProps`, `Page`, `Message`, `Event` in components).

**Server:** JavaScript only — no type hints or JSDoc types in `server/index.js` or `server/flowglad.js`.

---

## 9. Helper Function Patterns

**Locations:**

- `src/lib/guestId.ts` — guest ID helper.
- `src/components/ui/utils.ts` — UI utility (`cn` for class names).

**Helper examples:**

```typescript
// src/lib/guestId.ts (complete)
const STORAGE_KEY = 'medstudent_guest_id';

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest_anon';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = 'guest_' + crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
```

```typescript
// src/components/ui/utils.ts (complete)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Patterns:** Simple exported functions, early return for SSR (`typeof window === 'undefined'`), no JSDoc. No try/catch in these helpers. `cn` is used for conditional Tailwind classes.

**Code organization:** Helpers are in a small number of files (`src/lib/` and `src/components/ui/utils.ts`). Naming is camelCase for functions. Imports use path aliases where configured (e.g. `@/` in `vite.config.ts`).

---

## 10. Provider Composition Pattern

**Structure:** One provider file: `src/FlowgladApp.tsx`. It composes by wrapping the root `App` in `FlowgladProvider`. No other providers (theme, auth, etc.) are present in the analyzed code.

**Complete code:**

```tsx
// src/FlowgladApp.tsx
import { FlowgladProvider } from '@flowglad/react';
import { getOrCreateGuestId } from './lib/guestId';
import App from './App';

export function FlowgladApp() {
  const guestId = getOrCreateGuestId();
  return (
    <FlowgladProvider
      requestConfig={{
        headers: {
          'X-Customer-Id': guestId,
        },
      }}
    >
      <App />
    </FlowgladProvider>
  );
}
```

**Mounting:** The root entry is `src/main.tsx`, which renders `<FlowgladApp />` into `#root`. So the tree is: `FlowgladApp` → `FlowgladProvider` → `App`. No singleton or client-only wrapper beyond the fact that `getOrCreateGuestId()` depends on `window`/`localStorage` (and is only used in the client bundle).

---

## 11. Environment Variables

**Environment file:** `.env` in the project root (see README and `server/index.js`).

**Loading:** The server loads it with `dotenv` in `server/index.js`:

```javascript
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
```

**Access:**

- **Server:** `process.env.FLOWGLAD_SECRET_KEY`, `process.env.FLOWGLAD_SERVER_PORT`.
- **Client:** `import.meta.env.VITE_*` (e.g. `import.meta.env.VITE_DEDALUS_API_KEY` in `MCATStudy.tsx`). Vite only exposes variables prefixed with `VITE_`.

**Variables referenced in code:**

| Variable | Where | Purpose |
|----------|--------|---------|
| `FLOWGLAD_SECRET_KEY` | `server/index.js` (warning only), README | Flowglad secret key; required for checkout. Actual usage is inside `@flowglad/server` (unavailable in repo). |
| `FLOWGLAD_SERVER_PORT` | `server/index.js` | Port for the Flowglad API server (default 3001). |
| `VITE_DEDALUS_API_KEY` | `src/components/MCATStudy.tsx` | External API key for MCAT/study feature; not related to Flowglad. |

---

## 12. Existing Billing Code

**Locations:**

- **Client:** `src/components/BillingGate.tsx` — feature gate and checkout UI using `useBilling()` from `@flowglad/react`.
- **Server:** `server/flowglad.js` — Flowglad server factory and `getCustomerDetails`; `server/index.js` — mounts Flowglad router and `getCustomerExternalId`.

**Flowglad server factory (complete):**

```javascript
// server/flowglad.js
const { FlowgladServer } = require('@flowglad/server');

/**
 * Return guest details for a customer id. Replace with your user lookup when you add auth.
 */
async function getCustomerDetails(id) {
  return {
    email: `${id}@guest.medstudentpro.app`,
    name: 'Guest',
  };
}

/**
 * Flowglad server factory. customerExternalId is the ID from YOUR app (e.g. user.id).
 * We use getRequestingCustomer so the session has valid name/email (required by Flowglad).
 */
function flowglad(customerExternalId) {
  return new FlowgladServer({
    getRequestingCustomer: async () => {
      const details = await getCustomerDetails(customerExternalId);
      return {
        externalId: customerExternalId,
        name: details.name,
        email: details.email,
      };
    },
  });
}

module.exports = { flowglad };
```

**Billing hook/utility import:** The billing UI uses the `useBilling` hook from `@flowglad/react` inside `BillingGate.tsx`:

```tsx
const { checkFeatureAccess, createCheckoutSession, loaded, errors } = useBilling();
```

**Usage meter references:** None found. No usage meter slugs or reporting calls in the codebase.

**Feature toggle references:**

- **Feature slug:** `pro`. Defined in `src/components/BillingGate.tsx` as `PRO_FEATURE_SLUG = 'pro'`, used in `checkFeatureAccess(featureSlug)` (default `featureSlug` is `'pro'`). Can be overridden via `<BillingGate featureSlug="...">`.

**Product/price references:**

- **Price slug:** `pro_monthly`. Defined in `src/components/BillingGate.tsx` as `PRICE_SLUG = 'pro_monthly'`, used in `createCheckoutSession({ priceSlug, ... })`. Can be overridden via `<BillingGate priceSlug="...">`.

**Complete BillingGate component (for reference):**

```tsx
// src/components/BillingGate.tsx (complete)
'use client';

import { useState } from 'react';
import { useBilling } from '@flowglad/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

const PRO_FEATURE_SLUG = 'pro';
const PRICE_SLUG = 'pro_monthly';

interface BillingGateProps {
  children: React.ReactNode;
  /** Feature slug to check in Flowglad (default: 'pro') */
  featureSlug?: string;
  /** Price slug for checkout (default: 'pro_monthly') */
  priceSlug?: string;
  title?: string;
  description?: string;
}

export function BillingGate({
  children,
  featureSlug = PRO_FEATURE_SLUG,
  priceSlug = PRICE_SLUG,
  title = 'Premium feature',
  description = 'Upgrade to access this feature.',
}: BillingGateProps) {
  const { checkFeatureAccess, createCheckoutSession, loaded, errors } = useBilling();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (errors?.length) {
    return (
      <Card className="p-6 border-amber-200 bg-amber-50">
        <p className="text-amber-800">Unable to load billing. Please refresh the page.</p>
      </Card>
    );
  }

  if (checkFeatureAccess && checkFeatureAccess(featureSlug)) {
    return <>{children}</>;
  }

  const handleUpgrade = async () => {
    if (!createCheckoutSession) return;
    setIsRedirecting(true);
    setCheckoutError(null);
    try {
      const result = await createCheckoutSession({
        priceSlug,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
        autoRedirect: true,
      });
      if (result && 'error' in result) {
        const msg =
          result.error?.json?.error ??
          result.error?.json?.message ??
          result.error?.message ??
          result.error?.code ??
          'Checkout failed.';
        setCheckoutError(String(msg));
      }
      // If success, autoRedirect: true will navigate; no need to do anything else
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Is the server running?';
      setCheckoutError(message);
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto text-center border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-blue-100">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {checkoutError && (
        <p className="text-sm text-red-600 mb-4 bg-red-50 px-3 py-2 rounded">{checkoutError}</p>
      )}
      <Button
        onClick={handleUpgrade}
        disabled={isRedirecting}
        className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white"
      >
        {isRedirecting ? 'Redirecting to checkout…' : 'Upgrade to unlock'}
      </Button>
    </Card>
  );
}
```

---

## 13. Component Locations

| Component | Location |
|-----------|----------|
| **Pricing / upgrade UI** | `src/components/BillingGate.tsx`. There is no separate “pricing page”; paid features are gated by wrapping content in `<BillingGate>`. |
| **Navbar / account menu** | Inline in `src/App.tsx` (header with “MedStudent Pro” and nav buttons for Home, Interview, Exams, Schedule). No separate navbar or account menu component. |
| **Main dashboard / home** | `src/components/Home.tsx` — hero, feature cards, and quick tips. Rendered when `currentPage === 'home'` in `App.tsx`. |

**Usage of BillingGate:** In `App.tsx`, only the Interview page is wrapped with `BillingGate`; MCAT and Scheduling are not gated in the current code:

```tsx
// src/App.tsx (excerpt)
case 'interview':
  return (
    <BillingGate title="Mock Patient Interviews" description="Upgrade to practice with AI-generated interview simulations.">
      <MockInterview />
    </BillingGate>
  );
```

---

## Summary Table

| Topic | Value |
|--------|--------|
| Stack | Vite + React 18 (TS) + Express 4 (JS) |
| Package manager | npm, `package.json` at root |
| API base | `/api/flowglad` via Express in `server/index.js` |
| Auth | Guest ID in `localStorage`, sent as `X-Customer-Id`; replace with real user id when adding auth |
| Customer model | B2C; customer ID = guest id (or future user.id) |
| Provider | `FlowgladProvider` in `src/FlowgladApp.tsx`, mounted in `src/main.tsx` |
| Billing UI | `src/components/BillingGate.tsx`, `useBilling()` from `@flowglad/react` |
| Feature slug | `pro` (default in BillingGate) |
| Price slug | `pro_monthly` (default in BillingGate) |
| Env | `.env` at root; server uses `process.env`, client uses `import.meta.env.VITE_*` |

This document reflects the codebase as analyzed; any missing details (e.g. how `FLOWGLAD_SECRET_KEY` is read inside `@flowglad/server`) are noted as unavailable rather than assumed.
