# Chat Archive Manager – Bokhjälp

En webbapp för att hantera och söka i ChatGPT-exporter, med fokus på att hitta konversationer om Lester Levenson och andra ämnen.

## Funktioner

- **Filuppladdning**: Drag & drop eller välj din `conversations.json` från ChatGPT-exporten
- **Smart sökning**: Fuzzy search med Fuse.js för att hitta konversationer
- **Filtrering**: Filtrera på Lester/Levenson, Custom GPTs eller vanliga ChatGPT-konversationer
- **AI-assistans**: Ställ frågor om ditt arkiv med DeepSeek AI (kräver API-nyckel)
- **Export**: Ladda ner konversationer som markdown-filer
- **Virtualiserad tabell**: Hanterar stora arkiv (295+ MB) effektivt

## Tech Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (dark mode)
- **TanStack Table v8** med virtualisering
- **Zustand** för state management
- **Fuse.js** för fuzzy search
- **date-fns** för datumformatering

## Kom igång

```bash
# Installera beroenden
npm install

# Starta utvecklingsserver
npm run dev

# Bygg för produktion
npm run build
```

## Användning

1. Exportera dina ChatGPT-konversationer från **Settings → Data controls → Export data**
2. Ladda upp `conversations.json` i appen
3. Sök, filtrera och bläddra bland dina konversationer
4. Använd AI-läget för att ställa frågor om innehållet (kräver DeepSeek API-nyckel)
5. Exportera relevanta konversationer som markdown

## DeepSeek API

För AI-funktionen behöver du en DeepSeek API-nyckel:
1. Gå till [platform.deepseek.com](https://platform.deepseek.com/api_keys)
2. Skapa en API-nyckel
3. Lägg till nyckeln i inställningarna (kugghjulet i övre högra hörnet)
