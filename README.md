# 🏀 Basketbal-klassement (gedeelde versie)

Mini-website met een **centrale database** zodat iedereen dezelfde rangschikking ziet.  
Frontend = statische `index.html`. Backend = Node/Express met JSON-bestand (`data.json`).

## Snel starten (lokaal)

```bash
# 1) Download/uitpakken
npm install
# 2) Start met admin sleutel (verander dit!)
ADMIN_KEY=waregem2025 npm start
# Server draait op http://localhost:3000
```

Open daarna `http://localhost:3000` in je browser. Klik rechtsboven **Admin login** en geef je **ADMIN_KEY** in.

## Deploy (gratis en snel)

### Optie A — Render
1. Maak een gratis account op render.com
2. Maak een **New Web Service**
3. Koppel naar je repo of upload ZIP
4. **Build Command:** _leeg laten_ (niet nodig)
5. **Start Command:** `npm start`
6. Voeg bij **Environment**: `ADMIN_KEY=…` (kies je wachtwoord)
7. Deploy → je krijgt een publieke URL

### Optie B — Railway / Fly.io / Cyclic / Northflank
- Start command: `npm start`
- Poort: app luistert op `process.env.PORT`

### Optie C — Docker
```
docker build -t klassement .
docker run -e ADMIN_KEY=waregem2025 -p 3000:3000 klassement
```

## API (voor gevorderden)
- `GET /api/state` → huidige teams/games
- `POST /api/game` (admin) body: `{date?, home, away, homeScore, awayScore}`
- `PUT /api/game/:id` (admin)
- `DELETE /api/game/:id` (admin)
- `POST /api/team` (admin) `{name}`
- `PUT /api/team/rename` (admin) `{oldName,newName}`
- `DELETE /api/team` (admin) `{name}`

Authenticatie: header `x-admin-key: <ADMIN_KEY>`.

## Opmerkingen
- Data wordt bewaard in `data.json` op de server. Maak een back-up als je wil.
- Pas `ADMIN_KEY` zeker aan voor productie.
- `index.html` en `server.js` zitten in dezelfde map; Express serveert de frontend.
