import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";
import { createTestHarness, type TestHarness, type WorkerHandle } from "wrangler";

const APP_ORIGIN = "http://portfolio.test";
const ADMIN_USERNAME = "integration-admin";
const ADMIN_PASSWORD = "integration-pass";
const SESSION_SECRET = "integration-session-secret-with-at-least-32-bytes";
const APP_WORKER = "2026-design-portfolio";
const SETUP_WORKER = "portfolio-test-d1-setup";
const THUMBNAIL_TEST_WORK_TITLE = "Admin Thumbnail Integration";

let server: TestHarness;
let app: WorkerHandle;
let setup: WorkerHandle;
let adminCookie = "";
let harnessOrigin = "";

const splitSqlStatements = (source: string) => {
  const statements: string[] = [];
  let statement = "";
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quote && character === quote && next === quote) {
      statement += character + next;
      index += 1;
      continue;
    }

    if (character === "'" || character === '"') {
      quote = quote === character ? null : quote ?? character;
      statement += character;
      continue;
    }

    if (character === ";" && quote === null) {
      if (statement.trim()) statements.push(statement.trim());
      statement = "";
      continue;
    }

    statement += character;
  }

  if (statement.trim()) statements.push(statement.trim());
  return statements;
};

const applyMigrations = async () => {
  const migrationNames = (await readdir("migrations")).filter((name) => name.endsWith(".sql")).sort();

  for (const name of migrationNames) {
    const source = await readFile(`migrations/${name}`, "utf8");
    for (const statement of splitSqlStatements(source)) {
      const response = await setup.fetch("http://setup.test/", { method: "POST", body: statement });
      assert.equal(response.status, 200, `${name}: ${await response.text()}`);
    }
  }
};

const adminHeaders = (contentType?: string) => ({
  origin: APP_ORIGIN,
  cookie: adminCookie,
  ...(contentType ? { "content-type": contentType } : {})
});

before(async () => {
  server = createTestHarness({
    root: process.cwd(),
    workers: [
      {
        configPath: "dist/server/wrangler.json",
        vars: { ADMIN_USERNAME },
        secrets: {
          ADMIN_PASSWORD_HASH: `sha256:${createHash("sha256").update(ADMIN_PASSWORD).digest("hex")}`,
          SESSION_SECRET
        }
      },
      { configPath: "tests/fixtures/wrangler.d1-setup.toml" }
    ]
  });

  const { url } = await server.listen();
  harnessOrigin = url.origin;
  app = server.getWorker(APP_WORKER);
  setup = server.getWorker(SETUP_WORKER);
  await applyMigrations();
});

after(async () => {
  await server?.close();
});

