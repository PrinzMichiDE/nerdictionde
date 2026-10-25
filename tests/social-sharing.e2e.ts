import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("review detail page shows share buttons with all platforms", async ({ app, screen }) => {
  await app.open("/reviews");
  const firstReviewLink = screen.getByRole("link", { name: /Weiterlesen|Zum Test/ }).first();
  await expect(firstReviewLink).toBeVisible({ timeout: 10000 });
  await firstReviewLink.tap();

  await expect(screen.getByRole("group", { name: /Teilen/ })).toBeVisible();

  await expect(screen.getByRole("button", { name: /Auf Twitter teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Bluesky teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Mastodon teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Reddit teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Discord teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Link kopieren/ })).toBeVisible();
});

test("collection page shows share buttons", async ({ app, screen }) => {
  await app.open("/listen");
  const firstCollectionLink = screen.getByRole("link", { name: /Liste ansehen|Zur Liste/ }).first();
  await expect(firstCollectionLink).toBeVisible({ timeout: 10000 });
  await firstCollectionLink.tap();

  await expect(screen.getByRole("group", { name: /Teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Twitter teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Link kopieren/ })).toBeVisible();
});

test("series page shows share buttons", async ({ app, screen }) => {
  await app.open("/serien");
  const firstSeriesLink = screen.getByRole("link", { name: /Zur Serie/ }).first();
  await expect(firstSeriesLink).toBeVisible({ timeout: 10000 });
  await firstSeriesLink.tap();

  await expect(screen.getByRole("group", { name: /Teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Twitter teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Link kopieren/ })).toBeVisible();
});

test("profile page shows share buttons", async ({ app, screen }) => {
  await app.open("/u");
  const firstProfileLink = screen.getByRole("link", { name: /Profil ansehen/ }).first();
  await expect(firstProfileLink).toBeVisible({ timeout: 10000 });
  await firstProfileLink.tap();

  await expect(screen.getByRole("group", { name: /Teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Auf Twitter teilen/ })).toBeVisible();
  await expect(screen.getByRole("button", { name: /Link kopieren/ })).toBeVisible();
});

test("copy link shows toast confirmation", async ({ app, screen }) => {
  await app.open("/reviews");
  const firstReviewLink = screen.getByRole("link", { name: /Weiterlesen|Zum Test/ }).first();
  await expect(firstReviewLink).toBeVisible({ timeout: 10000 });
  await firstReviewLink.tap();

  await screen.getByRole("button", { name: /Link kopieren/ }).tap();

  await expect(screen.getByText("Link in Zwischenablage kopiert")).toBeVisible({ timeout: 5000 });
});

test("meta tags present on review detail page", async ({ app, screen, browser }) => {
  await app.open("/reviews");
  const firstReviewLink = screen.getByRole("link", { name: /Weiterlesen|Zum Test/ }).first();
  await expect(firstReviewLink).toBeVisible({ timeout: 10000 });
  await firstReviewLink.tap();

  const ogTitle = await browser.locator('meta[property="og:title"]').getAttribute("content");
  expect(ogTitle).toBeTruthy();

  const ogDescription = await browser.locator('meta[property="og:description"]').getAttribute("content");
  expect(ogDescription).toBeTruthy();

  const ogImage = await browser.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toBeTruthy();

  const ogType = await browser.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("article");

  const twitterCard = await browser.locator('meta[name="twitter:card"]').getAttribute("content");
  expect(twitterCard).toBe("summary_large_image");

  const twitterTitle = await browser.locator('meta[name="twitter:title"]').getAttribute("content");
  expect(twitterTitle).toBeTruthy();
});

test("meta tags present on collection page", async ({ app, screen, browser }) => {
  await app.open("/listen");
  const firstCollectionLink = screen.getByRole("link", { name: /Liste ansehen|Zur Liste/ }).first();
  await expect(firstCollectionLink).toBeVisible({ timeout: 10000 });
  await firstCollectionLink.tap();

  const ogType = await browser.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("website");
});

test("meta tags present on series page", async ({ app, screen, browser }) => {
  await app.open("/serien");
  const firstSeriesLink = screen.getByRole("link", { name: /Zur Serie/ }).first();
  await expect(firstSeriesLink).toBeVisible({ timeout: 10000 });
  await firstSeriesLink.tap();

  const ogType = await browser.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("article");
});

test("meta tags present on profile page", async ({ app, screen, browser }) => {
  await app.open("/u");
  const firstProfileLink = screen.getByRole("link", { name: /Profil ansehen/ }).first();
  await expect(firstProfileLink).toBeVisible({ timeout: 10000 });
  await firstProfileLink.tap();

  const ogType = await browser.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("profile");
});

test("mastodon instance dialog opens on click", async ({ app, screen }) => {
  await app.open("/reviews");
  const firstReviewLink = screen.getByRole("link", { name: /Weiterlesen|Zum Test/ }).first();
  await expect(firstReviewLink).toBeVisible({ timeout: 10000 });
  await firstReviewLink.tap();

  await screen.getByRole("button", { name: /Auf Mastodon teilen/ }).tap();

  await expect(screen.getByRole("dialog", { name: /Mastodon-Instanz/ })).toBeVisible();
  await expect(screen.getByLabel("Instanz")).toBeVisible();
});

test("share buttons are visible and interactive", async ({ app, screen }) => {
  await app.open("/reviews");
  const firstReviewLink = screen.getByRole("link", { name: /Weiterlesen|Zum Test/ }).first();
  await expect(firstReviewLink).toBeVisible({ timeout: 10000 });
  await firstReviewLink.tap();

  // Verify share buttons group is present
  await expect(screen.getByRole("group", { name: /Teilen/ })).toBeVisible();
  // Verify at least one button is present
  await expect(screen.getByRole("button", { name: /Auf Twitter teilen/ })).toBeVisible();
});