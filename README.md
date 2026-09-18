# Jiayi Su — personal academic website

Source adapted from [Jon Barron's academic website](https://jonbarron.info/). Please attribute the original template if you reuse this code.

Live site: [jiayisu.com](https://jiayisu.com/)

## Local preview

From this directory, run `python -m http.server 4173 --bind 127.0.0.1`, then open
`http://127.0.0.1:4173/`. No build step is required. Add `?settled=1` to disable
the particle animation for stable visual checks.

## Maintaining publications and visitor statistics

- Update both News and Publications when a paper is accepted or published.
  Accepted papers link to the conference until a proceedings URL is available.
- CEEGE 2026: [IEEE Xplore](https://ieeexplore.ieee.org/document/11637656),
  DOI `10.1109/CEEGE70076.2026.11637656`; citation in `data/su2026awtls.bib`.
- Visitors uses the official responsive MapMyVisitors embed for `jiayisu.com`
  (public project `1c5nr`). Its public embed identifier is not an account secret.
  Manage colors through the project's Widget Customization page. Keep the source
  width at the integer value `600`; site CSS scales the map responsively. The
  vendor's automatic width can request broken fractional-width background images
  and does not keep its inline map dimensions in sync with viewport changes.
  The external widget needs network access and may be blocked by privacy tools;
  the direct statistics link remains available. Preview visits may be counted.
  Historical Vercount totals are not imported by this change.
- Before publishing, check desktop and narrow/mobile layouts, the navigation
  menu, news archive, publication summaries, BibTeX download, and visitor map.
