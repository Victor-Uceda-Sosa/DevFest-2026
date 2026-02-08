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
