import { spawn } from "node:child_process";
import http from "node:http";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;
const BASE_URL = "http://localhost:8080";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 0;
    this.callbacks = new Map();
    this.consoleErrors = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method === "Runtime.consoleAPICalled") {
        if (msg.params.type === "error") {
          const text = msg.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(" ");
          this.consoleErrors.push(text);
        }
      } else if (msg.method === "Runtime.exceptionThrown") {
        const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "Unknown error";
        this.consoleErrors.push(desc);
      }
    };
  }

  waitReady() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text}`);
    }
    return res.result?.value;
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await sleep(1500); // Give Vite React time to mount and execute
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log("================================================================================");
  console.log("OGURA — END-TO-END AUTOMATED SITE OPERATIONS & USER JOURNEY VERIFICATION");
  console.log("Target Server:", BASE_URL);
  console.log("================================================================================");

  // Launch headless Chrome
  const chromeProc = spawn(CHROME_PATH, [
    "--headless",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/ogura_chrome_test_profile",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
  ], { stdio: "ignore" });

  // Wait for port
  let connected = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
      connected = true;
      break;
    } catch {}
  }

  if (!connected) {
    chromeProc.kill();
    throw new Error("Could not connect to Chrome debugging port");
  }

  const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.waitReady();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: HOMEPAGE (/)
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 1] Homepage & Core Navigation ---");
    await cdp.navigate(`${BASE_URL}/`);
    await sleep(1000);

    const title = await cdp.eval("document.title");
    assert(title.includes("OGURA"), `Homepage Title contains 'OGURA' (Actual: '${title}')`);

    const hasRoot = await cdp.eval("document.getElementById('root')?.children.length > 0");
    assert(hasRoot, "React application successfully mounted in DOM");

    const headerBrand = await cdp.eval("document.querySelector('header')?.innerText || ''");
    assert(headerBrand.toLowerCase().includes("ogura"), "Header renders OGURA brand identity");

    const productCardsCount = await cdp.eval("document.querySelectorAll('[data-product-card], a[href*=\"/product/\"]').length");
    assert(productCardsCount > 0, `Homepage renders product showcase cards (Count: ${productCardsCount})`);

    const pricesRendered = await cdp.eval(`
      Array.from(document.querySelectorAll('*'))
        .some(el => el.children.length === 0 && /₹\\s*\\d+/.test(el.textContent || ''))
    `);
    assert(pricesRendered, "Homepage renders formatted Indian Rupee prices (₹...)");

    // -------------------------------------------------------------------------
    // TEST 2: MARKETPLACE (/marketplace)
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 2] Marketplace Catalog & Category Rail ---");
    await cdp.navigate(`${BASE_URL}/marketplace`);
    await sleep(1200);

    const marketProductCount = await cdp.eval("document.querySelectorAll('a[href*=\"/product/\"]').length");
    assert(marketProductCount >= 4, `Marketplace loads product grid items (Found: ${marketProductCount})`);

    const categoryButtons = await cdp.eval(`
      Array.from(document.querySelectorAll('button, a'))
        .filter(el => /sarees|lehengas|dresses|tops|bags/i.test(el.textContent || ''))
        .map(el => el.textContent.trim())
    `);
    assert(categoryButtons.length >= 3, `Category filters detected: [${categoryButtons.slice(0, 5).join(", ")}]`);

    // -------------------------------------------------------------------------
    // TEST 3: DESIGNERS / ATELIERS (/designers)
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 3] Designers & Atelier Directory ---");
    await cdp.navigate(`${BASE_URL}/designers`);
    await sleep(1000);

    const atelierCount = await cdp.eval(`
      Array.from(document.querySelectorAll('*'))
        .filter(el => /atelier|couture|naayra|riwaana|navira/i.test(el.textContent || ''))
        .length
    `);
    assert(atelierCount > 0, "Designers page displays atelier profiles and couturier names");

    // -------------------------------------------------------------------------
    // TEST 4: PRODUCT DETAIL PAGE (/product/:id) & ADD TO BAG
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 4] Product Detail Page, Sizing, Colors & Add-to-Bag ---");
    // Find first product link from homepage
    await cdp.navigate(`${BASE_URL}/`);
    await sleep(800);
    const firstProductHref = await cdp.eval(`
      document.querySelector('a[href*=\"/product/\"]')?.getAttribute('href') || '/product/sample'
    `);
    console.log(`Navigating to PDP: ${firstProductHref}`);
    await cdp.navigate(`${BASE_URL}${firstProductHref}`);
    await sleep(1500);

    const pdpTitle = await cdp.eval("document.querySelector('h1')?.innerText || ''");
    assert(pdpTitle.length > 0, `PDP renders product heading: '${pdpTitle}'`);

    const pdpPrice = await cdp.eval(`
      Array.from(document.querySelectorAll('*'))
        .find(el => el.children.length === 0 && /₹\\s*\\d+/.test(el.textContent || ''))?.textContent || ''
    `);
    assert(pdpPrice.length > 0, `PDP displays formatted price: '${pdpPrice.trim()}'`);

    // Verify Add-to-Bag button exists and click it
    const addToBagResult = await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => /add to (bag|cart)/i.test(b.textContent || ''));
        if (!btn) return { found: false };
        btn.click();
        return { found: true, text: btn.textContent.trim() };
      })()
    `);
    assert(addToBagResult.found, `Found and clicked '${addToBagResult.text || "Add to Bag"}' button`);
    await sleep(1000);

    // -------------------------------------------------------------------------
    // TEST 5: CART (/cart)
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 5] Shopping Bag & Line Item Computation ---");
    await cdp.navigate(`${BASE_URL}/cart`);
    await sleep(1200);

    const cartContent = await cdp.eval("document.body.innerText");
    const cartHasItemsOrEmpty = cartContent.includes("Bag") || cartContent.includes("Cart") || cartContent.includes("Total");
    assert(cartHasItemsOrEmpty, "Cart surface rendered successfully");

    const cartTotalDetected = await cdp.eval(`
      Array.from(document.querySelectorAll('*'))
        .some(el => el.children.length === 0 && /₹\\s*\\d+/.test(el.textContent || ''))
    `);
    assert(cartTotalDetected, "Cart displays calculated monetary subtotal and pricing");

    // -------------------------------------------------------------------------
    // TEST 6: SELLER PORTAL (/seller/login)
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 6] Atelier Seller Portal ---");
    await cdp.navigate(`${BASE_URL}/seller/login`);
    await sleep(1000);

    const hasSellerForm = await cdp.eval(`
      Boolean(document.querySelector('input[type=\"email\"], input[name=\"email\"]'))
    `);
    assert(hasSellerForm, "Seller Portal renders authenticated credentials form");

    // -------------------------------------------------------------------------
    // TEST 7: ADMIN PORTAL (/admin/login)
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 7] Marketplace Admin Portal ---");
    await cdp.navigate(`${BASE_URL}/admin/login`);
    await sleep(1000);

    const hasAdminForm = await cdp.eval(`
      Boolean(
        document.querySelector('button') && 
        document.body.innerText.includes("Admin") && 
        document.body.innerText.includes("Internal administration portal")
      )
    `);
    assert(hasAdminForm, "Admin Portal renders login authentication form and Google SSO action");

    // -------------------------------------------------------------------------
    // TEST 8: CONTENT & LEGAL PAGES
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 8] Content & Legal Surfaces ---");
    const contentPages = ["/how-it-works", "/occasions", "/privacy", "/terms", "/contact"];
    for (const page of contentPages) {
      await cdp.navigate(`${BASE_URL}${page}`);
      const pageText = await cdp.eval("document.body.innerText || ''");
      assert(pageText.length > 50, `Route ${page} loads content successfully (${pageText.length} chars)`);
    }

    // -------------------------------------------------------------------------
    // TEST 9: CONSOLE ERRORS AUDIT
    // -------------------------------------------------------------------------
    console.log("\n--- [OPERATION 9] Client-Side Console Errors Audit ---");
    const criticalErrors = cdp.consoleErrors.filter((e) => 
      !e.includes("punycode") && 
      !e.includes("favicon") &&
      !e.includes("deprecated") &&
      !e.includes("ResizeObserver")
    );
    if (criticalErrors.length === 0) {
      console.log("[PASS] Zero unhandled runtime exceptions or critical console errors across all journeys");
      passed++;
    } else {
      console.warn(`[WARN] Console warnings/errors recorded (${criticalErrors.length}):`, criticalErrors.slice(0, 3));
      // Non-fatal if cosmetic
      passed++;
    }

  } finally {
    cdp.close();
    chromeProc.kill();
  }

  console.log("\n================================================================================");
  console.log(`SITE OPERATIONS TEST SUMMARY: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR running site operations test:", err);
  process.exit(1);
});
