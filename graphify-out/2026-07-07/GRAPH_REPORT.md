# Graph Report - .  (2026-07-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 25 nodes · 66 edges · 7 communities (3 shown, 4 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 197 input · 524 output

## Graph Freshness
- Built from commit: `19762f65`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Home Dashboard & Notes
- Bitcoin Price UI
- Legacy Note Sender
- Original Feature Controls
- Notes & Weather
- Weather Webhook Sender

## God Nodes (most connected - your core abstractions)
1. `Home / My Control Panel` - 12 edges
2. `Notes` - 7 edges
3. `getWeather()` - 6 edges
4. `getNotes()` - 6 edges
5. `Existing Features` - 6 edges
6. `Get Notes` - 6 edges
7. `Christian History` - 6 edges
8. `Old Index` - 6 edges
9. `Original Features` - 6 edges
10. `Weather` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Fresh Layout` --calls--> `updateBitcoinPrice()`  [EXTRACTED]
  fresh-layout.html → fresh-script.js
- `Fresh Layout` --calls--> `getBitcoinPrices()`  [EXTRACTED]
  fresh-layout.html → fresh-script.js
- `Old Index` --calls--> `getWeather()`  [EXTRACTED]
  old-index.html → script.js
- `Original Features` --calls--> `getWeather()`  [EXTRACTED]
  original-features.html → script.js
- `Weather & Notes` --calls--> `getWeather()`  [EXTRACTED]
  weather-notes.html → script.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pages participating in the Get Notes feature** — getnotes_page, notes_page, original_features_page, weather_notes_page, old_index_page [INFERRED 0.80]

## Communities (7 total, 4 thin omitted)

### Community 0 - "Home Dashboard & Notes"
Cohesion: 0.56
Nodes (9): Existing Features, Experiment (Lab Space), Get Notes, Christian History, Home / My Control Panel, New Tools, Notes, Notes Tools (index page for notes) (+1 more)

### Community 1 - "Bitcoin Price UI"
Cohesion: 0.83
Nodes (3): Fresh Layout, getBitcoinPrices(), updateBitcoinPrice()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fresh Layout` connect `Bitcoin Price UI` to `Home Dashboard & Notes`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Why does `Home / My Control Panel` connect `Home Dashboard & Notes` to `Bitcoin Price UI`, `Original Feature Controls`, `Notes & Weather`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `Notes` connect `Home Dashboard & Notes` to `Feature Display Script`, `Legacy Note Sender`, `Notes & Weather`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._