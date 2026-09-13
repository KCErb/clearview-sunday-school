# Latter-day Saints Design System

A working design system for making **Sunday School class materials** — slides, handouts, simple screens — that sit comfortably alongside the visual identity of The Church of Jesus Christ of Latter-day Saints.

> **Read this first.** This is an *unofficial, local-use* system, assembled from the Church's publicly published communication guidance. It is not a Church product, it contains none of the Church's trademarked marks, and it is not approved for official or correlated communications. Section 4 of the *Church Communication Guide* is explicit that its visual standards "are used by people who are approved to create official Church materials." Materials made for a ward class are not official Church materials. Follow the spirit of the identity; do not claim it.

## Sources used

Everything here was derived from public pages. No codebase, Figma file or asset package was provided.

| Source | Link | What was taken |
|---|---|---|
| Church Communication Guide, Section 4: Visual Design | https://guide.churchofjesuschrist.org/section-4-visual-design?lang=eng | Purpose and scope of the visual identity |
| 4.2.4 Typography | https://guide.churchofjesuschrist.org/4-2-4-typography?lang=eng | McKay Pro and Zoram are the only approved typefaces |
| 4.2.5 Colors | https://guide.churchofjesuschrist.org/4-2-5-colors?lang=eng | Palette rationale |
| **Official palette chart v4.0** (supplied by the user) | `uploads/color-palettes.json` | **Every color value in this system**, verbatim — hex, CMYK, RGB and PMS per swatch |
| 4.2.2 Wordmark | https://guide.churchofjesuschrist.org/4-2-2-wordmark?lang=eng | Mark protection rules, contrast minimums, cautions |
| Section 3: Our Voice | https://guide.churchofjesuschrist.org/section-3-our-voice?lang=eng | Tone and voice principles |
| Seminaries & Institutes Style Guide | https://www.churchofjesuschrist.org/si/style-guide?lang=eng | Imagery do's and don'ts; local-use restrictions |
| tsitedesign portfolio (design system case study) | https://tsitedesign.com/portfolio/the-church-of-jesus-christ-of-latter-day-saints-design-system/ | Product inventory; atomic/cascading structure |

**Products the Church's real design system covers** (from the case study): ChurchofJesusChrist.org, Gospel Library (iOS/Android/web), Member Tools, My Home, Gospel Stream, Sacred Music, Book of Mormon apps, General Conference, Come Follow Me, Newsroom, calendar and ward map — about 13K components across Web, iOS, Android, OTT and wearables, translated into 115 languages. **No UI-kit recreations of those products are included here** — see Gaps.

---

## Content fundamentals

**Voice.** Warm, plain, unhurried, and reverent without being ornate. The guide's own sentences are the model: *"We want each communication to feel familiar and to represent the Savior's Church."* Short declaratives. Ordinary words. No marketing verbs.

**Person.** First person plural for the community — *we, us, our*. Second person for an invitation — *"Invite two class members to read aloud."* Avoid *you should*; the brand invites, it does not instruct.

**Casing.** Sentence case for headings and buttons ("Begin lesson", not "Begin Lesson"). Uppercase only for small sans-serif overlines at 12–24px with wide tracking. Never all-caps headlines.

**Reverence rules that actually change the copy.**
- Capitalize deity pronouns: *He, Him, His, Himself*.
- "The Church of Jesus Christ of Latter-day Saints" in full on first reference; "the Church" after. "Latter-day Saints" for members. Avoid "Mormon" and "LDS".
- Scripture is quoted verbatim with a reference. Never paraphrase inside a `ScriptureBlock`.
- Attribute quotations by name, then role: *Russell M. Nelson · President of the Church*.
- Artwork carries its credit line: *Carl Heinrich Bloch, Christ Healing the Sick at Bethesda, 1883*.

**Emoji.** Never. Not in slides, not in UI, not in headings. This is the single most common way a well-meant class slide stops looking like Church material.

**Punctuation and length.** Full sentences, serial comma, em dashes sparingly. A slide holds one idea; if it needs a second sentence, it needs a second slide.

**Examples.**
- Title slide: `I Am the Good Shepherd` / `John 10 · Week 34`
- Question slide: `What does it mean to know His voice?`
- Closing invitation: `Listen for one prompting, and act on it.`
- Button: `Begin lesson` · `Save to study list` · `Present`

---

## Visual foundations

**The feeling.** Quiet, warm, and light-filled. Generous white space doing most of the work. Nothing shouts; nothing sparkles.

**Color.** The palette is the Church's own version 4.0 chart, transcribed swatch for swatch. Six families — **Blue, Red, Yellow, Green** in the color palette, **Gray** (cool) and **Neutral** (warm) in the neutral palette — each numbered 5 through 40, plus **Christmas** and **Easter** campaign palettes. Token names keep the printed names exactly: `--blue-25` is Blue 25 on the chart.

