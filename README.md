# Booking Showcase

Pagini de prezentare ("trust pages") pentru proprietățile tale de pe Booking.com — poze, facilități și
recenzii de la clienți, plus un panou de administrare pentru a le gestiona.

## Rulare locală

```bash
npm install
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) pentru site-ul public și
[http://localhost:3000/admin](http://localhost:3000/admin) pentru panoul de administrare.

Parola de admin este cea din `.env` (`ADMIN_PASSWORD`). Modific-o înainte de a publica site-ul public.

## Configurare

Copiază `.env.example` în `.env` și completează:

- `DATABASE_URL` — implicit `file:./dev.db` (SQLite local)
- `ADMIN_PASSWORD` — parola pentru `/admin`
- `SESSION_SECRET` — string lung și aleator, folosit pentru semnarea cookie-ului de sesiune

## Adăugarea primei proprietăți

1. Autentifică-te în `/admin`.
2. Apasă „Adaugă proprietate nouă” și dă-i un nume.
3. Pe pagina proprietății:
   - (opțional) lipește linkul de pe Booking.com și apasă **„Importă din URL”** — extrage best-effort
     titlu, descriere, adresă și poze sugerate. Preluarea se face o singură dată, la cerere; nu rulează
     automat sau repetat. Booking.com poate bloca sau randa conținutul prin JavaScript, caz în care
     importul întoarce puține date sau eșuează — completează manual ce lipsește.
   - completează/verifică datele generale și salvează
   - adaugă facilități, poze și recenzii
   - apasă butonul „Ciornă” din colțul din dreapta sus pentru a publica proprietatea
4. Proprietatea publicată apare pe homepage (`/`) și la `/proprietati/[slug]`.

## Note despre import

Butonul „Importă din URL” nu este un scraper automat — face o singură cerere HTTP către pagina indicată,
în momentul apăsării, și încearcă să extragă date publice (meta tags Open Graph și JSON-LD schema.org).
Nu salvează nimic automat: administratorul revizuiește și confirmă manual. Această abordare a fost aleasă
în locul unui scraper repetat/automat pentru a evita riscul de încălcare a termenilor de utilizare Booking.com.

## Hosting recomandat

Aplicația folosește SQLite (fișier local) și stochează pozele uploadate pe disc
(`public/uploads/`), așa că are nevoie de **disc persistent**. Vercel nu e potrivit (filesystem efemer).

Recomandare: [Railway](https://railway.app) sau [Render](https://render.com) — ambele oferă un volum
persistent la cost mic, suficient pentru acest tip de aplicație. La deploy:

1. Setează variabilele de mediu (`ADMIN_PASSWORD`, `SESSION_SECRET`, `DATABASE_URL`)
2. Montează un disc persistent pentru `dev.db` și `public/uploads/`
3. Rulează `npx prisma migrate deploy` la fiecare deploy pentru a aplica migrațiile

## Stack tehnic

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- `jose` pentru sesiunea de admin (cookie httpOnly semnat)
- `cheerio` pentru parsarea best-effort din import
