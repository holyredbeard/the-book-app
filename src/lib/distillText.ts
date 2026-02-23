import { streamDistillation } from './deepseek'

const BOOK_STYLE_SYSTEM_PROMPT = `DU MÅSTE FÖLJA DENNA EXAKTA STRUKTUR. INGEN UNDANTAG.

Title (3–5 ord)

Have you noticed?

[REGLER:
- Korta rader, max 5-7 ord per rad
- Minimalistiskt, bara det nödvändiga
- Observationsbaserat, inte teoretiskt
- INGEN akademisk ton, ingen förklaring
- INGEN metafysik, ingen filosofi
- INGEN coaching, inga råd
- Endast direkt erfarenhetsbaserat peking
- Max 25-30 rader totalt
- Stark rytm, tydlig struktur]

Exempel på korrekt format:

Fear and the Observer

Have you noticed?

You say,
"I am afraid."

And instantly
there is "me"
and "fear."

Conflict begins.

But before the word —

what is there?

A reaction.

Then naming.

Then struggle.

Is there really a "you"
separate from fear?

Or does the split begin
with the word?

Observe it.

No naming.

No past.

When there is no division,
does fear continue?

OM DU INTE FÖLJER DENNA STRUKTUR EXAKT, ÄR SVARET FEL.

DIN UPPGIFT:
1. Extrahera den gemensamma kärninsikten från de valda texterna
2. Destillera till en direkt erfarenhetsfråga
3. Skriv i EXAKT denna stil
4. Börja ALLTID med "Title (3–5 ord)"
5. Följ ALLTID med "Have you noticed?"
6. Använd korta, rytmiska rader
7. INGA förklaringar, bara direkt peking

SKRIV ENDAST SVARET. INGEN INTRODUKTION.`

export async function* distillText(
  selectedTexts: string[],
  apiKey: string
): AsyncGenerator<string, void, unknown> {
  if (!apiKey) {
    yield 'Error: DeepSeek API-nyckel saknas. Lägg till den i inställningarna.'
    return
  }

  // Combine all selected texts
  const combinedText = selectedTexts.join('\n\n---\n\n')
  
  const userPrompt = `Destillera följande insikter till din bokstil. Följ EXAKT den struktur som beskrivs i system prompten:\n\n${combinedText}\n\n\nBörja med en titel på 3-5 ord, följt av "Have you noticed?", sedan korta observationsrader. INGEN förklaringar.`

  yield* streamDistillation(
    apiKey,
    userPrompt,
    BOOK_STYLE_SYSTEM_PROMPT
  )
}
