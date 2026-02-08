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