test("health endpoint verifies the required D1 content schema without caching", async () => {
  const response = await app.fetch(`${APP_ORIGIN}/api/health`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok", database: "available" });
});

test("admin login rejects invalid credentials and issues a signed session cookie for valid credentials", async () => {
  const invalidResponse = await app.fetch(`${APP_ORIGIN}/api/admin/login`, {
    method: "POST",
    headers: { origin: APP_ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: "wrong-password" })
  });
  assert.equal(invalidResponse.status, 401);

  const response = await app.fetch(`${APP_ORIGIN}/api/admin/login`, {
    method: "POST",
    headers: { origin: APP_ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const setCookie = response.headers.get("set-cookie");
  assert.match(setCookie ?? "", /^portfolio_admin=/);
  assert.match(setCookie ?? "", /HttpOnly/);
  assert.match(setCookie ?? "", /SameSite=Strict/);
  adminCookie = setCookie?.split(";", 1)[0] ?? "";
});

test("saved work blocks are read from D1 and rendered on the public detail page", async () => {
  const initialPayload = {
    slug: "integration-work",
    title: "Integration Work Draft",
    category: "UI/UX",
    summary: "Integration save flow",
    client: "Test Client",
    year: "2026",
    role: "Figma, Illustrator",
    featured: false,
    published: true,
    blocks: [
      { id: "integration-heading", type: "heading", content: { text: "Draft Heading", level: 2 }, sortOrder: 1 },
      {
        id: "integration-paragraph",
        type: "paragraph",
        content: { html: "<p>Draft block content</p>", textAlign: "left", lineHeight: "1.7" },
        sortOrder: 2
      }
    ]
  };

  const createResponse = await app.fetch(`${APP_ORIGIN}/api/admin/works`, {
    method: "POST",
    headers: adminHeaders("application/json"),
    body: JSON.stringify(initialPayload)
  });
  assert.equal(createResponse.status, 201, await createResponse.clone().text());

  const createdBody = (await createResponse.json()) as { works: Array<{ id: string; slug: string }> };
  const created = createdBody.works.find((work) => work.slug === initialPayload.slug);
  assert.ok(created);

  const firstPublicResponse = await app.fetch(`${APP_ORIGIN}/work/${initialPayload.slug}`);
  assert.equal(firstPublicResponse.status, 200);
  assert.equal(firstPublicResponse.headers.get("x-portfolio-content-source"), "database");
  assert.match(await firstPublicResponse.text(), /Integration Work Draft/);

  const updatedPayload = {
    ...initialPayload,
    title: "Integration Work Published",
    blocks: [
      { id: "integration-heading", type: "heading", content: { text: "Published Heading", level: 2 }, sortOrder: 1 },
      {
        id: "integration-paragraph",
        type: "paragraph",
        content: { html: "<p>Saved D1 block is publicly rendered.</p>", textAlign: "left", lineHeight: "1.7" },
        sortOrder: 2
      },
      { id: "integration-divider", type: "divider", content: {}, sortOrder: 3 }
    ]
  };

  const updateResponse = await app.fetch(`${APP_ORIGIN}/api/admin/works/${created.id}`, {
    method: "PUT",
    headers: adminHeaders("application/json"),
    body: JSON.stringify(updatedPayload)
  });
  assert.equal(updateResponse.status, 200, await updateResponse.clone().text());

  const publicResponse = await app.fetch(`${APP_ORIGIN}/work/${initialPayload.slug}`);
  const html = await publicResponse.text();
  assert.equal(publicResponse.status, 200);
  assert.match(html, /Integration Work Published/);
  assert.match(html, /Published Heading/);
  assert.match(html, /Saved D1 block is publicly rendered\./);
  assert.match(html, /class="work-block-divider"/);
  assert.match(html, /<dt>Tools<\/dt>/);
  assert.match(html, /Figma, Illustrator/);
  assert.doesNotMatch(html, /Draft block content/);
});

test("image upload stores bytes in R2, metadata in D1, and serves immutable media", async () => {
  const pngBytes = new Uint8Array(await readFile("public/og-image.png"));
  const form = new FormData();
  form.append("file", new Blob([pngBytes], { type: "image/png" }), "integration.png");
  form.append("alt", "Integration upload");
  form.append("width", "1200");
  form.append("height", "630");

  const serializedRequest = new Request(`${APP_ORIGIN}/api/admin/assets`, {
    method: "POST",
    body: form
  });
  const contentType = serializedRequest.headers.get("content-type");
  assert.ok(contentType);

  const uploadResponse = await app.fetch(`${APP_ORIGIN}/api/admin/assets`, {
    method: "POST",
    headers: adminHeaders(contentType),
    body: await serializedRequest.arrayBuffer()
  });
  if (!uploadResponse.ok) server.debug();
  assert.equal(uploadResponse.status, 201, await uploadResponse.clone().text());

  const body = (await uploadResponse.json()) as {
    asset: { id: string; url: string; alt: string; mime: string; width: number; height: number; size: number };
  };
  assert.equal(body.asset.alt, "Integration upload");
  assert.equal(body.asset.mime, "image/png");
  assert.equal(body.asset.size, pngBytes.byteLength);

  const mediaResponse = await app.fetch(`${APP_ORIGIN}${body.asset.url}`);
  assert.equal(mediaResponse.status, 200);
  assert.equal(mediaResponse.headers.get("content-type"), "image/png");
  assert.equal(mediaResponse.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.deepEqual(new Uint8Array(await mediaResponse.arrayBuffer()), pngBytes);

  const workResponse = await app.fetch(`${APP_ORIGIN}/api/admin/works`, {
    method: "POST",
    headers: adminHeaders("application/json"),
    body: JSON.stringify({
      slug: "admin-thumbnail-integration",
      title: THUMBNAIL_TEST_WORK_TITLE,
      category: "UI/UX",
      summary: "Admin thumbnail rendering test",
      client: "Integration",
      year: "2026",
      role: "Figma",
      thumbnailAssetId: body.asset.id,
      featured: false,
      published: true,
      blocks: []
    })
  });
  assert.equal(workResponse.status, 201, await workResponse.clone().text());
});

test("mobile about and career routes initialize visibly and keep wheel scrolling usable", async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();

    await page.goto(`${harnessOrigin}/about`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.scrollY > 100 && Boolean(document.querySelector("[data-identity]")));

    const aboutState = await page.evaluate(() => {
      const identity = document.querySelector<HTMLElement>("[data-identity]");
      const intro = document.querySelector<HTMLElement>('[data-type-copy="about"]');
      return {
        scrollY: window.scrollY,
        workTop: document.querySelector<HTMLElement>("#work")?.offsetTop ?? 0,
        identityTop: identity?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        identityBottom: identity?.getBoundingClientRect().bottom ?? Number.NEGATIVE_INFINITY,
        introVisible: Boolean(intro && getComputedStyle(intro).display !== "none"),
        career: identity?.classList.contains("is-career") ?? false,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });

    assert.equal(aboutState.introVisible, true);
    assert.equal(aboutState.career, false);
    assert.ok(aboutState.identityTop < 844 && aboutState.identityBottom > 0);
    assert.ok(aboutState.horizontalOverflow <= 1);

    const beforeWheel = aboutState.scrollY;
    await page.mouse.wheel(0, 900);
    await page.waitForFunction((start) => window.scrollY > Number(start) + 40, beforeWheel);
    const afterWheel = await page.evaluate(() => window.scrollY);
    assert.ok(afterWheel < aboutState.workTop, "one mobile wheel input must not skip the entire identity stage");

    await page.goto(`${harnessOrigin}/career`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const identity = document.querySelector<HTMLElement>("[data-identity]");
      return window.scrollY > 100 && identity?.classList.contains("is-career");
    });

    const careerState = await page.evaluate(() => {
      const identity = document.querySelector<HTMLElement>("[data-identity]");
      const careerList = document.querySelector<HTMLElement>("[data-career-list]");
      const timelineTrack = document.querySelector<HTMLElement>("[data-timeline-track]");
      const rect = careerList?.getBoundingClientRect();
      const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-timeline-card]"));
      return {
        career: identity?.classList.contains("is-career") ?? false,
        listVisible: Boolean(rect && rect.bottom > 0 && rect.top < window.innerHeight),
        activeTimelineItems: cards.filter((card) => card.classList.contains("is-active")).length,
        fullyFocusedTimelineItems: cards.filter((card) => Number.parseFloat(getComputedStyle(card).opacity) >= 0.99).length,
        timelineGap: timelineTrack ? Number.parseFloat(getComputedStyle(timelineTrack).rowGap) : 0,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });

    assert.equal(careerState.career, true);
    assert.equal(careerState.listVisible, true);
    assert.equal(careerState.activeTimelineItems, 1);
    assert.equal(careerState.fullyFocusedTimelineItems, 1);
    assert.ok(careerState.timelineGap >= 64, `mobile career gap should stay expanded (${careerState.timelineGap}px)`);
    assert.ok(careerState.horizontalOverflow <= 1);

    await page.evaluate(() => {
      const cards = document.querySelectorAll<HTMLElement>("[data-timeline-card]");
      cards.item(cards.length - 1).click();
    });
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll<HTMLElement>("[data-timeline-card]");
      return cards.length > 0 && cards.item(cards.length - 1).classList.contains("is-active");
    });
    await page.waitForTimeout(1300);
    const fullyFocusedEndItems = await page.evaluate(() => (
      Array.from(document.querySelectorAll<HTMLElement>("[data-timeline-card]"))
        .filter((card) => Number.parseFloat(getComputedStyle(card).opacity) >= 0.99)
        .length
    ));
    assert.equal(fullyFocusedEndItems, 1);
    await context.close();
  } finally {
    await browser.close();
  }
});

