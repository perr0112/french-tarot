# The deal score is a sum of terms signed from the taker's side

AGENTS.md first wrote the score as `(25 + gap + petitAuBout) × multiplier + poignée + chelem`, signed by the contract result. That is wrong whenever the petit au bout or a chelem goes to the side that lost the contract: the FFT rulebook (see `docs/research/fft-rules.md`) adds the petit au bout _after_ multiplying, for the side that achieved it regardless of the contract, and signs the chelem by the side that made (or failed) it. We therefore compute `S = c·(25 + gap)·mult + p·10·mult + c·poignée + chelem`, where `c` is ±1 for the contract, `p` is +1/−1/0 for the petit au bout, and `chelem` is +400/+200/−200 for the taker's side or −200 when the defence wins every trick. Each term is kept separately in the deal's breakdown so the score sheet can show it.

## Consequences

- The Excuse exchange is settled at scoring time (the owner's side keeps the Excuse and always gives half a point to the trick winner's side, except on a non-chelem last trick), so play does not track an "owed card".
