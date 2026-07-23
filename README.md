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

## Deploy pe hosting-ul Namecheap (cPanel, fără Terminal)

Aplicația e pregătită să ruleze prin funcția **„Setup Node.js App”** din cPanel (Passenger),
fără să ai nevoie de SSH/Terminal. Fișierul `server.js` din rădăcina proiectului e punctul de
intrare cerut de Passenger — la fiecare pornire, aplică automat migrațiile bazei de date și
pornește serverul.

### 1. Urcă proiectul pe GitHub

Ai nevoie de un cont GitHub (gratuit) și de un repo nou cu acest cod. Din folderul proiectului:

```bash
git remote add origin https://github.com/<user-ul-tau>/booking-showcase.git
git branch -M main
git push -u origin main
```

(`.env`, `dev.db` și pozele din `data/` NU se urcă — sunt excluse prin `.gitignore`.)

### 2. Clonează repo-ul pe hosting, din cPanel

cPanel → categoria **Files** → **„Git™ Version Control”** → **Create**:
- „Clone a Repository” → lipești URL-ul repo-ului tău GitHub
- Repository Path: un folder **în afara** lui `public_html` (ex: `booking-showcase`)
- Branch: `main` → Create

(Dacă nu vezi „Git Version Control” în cPanel: descarci repo-ul ca ZIP de pe GitHub și îl urci/dezarhivezi prin **File Manager**, în același folder.)

### 3. Creează aplicația Node.js

cPanel → categoria **Software** → **„Setup Node.js App”** → **Create Application**:

| Câmp | Valoare |
|---|---|
| Node.js version | cea mai recentă disponibilă (24.x) |
| Application mode | Production |
| Application root | folderul unde ai clonat (ex: `booking-showcase`) |
| Application URL | domeniul sau subdomeniul tău |
| Application startup file | `server.js` |

Apasă **Create**.

### 4. Variabile de mediu

Pe pagina aplicației create, la secțiunea **Environment variables**, adaugă:

| Variabilă | Valoare |
|---|---|
| `ADMIN_PASSWORD` | o parolă puternică, aleasă de tine |
| `SESSION_SECRET` | un string lung și aleator |

(`DATABASE_URL` și `UPLOAD_DIR` nu trebuie setate — implicit se salvează în folderul aplicației, care e permanent pe hosting-ul tău.)

### 5. Instalează și construiește

Apasă butonul **„Run NPM Install”** din pagina aplicației. Acesta rulează automat instalarea
pachetelor, generarea clientului Prisma și `next build` (poate dura câteva minute la prima
rulare — asta e configurat prin scriptul `postinstall` din `package.json`).

### 6. Pornește aplicația

Apasă **„Restart”**. La pornire, `server.js` aplică automat migrațiile bazei de date și
pornește serverul. Accesează domeniul tău în browser — ar trebui să vezi homepage-ul.

### După fiecare modificare de cod

```bash
git add -A
git commit -m "mesajul tău"
git push
```

Apoi în cPanel: **Git Version Control** → „Pull or Deploy” (aduce ultimele modificări) →
**Setup Node.js App** → „Run NPM Install” (reconstruiește) → „Restart”.

### Dacă ceva nu merge

Mediile de shared hosting variază mult între ele — dacă un pas nu se comportă exact așa
(buton lipsă, eroare la instalare, etc.), spune-mi exact ce vezi și te ajut să găsim alternativa.

## Alternativă: Railway (dacă renunți la hosting-ul Namecheap)

Dacă la un moment dat preferi ceva cu deploy automat la fiecare `git push` (fără să intri manual
în cPanel), [Railway](https://railway.app) e alternativa recomandată — conectezi același repo
GitHub, adaugi un volum persistent montat la `/app/data`, și setezi `DATABASE_URL=file:/app/data/dev.db`
+ `UPLOAD_DIR=/app/data/uploads` (pe lângă `ADMIN_PASSWORD`/`SESSION_SECRET`). Domeniul de la
Namecheap se conectează la fel, prin DNS (CNAME către adresa dată de Railway).

## Stack tehnic

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- `jose` pentru sesiunea de admin (cookie httpOnly semnat)
- `cheerio` pentru parsarea best-effort din import
