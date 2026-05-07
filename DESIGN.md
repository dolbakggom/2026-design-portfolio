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
- Intro starts with a slow blurred logo fade-in, then the slogan `Beyond the Answer` types after a 1 second delay. The green period appears after typing and blinks every 0.5s.
- About and career share one sticky layout. The about copy types in with the black logo while the profile image reveals, then contact details appear. As the user advances, the copy changes into the career statement and the right-side career rail appears.
- The route updates with the active home state: `/`, `/about`, `/career`, or `/work`.
- Work uses three levels: work intro, full-screen featured project slides, then a filterable gallery.
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
- Make save states explicit and keep forms dense enough for repeated editing.

## Featured Work Cards
- Featured work thumbnails are full-bleed background images with text overlaid on top.
- Featured titles render at 100% fill. Category and metadata render at 50% fill using the active black/white text tone.
- Featured cards sample image brightness on the client and switch text between black and white for contrast.
