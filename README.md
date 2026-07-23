# Booking Showcase

Pagini de prezentare ("trust pages") pentru proprietățile tale de pe Booking.com — poze, facilități și
recenzii de la clienți, plus un panou de administrare pentru a le gestiona. Site-ul public și panoul
admin sunt în engleză; acest README e în română, pentru tine ca operator.

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
- `UPLOAD_DIR` — opțional local (implicit `./data/uploads`); obligatoriu în producție, vezi secțiunea de deploy

## Adăugarea primei proprietăți

1. Autentifică-te în `/admin`.
2. Apasă „Add property” și dă-i un nume.
3. Pe pagina proprietății:
   - (opțional) folosește secțiunea „Import from Booking.com” — recomandat modul „From pasted HTML”
     (Booking.com blochează cererile automate directe de pe server)
   - completează/verifică datele generale și salvează
   - adaugă facilități, poze și recenzii
   - apasă butonul „Draft” din colțul din dreapta sus pentru a publica proprietatea
4. Proprietatea publicată apare pe homepage (`/`) și la `/properties/[slug]`.

## Note despre import

Butonul de import nu este un scraper automat — face o singură cerere (sau parsează HTML-ul lipit de tine),
în momentul apăsării, și încearcă să extragă date publice (meta tags Open Graph și JSON-LD schema.org).
Nu salvează nimic automat: administratorul revizuiește și confirmă manual.

## Deploy pe Railway + domeniu de la Namecheap

Aplicația folosește SQLite și stochează pozele pe disc, așa că are nevoie de **disc persistent**
(Vercel nu e potrivit — filesystem efemer). Railway oferă asta simplu și ieftin.

### 1. Urcă proiectul pe GitHub

Ai nevoie de un cont GitHub (gratuit) și de un repo nou cu acest cod. Din folderul proiectului:

```bash
git remote add origin https://github.com/<user-ul-tau>/booking-showcase.git
git branch -M main
git push -u origin main
```

(`.env`, `dev.db` și pozele din `data/` NU se urcă — sunt excluse prin `.gitignore`.)

### 2. Creează proiectul pe Railway

1. Cont pe [railway.app](https://railway.app) (poți intra direct cu GitHub)
2. „New Project” → „Deploy from GitHub repo” → alege repo-ul `booking-showcase`
3. Railway detectează automat Next.js și rulează `npm install` + `npm run build` + `npm run start`

### 3. Adaugă un volum persistent

În setările serviciului → tab **Volumes** → „New Volume”:
- Mount path: `/app/data`

Acesta va ține baza de date SQLite și pozele uploadate, ca să nu se piardă la fiecare redeploy.

### 4. Variabile de mediu

În tab-ul **Variables**, adaugă:

| Variabilă | Valoare |
|---|---|
| `ADMIN_PASSWORD` | o parolă puternică, aleasă de tine |
| `SESSION_SECRET` | un string lung și aleator (ex: generat cu `openssl rand -hex 32`) |
| `DATABASE_URL` | `file:/app/data/dev.db` |
| `UPLOAD_DIR` | `/app/data/uploads` |

Migrațiile bazei de date rulează automat la fiecare deploy (`npm run start` include `prisma migrate deploy`).

### 5. Conectează domeniul de la Namecheap

1. Cumpără domeniul pe [namecheap.com](https://namecheap.com) (asta o faci tu direct, e o achiziție)
2. În Railway, tab-ul **Settings** al serviciului → „Custom Domain” → introdu domeniul tău → Railway îți dă
   o valoare CNAME (ceva de genul `xxxxx.up.railway.app`)
3. În contul Namecheap → „Domain List” → „Manage” lângă domeniul tău → „Advanced DNS” → adaugă:
   - Tip `CNAME`, Host `@` sau `www` (după cum ceri în Railway), Value = valoarea primită de la Railway
4. Așteaptă propagarea DNS (de obicei sub o oră) — Railway emite automat certificat SSL după ce DNS-ul e valid

### După fiecare modificare de cod

```bash
git add -A
git commit -m "mesajul tău"
git push
```

Railway redeploy-uiește automat la fiecare push pe `main`.

## Stack tehnic

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- `jose` pentru sesiunea de admin (cookie httpOnly semnat)
- `cheerio` pentru parsarea best-effort din import
