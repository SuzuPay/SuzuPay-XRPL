# Mobile Integration Notes

## Architecture

The wallet adapter layer is **platform-agnostic** — `WalletAdapterInfo` and `ConnectionResult` have no DOM/`window` dependencies. Each adapter's `isAvailable()` returns `false` on unsupported platforms.

## Adapter Compatibility by Platform

| Adapter | Web (Desktop) | Web (Mobile) | React Native |
|---|---|---|---|
| CrossMark | ✅ Extension | ❌ No extension | ❌ |
| Xaman | ✅ QR code | ✅ Deep link | ✅ Deep link |
| Ledger | ✅ WebUSB | ❌ No WebUSB† | ✅ BLE transport |
| WalletConnect | ✅ QR code | ✅ Deep link | ✅ Deep link |
| Atomic / Manual | ✅ QR + paste | ✅ QR + paste | ✅ QR + paste |

† WebUSB is available in Chrome Android but not Safari iOS.

## Mobile-Ready Wallets (No Changes Needed)

- **Xaman**: QR code on desktop → deep link on mobile. Same payload API.
- **WalletConnect**: QR code on desktop → deep link on mobile. Same session protocol.
- **Manual/Atomic**: Always works — user scans QR in their wallet app.

## Future Mobile Adapters

For React Native apps, add platform-specific adapters:

```typescript
// React Native Xaman adapter (deep link)
import { Linking } from 'react-native';

const xamanDeepLink = `xaman://payload/${payloadId}`;
await Linking.openURL(xamanDeepLink);
```

```typescript
// React Native Ledger adapter (BLE transport)
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import Xrp from '@ledgerhq/hw-app-xrp';

const transport = await TransportBLE.create();
const xrp = new Xrp(transport);
const { address } = await xrp.getAddress("44'/144'/0'/0/0");
```

## Capability Flags

Mobile UIs can check `adapter.supportsDirectSigning` to decide whether to show:
- **Sign button** (for adapters that support programmatic signing)
- **Payment QR code** (for manual-flow adapters)
