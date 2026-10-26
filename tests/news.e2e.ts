import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("/news lists articles and offers category filters", async ({ app, screen }) => {
  await app.open("/news");
  await expect(screen.getByRole("heading", "News", { level: 1 })).toBeVisible();
  const filterNav = screen.getByRole("navigation", "Kategorie filtern");
  await expect(filterNav.getByRole("link", { name: /Alle/ })).toBeVisible();
  await expect(filterNav.getByRole("link", { name: /Technik/ })).toBeVisible();
});

test("category filter navigates to the filtered list", async ({ app, screen, browser }) => {
  await app.open("/news");
  await screen
    .getByRole("navigation", "Kategorie filtern")
    .getByRole("link", { name: /Technik/ })
    .tap();
  // RSC-Navigation im Dev-Server dauert länger als die Default-Assertion-Zeit.
  await expect(browser).toHaveURL(/category=Technik/, { timeout: 30000 });
  await expect(screen.getByRole("heading", "News", { level: 1 })).toBeVisible();
});

test("article detail shows content without source attribution", async ({ app, screen }) => {
  await app.open("/news");
  await screen.getByRole("link", { name: /Weiterlesen/ }).tap();
  await expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(screen.getByText("Quelle:")).toHaveCount(0);
});
