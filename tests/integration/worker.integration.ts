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
    role: "Design",
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
      }
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
  assert.doesNotMatch(html, /Draft block content/);
});

test("image upload stores bytes in R2, metadata in D1, and serves immutable media", async () => {
  const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = new FormData();
  form.append("file", new Blob([pngSignature], { type: "image/png" }), "integration.png");
  form.append("alt", "Integration upload");
  form.append("width", "1");
  form.append("height", "1");

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
    asset: { url: string; alt: string; mime: string; width: number; height: number; size: number };
  };
  assert.equal(body.asset.alt, "Integration upload");
  assert.equal(body.asset.mime, "image/png");
  assert.equal(body.asset.size, pngSignature.byteLength);

  const mediaResponse = await app.fetch(`${APP_ORIGIN}${body.asset.url}`);
  assert.equal(mediaResponse.status, 200);
  assert.equal(mediaResponse.headers.get("content-type"), "image/png");
  assert.equal(mediaResponse.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.deepEqual(new Uint8Array(await mediaResponse.arrayBuffer()), pngSignature);
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
      const rect = careerList?.getBoundingClientRect();
      return {
        career: identity?.classList.contains("is-career") ?? false,
        listVisible: Boolean(rect && rect.bottom > 0 && rect.top < window.innerHeight),
        activeTimelineItems: document.querySelectorAll("[data-timeline-card].is-active").length,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });

    assert.equal(careerState.career, true);
    assert.equal(careerState.listVisible, true);
    assert.equal(careerState.activeTimelineItems, 1);
    assert.ok(careerState.horizontalOverflow <= 1);
    await context.close();
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

    await uiUxTab.focus();
    await uiUxTab.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector('[data-filter="BI/BX"]')?.getAttribute("aria-selected") === "true");
    assert.equal(await page.locator('[data-filter="BI/BX"]').getAttribute("tabindex"), "0");
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
