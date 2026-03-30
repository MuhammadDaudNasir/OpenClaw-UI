# Update Log

## 2026-03-30

### Skill Builder Upgrade
- Reworked visual skill builder to start on an empty canvas by default.
- Added delete controls for nodes.
- Added explicit graph links with support for multiple inbound links per node.
- Added free-canvas panning (drag empty canvas to move around the map).
- Expanded node library to 18 typed nodes with color identifiers.
- Added link-preview and node/edge motion animations.
- Reworked generated AI prompt to include:
  - explicit node inventory
  - explicit graph connections
  - build rules and completion constraints
- Fixed reset behavior to fully clear nodes, links, link selection, and viewport.

### Windows Reliability
- Kept Windows packaging path stable (`npm run dist:win`) and cross-platform postinstall behavior.