test("home loading, career endpoints, and gallery height stay visually aligned", async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(harnessOrigin, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("[data-home-loader]").count(), 1);
    await page.waitForFunction(() => {
      const loader = document.querySelector<HTMLElement>("[data-home-loader]");
      const logo = document.querySelector<HTMLElement>(".intro-logo");
      return Boolean(loader?.hidden && logo && Number.parseFloat(getComputedStyle(logo).opacity) > 0.5);
    }, { timeout: 8000 });

    await page.goto(`${harnessOrigin}/career`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelectorAll("[data-timeline-card].is-active").length === 1);
    const getTimelineCenterDelta = () => page.evaluate(() => {
      const list = document.querySelector<HTMLElement>("[data-career-list]");
      const active = document.querySelector<HTMLElement>("[data-timeline-card].is-active");
      if (!list || !active) return Number.POSITIVE_INFINITY;
      const listRect = list.getBoundingClientRect();
      const cardRect = active.getBoundingClientRect();
      return Math.abs((listRect.top + listRect.bottom) / 2 - (cardRect.top + cardRect.bottom) / 2);
    });
    assert.ok(await getTimelineCenterDelta() <= 2, "the first career item should start centered");

    await page.evaluate(() => {
      const cards = document.querySelectorAll<HTMLElement>("[data-timeline-card]");
      cards.item(cards.length - 1).click();
    });
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll<HTMLElement>("[data-timeline-card]");
      return cards.length > 0 && cards.item(cards.length - 1).classList.contains("is-active");
    });
    await page.waitForTimeout(1300);
    const lastTimelineCenterDelta = await getTimelineCenterDelta();
    assert.ok(lastTimelineCenterDelta <= 2, `the last career item should finish centered (delta: ${lastTimelineCenterDelta}px)`);

    await page.goto(`${harnessOrigin}/work`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const section = document.querySelector<HTMLElement>(".gallery-section");
      return Boolean(section && Math.abs(section.getBoundingClientRect().top) <= 1);
    }, { timeout: 8000 });
    const galleryHeights = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>(".gallery-section");
      const canvas = document.querySelector<HTMLElement>(".gallery-canvas");
      return {
        section: section?.offsetHeight ?? 0,
        canvas: canvas?.offsetHeight ?? 0,
        panel: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--home-panel-height")) || window.innerHeight,
        top: section?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      };
    });
    assert.ok(galleryHeights.canvas > 0);
    assert.ok(
      Math.abs(galleryHeights.section - Math.max(galleryHeights.canvas, galleryHeights.panel)) <= 1,
      "gallery section should match its content while keeping one full panel of opaque coverage"
    );
    assert.ok(
      Math.abs(galleryHeights.top) <= 1,
      `the gallery should fully cover the featured stage at its route target (${JSON.stringify(galleryHeights)})`
    );

    await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>(".gallery-section");
      if (!section) return;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: section.offsetTop - window.innerHeight / 2, behavior: "auto" });
    });
    await page.waitForFunction(() => {
      const section = document.querySelector<HTMLElement>(".gallery-section");
      return Boolean(section && Math.abs(section.getBoundingClientRect().top - window.innerHeight / 2) <= 2);
    });
    const galleryEntryState = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>(".gallery-section");
      if (!section) return null;
      const stage = document.querySelector<HTMLElement>(".featured-stage");
      return {
        galleryTop: section.getBoundingClientRect().top,
        stageTop: stage?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        viewportHalf: window.innerHeight / 2
      };
    });
    assert.ok(galleryEntryState);
    assert.ok(
      Math.abs(galleryEntryState.galleryTop - galleryEntryState.viewportHalf) <= 2,
      `the gallery should rise over featured through a full-panel transition (${JSON.stringify(galleryEntryState)})`
    );
    assert.ok(
      Math.abs(galleryEntryState.stageTop) <= 2,
      `the featured stage should remain sticky while the gallery rises over it (${JSON.stringify(galleryEntryState)})`
    );
  } finally {
    await browser.close();
  }
});

