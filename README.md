# Home Assistant check-up

A **read-only** health check for Home Assistant. You paste a short template into
*Settings → Tools → Template*, it prints one line, and a web page turns that line into a score
from 0 to 100, a floor plan of your house with every problem circled in red, and the steps to fix
each one.

**Try it:** <https://domotikpro.it/check-up/en> (Italian: <https://domotikpro.it/check-up>)

## What it looks for

- entities that are `unavailable`, grouped by device and by integration
- "ghost" entities (`restored: true`: still in the registry, no integration provides them),
  split into *safe to delete* and *the integration is failing, do not delete*
- broken automations and scripts
- automations that never ran, have been idle for 90+ days, or are turned off
- batteries at 20% or lower
- pending updates
- entities with no area (counted per device, so you can move a whole device at once)

## Is it safe?

The template only **reads states**. It calls no service, writes nothing and changes nothing.
You can read the whole file before using it: [`snippet/checkup.jinja`](snippet/checkup.jinja).

The analysis runs in your browser. Nothing you paste is sent to a server: open the Network tab
and press the button, you will see no request.

## How to use it

1. Copy [`snippet/checkup.jinja`](snippet/checkup.jinja).
2. In Home Assistant open *Settings → Tools → Template*, select the example text, delete it and
   paste the snippet.
3. After a couple of seconds a very long line starting with `CHECKUP:` shows up on the right.
   Copy all of it.
4. Paste it into <https://domotikpro.it/check-up/en>.

It uses `config_entry_id` / `config_entry_attr`, which exist in recent versions of Home Assistant.
Where they are missing the template skips them instead of failing, and you get the report without
the per-device grouping.

## Output format

One line, `CHECKUP:` followed by JSON:

```json
{
  "v": 2,
  "n": 2054,            // all entities
  "w": 1086,            // "furnishable" entities (lights, sensors, switches, ...)
  "wn": 637,            // ... of which with no area
  "au": 61,             // automations
  "ar": [["Kitchen", 87]],            // [area name, entities in it]
  "na": [["Router", 3]],              // top devices by entities without an area ("" = no device)
  "pt": 390,            // total number of problems
  "p": [                // first 400 problems
    ["nd", "sensor.x", "Name", "Area|null", "", "Device|null", "integration|null", "loaded|null"]
  ]
}
```

Problem kinds: `nd` unavailable, `ab` broken automation/script, `gh` ghost, `bt` low battery,
`up` update pending, `an` automation never triggered, `aw` automation idle for 90+ days,
`ao` automation turned off. For `nd`, `ab` and `gh` the last three fields are device,
integration domain and integration state.

## The score

The weights are public. [`src/score.ts`](src/score.ts) is the exact function the site uses:

| Vital sign | Weight |
|---|---|
| Connection (unavailable entities) | 30 |
| Batteries | 15 |
| Order (entities without an area) | 15 |
| Automations | 15 |
| Updates | 15 |
| Cleanliness (ghost entities) | 10 |

It is a compass, not a standard: use it to compare your house with itself over time.

## What is and isn't here

The template, the output format and the scoring are here under the MIT license. The page that
draws the floor plan and the leaderboard is part of the DomotikPro site and is not in this repo.

## License

MIT. See [LICENSE](LICENSE).
