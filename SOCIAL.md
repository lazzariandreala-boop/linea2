# TikTok e Instagram sul sito

Il sito mostra i social di **@linea2.upcycling** in Home (sezione "Follow the
studio"), in Editorial e nella pagina /tiktok. I dati arrivano da
`GET /api/social/feed`, che il server tiene in cache 30 minuti: le pagine non
aspettano mai TikTok o Instagram, e se una piattaforma non risponde compare una
card con il link al profilo.

## TikTok: funziona già, senza configurare nulla

- **Profilo incorporato** (embed ufficiale "creator" di TikTok): mostra da solo
  gli ultimi video dell'account, quindi i nuovi post compaiono senza fare nulla.
  Si carica solo quando il visitatore tocca "Guarda i video" (pagine leggere e
  niente cookie TikTok prima del consenso).
- **Video in evidenza** (facoltativo): per mostrare dei video specifici come
  card con copertina, incolla i loro link in `shared/social.config.ts`
  (`tiktok.videos`), dal più recente. Copertina e didascalia arrivano da sole
  dall'oEmbed pubblico di TikTok.

Una lista automatica dei video come card richiederebbe la TikTok Display API,
che vuole un'app sviluppatore approvata da TikTok: si può aggiungere più avanti.

## Instagram: serve un token (una volta sola)

Instagram non ha un widget profilo ufficiale: la griglia degli ultimi post usa
l'API ufficiale di Instagram, che vuole un account professionale.

1. Nell'app Instagram: Impostazioni → Tipo di account e strumenti → **Passa a
   un account professionale** (Creator o Business, gratis).
2. Su <https://developers.facebook.com/apps> crea un'app (tipo "Business"),
   aggiungi il prodotto **Instagram** → "API setup with Instagram login".
3. In "Generate access tokens" aggiungi l'account `linea2.upcycling`, accedi con
   Instagram e copia il token. L'app può restare in modalità sviluppo: legge
   solo il vostro account, quindi non serve la revisione di Meta.
4. Su Vercel → Settings → Environment Variables aggiungi
   `NUXT_INSTAGRAM_TOKEN` con il token, poi rifai il deploy.

Il token dura 60 giorni e il server prova a rinnovarlo una volta al giorno. Se
un giorno la griglia torna alla card del profilo, genera un token nuovo
(passo 3) e aggiorna la variabile.