test("work gallery filters update tiles and support roving keyboard navigation", async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${harnessOrigin}/work`, { waitUntil: "networkidle" });

    const uiUxTab = page.locator('[data-filter="UI/UX"]');
    await uiUxTab.click();
    await page.waitForFunction(() => document.querySelector('[data-filter="UI/UX"]')?.getAttribute("aria-selected") === "true");

    const uiUxState = await page.evaluate(() => {
      const visibleTiles = Array.from(document.querySelectorAll<HTMLElement>("#work-gallery-grid [data-category]")).filter((tile) => !tile.hidden);
      const tab = document.querySelector<HTMLElement>('[data-filter="UI/UX"]');
      return {
        labelledBy: document.querySelector("#work-gallery-grid")?.getAttribute("aria-labelledby"),
        selectedId: tab?.id,
        status: document.querySelector("[data-gallery-status]")?.textContent,
        visibleCount: visibleTiles.length,
        categories: visibleTiles.map((tile) => tile.dataset.category ?? "")
      };
    });

    assert.equal(uiUxState.labelledBy, uiUxState.selectedId);
    assert.match(uiUxState.status ?? "", /^UI\/UX 작업물 \d+개$/);
    assert.ok(uiUxState.visibleCount > 0);
    assert.ok(uiUxState.categories.every((category) => category.split(",").map((value) => value.trim()).includes("UI/UX")));

    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>("#work-gallery-grid [data-category]").forEach((tile) => {
        tile.dataset.category = "UI/UX";
      });
    });
    await uiUxTab.focus();
    await uiUxTab.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector('[data-filter="BI/BX"]')?.getAttribute("aria-selected") === "true");
    assert.equal(await page.locator('[data-filter="BI/BX"]').getAttribute("tabindex"), "0");
    await page.waitForFunction(() => document.querySelector<HTMLElement>("[data-gallery-filter-empty]")?.hidden === false);
    assert.equal(await page.locator("[data-gallery-filter-empty] p").textContent(), "이런... 아직 작업물이 없네요.");
    assert.equal(await page.locator("#work-gallery-grid [data-category]:visible").count(), 0);
    assert.equal(
      await page.locator("[data-gallery-status]").textContent(),
      "BI/BX 작업물 0개. 아직 등록된 작업물이 없습니다."
    );

    await page.locator('[data-filter="ALL"]').click();
    await page.waitForFunction(() => document.querySelector<HTMLElement>("[data-gallery-filter-empty]")?.hidden === true);
    assert.ok(await page.locator("#work-gallery-grid [data-category]:visible").count() > 0);
  } finally {
    await browser.close();
  }
});

test("featured work dots activate the matching full-screen panel", async () => {
  for (const suffix of ["a", "b"]) {
    const response = await app.fetch(`${APP_ORIGIN}/api/admin/works`, {
      method: "POST",
      headers: adminHeaders("application/json"),
      body: JSON.stringify({
        slug: `integration-featured-${suffix}`,
        title: `Integration Featured ${suffix.toUpperCase()}`,
        category: "BI/BX",
        summary: "Featured controller integration test",
        client: "Test Client",
        year: "2026",
        role: "Design",
        featured: true,
        published: true,
        blocks: []
      })
    });
    assert.equal(response.status, 201, await response.clone().text());
  }

  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${harnessOrigin}/work?featured-test=1`, { waitUntil: "domcontentloaded" });
    const dots = page.locator("[data-featured-dot]");
    await page.waitForFunction(() => document.querySelectorAll("[data-featured-dot]").length >= 2 && document.querySelector("[data-featured-dot]")?.getAttribute("aria-pressed") === "true");
    await dots.nth(1).evaluate((dot) => dot.click());
    await page.waitForFunction(() => document.querySelectorAll("[data-featured-panel]")[1]?.classList.contains("is-active"));

    const featuredState = await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-featured-panel]"));
      const dots = Array.from(document.querySelectorAll<HTMLElement>("[data-featured-dot]"));
      return {
        activePanels: panels.filter((panel) => panel.classList.contains("is-active")).length,
        firstHidden: panels[0]?.getAttribute("aria-hidden"),
        secondHidden: panels[1]?.getAttribute("aria-hidden"),
        firstPressed: dots[0]?.getAttribute("aria-pressed"),
        secondPressed: dots[1]?.getAttribute("aria-pressed")
      };
    });

    assert.equal(featuredState.activePanels, 1);
    assert.equal(featuredState.firstHidden, "true");
    assert.equal(featuredState.secondHidden, "false");
    assert.equal(featuredState.firstPressed, "false");
    assert.equal(featuredState.secondPressed, "true");
  } finally {
    await browser.close();
  }
});

