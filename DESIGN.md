# DESIGN.md

## Information Architecture
- `/`: one-page portfolio entry point with intro, about/career stage, featured work, and work gallery.
- `/about`: same home experience, initially positioned at the about stage.
- `/career`: same home experience, initially positioned at the career state.
- `/work`: same home experience, initially positioned at the work stage and followed by featured work slides and gallery.
- `/work/[slug]`: project detail page rendered from editor blocks.
- `/admin`: internal CMS for profile, timeline, work ordering, thumbnails, and detail blocks.

## Main Page Interaction
- Home sections use GSAP Observer + ScrollTo controlled navigation so one wheel/touch/key input moves only one target: intro, about, each career item, work intro, each featured work, then gallery.
- Scroll input is locked for roughly 1 second during section travel, and longer while the first about reveal is playing, so rapid wheel input cannot skip content.
- A full-screen black loading layer with a white circular sweep appears on the root entry. It waits for the initial page and fonts, fades out, and only then hands off to the logo fade and slogan typing so uninitialized intro content never flashes.
- Intro starts with a slow blurred logo fade-in, then the slogan `Beyond the Answer` types after a 1 second delay. The green period appears after typing and blinks every 0.5s.
- About and career share one sticky layout. The about copy types in with the black logo while the profile image reveals, then contact details appear. As the user advances, the copy changes into the career statement and the right-side career rail appears.
- The profile photo caption fades out across the full photo zoom/blur transition into Career and returns when scrolling back to About; the caption itself remains outside the blurred image layer.
- The first and last career cards are centered in the visible timeline window. Their top and bottom track padding follows the cards' expanded content height so adjacent items do not displace the endpoints.
- The extra scroll dwell before leaving the first career card and after reaching the last card is reduced to 50% of the original distance; middle career transitions keep their existing visual pacing.
- Every career card has a short scroll-progress dwell without locking wheel or touch input. Movement between cards uses `cubic-bezier(.4, 0, .6, 1)` so each item settles before the next transition begins.
- At `1180px` and below, career cards use a viewport-aware `64px–108px` vertical gap so the tall mobile canvas gives each active history item clearer separation.
- Mobile Career keeps the computed first/last card padding instead of replacing it with fixed responsive padding, ensuring only one endpoint card can resolve to progress `0` or `1`.
- The route updates with the active home state: `/`, `/about`, `/career`, or `/work`.
- Work uses three levels: work intro, full-screen featured project slides, then a filterable gallery.
- A gallery category with no matching work shows a dedicated empty state in place of the grid and announces the empty result without affecting categories that contain work.
- The gallery section height follows its 1920px canvas content instead of reserving two empty viewport heights, while retaining a one-panel minimum so a short gallery can still scroll to the top. The Gallery transition always overlaps one full panel: Featured stays sticky while Gallery rises over and fully covers it.
- `prefers-reduced-motion` must remove pinning-heavy and typing-heavy behavior.

## Visual Language
- Tone: minimal, direct, Figma-led, portfolio-first.
- Base palette: black, white, #f4f4f4 paper, muted black, and #08c840 green accent.
- Typography: Pretendard across the full site and admin.
- Font weights are limited to 400 for body text, 500 for `em`/subtle emphasis, and 700 for `strong`, headings, buttons, labels, and active states.
- Keep the main public accent `#08c840` for scroll markers and site identity. Admin button hover/active highlights use a softer pastel green instead of the main accent.
- Only the WORK gallery section uses a centered 1920px maximum design canvas. Other public sections may use the full viewport width.
- Figma source frames: `Intro`, `소개`, `이력`, `WORK`, `WORK/대표 썸네일`, `WORK/갤러리`.
- Avoid decorative cards inside cards. Use cards only for repeated project/admin items and editor blocks.
- Use real uploaded images when available; use restrained generated placeholder surfaces only for empty starter content.

## Admin Design
- Admin should feel like a focused editing tool, not a marketing page.
- Use tabs/sidebar for major content groups.
- Use direct controls for status, category, order, featured state, and media upload.
- WORK editing must show a live right-side preview of the selected project using the unsaved local form state.
- The WORK editor and live preview are separated by a draggable split handle so the editor/preview ratio can be adjusted during content work.
- Work detail blocks support editor controls for line height, paragraph spacing, block width, and alignment.
- Text blocks default to `100%` content width, and newly added Heading, Paragraph, or Quote blocks inherit the editor's current Content width selection.
- At `1180px` and below, work content uses `36px` Heading, `18px` body, and `24px` quote text while desktop typography remains unchanged.
- Every work detail Heading, including the first one, adds 48px above the shared 34px block gap; the scaled admin live preview uses 24px additional top spacing.
- The body block toolbar remains sticky within the work editor while long content scrolls, then releases at the end of the body editor. On mobile it follows the page scroll with a small top inset.
- Work metadata presents the existing `role` value as `Tools` in the public detail and admin UI because the field contains software names; the internal key remains unchanged for data compatibility.
- Website blocks render as a full-background CTA: the linked site's representative image fills the block beneath a strong blur and black overlay, while custom title/description and an enlarged Korean link action remain high-contrast in the foreground. The admin fetches Open Graph metadata, imports the representative image into R2, and lets the editor override title and description afterward.
- Divider blocks render as a full-width 1px neutral line with consistent spacing in the public detail page and its scaled admin live preview.
- Work detail pages end with a full-viewport, two-panel previous/next project navigation ordered by the admin WORK sequence. Each panel is 320px tall on desktop; pointer hover expands an opaque acid-green circle from the cursor position until it fully covers the project image. Typography follows title, direction, then category/year in descending size, and the direction arrows use the same sweep language as the detail topbar.
- Previous copy uses 200% of the base left inset and Next copy uses 200% of the base right inset, while the opposite edges and full-width media remain unchanged.
- The work detail top cover keeps its paper-colored lower fade. The bottom previous/next navigation uses a uniform dark image overlay with no directional gradient, and its opaque acid-green reveal sits above that overlay so the hover state remains a true flat color.
- The navigation's foreground contrast follows the same circular reveal: white text remains over the image, while a synchronized clipped duplicate switches only the green-covered portion to black. This applies to titles, direction labels, metadata, and arrows without an abrupt whole-label color change.
- Make save states explicit and keep forms dense enough for repeated editing.

## Featured Work Cards
- Featured work thumbnails are full-bleed background images with text overlaid on top.
- Featured titles render at 100% fill. Category and metadata render at 50% fill using the active black/white text tone.
- Featured cards sample image brightness on the client and switch text between black and white for contrast.
