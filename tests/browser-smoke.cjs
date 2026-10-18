const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

async function main() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filename)] || "application/octet-stream" });
    fs.createReadStream(filename).pipe(response);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto("http://127.0.0.1:" + address.port, { waitUntil: "networkidle" });
    assert.equal(await page.title(), "Nexora — L'assistant des créateurs");
    assert.equal(await page.locator('[data-page="overview"]').isVisible(), true);

    // Navigation and Content Intelligence text analysis.
    await page.locator('[data-view="content"]').first().click();
    assert.equal(await page.locator('[data-page="content"]').isVisible(), true);
    await page.locator("#content-text").fill("Bonjour les amis, voici une publication utile. Bonjour encore les amis.");
    await page.locator("#analyze-text-button").click();
    const textAnalysis = await page.locator("#text-result").innerText();
    assert.match(textAnalysis, /Analyse du texte/);
    assert.match(textAnalysis, /Hashtags/);
    assert.match(textAnalysis, /Mots uniques/);
    assert.match(textAnalysis, /Conseils adaptés/);
    assert.match(textAnalysis, /Comment améliorer ce contenu/);
    assert.match(textAnalysis, /Exemple d'accroche|information concrète|question précise/i);
    assert.match(textAnalysis, /Conseil général/);
    await page.locator("#content-platform").selectOption("instagram-post");
    const instagramAnalysis = await page.locator("#text-result").innerText();
    assert.match(instagramAnalysis, /Instagram/);
    await page.locator("#content-text").fill("Pourquoi créer ? 🌟 Partage tes idées avec nous ! #Création #Création");
    await page.locator("#analyze-text-button").click();
    const focusedAnalysis = await page.locator("#text-result").innerText();
    assert.match(focusedAnalysis, /Émojis détectés/);
    assert.match(focusedAnalysis, /hashtag est répété/i);
    assert.match(focusedAnalysis, /Comment améliorer ce contenu/);
    await page.locator("#image-file").setInputFiles({
      name: "not-an-image.txt", mimeType: "text/plain", buffer: Buffer.from("test")
    });
    assert.match(await page.locator("#image-result").innerText(), /pas reconnu comme une image/);
    await page.locator("#video-file").setInputFiles({
      name: "not-a-video.txt", mimeType: "text/plain", buffer: Buffer.from("test")
    });
    assert.match(await page.locator("#video-result").innerText(), /pas reconnu comme une vidéo/);

    // Cultural Bridge local rewrite and phrasebook.
    await page.locator('[data-view="cultural"]').first().click();
    await page.locator("#bridge-text").fill("bonjour à tous");
    await page.locator("#bridge-tone").selectOption("friendly");
    await page.locator("#bridge-rewrite-button").click();
    assert.match(await page.locator("#bridge-result").innerText(), /Salut !/);
    assert.match(await page.locator("#bridge-result").innerText(), /bonjour à tous/i);
    await page.locator("#bridge-language").selectOption("mg");
    await page.locator("#bridge-phrase-button").click();
    assert.match(await page.locator("#bridge-phrase-result").innerText(), /Manao ahoana/);

    // Digital Identity: validation, save, reload, safe link preview and reset.
    await page.locator('[data-view="identity"]').first().click();
    await page.locator("#identity-name").fill("Nexora Test Creator");
    await page.locator("#identity-handle").fill("@test_creator");
    await page.locator("#identity-tagline").fill("Créateur de contenu");
    await page.locator("#identity-add-link").click();
    await page.locator(".identity-url").last().fill("https://example.com/profile");
    await page.locator("#identity-save").click();
    assert.match(await page.locator("#identity-feedback").innerText(), /enregistrée dans le stockage local/);
    assert.equal(await page.locator("#identity-preview-name").innerText(), "Nexora Test Creator");
    assert.equal(await page.locator("#identity-preview-links a").count(), 1);
    assert.equal(await page.locator("#identity-preview-links a").getAttribute("rel"), "noopener noreferrer");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#identity-name").inputValue(), "Nexora Test Creator");

    await page.locator(".identity-url").last().fill("http://example.com");
    await page.locator("#identity-save").click();
    assert.match(await page.locator("#identity-feedback").innerText(), /adresse HTTPS valide/);

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#identity-reset").click();
    assert.equal(await page.evaluate(() => localStorage.getItem("nexora.digitalIdentity.v1")), null);
    assert.equal(await page.locator("#identity-name").inputValue(), "");

    // Small-screen navigation drawer opens and closes.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#mobile-menu-button").click();
    assert.equal(await page.locator("#sidebar").evaluate((node) => node.classList.contains("is-open")), true);
    assert.equal(await page.locator("#mobile-menu-button").getAttribute("aria-expanded"), "true");
    await page.locator("#sidebar-overlay").click({ position: { x: 320, y: 400 } });
    assert.equal(await page.locator("#sidebar").evaluate((node) => node.classList.contains("is-open")), false);
    assert.deepEqual(pageErrors, [], "browser runtime should not throw uncaught errors");

    console.log("PASS: desktop navigation and Content Intelligence text/file validation");
    console.log("PASS: Cultural Bridge rewrite and Malagasy phrasebook");
    console.log("PASS: Digital Identity validation, local save/reload, safe link preview and reset");
    console.log("PASS: mobile navigation drawer and no uncaught browser errors");
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