How the system uses it: a warm paper ground (**Neutral 5** #EFEFE7), **Blue 25** #007DA5 as the single interactive accent, **Blue 40** #003057 for reverent full-field slides, **Gold 20** #C1A01E for the thin accent rule on light grounds and **Gold 10** #DBBF6B on dark, **Black** for text (the chart's own note: "use for text"), **Gray 40** for body copy. The guide's rationale: blues and greens read as growth and spirituality; warm hues read as relationship with God. Maximum two background colors per deck — paper and Blue 40.

Rules the chart carries with it: the wordmark guidance calls for swatch **25 and higher** where contrast matters; **Gold 20** rather than Gold 10 whenever gold stands alone on white; **Rich Black** (CMYK 75/68/67/90) only for large solid areas in print; **Christmas Gold Metallic** is PMS 871C with no screen equivalent. Campaign palettes are seasonal — do not borrow Easter purple for an ordinary lesson.

**Type.** Serif leads. `--font-serif-display` for every heading, title, quotation and body passage; `--font-sans` only for labels, captions, overlines, buttons and UI chrome. Display type is set tight (−0.015 to −0.02em, 1.05–1.08 line height); body is loose (1.6) inside a 66-character measure. Slide text never drops below 24px at 1920×1080.

**Backgrounds.** Flat color or a full-bleed photograph. **No gradients as decoration** — the only gradients in the system are the two protection scrims that keep type legible over imagery (`--scrim-bottom`, `--scrim-full`, deep blue at 82–86% falling to zero). No repeating patterns, no textures, no noise. The Church's light-ray graphic is an official asset and is not reproduced here.

**Imagery.** Personal, candid, human, authentic; both color and black-and-white, with creative use of light. Warm-leaning, never heavily graded, never artificially tinted or colorized. No posed stock photography of members. Faces and hands over objects. Artwork of the Savior comes from the Church's Media Library only.

**Layout.** 1920×1080 slides with a 112px side / 80px top-bottom margin and a 48px gutter; screens sit in a 1120px page container with a 720px text container. Content is left-aligned by default; centered only on question and closing slides. A single element hierarchy per slide: overline → title → gold rule → body.

**Borders and rules.** 1px hairlines (`--border-subtle`) for dividers and card edges. A 2px gold rule at the left of a scripture quote. A 120px × 5px gold rule under slide titles — this short rule is the system's one recurring graphic device.

**Corner radii.** Restrained. 4px is the default for buttons, inputs and cards' inner elements; 6px for cards; 10px for dialogs; 2px for badges. Pills are used for exactly one thing — `Tag`. Nothing else is rounded more than 10px.

**Cards.** White surface, 1px warm hairline border, 6px radius, **no shadow by default**. `elevation="raised"` adds a barely-there 1px/3px shadow; `floating` a 4px/12px one. Accent cards take a 4px cerulean rule along the **top** — never a colored left border.

**Shadows.** Low, warm-grey, two-layer, tinted with `rgba(28,26,24,·)` so they never read as blue. Inner shadows are not used. Elevation is a last resort; borders carry most separation.

**Transparency and blur.** Only in two places: the dialog scrim (deep blue at 52% with a 14px blur) and photo protection scrims. Never on text — type is always full-opacity ink, never a muted `color-mix`.

**Animation.** Quiet fades and short position shifts. 140ms for interaction feedback, 220ms for state change, 600ms for a slide reveal, all on `cubic-bezier(.4,0,.2,1)`. **No bounce, no spring, no parallax, no auto-playing motion behind text.** Every duration collapses to 0 under `prefers-reduced-motion`.

**Hover / press / focus.** Hover *darkens* a filled control one step (`--accent` → `--accent-hover`); press darkens one further (`--accent-press`). Quiet and secondary controls fill with a faint tint instead. **Nothing scales, lifts or shrinks on press.** Focus is a 2px gold ring at 2px offset — gold is used here precisely because it never appears as a fill.

**Contrast.** The wordmark guidance sets the floor for the whole system: at least a 50% value difference between element and ground. In practice, 4.5:1 for body text, 3:1 for headline-scale type.

---

## Iconography

The Church's product icon set is internal and was not available. **Flagged substitution: this system uses [Lucide](https://lucide.dev) 0.462.0 from jsDelivr CDN** — a 2px-stroke, rounded-cap, outline-only set that matches the restraint of Church UI better than a filled or duotone set would.

- Use the `Icon` component; it masks the CDN SVG to `currentColor` so glyphs inherit their parent's color. Default size 20px; 24px on slides.
- Outline style only. Never mix filled and outline glyphs.
- **Emoji are never used as icons.** Unicode symbols (✓, →) are not used as icons either — use `check` and `arrow-right`.
- The Church symbol, wordmark, cornerstone and light-ray graphic are **not icons** and must never be used as one.
- If you obtain the Church's own icon assets, drop the SVGs into `assets/icons/` and point `Icon`'s `CDN` constant at that folder — no other change is needed.

## Logo and marks

**No logo files are included, and none were drawn.** The Christus-arch symbol, the cornerstone, the official wordmark and the light-ray graphic are trademarked assets released only to approved correlated channels — the S&I guide states plainly: *do not use official Church logos, icons, or light rays.* Where a mark would go, this system sets the name of the Church in type via the `Wordmark` component, which is ordinary typography and not a reproduction of the trademark. **Even that lockup does not belong on ward or class materials** — placing the name of the Church as an identity mark on a lesson deck implies correlation-committee approval the maker does not have. Class slides identify themselves in plain text: *Clearview Ward · Sunday School*. `Wordmark` exists for authorized contexts only. If you are authorized and hold the official files, place them in `assets/logos/` and swap `Wordmark` for an `<img>`.

---

## Index

**Root**
- `styles.css` — the single entry point; `@import`s everything below
- `thumbnail.html` — system tile
- `SKILL.md` — Agent Skills wrapper
- `readme.md` — this file

**Tokens** (`tokens/`) — `fonts.css`, `colors.css`, `semantic.css`, `typography.css`, `spacing.css`, `shape.css`, `motion.css`, `base.css`

**Components**
- `components/core/` — **Button**, **IconButton**, **Icon**, **Card** (with **CardMedia**), **Badge**, **Tag**, **Divider**
- `components/forms/` — **Input**, **Select**, **Checkbox**, **Radio**, **Switch**
- `components/feedback/` — **Callout**, **Dialog**, **Tooltip**
- `components/navigation/` — **Tabs**, **Breadcrumb**
- `components/brand/` — **Wordmark**, **ScriptureBlock**, **PullQuote**, **MediaFrame**

Each has a sibling `.d.ts` (props) and `.prompt.md` (what & when, with an example).

**Intentional additions** — components with no counterpart in a provided source, added because the system needs them:
- `Icon` — a wrapper so every glyph comes from one place and inherits color.
- `Wordmark` — a type-only name lockup, so layouts have a correct stand-in for a mark that is deliberately absent.
- `ScriptureBlock`, `PullQuote`, `MediaFrame` — quotation and credit patterns the content rules demand.

**Slides** (`slides/`) — nine 1920×1080 slide types: `TitleSlide`, `SectionSlide`, `ScriptureSlide`, `QuestionSlide`, `QuoteSlide`, `ImageSlide`, `PointsSlide`, `MediaTextSlide`, `ClosingSlide`

## Color as intent

Blue is the anchor. Full-field color appears **only on divider and question slides**, never behind body copy, and each hue means one thing:

| Field | Ordinary Sundays | Means |
|---|---|---|
| Anchor | **Blue 40** #003057 | A doctrinal principle is being stated |
| Discussion | **Green 40** #235C35 | The class is being asked to speak |
| Scripture ground | **Gold 10 · 20% tint** #F8F0E4 | A verse is being read verbatim |
| Paper | **Neutral 5** #EFEFE7 | Everything else |

Three fields, not six. If a fourth color would help, the slide probably wants splitting instead. The gold rule is Gold 20 on light grounds and Gold 10 on dark — the one recurring graphic device, unchanged across every palette.

**Seasonal masters swap only the two field hues.** Paper, scripture ground, gold rules, type and layout stay identical, so a Christmas deck still reads as the same class.

| | Anchor | Discussion |
|---|---|---|
| Ordinary | Blue 40 #003057 | Green 40 #235C35 |
| Christmas | Christmas Deep Red #992A31 | Green 30 #318D43 |
| Easter | Purple 40 #432554 | Green 40 #235C35 |

Campaign palettes are seasonal. Do not borrow Easter purple for an ordinary lesson, or Christmas red for a general one.

---

**Templates** (`templates/`) — three masters, same eleven-slide structure: `sunday-school-lesson/` (ordinary Sundays), `christmas-lesson/`, `easter-lesson/`. **Copy the whole folder each week and edit the copy.** Eleven slides following the standard structure: welcome · opening question into the scriptures · brief storyline context · one to three principles, each a blue divider followed by a scripture-and-question slide · witness of Jesus Christ with room for class testimony · home-study invitation · close. Principle three is marked "cut this if time is short" — the structure expects you to teach fewer things well.

**Guidelines** (`guidelines/`) — foundation specimen cards: Blue, Green, Yellow, Red, Neutral, Gray, Christmas, Easter, semantic aliases, protection scrims, display serif, sans serif, slide and UI type scales, measure, spacing scale, slide margins, radii, elevation, rules, motion, interaction states, mark policy

---

## Gaps — please fix these with me

1. **Fonts are substituted.** McKay Pro and Zoram are proprietary. Source Serif 4 and Source Sans 3 stand in. If you can license or have been given the real files, drop them in `assets/fonts/` and replace the stacks in `tokens/fonts.css`.
2. **Campaign palettes are unused so far.** The Christmas and Easter palettes are tokenised and carded but no slide type uses them yet. Say the word and I will add seasonal variants of the lesson template.
3. **No product UI kits.** Recreating Gospel Library or ChurchofJesusChrist.org from memory or screenshots would produce something confidently wrong. If you can point me at real source — a repo, a Figma file, or exported design context — I will build them properly.
4. **No imagery.** No photographs, illustrations or artwork are bundled; slides use marked placeholders. Church Media Library images must be downloaded by you under their terms.
