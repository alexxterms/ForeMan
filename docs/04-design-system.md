# ForeMan design system v0.1

Source of truth for every screen. Built from [option-a-khata-palette.html](../design-options/option-a-khata-palette.html): Option A's layout with Option D's colours. Status: v0.1, from the mockup. Not yet tested on a real budget phone.

Rules marked **(proposed)** are not in the mockup yet. Check them against the mockup before building.

---

## 1. Principles

1. **Picture first, word always.** Every icon sits next to or inside a short word. Icons alone are only used where the meaning is obvious (back arrow, mic, sync).
2. **Colour is never the only signal.** Every status has a word and an icon as well as a colour.
3. **Big targets for thumbs and gloves.** Primary actions are 56px high. Secondary controls are at least 44px.
4. **Readable in sun.** Dark text on light surfaces. No grey text below 14px.
5. **One family for all scripts.** Hind for now. Devanagari comes through the same font, so no layout changes when Hindi is added.

---

## 2. Colour tokens

```css
:root {
  /* Surfaces */
  --bg:        #F4F6F8;  /* app background */
  --surface:   #FFFFFF;  /* cards, rows, sheets */
  --line:      #DCE1E7;  /* borders, dividers */

  /* Brand and actions */
  --primary:   #1E3A8A;  /* main buttons, active tab, links */
  --secondary: #0E7490;  /* voice mic, floating actions */

  /* Status */
  --success:   #047857;  /* present, saved, paid */
  --warning:   #B45309;  /* half day, pending, low stock */
  --danger:    #B91C1C;  /* absent, owed, delete */

  /* Text */
  --text:      #0F172A;  /* body, titles */
  --muted:     #475569;  /* labels, captions */

  /* Tints (chip and ring backgrounds) */
  --t-success: #D1FAE5;
  --t-primary: #DBEAFE;
  --t-warning: #FEF3C7;
  --t-neutral: #E2E8F0;
  --t-teal:    #CFF0F7;
}
```

### Contrast (WCAG, checked)

| Pair | Ratio | Use |
|---|---|---|
| text on bg | 16.5:1 | body |
| muted on bg | 7.0:1 | labels |
| white on primary | 10.4:1 | main buttons |
| white on secondary | 5.4:1 | mic |
| white on success | 5.5:1 | present, save |
| white on warning | 5.0:1 | half day |
| white on danger | 6.5:1 | absent, delete |
| text on warning tint | 16.0:1 | warning chips |

Every button label passes AA (4.5:1). Do not put white text on the warning tint or on the teal ring.

### Section colours

Each home tile has one colour, used for its badge. Keep the same colour wherever that section appears.

| Section | Colour | Tint (ring) |
|---|---|---|
| Attendance | `--success` | `--t-success` |
| Wages | `--primary` | `--t-primary` |
| Materials | `--warning` | `--t-warning` |
| Expenses | `#475569` (muted slate) | `--t-neutral` |
| Bills | `#334155` (dark slate) | `--t-neutral` |
| Sites | `--secondary` | `--t-teal` |

---

## 3. Typography

**Family:** Hind (400, 500, 600, 700). Loaded from Google Fonts.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Screen title | 26px | 700 | Line height 1.1 |
| Section title | 22–24px | 600–700 | |
| Count line | 19px | 600 | Number inside is 32px, tabular |
| Card title (worker name) | 21px | 600 | Line height 1.1 |
| Button label | 20px | 600 | Primary buttons |
| Status button label | 15px | 600 | Segmented controls |
| Chip label | 14px | 700 | Sync and site chips |
| Body | 16–18px | 400–500 | |
| Label, caption | 14–15px | 500 | Never below 14px |
| Numbers | 20–32px | 700 | `font-variant-numeric: tabular-nums` |

Money shows Indian grouping: ₹12,50,000. Dates are DD/MM/YYYY.

---

## 4. Icons

**Style:** line icons only. 24px grid, 2px stroke, round caps and joins, no fills. White line on coloured badges.

