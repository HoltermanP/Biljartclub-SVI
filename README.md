# Biljartclub SVI

Webapplicatie voor carambolebiljarten. Beheert leden, competities en partijen.

**Tech:** Next.js 14 (App Router) · Neon PostgreSQL · Tailwind CSS · Vercel

---

## Installatie

```bash
npm install
```

## Neon database setup

1. Maak een account op [console.neon.tech](https://console.neon.tech)
2. Maak een nieuw project aan
3. Kopieer de **connection string** (begint met `postgresql://...`)
4. Bewerk `.env.local` en vul `DATABASE_URL` in met jouw connection string
5. Start de dev server en open `http://localhost:3000/api/setup` in je browser om de tabellen aan te maken

## Development

```bash
npm run dev
```

Ga naar `http://localhost:3000`

## Vercel deploy

1. Push de code naar GitHub
2. Importeer het project in [vercel.com](https://vercel.com)
3. Voeg de volgende environment variables toe in Vercel:
   - `DATABASE_URL` — jouw Neon connection string
   - `NEXT_PUBLIC_BASE_URL` — de URL van je Vercel deployment (bijv. `https://biljart-svi.vercel.app`)
4. Deploy!
5. Open na de deploy `https://jouw-app.vercel.app/api/setup` om het schema aan te maken

---

## Puntensysteem

```
C (caramboles) × 10 / N (moyenne) = basispunten
+ 2 punten bij winst
+ 1 punt bij remise (beide spelers)
+ 3 punten als partijgemiddelde > persoonlijk gemiddelde
```

**Partijgemiddelde** = totaal caramboles / aantal beurten (max 30)

### Voorbeeld
- Speler met moyenne 2.00 maakt 65 caramboles in 30 beurten
- Partijgemiddelde: 65/30 = 2.167 → boven moyenne ✓
- Basispunten: 65 × 10 / 2 = 325
- Winst: +2
- Boven moyenne: +3
- **Totaal: 330 punten**

---

## Pagina's

| Pagina | Beschrijving |
|--------|-------------|
| `/` | Dashboard met statistieken |
| `/members` | Ledenbeheer (toevoegen, bewerken, verwijderen) |
| `/competitions` | Competitie-overzicht en aanmaken |
| `/competitions/[id]` | Ranglijst, gespeelde en geplande partijen |
| `/match/[id]` | Live scorebord voor beurtregistratie |
| `/api/setup` | Eenmalig: database schema aanmaken |
