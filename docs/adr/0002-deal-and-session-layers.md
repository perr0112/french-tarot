# The engine has two layers: Deal and Session

The engine models a **Deal** (a state machine from dealing to scoring or cancellation) and a thin **Session** above it (dealer rotation, redeals, cumulative score sheet, end after N played deals). Seating, nicknames, bots and connections belong to the room server, so `lobby` is not an engine phase. Session rules such as "the next dealer redeals after a petit sec" are FFT rules, which is why the Session lives in the engine rather than in the server, while each Deal stays small enough to test in isolation.

There is also no `declarations` phase: the FFT has a poignée shown _with_ the player's first card, so it is an optional field of that `playCard` action, and the only pre-play step is a `chelemDecision` for the taker (when chelem announcements are enabled).
