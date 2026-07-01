# Setup Firebase + PayPal (Linea 2)

Il codice è già cablato. Restano alcuni passaggi manuali nella console — io non posso farli al posto tuo.

## 1. Firebase console — progetto `linea2-6e804`

1. **Authentication → Sign-in method**: abilita **Email/Password** e **Google**.
2. **Firestore Database → Create database** (modalità *Production*, regione EU es. `europe-west`).
3. **Firestore → Rules**: incolla il contenuto di [`firestore.rules`](./firestore.rules) e **Publish**.
4. **Authentication → Settings → Authorized domains**: aggiungi `localhost` (e in seguito il dominio di produzione).

> Le chiavi web Firebase in `nuxt.config.ts` sono **pubbliche per design**: la sicurezza la fanno le regole qui sopra + i domini autorizzati, non la segretezza delle chiavi.

## 2. PayPal (Standard Checkout, Orders API v2 — pay-per-transaction)

1. Vai su https://developer.paypal.com/dashboard/applications e crea un'app in **Sandbox**.
2. Copia **Client ID** e **Secret** e mettili in `.env`:
   ```
   NUXT_PUBLIC_PAYPAL_CLIENT_ID=<client id sandbox>
   NUXT_PAYPAL_SECRET=<secret sandbox>
   NUXT_PAYPAL_ENV=sandbox
   NUXT_PUBLIC_PAYPAL_CURRENCY=EUR
   ```
3. Per testare i pagamenti usa gli account di test in **Sandbox → Accounts**.
4. In produzione: crea l'app **Live**, aggiorna le stesse variabili e imposta `NUXT_PAYPAL_ENV=live`.

Finché `NUXT_PUBLIC_PAYPAL_CLIENT_ID` è vuoto, il carrello mostra "pagamento non ancora configurato" e il resto (login, profilo, carrello salvato) funziona comunque.

## Modello dati Firestore

| Percorso | Contenuto |
|----------|-----------|
| `users/{uid}` | profilo: `displayName`, `email`, `phone`, `shipping{}` |
| `users/{uid}/orders/{orderId}` | ordine (immutabile): `items[]`, `amount`, `currency`, `status`, `shipping`, `paypal{}`, `createdAt` |
| `carts/{uid}` | carrello salvato: `items[]`, `updatedAt` |

## ⚠️ Nota sulla sicurezza dei prezzi

Oggi il catalogo è client-side (mock). La route `create-order` accetta l'importo dal client. Quando sposterai il catalogo su un backend, ricalcola l'importo lato server in `server/api/paypal/create-order.post.ts` prima di creare l'ordine, per evitare manomissioni del totale.
