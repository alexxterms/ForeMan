# ForeMan: four UI/UX directions

Open `design-options/index.html` to see all four side by side. Each mockup is clickable and has four screens (Home, Attendance, Voice listening, Voice confirm) at 360px wide. All mockup text is English for now. Hindi and other languages come later through the string files.

| | A. Pakka Pictogram | B. Chai Ledger | C. Hi-Vis Site | D. Khata Pro |
|---|---|---|---|---|
| Built for | Munshi, low literacy | Contractor and munshi, mixed literacy | Munshi in harsh sun | Contractor with 10+ sites |
| Navigation | Home grid + big mic | Bottom tabs | Site bar + bottom nav with raised voice button | Drawer + KPI cards |
| Bet | Icons carry meaning, words back them up | Familiar cards, fastest to build | Maximum contrast, bold blocks | Dense numbers, fast scanning |
| Main risk | Slower for power users | Looks like every other app | Loud, can feel aggressive | Cramped at 360px |

---

## A. Pakka Pictogram

### 1. Concept and mood
Calm, sturdy and direct, like a printed register with big buttons. Every action is a picture plus a short word. Built around the supervisor who may read slowly and never opens a settings menu.
**Best for:** the munshi on a budget phone.

### 2. Colour palette

| Token | Hex | Use | Contrast |
|---|---|---|---|
| background | `#F7F3EA` | Warm paper, less glare than pure white | |
| surface | `#FFFFFF` | Cards, rows | |
| primary | `#1D3F72` | Main actions (navy) | white on it 10.5:1 |
| secondary | `#E8891D` | Mic, highlights (saffron) | dark text on it 6.9:1 |
| success | `#15803D` | Present, paid, saved | white on it 5.0:1 |
| warning | `#E0A100` | Half day, pending, low stock | dark text on it 7.9:1 |
| danger | `#C62828` | Absent, owed, delete | white on it 5.6:1 |
| text | `#15171A` | Body | 16.2:1 on background |
| muted | `#55595F` | Secondary labels | 6.4:1 on background |

**Sunlight:** Warm off-white cuts the glare that washes out cheap screens. Text is near-black, not grey. Colour is never the only signal: present, half and absent also use a sun, a half-sun and a moon icon.

### 3. Typography
- **Family:** Hind (clean at small sizes, free, and it supports Devanagari when we add Hindi)
- **Heading:** 26px / 700 (screen title), 22px / 600 (section)
- **Body:** 20px / 500. Large because the reader may work without glasses.
- **Label:** 16px / 600 minimum. Never smaller.
- **Numbers:** 32px / 700, tabular figures so quantities and money line up in columns
- **Mixed text:** main line in 20px, a short English gloss below in 15px muted when we add a second language

### 4. Buttons
- **Primary:** navy, 56px high, 16px radius, 20px horizontal padding, full width on forms
- **Secondary:** white with 2px navy border, same size
- **Destructive:** red, 56px, always followed by a confirm screen
- **Icon-only:** 56 × 56px rounded square, icon 28px, always with a label on the home grid
- **Floating action (mic):** 72px saffron circle, bottom centre, always visible
- **Min touch target:** 56px (bigger than the usual 48px, for gloves and shaky hands)
- **Pressed:** scale to 0.97 and darken 10%, with a short vibration
- **Disabled:** 40% opacity with a dashed border so it is not mistaken for a broken control

### 5. Inputs and forms
- **Text fields:** 56px, 2px border, label above
- **Numbers (quantity, money):** an on-screen keypad (3 × 4 large keys, ₹ shown), not the system keyboard. Number entry is the most common action.
- **Dropdowns:** a full-screen picker with a photo or icon per option (trade, material, site). Search box only above 8 items.
- **Date:** chips for Today, Yesterday, Day before, plus a calendar icon for anything else. Output DD/MM/YYYY.
- **Toggles:** large switch 56px wide, state also written out (On / Off)
- **Voice button:** 72px saffron mic. Listening state: a red ring pulses around it, five bars animate and the label reads "Listening…". Stop by tapping again or pausing for 2 seconds.
- **Validation:** red border, a warning icon and one short sentence. Example: "Quantity is needed." Never a red-only error without words.

