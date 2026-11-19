# Card art sources

All 79 images in this folder (`<card id>.webp` for the 78 cards, `back.webp`) are scans of one deck:

- **Deck**: _Jeu de tarot français à deux têtes dit « tarot allemand » ou « tarot nouveau »_, B.P. Grimaud (Baptiste-Paul Grimaud), Paris, 1898.
- **Original scans**: Bibliothèque nationale de France, Gallica, <http://gallica.bnf.fr/ark:/12148/btv1b10510159t>.
- **Downloaded from**: Wikimedia Commons, category [Tarot nouveau - Grimaud - 1898](https://commons.wikimedia.org/wiki/Category:Tarot_nouveau_-_Grimaud_-_1898), files `Tarot nouveau - Grimaud - 1898 - <Suit> - <Rank>.jpg`, `… - Trumps - <n>.jpg`, `… - Trumps - Excuse.jpg` and `… - Back side.jpg`.
- **Licence**: public domain (Commons: "Public domain", the artwork was published in 1898).
- **BnF reuse terms**: non-commercial reuse of Gallica reproductions of public-domain works is free, with the mention **« Source gallica.bnf.fr / BnF »** (shown on the home page). Commercial reuse needs a licence from the BnF (utilisation.commerciale@bnf.fr).

## Processing

`apps/web/scripts/fetch-cards.py` downloads each file as Commons' 330 px wide thumbnail and encodes it as WebP (quality 70, about 2.2 MB for the 79 files; WebP was preferred to the JPEG first planned, at half the size). It needs `python3` and `cwebp` (`brew install webp`), no npm dependency. Nothing else is changed in the images: the app clips each scan to the card outline, cutting off the scan's paper margin, and draws its corner index (and, on trumps, number bands) over it.

File names are the engine's card ids (ADR-0001): Ace → `01`, Jack (Valet) → `11`, Knight (Cavalier) → `12`, Queen (Dame) → `13`, King (Roi) → `14`; trumps `T01`–`T21`; the Excuse `EXC`.

## Files

| File   | Commons file                                           |
| ------ | ------------------------------------------------------ |
| `S02`  | Tarot nouveau - Grimaud - 1898 - Spades - 02.jpg       |
| `S03`  | Tarot nouveau - Grimaud - 1898 - Spades - 03.jpg       |
| `S04`  | Tarot nouveau - Grimaud - 1898 - Spades - 04.jpg       |
| `S05`  | Tarot nouveau - Grimaud - 1898 - Spades - 05.jpg       |
| `S06`  | Tarot nouveau - Grimaud - 1898 - Spades - 06.jpg       |
| `S07`  | Tarot nouveau - Grimaud - 1898 - Spades - 07.jpg       |
| `S08`  | Tarot nouveau - Grimaud - 1898 - Spades - 08.jpg       |
| `S09`  | Tarot nouveau - Grimaud - 1898 - Spades - 09.jpg       |
| `S10`  | Tarot nouveau - Grimaud - 1898 - Spades - 10.jpg       |
| `S01`  | Tarot nouveau - Grimaud - 1898 - Spades - Ace.jpg      |
| `S11`  | Tarot nouveau - Grimaud - 1898 - Spades - Jack.jpg     |
| `S12`  | Tarot nouveau - Grimaud - 1898 - Spades - Knight.jpg   |
| `S13`  | Tarot nouveau - Grimaud - 1898 - Spades - Queen.jpg    |
| `S14`  | Tarot nouveau - Grimaud - 1898 - Spades - King.jpg     |
| `H02`  | Tarot nouveau - Grimaud - 1898 - Hearts - 02.jpg       |
| `H03`  | Tarot nouveau - Grimaud - 1898 - Hearts - 03.jpg       |
| `H04`  | Tarot nouveau - Grimaud - 1898 - Hearts - 04.jpg       |
| `H05`  | Tarot nouveau - Grimaud - 1898 - Hearts - 05.jpg       |
| `H06`  | Tarot nouveau - Grimaud - 1898 - Hearts - 06.jpg       |
| `H07`  | Tarot nouveau - Grimaud - 1898 - Hearts - 07.jpg       |
| `H08`  | Tarot nouveau - Grimaud - 1898 - Hearts - 08.jpg       |
| `H09`  | Tarot nouveau - Grimaud - 1898 - Hearts - 09.jpg       |
| `H10`  | Tarot nouveau - Grimaud - 1898 - Hearts - 10.jpg       |
| `H01`  | Tarot nouveau - Grimaud - 1898 - Hearts - Ace.jpg      |
| `H11`  | Tarot nouveau - Grimaud - 1898 - Hearts - Jack.jpg     |
| `H12`  | Tarot nouveau - Grimaud - 1898 - Hearts - Knight.jpg   |
| `H13`  | Tarot nouveau - Grimaud - 1898 - Hearts - Queen.jpg    |
| `H14`  | Tarot nouveau - Grimaud - 1898 - Hearts - King.jpg     |
| `D02`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 02.jpg     |
| `D03`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 03.jpg     |
| `D04`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 04.jpg     |
| `D05`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 05.jpg     |
| `D06`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 06.jpg     |
| `D07`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 07.jpg     |
| `D08`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 08.jpg     |
| `D09`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 09.jpg     |
| `D10`  | Tarot nouveau - Grimaud - 1898 - Diamonds - 10.jpg     |
| `D01`  | Tarot nouveau - Grimaud - 1898 - Diamonds - Ace.jpg    |
| `D11`  | Tarot nouveau - Grimaud - 1898 - Diamonds - Jack.jpg   |
| `D12`  | Tarot nouveau - Grimaud - 1898 - Diamonds - Knight.jpg |
| `D13`  | Tarot nouveau - Grimaud - 1898 - Diamonds - Queen.jpg  |
| `D14`  | Tarot nouveau - Grimaud - 1898 - Diamonds - King.jpg   |
| `C02`  | Tarot nouveau - Grimaud - 1898 - Clubs - 02.jpg        |
| `C03`  | Tarot nouveau - Grimaud - 1898 - Clubs - 03.jpg        |
| `C04`  | Tarot nouveau - Grimaud - 1898 - Clubs - 04.jpg        |
| `C05`  | Tarot nouveau - Grimaud - 1898 - Clubs - 05.jpg        |
| `C06`  | Tarot nouveau - Grimaud - 1898 - Clubs - 06.jpg        |
| `C07`  | Tarot nouveau - Grimaud - 1898 - Clubs - 07.jpg        |
| `C08`  | Tarot nouveau - Grimaud - 1898 - Clubs - 08.jpg        |
| `C09`  | Tarot nouveau - Grimaud - 1898 - Clubs - 09.jpg        |
| `C10`  | Tarot nouveau - Grimaud - 1898 - Clubs - 10.jpg        |
| `C01`  | Tarot nouveau - Grimaud - 1898 - Clubs - Ace.jpg       |
| `C11`  | Tarot nouveau - Grimaud - 1898 - Clubs - Jack.jpg      |
| `C12`  | Tarot nouveau - Grimaud - 1898 - Clubs - Knight.jpg    |
| `C13`  | Tarot nouveau - Grimaud - 1898 - Clubs - Queen.jpg     |
| `C14`  | Tarot nouveau - Grimaud - 1898 - Clubs - King.jpg      |
| `T01`  | Tarot nouveau - Grimaud - 1898 - Trumps - 01.jpg       |
| `T02`  | Tarot nouveau - Grimaud - 1898 - Trumps - 02.jpg       |
| `T03`  | Tarot nouveau - Grimaud - 1898 - Trumps - 03.jpg       |
| `T04`  | Tarot nouveau - Grimaud - 1898 - Trumps - 04.jpg       |
| `T05`  | Tarot nouveau - Grimaud - 1898 - Trumps - 05.jpg       |
| `T06`  | Tarot nouveau - Grimaud - 1898 - Trumps - 06.jpg       |
| `T07`  | Tarot nouveau - Grimaud - 1898 - Trumps - 07.jpg       |
| `T08`  | Tarot nouveau - Grimaud - 1898 - Trumps - 08.jpg       |
| `T09`  | Tarot nouveau - Grimaud - 1898 - Trumps - 09.jpg       |
| `T10`  | Tarot nouveau - Grimaud - 1898 - Trumps - 10.jpg       |
| `T11`  | Tarot nouveau - Grimaud - 1898 - Trumps - 11.jpg       |
| `T12`  | Tarot nouveau - Grimaud - 1898 - Trumps - 12.jpg       |
| `T13`  | Tarot nouveau - Grimaud - 1898 - Trumps - 13.jpg       |
| `T14`  | Tarot nouveau - Grimaud - 1898 - Trumps - 14.jpg       |
| `T15`  | Tarot nouveau - Grimaud - 1898 - Trumps - 15.jpg       |
| `T16`  | Tarot nouveau - Grimaud - 1898 - Trumps - 16.jpg       |
| `T17`  | Tarot nouveau - Grimaud - 1898 - Trumps - 17.jpg       |
| `T18`  | Tarot nouveau - Grimaud - 1898 - Trumps - 18.jpg       |
| `T19`  | Tarot nouveau - Grimaud - 1898 - Trumps - 19.jpg       |
| `T20`  | Tarot nouveau - Grimaud - 1898 - Trumps - 20.jpg       |
| `T21`  | Tarot nouveau - Grimaud - 1898 - Trumps - 21.jpg       |
| `EXC`  | Tarot nouveau - Grimaud - 1898 - Trumps - Excuse.jpg   |
| `back` | Tarot nouveau - Grimaud - 1898 - Back side.jpg         |
