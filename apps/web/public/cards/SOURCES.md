# Card art sources

All 79 images in this folder (`<card id>.webp` for the 78 cards, `back.webp`) are scans of one deck:

- **Deck**: _Jeu de tarot français à deux têtes dit « tarot allemand » ou « tarot nouveau »_, B.P. Grimaud (Baptiste-Paul Grimaud), Paris, 1898.
- **Original scans**: Bibliothèque nationale de France, Gallica, <http://gallica.bnf.fr/ark:/12148/btv1b10510159t>.
- **Downloaded from**: Wikimedia Commons, category [Tarot nouveau - Grimaud - 1898](https://commons.wikimedia.org/wiki/Category:Tarot_nouveau_-_Grimaud_-_1898), files `Tarot nouveau - Grimaud - 1898 - <Suit> - <Rank>.jpg`, `… - Trumps - <n>.jpg`, `… - Trumps - Excuse.jpg` and `… - Back side.jpg`.
- **Licence**: public domain (Commons: "Public domain", the artwork was published in 1898).
- **BnF reuse terms**: non-commercial reuse of Gallica reproductions of public-domain works is free, with the mention **« Source gallica.bnf.fr / BnF »** (shown on the home page). Commercial reuse needs a licence from the BnF (utilisation.commerciale@bnf.fr).

## Processing

`apps/web/scripts/fetch-cards.py` downloads each file as a 320 px wide Commons thumbnail and encodes it as WebP (quality 70). Nothing else is changed: the app clips the scan to the card outline and draws a corner index over it. File names are the engine's card ids (ADR-0001): `S01`–`S14`, `H…`, `D…`, `C…`, `T01`–`T21`, `EXC`.
