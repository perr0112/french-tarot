# Cards are typed string ids

A card is a string id from a closed TypeScript union of 78 values: `S01`–`S14`, `H01`–`H14`, `D01`–`D14`, `C01`–`C14` (11 Valet, 12 Cavalier, 13 Dame, 14 Roi), trumps `T01`–`T21`, and `EXC` for the Excuse. Suit, rank and points are derived by helper functions. We chose ids over objects (`{ kind: 'trump', value: 21 }`) and over numbers `0–77` because ids compare with `===`, serialise and validate with zod for free, sort naturally, and stay readable in tests and logs (`hand: ['T21', 'EXC', 'H14']`), while the compiler still rejects any card that does not exist.