test("admin CSS imports render the shell and work editor layout", async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${harnessOrigin}/admin`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Username").fill(ADMIN_USERNAME);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForSelector(".admin-sidebar");

    const shellState = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>(".admin-shell");
      const sidebar = document.querySelector<HTMLElement>(".admin-sidebar");
      return {
        shellDisplay: shell ? getComputedStyle(shell).display : "",
        shellColumns: shell ? getComputedStyle(shell).gridTemplateColumns : "",
        sidebarPosition: sidebar ? getComputedStyle(sidebar).position : "",
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });

    assert.equal(shellState.shellDisplay, "grid");
    assert.notEqual(shellState.shellColumns, "none");
    assert.equal(shellState.sidebarPosition, "sticky");
    assert.ok(shellState.horizontalOverflow <= 1);

    await page.getByRole("button", { name: "Works" }).click();
    await page.waitForSelector(".admin-work-card");

    const thumbnailCard = page.locator(".admin-work-card", { hasText: THUMBNAIL_TEST_WORK_TITLE });
    const thumbnailImage = thumbnailCard.locator(".work-tile-media img");
    await thumbnailImage.waitFor({ state: "visible" });
    await page.waitForFunction(
      (title) => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>(".admin-work-card"));
        const card = cards.find((candidate) => candidate.textContent?.includes(title));
        const image = card?.querySelector<HTMLImageElement>(".work-tile-media img");
        return Boolean(image?.complete && image.naturalWidth > 0);
      },
      THUMBNAIL_TEST_WORK_TITLE
    );
    assert.ok((await thumbnailImage.evaluate((image) => image.naturalWidth)) > 0);

    await page.locator(".admin-work-card").first().click();
    await page.waitForSelector(".work-preview-panel");
    await page.waitForSelector(".block-toolbar");

    const toolsInput = page.getByLabel("Tools");
    await toolsInput.waitFor();
    assert.equal(await toolsInput.getAttribute("placeholder"), "Figma, Illustrator, Photoshop");
    assert.equal(await page.locator(".preview-hero dt", { hasText: "Tools" }).count(), 1);

    const previewCopyCount = await page.locator(".preview-block-copy").count();
    await page.getByRole("button", { name: "Paragraph", exact: true }).click();
    await page.waitForFunction(
      (previousCount) => document.querySelectorAll(".preview-block-copy").length > previousCount,
      previewCopyCount
    );
    assert.equal(
      await page.locator(".preview-block-copy").last().evaluate((node) => node.style.getPropertyValue("--preview-block-width")),
      "100%"
    );

    const previewDividerCount = await page.locator(".preview-block-divider").count();
    await page.getByRole("button", { name: "Divider", exact: true }).click();
    await page.waitForFunction(
      (previousCount) => document.querySelectorAll(".preview-block-divider").length > previousCount,
      previewDividerCount
    );

    const editorState = await page.evaluate(async () => {
      const layout = document.querySelector<HTMLElement>(".works-editor-layout");
      const editor = document.querySelector<HTMLElement>(".work-editor");
      const preview = document.querySelector<HTMLElement>(".work-preview-panel");
      const toolbar = document.querySelector<HTMLElement>(".block-toolbar");
      const blockList = document.querySelector<HTMLElement>(".block-list");

      if (editor && toolbar && blockList) {
        blockList.style.minHeight = "1600px";
        const toolbarOffset = toolbar.getBoundingClientRect().top - editor.getBoundingClientRect().top;
        editor.scrollTop += toolbarOffset + 80;
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      }

      return {
        layoutDisplay: layout ? getComputedStyle(layout).display : "",
        layoutColumns: layout ? getComputedStyle(layout).gridTemplateColumns : "",
        editorOverflow: editor ? getComputedStyle(editor).overflowY : "",
        previewOverflow: preview ? getComputedStyle(preview).overflow : "",
        toolbarPosition: toolbar ? getComputedStyle(toolbar).position : "",
        toolbarTop: toolbar ? getComputedStyle(toolbar).top : "",
        stickyOffset: editor && toolbar ? toolbar.getBoundingClientRect().top - editor.getBoundingClientRect().top : Number.NaN
      };
    });

    assert.equal(editorState.layoutDisplay, "grid");
    assert.match(editorState.layoutColumns, /px/);
    assert.equal(editorState.editorOverflow, "auto");
    assert.equal(editorState.previewOverflow, "hidden");
    assert.equal(editorState.toolbarPosition, "sticky");
    assert.equal(editorState.toolbarTop, "0px");
    assert.ok(Math.abs(editorState.stickyOffset) <= 1, `sticky toolbar offset: ${editorState.stickyOffset}`);
  } finally {
    await browser.close();
  }
});

test("D1 read failures expose degraded content without caching the fallback response", async () => {
  const disableWorksResponse = await setup.fetch("http://setup.test/", {
    method: "POST",
    body: "ALTER TABLE works RENAME TO works_unavailable"
  });
  assert.equal(disableWorksResponse.status, 200, await disableWorksResponse.text());

  const healthResponse = await app.fetch(`${APP_ORIGIN}/api/health`);
  assert.equal(healthResponse.status, 503);
  assert.equal(healthResponse.headers.get("cache-control"), "no-store");
  assert.deepEqual(await healthResponse.json(), { status: "degraded", database: "unavailable" });

  for (let requestIndex = 0; requestIndex < 2; requestIndex += 1) {
    const response = await app.fetch(`${APP_ORIGIN}/work/rush-hour-app`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-portfolio-content-source"), "fallback");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("cdn-cache-control"), "no-store");
    assert.equal(response.headers.get("cloudflare-cdn-cache-control"), "no-store");
    assert.equal(response.headers.get("x-portfolio-cache"), null);
    assert.match(html, /Rush Hour App UI/);
  }
});
