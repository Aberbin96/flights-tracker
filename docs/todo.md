# Project TODO List

## Core Engine & Data Consistency
- [x] **Automated Verification System**: Implemented `/api/verify` and `runAutoVerification` for real-time tracking (Takeoffs, Landings, Delays).
- [x] **Cron Schedule Optimization**: Sync reduced to 2x/day, Cleanup removed, Verification added every 20m.
- [ ] **Aircraft Registry Cache**: Create a table to cache `tail_number` <-> `icao24` to save API hits.
- [ ] **Aircraft Enrichment**: Improve `/api/enrich-aircraft` by integrating OpenSky discovery for unknown registrations.

## Verification & Status Logic
- [ ] **OpenRadar/OpenSky Integration**: Enhance the verification process to reconcile data with OpenRadar/OpenSky more proactively.
- [x] **Verification Service (OpenSky)**: Base implementation completed.
- [x] **Proximity Logic**: Basic logic implemented (dist < 10km, alt < 1000ft).
- [ ] **Airport Board Scraper**: Implement Maiquetía board scraper as a fallback source.

## UI & User Experience
- [ ] **Donation Widgets**: Add "Buy Me a Coffee" links.
- [ ] **Enhanced Feedback**: Show verification logs/status in the admin UI.