### Section icons (home tiles)

| Section | Icon | Name in file |
|---|---|---|
| Attendance | Clipboard with tick | `i-clip` |
| Wages | Wallet | `i-rupee` (wallet drawing) |
| Materials | Package | `i-box` (package drawing) |
| Expenses | Price tag | `i-receipt` (tag drawing) |
| Bills | Invoice | `i-doc` |
| Sites | Building | `i-site` (building drawing) |

Worker count line: hard hat (`i-hat`). Map pin: `i-pin`. Calendar: `i-cal`.

### Badge (round icon)

| Property | Home tiles | Form rows |
|---|---|---|
| Size | 56px circle | 46px circle |
| Fill | section colour | section colour |
| Icon | 30px, white | 26px, white |
| Ring | 5px `--t-*` tint | none |

### Status icons

Present, half and absent use **text only** on the attendance buttons. Removed on purpose, so the buttons stay compact.

---

## 5. Buttons

| Type | Height | Radius | Style | Use |
|---|---|---|---|---|
| Primary | 56px | 16px | `--primary` fill, white 20px text | Save, Continue |
| Secondary | 56px | 16px | White fill, 2px `--primary` border | Cancel, Speak again |
| Success | 56px | 16px | `--success` fill, white | All present, Yes save |
| Destructive | 56px | 16px | `--danger` fill, white. Confirm screen first | Delete, remove |
| Voice (mic) | 76px circle | — | `--secondary` fill, white 36px icon, soft teal shadow | Speak an entry |
| Status segment | 44px | 12px | 1.5px `--line` border, white fill, `--muted` 15px text | Present, Half, Absent |
| Icon-only | 52px | 14px | White fill, 28px icon | Back |

**States**
- Pressed: scale to 0.97.
- Disabled: `--t-neutral` fill, no border, `--muted` text and icon. Never hide a disabled button.
- Selected status segment: fill and border in the status colour, white text.
  - Present: `--success`
  - Half: `--warning` (white text)
  - Absent: `--danger`

**(proposed)** Min touch target 44px everywhere. Gaps between adjacent buttons at least 8px.

---

## 6. Chips and status

### Sync chip (header, top right)

Three states. Tapping the chip cycles them in the mockup. In the app, the chip reflects live state.

| State | Fill | Text | Icon | Label |
|---|---|---|---|---|
| All saved | `--t-success` | `--success` | tick | All saved |
| Offline, saved on phone | `#E2E8F0` | `--muted` | cloud off | Saved on phone · 3 |
| Sending | `--t-primary` | `--primary` | sync, spinning 1.2s | Sending · 3 |

Offline is normal on site. It is grey, not red or amber.

### Site chip (header, top left)

White pill, 1px `--line` border, 14px 600 text, with a down arrow.

### Stock status pill (low and out)

Option 1 from the stock pill options. Always three signals: colour, icon and word.

| Status | Fill | Text | Icon | Word |
|---|---|---|---|---|
| Out of stock | `#FEE2E2` | `--danger` | circle with cross | Out of stock |
| Low stock | `--t-warning` | `--warning` | triangle with exclamation | Low stock |

Pill: 14px 700, 5px × 11px padding, full radius, 16px icon with 2.2px stroke. The stock bar under the name uses the same colour as the pill. In-stock rows show no pill.

### Bill status pill

Same pill pattern as the stock pill: icon, word, tinted fill.

| Status | Fill | Text | Icon | Word |
|---|---|---|---|---|
| Draft | `--t-neutral` | `--muted` | pencil | Draft |
| Sent | `--t-primary` | `--primary` | paper plane | Sent |
| Due | `--t-warning` | `--warning` | clock | Due in 5 days |
| Overdue | `#FEE2E2` | `--danger` | triangle | Overdue 12 days |
| Paid | `--t-success` | `--success` | tick | Paid 02/10/2026 |

### Warning chip

`--t-warning` fill, `--warning` text. Use for "needs attention" only.