### 6. Navigation
- **Home grid:** six large tiles in a 2 × 3 grid: Attendance, Wages, Materials, Expenses, Bills, Sites. Each has a picture, a title and a short subtitle.
- **Colour coding by area:** attendance is green, money is navy, stock is saffron, bills are brown.
- **Back:** a large arrow top-left on every screen. No hamburger menu.
- **Owner view:** the same grid with a site switcher chip at the top. No extra screens to learn.

### 7. Lists and cards
- **Worker card:** round photo or initials (50px), name in 21px, trade and day rate under it in muted text. Below, a compact row of three 44px text buttons: Present, Half, Absent. Text only, no icons. Full width, sized to the content so the list stays scannable.
- **Material row (72px):** a picture of the material (bag, sand heap, steel bar), name, quantity in 32px numbers, a thin stock bar. Red stripe when below the low-stock mark.
- **Bill card:** invoice number and client on top, amount in 32px numbers, status chip (Sent / Due / Paid) with icon.
- **Site card:** photo strip, site name, and three icon-numbers: workers today, cost today, money owed.

### 8. Icons and illustrations
- **Style:** flat, filled, 2.5px rounded strokes, one colour per icon
- **Pictures over words:** yes. Materials use photos taken on site where possible (the supervisor's own bags and bricks), with a cartoon fallback.
- **Illustrations:** only in empty states, and simple (a hard hat, a hand).

### 9. Feedback states
- **Loading:** a spinning saffron ring with "Loading…". No skeleton shimmer, which reads as a glitch on slow phones.
- **Empty:** a large picture and one button. Example: a hard hat with "Add first worker".
- **Success:** a full-width green bar with a large tick, a short sound and a vibration. Gone after 2 seconds.
- **Error:** a red bar with what went wrong in one line and a single fix button.
- **Offline:** a grey cloud-off chip at the top: "Saved on phone". Never a warning colour, because offline is normal on site.
- **Syncing:** two arrows turning beside a count: "3 pending".

### 10. Key screens
- **Home:** site chip at top, a count line ("24 / 25 workers present today"), six large tiles, saffron mic floating bottom-centre.
- **Attendance:** a full-width "All present" button, the crew name, one card per worker with three status buttons, and a Photo and Save footer.
- **Add material:** picture grid of materials, tap one, keypad for quantity, camera button for the challan, a single Save button.
- **Create bill:** a stepper of three big steps (Details, Measure, Send). Each step fills the screen.

---

## B. Chai Ledger

### 1. Concept and mood
Warm and friendly, like a tea-stall ledger, with cards and soft shadows. Familiar from other apps, so there is almost no learning curve. Labels are always visible.
**Best for:** the builder who is comfortable with a phone but wants a clear overview.

### 2. Colour palette

| Token | Hex | Use | Contrast |
|---|---|---|---|
| background | `#FBF8F3` | Cream | |
| surface | `#FFFFFF` | Cards | |
| primary | `#0F766E` | Teal, main actions | white on it 5.5:1 |
| secondary | `#6D4C41` | Brown, secondary emphasis | white on it 7.6:1 |
| success | `#15803D` | Paid, present | white on it 5.0:1 |
| warning | `#92400E` | Pending, half day (dark amber) | white on it 7.1:1 |
| danger | `#B42318` | Owed, absent, delete | white on it 6.6:1 |
| text | `#1C1917` | Body | 16.5:1 on background |
| muted | `#5B5550` | Labels | 6.9:1 on background |

**Sunlight:** Cream is softer than white. Cards have a border as well as a shadow, so they still show on a washed-out screen. Warning uses dark amber, not yellow, which disappears in sun.

### 3. Typography
- **Family:** Mukta (medium weight reads well on budget screens, and it supports Devanagari for later)
- **Heading:** 22px / 700 (screen), 18px / 700 (card title)
- **Body:** 16px / 500
- **Label:** 14px / 600 minimum
- **Numbers:** 20px / 700, tabular figures. Money uses Indian grouping: ₹12,50,000.
- **Mixed text:** when a second language is added, it sits on the same line, separated by a slash, or stacked below.

### 4. Buttons
- **Primary:** teal, 48px high, 12px radius, 20px horizontal padding
- **Secondary:** outline 1.5px teal, same size
- **Destructive:** red text on white with a red outline, confirmed in a bottom sheet
- **Icon-only:** 44px round, ghost style, with a label on long press
- **Floating action:** 56px rounded square, teal, bottom right above the tabs, only on list screens
- **Min touch target:** 48px
- **Pressed:** darken 8% and a 1px inset shadow
- **Disabled:** 40% opacity, no shadow

### 5. Inputs and forms
- **Text fields:** 48px, 1.5px border, floating label
- **Money:** numeric keyboard, live formatting to lakh grouping as you type, ₹ prefix
- **Dropdowns:** bottom sheet with search at top
- **Date:** native date picker, DD/MM/YYYY display
- **Toggles:** standard switch with the state written beside it
- **Voice:** a mic icon at the end of the search field and a 48px mic in the bottom bar. Listening: a bottom sheet with live transcript, a level meter, and Stop and Yes, save buttons.
- **Validation:** red line under the field with the message

### 6. Navigation
- **Bottom tabs (5):** Home, Sites, Labour, Stock, Bills. Each tab has an icon and a label.
- **Profile:** top right avatar. Language switch lives there, not hidden.
- **Site switcher:** a dropdown chip under the title on Home and Labour.
- **Low-literacy help:** tabs have icons so positions are memorable. Labels are always on, never icon-only.

### 7. Lists and cards
- **Worker card:** name and trade on the left, day rate and advance balance on the right. Below: a three-part segmented control with icon and text (Present / Half / Absent).
- **Material row:** name, unit, quantity in and out for today, a stock progress bar, and "Owed to supplier ₹…" in red when unpaid.
- **Bill card:** invoice number, client, amount, status pill, and a WhatsApp share button.
- **Site card:** site name and city, progress percentage, workers today, cost today, money owed. Tap to open.

### 8. Icons and illustrations
- **Style:** outline icons, 1.75px stroke, rounded caps
- **Labels:** always beside or under icons
- **Illustrations:** light line drawings in empty states only
- **Pictures:** supported in the material list, but not required

### 9. Feedback states
- **Loading:** skeleton cards (grey blocks). Works well here because the screens are cards.
- **Empty:** an illustration, a headline and one primary button
- **Success:** a top toast in green for 2.5 seconds, naming the saved item
- **Error:** inline red message under the field, or a red toast with a retry button
- **Offline:** a small grey dot in the header with the words "Offline"
- **Syncing:** the dot turns teal and rotates, with "Syncing"

### 10. Key screens
- **Home:** greeting, four KPI cards (labour, material, owed to you, you owe), then a list of sites with today's status
- **Attendance:** site chip, date chip, list of workers with segmented status control, a "Mark all present" button, and a sticky footer with the count
- **Add material:** form with material picker sheet, quantity with unit, supplier dropdown, challan photo and a Save button at the bottom
- **Create bill:** summary list, tabs for RA bill and GST invoice, and a preview that matches the PDF

---

## C. Hi-Vis Site

### 1. Concept and mood
Safety yellow and black, sharp corners, thick borders. It looks like site signage: visible from across the yard and readable at arm's length in the sun.
**Best for:** the munshi working outdoors all day, on a busy crew.

### 2. Colour palette

| Token | Hex | Use | Contrast |
|---|---|---|---|
| background | `#F5F5F0` | Pale concrete | |
| surface | `#FFFFFF` | Cards | |
| primary | `#FFC400` | Hi-vis yellow, main actions | black text on it 11.8:1 |
| secondary | `#111111` | Black, secondary actions | white on it 18.9:1 |
| success | `#0E7A3B` | Present, paid | white on it 5.4:1 |
| warning | `#FF7A00` | Half day, pending | black text on it 7.2:1 |
| danger | `#D00000` | Absent, owed, delete | white on it 5.7:1 |
| text | `#111111` | Body | 17.3:1 on background |
| muted | `#4B4B4B` | Labels | 8.0:1 on background |

**Sunlight:** Strongest of the four. Black on yellow stays readable in full sun. No grey text smaller than 16px. Dark mode is not offered, because black screens reflect and wash out on cheap LCDs. The listening screen goes black for a few seconds only.

### 3. Typography
- **Headings:** Baloo 2, 28px / 800. Bold and friendly.
- **Body:** Hind 18px / 500
- **Label:** 15px / 600. No all-caps. Caps are harder to read in sun.
- **Numbers:** Baloo 2 34px / 800, tabular
- **Mixed text:** main line first, a smaller second line below

### 4. Buttons
- **Primary:** yellow fill, black 2px border, 60px high, 4px radius (sharp), full width
- **Secondary:** black fill, white text, same size
- **Destructive:** red fill, white text, 60px. Confirm screen says what will be lost.
- **Icon-only:** 56px square, black border, icon 28px
- **Floating action (voice):** 72px square yellow block with black border, raised in the bottom bar centre
- **Min touch target:** 60px
- **Pressed:** invert colours (yellow becomes black, text becomes yellow)
- **Disabled:** grey with a diagonal hatch, so it is clearly unavailable

### 5. Inputs and forms
- **Text fields:** 56px, 2px black border, no rounded corners
- **Number pad:** large grid keypad, keys 64px. Used for quantities and money.
- **Dropdowns:** full-width list, rows 60px, tapped item highlighted yellow
- **Date:** chips for Today, Yesterday, Day before, plus Pick date
- **Toggles:** big square check blocks, 56px, black border, yellow fill when on
- **Voice:** a yellow square "Speak" block, 72px. Listening: block turns black, five yellow bars bounce, label reads "Listening…". Tap again to stop.
- **Validation:** black strip at the top of the form with a red warning icon and the message in white

### 6. Navigation
- **Top:** yellow site bar with the site name in 22px bold and a down arrow. Tap to switch site.
- **Bottom nav (4 + voice):** Home, Attendance, Stock, Bills. Voice sits in the centre as the raised block.
- **Active tab:** black background with yellow icon
- **Back:** a black square arrow on the top left

### 7. Lists and cards
- **Worker tile:** two per row, each about 120px tall. The top band shows status: green for present, orange for half, red for absent, grey for pending. Name and trade in black on white.
- **Bulk action:** full-width black "All present" bar above the grid
- **Material row:** black stripe on the left with the quantity in yellow numbers, name in black on white, a thick stock bar
- **Bill card:** black header with the amount in yellow, client and status below
- **Site card:** full-width yellow strip with the site name, and a row of three black blocks for workers, cost and owed

### 8. Icons and illustrations
- **Style:** bold glyphs, 2.5px, sharp corners to match the blocks
- **Accents:** a hazard-stripe band used only in headers and the confirm screen. Never on interactive elements.
- **Illustrations:** none. Real photos from site.

### 9. Feedback states
- **Loading:** a yellow-and-black progress bar sliding across the top
- **Empty:** a large black "+" block with "Add first worker"
- **Success:** the full screen flashes green for 1 second with a large tick
- **Error:** a red strip across the top with one line and a "Try again" button
- **Offline:** an orange strip at the top: "Offline · 4 entries saved on phone"
- **Syncing:** a yellow spinner next to the count, "Syncing · 4 left"

### 10. Key screens
- **Home:** site bar, four large blocks (Workers today, Cost today, Owed to me, I owe), then the voice block in the bottom bar
- **Attendance:** "All present" bar, a two-column grid of worker tiles (tap one to cycle its status), a sticky black footer with "Present 22 / 25"
- **Add material:** yellow header with material name, number pad, camera block for the challan, black Save bar at the bottom
- **Create bill:** three numbered yellow steps, each a full screen

---

## D. Khata Pro

### 1. Concept and mood
A clean business tool: dense, numbers-first, organised like a ledger on a tablet. Tables and cards with clear hierarchy. Built for scanning twenty sites quickly.
**Best for:** the tech-comfortable builder who runs many sites and wants a dashboard, and who spends more time on the phone than the munshi does.

### 2. Colour palette

| Token | Hex | Use | Contrast |
|---|---|---|---|
| background | `#F4F6F8` | Cool grey app background | |
| surface | `#FFFFFF` | Cards, table | |
| primary | `#1E3A8A` | Deep indigo, main actions | white on it 10.4:1 |
| secondary | `#0E7490` | Teal, secondary and charts | white on it 5.4:1 |
| success | `#047857` | Paid, present | white on it 5.5:1 |
| warning | `#B45309` | Pending, low stock | white on it 5.0:1 |
| danger | `#B91C1C` | Owed, absent, delete | white on it 6.5:1 |
| text | `#0F172A` | Body | 16.5:1 on background |
| muted | `#475569` | Labels | 7.0:1 on background |

**Sunlight:** Weakest of the four outdoors. Cool grey and thin table lines fade in full sun. Mitigation: 2px row dividers and a high-contrast mode (text and borders to pure black). Best used indoors or in shade.

### 3. Typography
- **Family:** Noto Sans. Clean, very readable at small sizes, and it has a Devanagari companion for later.
- **Heading:** 20px / 700 (screen), 16px / 600 (section)
- **Body:** 15px / 400
- **Table text:** 14px / 400, minimum 14px
- **Numbers:** 16px / 600, tabular, right-aligned in tables. ₹ with Indian grouping.
- **Mixed text:** translations shown at 60% muted tint on the same line

### 4. Buttons
- **Primary:** indigo, 40px high, 8px radius, 16px horizontal padding. 48px on touch screens.
- **Secondary:** outline 1px indigo
- **Destructive:** red outline and red text, solid red on press. Confirmation dialog required.
- **Icon-only:** 36px, ghost, with tooltip
- **Floating action:** extended button "New entry", bottom right, 48px
- **Min touch target:** 44px on phone (below the 48px guideline on purpose, to fit more rows; see trade-offs)
- **Pressed:** darken 10%
- **Disabled:** 40% opacity

### 5. Inputs and forms
- **Text fields:** 40px, 1px border, 6px radius, label above
- **Money:** ₹ prefix, live Indian grouping as you type, numeric keyboard
- **Dropdowns:** searchable combobox that works like a desktop select
- **Date:** text field with DD/MM/YYYY mask and a calendar picker
- **Toggles:** switch with a text state (On / Off)
- **Voice:** a mic button inside the search bar at the top, and inside each form field that accepts speech. Listening state: the search bar becomes a teal pill with a waveform. The result fills the field as text, with a voice tag.
- **Validation:** red text under the field and a red border. Summary at the top of long forms.

### 6. Navigation
- **Drawer:** left, opens from the menu icon. Lists sites, labour, materials, bills, export and settings.
- **Dashboard first:** four KPI cards at the top of Home, then a site table.
- **Top bar:** site filter (All sites or one) and the menu.
- **Tablet:** the same layout works on a 10-inch tablet with two columns.

### 7. Lists and cards
- **Worker row:** name and trade, then P / A / HD as small chips, then day wage and advance balance in tabular numbers
- **Material row:** name, unit, in, out, balance, and a "Low stock" badge
- **Bill row:** invoice number, client, amount, due date, status badge. Tap to open the detail sheet.
- **Site row:** site name and city, today's labour count, today's cost, owed in red. The whole row is tappable.

### 8. Icons and illustrations
- **Style:** outline icons, 20px, 1.5px stroke, matched to the text weight
- **Pictures:** not used in tables
- **Illustrations:** none. Empty states are text plus one button.

### 9. Feedback states
- **Loading:** skeleton rows that match the table layout
- **Empty:** a short line of text and one button
- **Success:** a toast at bottom left for 3 seconds with an undo link
- **Error:** inline message under the field, or a red banner above the table
- **Offline:** a status bar at the bottom: "Offline · 3 entries pending"
- **Syncing:** the status bar shows "Synced 2 minutes ago"

### 10. Key screens
- **Dashboard:** four KPI cards in a 2 × 2 grid, then a table of sites with today's numbers and a "New entry" button
- **Attendance:** search and "All present" above a table with worker, status chips, wage. Sticky total row at the bottom.
- **Voice entry:** the search bar turns teal while listening. Understood fields are highlighted in the text. Suggestions appear below.
- **Confirm:** a dialog with the fields filled by voice (tagged), the day wage calculated, advance deduction shown, and Cancel and Save buttons.

---

## Recommendation

**Pick A as the base, and take two things from B and one from C.**

1. **A (Pakka Pictogram) for the munshi.** Attendance, material in and expenses are the screens used hundreds of times a week on site. Big targets, pictures and a voice button suit someone who may not read English well.
2. **B's bottom tabs and cards for the owner.** The contractor switches between sites and money views. Tabs and cards are easier to build and to learn than a drawer.
3. **From C:** the "All present" bulk button and the raised voice button. Both are fast and both work in sun.
4. **Skip D for v1.** It fits a desktop-first owner later, not a phone-first first version.

## Trade-offs at a glance

- **A:** Most accessible. Largest buttons, so more scrolling. Icon-led screens take longer to design well. Needs real site photos for materials.
- **B:** Fastest to build with standard components. Most familiar. Least distinctive. Text-heavy for the munshi.
- **C:** Best sunlight contrast. Strongest outdoors. Loud, and some owners may find it blunt next to a client-facing product.
- **D:** Most information per screen. Good for owners with many sites. Smallest touch targets and weakest outdoors. Hardest to use one-handed on a 360px phone.

## Questions

See the decision list in the chat reply. The direction choice comes first.