---

## 7. Cards, rows and lists

- **Card:** white, 16–18px radius, 12–14px padding, no border or a 1px `--line`. Gap between cards 10px.
- **Worker card:** 50px initials circle (`--t-primary` fill, `--primary` text), name 21px, trade and day rate in muted 14px. Status row below, full width, three buttons with 8px gaps.
- **Tile grid:** 2 columns, 12px gap, 20px radius, 14px padding. Icon badge top, title 21px, subtitle 15px muted.
- **Count line:** white pill, 16px radius, number in success colour.
- **Confirm row:** 46px badge, label 14px muted, value 21px, "Change" link on the right in `--primary`.

---

## 8. Layout

- Screen side gutter: **16px**.
- Title bar: 8px top, 12px bottom padding. Back button on the left.
- Bottom action area: sits above the home indicator, 12px top and 18px bottom padding, 10px between buttons.
- Lists scroll inside the screen. Action buttons stay pinned at the bottom.
- Phone width: 360px. Check at 360px before anything else.

---

## 9. Feedback and states

| Moment | Pattern |
|---|---|
| Loading | Spinner in `--secondary`, text "Loading…" |
| Empty | Icon in a badge, one line of text, one primary button |
| Saved | Success chip updates to "All saved" (no toast) |
| Error | Red strip under the title with one plain sentence and one fix button |
| Offline | Grey sync chip. No warning colour |
| Sending | Blue sync chip with spinning icon |

**(proposed)** Haptic tick on each save and a short sound on voice stop. Users can turn sound off.

---

## 10. Voice entry

- Mic: 76px circle, bottom centre on Home.
- Listening screen: 120px red circle (`--danger`) with two pulsing rings, five bars in `--secondary`, text "Listening…".
- Transcript box: white card, 22px text, "You said" label above.
- Confirm screen: parsed rows (worker, entry, site, date), each with a "Change" link. Buttons: Yes, save (success) and Speak again (secondary).
- Nothing saves from voice without the confirm tap.

---

## 11. Language and text

- All strings come from `apps/mobile/src/i18n/en.ts` and `hi.ts` (Hindi). Nothing hard-coded in a screen. TypeScript checks that both files have the same keys.
- Line height follows the language: 1.3× for English, 1.5× for Hindi, so Devanagari marks never clip.
- Keep labels short: one or two words. Example: "Present", "Half", "Absent".
- Use the same word everywhere for the same thing. "Save", not "Submit" in one place and "Save" elsewhere.
- Sentences for errors and confirmations are short, plain, and say what to do next.

---

## 12. Not designed yet

Bills (list, new bill, bill lines, preview) are designed in [bills-screen.html](../design-options/bills-screen.html). The mockup has a switch for GST-registered and not-registered companies. Tax rates and deduction percentages in it are examples only.

Materials (stock list, stock in) is designed in [materials-screen.html](../design-options/materials-screen.html). Materials stock-out uses the same screen with the action changed.


- Wages sheet
- Expenses and daily diary
- Owner dashboard across sites
- Inputs: text field, number keypad, date chips, dropdown picker (**(proposed)**, see section 5 and section 13)

## 13. Inputs (proposed)

- **Text field:** 56px high, 2px `--line` border, 12px radius, label above in 14px muted.
- **Number keypad:** on-screen, 3 × 4 keys, 50px high with 8px gaps, 14px radius, 24px numbers. Used for quantities and money. Replaces the system keyboard. Designed in [materials-screen.html](../design-options/materials-screen.html).
- **Date:** chips for Today, Yesterday, Day before, plus a calendar icon for other dates.
- **Dropdown:** full-screen picker with an icon or photo per option. Search only above 8 items.
- **Toggle:** 56px wide switch with the state written as text (On / Off).

## 14. Open items

- Single-font finding for Option D and the sync page is marked as intentional. Waiver pending your confirmation.
- Missed-call attendance is dropped from v1. No banner or tab.
