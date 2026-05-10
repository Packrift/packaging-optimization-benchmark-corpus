import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const feedPath = process.env.FEED_PATH || "/Users/farhan/Downloads/packrift-ai-commerce-execution-2026-05-04/ai-catalog-control/merchant-top1000/merchant-center-top1000-exact-spec-feed-2026-05-05.jsonl";
const graphPath = process.env.PRODUCT_GRAPH_PATH || "/Users/farhan/Downloads/packrift-ai-commerce-factory/control/product_spec_graph_current.csv";
const outDir = path.join(root, "docs");
const baseUrl = (process.env.BASE_URL || "https://packrift.github.io/packaging-optimization-benchmark-corpus").replace(/\/+$/, "");
const rowLimit = Number(process.env.PAGE_ROW_LIMIT || 1000);
const artifactDate = "2026-05-10";
const indexNowKey = "5050e763abb8dafdc736a5971e107171";
const googleGuidance = {
  helpfulContent: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  spamPolicies: "https://developers.google.com/search/docs/essentials/spam-policies",
  sitemaps: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
  structuredData: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
};

const pageTypes = [
  ["dimensional-weight-benchmark", "Dimensional Weight Benchmark", "Screen whether listed dimensions can create parcel DIM-weight exposure before a buyer standardizes a SKU."],
  ["cube-utilization-benchmark", "Cube Utilization Benchmark", "Convert listed dimensions into cube or face-area planning values for warehouse and pack-station comparisons."],
  ["length-girth-screen", "Length Plus Girth Screen", "Flag long-side and length-plus-girth values that may affect carrier handling checks."],
  ["carton-fit-boundary", "Carton Fit Boundary", "Document the fit question a team must answer before using this Packrift item as a standard shipper."],
  ["void-fill-screen", "Void Fill Screen", "Record when the SKU needs void-fill, inserts, or cushioning review before rollout."],
  ["parcel-freight-router", "Parcel Freight Router", "Use weight, dimensions, and product family to decide which rating path should be verified next."],
  ["pallet-storage-prompt", "Pallet Storage Prompt", "Prepare a storage and palletization prompt without claiming a pallet count from incomplete data."],
  ["warehouse-bin-slotting", "Warehouse Bin Slotting", "Turn the SKU into a warehouse slotting note with dimensions, family, and source caveats."],
  ["pick-path-label-card", "Pick Path Label Card", "Create a picker-facing label record that reduces wrong-size or wrong-family substitutions."],
  ["receiving-inspection-check", "Receiving Inspection Check", "List the fields receiving should verify against the Packrift source before accepting inventory."],
  ["source-spec-audit", "Source Spec Audit", "Audit the product-derived source fields used for catalog, AI retrieval, and procurement references."],
  ["substitute-approval-screen", "Substitute Approval Screen", "Define the fields that must match before an alternate packaging SKU is approved."],
  ["damage-risk-screen", "Damage Risk Screen", "Frame family-specific damage risks and the evidence needed before changing packaging."],
  ["material-compatibility-screen", "Material Compatibility Screen", "Summarize material, color, closure, adhesive, and handling compatibility checks."],
  ["pack-count-normalization", "Pack Count Normalization", "Normalize case, pack, bundle, or roll quantity so buyers compare like with like."],
  ["unit-economics-snapshot", "Unit Economics Snapshot", "Create a source-snapshot unit price and unit weight frame without claiming live pricing."],
  ["reorder-trigger-sheet", "Reorder Trigger Sheet", "Prepare a reorder-by-SKU record with current-source caveats and buyer handoff links."],
  ["bulk-quote-prep", "Bulk Quote Prep", "Gather the fields a buyer should include before requesting a Packrift bulk quote."],
  ["marketplace-prep-check", "Marketplace Prep Check", "Map the SKU to marketplace, FBA, inventory, label, or shipping-prep checks where applicable."],
  ["returns-repack-screen", "Returns Repack Screen", "Screen whether the item is suitable for returns, replacement shipments, or repack workflows."],
  ["ai-retrieval-card", "AI Retrieval Card", "Create an exact-match retrieval card for AI agents and internal search tools."],
  ["buyer-comparison-prompt", "Buyer Comparison Prompt", "Give procurement a structured comparison prompt against nearby same-family SKUs."],
  ["qa-exception-record", "QA Exception Record", "Expose missing or weak fields so thin pages and unsupported claims can be blocked."],
  ["implementation-handoff", "Implementation Handoff", "Package the SKU, source facts, checks, and canonical links for a human or agent implementing the choice."],
].map(([id, label, intent]) => ({ id, label, intent }));

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...data] = rows;
  return data
    .filter((r) => r.some((value) => String(value || "").trim()))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
}

function numberPart(value) {
  const raw = String(value || "").trim().replace(/"/g, "");
  if (!raw) return null;
  try {
    if (/^\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
    if (/^\d+\/\d+$/.test(raw)) {
      const [n, d] = raw.split("/").map(Number);
      return d ? n / d : null;
    }
    if (/^\d+\s+\d+\/\d+$/.test(raw)) {
      const [whole, frac] = raw.split(/\s+/, 2);
      const [n, d] = frac.split("/").map(Number);
      return d ? Number(whole) + n / d : null;
    }
  } catch {
    return null;
  }
  return null;
}

function parseDimensionText(value) {
  const text = String(value || "").replace(/[×X]/g, "x");
  const parts = text.match(/\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+/g)?.map(numberPart).filter((v) => Number.isFinite(v) && v > 0) || [];
  if (parts.length < 2) return {};
  const [length, width, height] = parts;
  return {
    length,
    width,
    height,
    source: value,
  };
}

function round(value, places = 2) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(places)).toLocaleString("en-US");
}

function money(value) {
  const n = Number(String(value || "").replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? `$${round(n, 2)}` : "";
}

function familyName(value) {
  const family = String(value || "").toLowerCase();
  const labels = {
    boxes: "corrugated boxes",
    mailers: "mailers",
    labels: "labels",
    poly_bags: "poly bags",
    tape: "packing tape",
    strapping: "strapping",
  };
  return labels[family] || family.replaceAll("_", " ") || "packaging supplies";
}

function detailMap(details) {
  const out = {};
  for (const detail of details || []) {
    const key = String(detail.attributeName || "").toLowerCase();
    if (key) out[key] = String(detail.attributeValue || "").trim();
  }
  return out;
}

function offerParts(offerId) {
  const match = String(offerId || "").match(/^shopify_[^_]+_(\d+)_(\d+)$/);
  return {
    productId: match?.[1] || "",
    variantId: match?.[2] || "",
  };
}

function safeUrl(url) {
  return String(url || "").startsWith("https://") ? url : "https://packrift.com/";
}

function normalizeRow(feedRow, graphRow, index) {
  const attrs = feedRow.productAttributes || {};
  const details = attrs.productDetails || [];
  const detail = detailMap(details);
  const parsedDetailDims = parseDimensionText(detail.dimensions || "");
  const productLength = Number(attrs.productLength?.value || graphRow?.title_length_in || graphRow?.metafield_length_in || parsedDetailDims.length || 0);
  const productWidth = Number(attrs.productWidth?.value || graphRow?.title_width_in || graphRow?.metafield_width_in || parsedDetailDims.width || 0);
  const productHeight = Number(attrs.productHeight?.value || graphRow?.title_height_in || graphRow?.metafield_height_in || parsedDetailDims.height || 0);
  const dimensions = {
    length: productLength > 0 ? productLength : null,
    width: productWidth > 0 ? productWidth : null,
    height: productHeight > 0 ? productHeight : null,
    display: detail.dimensions || [productLength, productWidth, productHeight].filter(Boolean).join(" x "),
  };
  const weight = Number(attrs.productWeight?.value || attrs.shippingWeight?.value || graphRow?.weight_value || 0);
  const packCount = Number(attrs.unitPricingMeasure?.value || 0);
  const price = Number(String(graphRow?.price || "").replace(/[$,]/g, "")) || null;
  const family = attrs.customLabel1 || graphRow?.family || "packaging_supplies";
  const parts = offerParts(feedRow.offerId);
  const title = graphRow?.title || detail["ai summary"] || `${familyName(family)} ${index + 1}`;
  const handle = graphRow?.handle || slugify(title);
  const productUrl = graphRow?.handle ? `https://packrift.com/products/${graphRow.handle}` : `https://packrift.com/search?q=${encodeURIComponent(graphRow?.sku || feedRow.offerId || title)}`;
  const row = {
    index: index + 1,
    offerId: feedRow.offerId,
    productId: graphRow?.product_id || parts.productId,
    variantId: graphRow?.variant_id || parts.variantId,
    sku: graphRow?.sku || parts.variantId || `row-${index + 1}`,
    handle,
    slug: `${slugify(graphRow?.sku || parts.variantId || index + 1)}-${slugify(handle || title)}`,
    title,
    family,
    familyLabel: familyName(family),
    productType: graphRow?.product_type || familyName(family),
    productUrl,
    purchaseUrl: `${productUrl}?variant=${encodeURIComponent(graphRow?.variant_id || parts.variantId)}`,
    price,
    inventory: graphRow?.inventory || "",
    merchantStatus: graphRow?.merchant_status || "",
    merchantAvailability: graphRow?.merchant_availability || "",
    imageStatus: attrs.customLabel3 || graphRow?.image_status || "",
    dimensions,
    weight: weight > 0 ? weight : null,
    packCount: packCount > 0 ? packCount : null,
    material: detail.material || "",
    color: detail.color || "",
    closure: detail.assembly || detail.closure || "",
    recyclable: detail.recyclable || "",
    aiSummary: detail["ai summary"] || "",
    details,
    highlights: attrs.productHighlights || [],
    labels: {
      customLabel0: attrs.customLabel0 || "",
      customLabel1: attrs.customLabel1 || "",
      customLabel2: attrs.customLabel2 || "",
      customLabel3: attrs.customLabel3 || "",
      customLabel4: attrs.customLabel4 || "",
    },
  };
  return { ...row, metrics: metrics(row), quality: quality(row) };
}

function metrics(row) {
  const { length, width, height } = row.dimensions;
  const area = length && width ? length * width : null;
  const volume = length && width && height ? length * width * height : null;
  const girth = length && width && height ? length + 2 * (width + height) : null;
  const longest = [length, width, height].filter(Boolean).sort((a, b) => b - a)[0] || null;
  const dim139 = volume ? Math.ceil(volume / 139) : null;
  const dim166 = volume ? Math.ceil(volume / 166) : null;
  const unitWeight = row.weight && row.packCount ? row.weight / row.packCount : null;
  const unitPrice = row.price && row.packCount ? row.price / row.packCount : null;
  const cubePerUnit = volume && row.packCount ? volume / row.packCount : null;
  return { area, volume, girth, longest, dim139, dim166, unitWeight, unitPrice, cubePerUnit };
}

function quality(row) {
  const checks = [
    ["title", Boolean(row.title)],
    ["sku", Boolean(row.sku)],
    ["product_url", Boolean(row.productUrl && row.productUrl.includes("/products/"))],
    ["ai_summary", Boolean(row.aiSummary)],
    ["details_3_plus", row.details.length >= 3],
    ["highlights_2_plus", row.highlights.length >= 2],
    ["dimension_signal", Boolean(row.dimensions.length && row.dimensions.width)],
    ["weight_signal", Boolean(row.weight)],
    ["pack_count_signal", Boolean(row.packCount)],
    ["exact_spec_label", row.labels.customLabel0 === "exact_spec"],
  ];
  const passed = checks.filter(([, ok]) => ok).length;
  return {
    score: passed,
    max: checks.length,
    passed: checks.filter(([, ok]) => ok).map(([name]) => name),
    missing: checks.filter(([, ok]) => !ok).map(([name]) => name),
    publishable: passed >= 7 && row.productUrl.includes("/products/"),
  };
}

function familyChecks(row) {
  const family = String(row.family || "").toLowerCase();
  if (family === "boxes") {
    return ["Confirm inside usable dimensions against the product plus dunnage.", "Check board grade, closure method, and crush exposure before standardizing.", "Do not treat outside size, inside size, and carrier billing size as identical."];
  }
  if (family === "mailers") {
    return ["Confirm opening, self-seal behavior, and usable depth before replacing a box.", "Use added protection for rigid, sharp, or crush-sensitive products.", "Check presentation and returns workflow before approving a mailer standard."];
  }
  if (family === "labels") {
    return ["Confirm printer type, adhesive, face stock, roll or sheet format, and surface conditions.", "Test barcode scan quality where the label supports routing or inventory.", "Do not substitute label material or adhesive without workflow approval."];
  }
  if (family === "poly_bags") {
    return ["Confirm bag dimensions, film thickness, closure type, and suffocation-warning requirements.", "Match gauge to item edges, weight, and handling exposure.", "Do not use a lightweight bag for sharp or abrasive items without a test pack."];
  }
  if (family === "tape") {
    return ["Confirm tape width, length, adhesive, dispenser, temperature, and carton weight.", "Test seal performance in the actual storage and shipping conditions.", "Do not substitute adhesive family without damage or opening-rate review."];
  }
  if (family === "strapping") {
    return ["Confirm strap width, material, break strength, core, and tool compatibility.", "Review pallet, bundle, and edge-protection requirements before standardizing.", "Do not infer load rating from family alone."];
  }
  return ["Confirm dimensions, material, closure, pack quantity, and current Packrift product page.", "Test one real workflow before approving a substitute.", "Do not infer current price or inventory from this static reference."];
}

function metricBullets(type, row) {
  const m = row.metrics;
  const dims = row.dimensions.display || "not available in source feed";
  const priceSnapshot = row.price ? `${money(row.price)} source snapshot` : "no price snapshot in joined graph";
  const pack = row.packCount ? `${round(row.packCount, 0)} units in source unit-pricing measure` : "pack count not available in source unit-pricing measure";
  const common = {
    "dimensional-weight-benchmark": [
      `Listed dimensions: ${dims}.`,
      m.volume ? `Calculated cube: ${round(m.volume)} cubic inches.` : "Three-dimensional cube not calculated because the source does not expose length, width, and height.",
      m.dim139 ? `DIM weight benchmark at divisor 139: ${round(m.dim139, 0)} lb.` : "Divisor-139 DIM benchmark blocked until 3D dimensions are confirmed.",
      m.dim166 ? `DIM weight benchmark at divisor 166: ${round(m.dim166, 0)} lb.` : "Divisor-166 DIM benchmark blocked until 3D dimensions are confirmed.",
      row.weight ? `Actual product or shipping weight snapshot: ${round(row.weight)} lb.` : "Weight snapshot missing.",
    ],
    "cube-utilization-benchmark": [
      `Listed dimensions: ${dims}.`,
      m.volume ? `Cube benchmark: ${round(m.volume)} cubic inches.` : "Cube benchmark unavailable; use face area or source dimensions instead.",
      m.area ? `Face-area benchmark: ${round(m.area)} square inches.` : "Face-area benchmark unavailable.",
      m.cubePerUnit ? `Approximate cube per sellable unit: ${round(m.cubePerUnit)} cubic inches.` : "Cube-per-unit benchmark needs 3D dimensions and pack count.",
    ],
    "length-girth-screen": [
      m.longest ? `Longest listed side: ${round(m.longest)} inches.` : "Longest side unavailable.",
      m.girth ? `Length plus girth planning value: ${round(m.girth)} inches.` : "Length plus girth needs 3D dimensions.",
      "Use current carrier rules for the final limit check.",
    ],
    "carton-fit-boundary": [
      `Source dimensions: ${dims}.`,
      m.volume ? `Available cube planning value: ${round(m.volume)} cubic inches before contents, inserts, or void fill.` : "Fit boundary should be confirmed manually because complete 3D dimensions are not present.",
      `Family fit lens: ${row.familyLabel}.`,
    ],
    "void-fill-screen": [
      m.volume ? `Void-fill review starts from ${round(m.volume)} cubic inches of listed package cube.` : "Void-fill review starts with physical measurement because cube is missing.",
      row.material ? `Material signal: ${row.material}.` : "Material signal missing.",
      row.aiSummary || "Use the product page summary before deciding cushioning.",
    ],
    "parcel-freight-router": [
      row.weight ? `Weight snapshot: ${round(row.weight)} lb.` : "Weight snapshot missing.",
      m.dim139 ? `DIM-139 benchmark: ${round(m.dim139, 0)} lb.` : "DIM benchmark missing.",
      m.girth ? `Length plus girth planning value: ${round(m.girth)} inches.` : "Length plus girth missing.",
      "Final parcel/LTL routing must be verified in checkout or carrier tooling.",
    ],
    "pallet-storage-prompt": [
      m.volume ? `Single-unit cube benchmark: ${round(m.volume)} cubic inches.` : "Storage cube requires confirmed dimensions.",
      row.weight ? `Weight snapshot: ${round(row.weight)} lb.` : "Weight snapshot missing.",
      pack,
      "Pallet counts are intentionally not claimed from this feed.",
    ],
    "warehouse-bin-slotting": [
      `Slot label: ${row.sku} / ${row.familyLabel}.`,
      `Dimensions to print: ${dims}.`,
      row.inventory ? `Inventory snapshot in graph: ${row.inventory}.` : "Inventory snapshot missing.",
      m.longest ? `Longest-side slotting signal: ${round(m.longest)} inches.` : "Longest-side signal unavailable.",
    ],
    "pick-path-label-card": [
      `Picker label: ${row.sku}.`,
      `Display title: ${row.title}.`,
      `Family: ${row.familyLabel}.`,
      `Dimension display: ${dims}.`,
      pack,
    ],
    "receiving-inspection-check": [
      `Receive against SKU ${row.sku} and product handle ${row.handle}.`,
      `Verify dimensions: ${dims}.`,
      `Verify material/color: ${row.material || "not listed"} / ${row.color || "not listed"}.`,
      `Verify source pack count: ${row.packCount ? round(row.packCount, 0) : "not listed"}.`,
    ],
    "source-spec-audit": [
      `Product details present: ${row.details.length}.`,
      `Product highlights present: ${row.highlights.length}.`,
      `Quality score: ${row.quality.score}/${row.quality.max}.`,
      row.quality.missing.length ? `Missing/weak fields: ${row.quality.missing.join(", ")}.` : "No quality-gate misses in this source record.",
    ],
    "substitute-approval-screen": [
      `Required match fields: SKU, family, dimensions, material, closure, pack count, weight, and product URL.`,
      `Current dimensions: ${dims}.`,
      `Current material/closure: ${row.material || "not listed"} / ${row.closure || "not listed"}.`,
      pack,
    ],
    "damage-risk-screen": [
      `Family risk lens: ${row.familyLabel}.`,
      row.material ? `Material signal: ${row.material}.` : "Material signal missing.",
      m.volume ? `Cube signal for movement/void review: ${round(m.volume)} cubic inches.` : "Cube signal missing; test pack required.",
      row.weight ? `Weight signal: ${round(row.weight)} lb.` : "Weight signal missing.",
    ],
    "material-compatibility-screen": [
      `Material: ${row.material || "not listed in source details"}.`,
      `Color: ${row.color || "not listed in source details"}.`,
      `Closure or assembly: ${row.closure || "not listed in source details"}.`,
      `Recyclable signal: ${row.recyclable || "not listed in source details"}.`,
    ],
    "pack-count-normalization": [
      pack,
      row.weight && row.packCount ? `Approximate weight per unit: ${round(m.unitWeight, 4)} lb.` : "Weight-per-unit unavailable.",
      row.price && row.packCount ? `Approximate price per unit from source snapshot: ${money(m.unitPrice)}.` : "Unit price unavailable from source snapshot.",
      "Packrift case, bundle, pack, carton, and roll quantities are normal sellable units, not Merchant Center multipacks.",
    ],
    "unit-economics-snapshot": [
      `Price: ${priceSnapshot}.`,
      row.packCount ? `Unit-pricing measure: ${round(row.packCount, 0)} ct.` : "Unit-pricing measure missing.",
      m.unitPrice ? `Source-snapshot unit price: ${money(m.unitPrice)}.` : "Source-snapshot unit price not calculated.",
      m.unitWeight ? `Source-snapshot unit weight: ${round(m.unitWeight, 4)} lb.` : "Source-snapshot unit weight not calculated.",
    ],
    "reorder-trigger-sheet": [
      `Reorder key: ${row.sku}.`,
      `Canonical product URL: ${row.productUrl}.`,
      row.inventory ? `Inventory snapshot in graph: ${row.inventory}.` : "Inventory snapshot missing.",
      pack,
    ],
    "bulk-quote-prep": [
      `Quote SKU: ${row.sku}.`,
      `Product URL: ${row.productUrl}.`,
      `Specs to include: ${dims}; ${row.material || "material not listed"}; ${pack}.`,
      row.weight ? `Weight snapshot to include: ${round(row.weight)} lb.` : "Weight snapshot missing.",
    ],
    "marketplace-prep-check": [
      `Marketplace prep family: ${row.familyLabel}.`,
      `Use case hints: ${row.highlights.join("; ") || "no highlights"}.`,
      row.family === "labels" ? "Confirm printer, label size, adhesive, and barcode scan behavior." : "Confirm packaging, label, and outbound handling requirements for the marketplace workflow.",
    ],
    "returns-repack-screen": [
      `Returns lens: ${row.familyLabel}.`,
      row.family === "mailers" || row.family === "boxes" ? "Potential returns/repack candidate if the contents match dimensions and protection requirements." : "Use mainly as a support item unless the workflow explicitly needs this family.",
      `Source dimensions: ${dims}.`,
    ],
    "ai-retrieval-card": [
      `Exact-match key: ${row.sku}.`,
      `Offer ID: ${row.offerId}.`,
      `Match fields: title, family, dimensions, material, pack count, product URL, and variant ID.`,
      `Do not substitute unless match fields are confirmed.`,
    ],
    "buyer-comparison-prompt": [
      `Compare this SKU to same-family alternatives by dimensions, material, closure, pack count, weight, and product URL.`,
      `Current dimensions: ${dims}.`,
      `Current pack count: ${row.packCount ? round(row.packCount, 0) : "not listed"}.`,
      `Current material: ${row.material || "not listed"}.`,
    ],
    "qa-exception-record": [
      `Quality score: ${row.quality.score}/${row.quality.max}.`,
      row.quality.missing.length ? `Fields to verify before live use: ${row.quality.missing.join(", ")}.` : "No quality exceptions from the generator gates.",
      `Publishable by generator gate: ${row.quality.publishable ? "yes" : "no"}.`,
      "Pages with missing metrics state the gap instead of inventing values.",
    ],
    "implementation-handoff": [
      `Implementation target: ${row.sku} / ${row.title}.`,
      `Canonical link: ${row.productUrl}.`,
      `Source facts: ${dims}; ${row.material || "material not listed"}; ${pack}.`,
      "Next action: verify current price, inventory, and checkout before purchase or publishing claims outside this static corpus.",
    ],
  };
  return common[type.id] || [`Source dimensions: ${dims}.`, pack, priceSnapshot];
}

function checklist(type, row) {
  const base = {
    "dimensional-weight-benchmark": ["Use the greater of actual and dimensional weight only after current carrier rules are known.", "Verify whether the listed dimensions are product, inner, outer, or shipping dimensions.", "Do not present this as a live freight quote."],
    "cube-utilization-benchmark": ["Compare cube or face area only within the same packaging family.", "Check practical usable space, not just mathematical volume.", "Keep a physical test pack for final approval."],
    "length-girth-screen": ["Use carrier-specific formulas and surcharge tables before final routing.", "Escalate long-side outliers to shipping ops.", "Document whether the measurement is package or product size."],
    "carton-fit-boundary": ["Measure the product plus protection together.", "Leave clearance for inserts, dunnage, and closure.", "Reject a close fit if packing labor or damage risk increases."],
    "void-fill-screen": ["Check movement inside the package.", "Record the chosen void fill or insert.", "Re-test when product shape, bundle count, or carrier handling changes."],
    "parcel-freight-router": ["Rate the real destination and service.", "Review free-shipping or legacy rate conflicts separately.", "Escalate heavy, long, or high-cube rows before checkout promises."],
    "pallet-storage-prompt": ["Use real case/carton dimensions before pallet math.", "Protect crush-prone supplies from overstacking.", "Separate lookalike sizes by bin, bay, or label."],
    "warehouse-bin-slotting": ["Print SKU and dimensions on the slot label.", "Keep same-family lookalikes physically separated.", "Audit the slot after the first replenishment cycle."],
    "pick-path-label-card": ["Show SKU, family, dimensions, pack count, and Packrift link.", "Place the label where pickers see it before grabbing the item.", "Refresh the card when source facts change."],
    "receiving-inspection-check": ["Compare incoming labels and dimensions to source facts.", "Hold exceptions for buyer review.", "Photograph damage, wrong size, wrong material, or count mismatch."],
    "source-spec-audit": ["Treat feed and graph data as source snapshots.", "Block unsupported claims, fake performance promises, and guessed dimensions.", "Keep the Packrift product page as the canonical commerce source."],
    "substitute-approval-screen": ["Require same family and compatible material.", "Compare dimensions and pack count explicitly.", "Run a pack-station or buyer test before approval."],
    "damage-risk-screen": ["Review damage complaints and carrier claims.", "Match risk to material, closure, and product fragility.", "Do not change packaging on price alone."],
    "material-compatibility-screen": ["Check adhesive, material, finish, color, and environment.", "Test the actual surface or contents.", "Document incompatibilities before substitution."],
    "pack-count-normalization": ["Compare unit economics only after normalizing pack count.", "Confirm whether the unit is each, case, roll, pack, carton, or bundle.", "Do not mark sellable packs as multipacks."],
    "unit-economics-snapshot": ["Use current Packrift pricing before buying.", "Separate source-snapshot math from live margin analysis.", "Normalize by unit, weight, or cube where the data supports it."],
    "reorder-trigger-sheet": ["Use SKU-first reorder paths.", "Confirm current inventory and purchase quantity.", "Record substitute policy before the reorder point is reached."],
    "bulk-quote-prep": ["Include SKU, quantity, dimensions, material, destination, and timing.", "Attach current usage or order forecast when available.", "Do not promise a discount from static source data."],
    "marketplace-prep-check": ["Map the marketplace rule to the actual product and packaging family.", "Check label/barcode and bag/box requirements.", "Keep final approval in the marketplace or seller workflow."],
    "returns-repack-screen": ["Test whether the returned item can be protected and resealed.", "Document when a new shipper is required.", "Avoid reusing damaged outbound packaging."],
    "ai-retrieval-card": ["Prefer exact SKU and product URL matches.", "Return no-match rather than an unsafe substitute.", "Show the fields used to support the recommendation."],
    "buyer-comparison-prompt": ["Compare only same-purpose alternatives.", "Document what changed and what stayed the same.", "Escalate material, closure, or size mismatches."],
    "qa-exception-record": ["Fix missing source fields before broad indexing.", "Use no invented metrics.", "Keep every page connected to source details and product URL."],
    "implementation-handoff": ["Verify live Packrift product state.", "Record the decision owner.", "Carry forward source caveats in any downstream artifact."],
  };
  return [...(base[type.id] || []), ...familyChecks(row).slice(0, 2)];
}

function table(rows) {
  return `<table>${rows.map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(value || "Not listed")}</td></tr>`).join("\n")}</table>`;
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("\n")}</ul>`;
}

function css() {
  return `:root{color-scheme:light;--ink:#17201b;--muted:#5d6a61;--line:#d9e3dc;--bg:#f7faf8;--panel:#fff;--accent:#0f6b55;--accent2:#8a4b0f}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto}header,footer{background:#fff;border-bottom:1px solid var(--line)}footer{border-top:1px solid var(--line);border-bottom:0;color:var(--muted);font-size:14px;padding:22px 0}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:18px 0}.brand{font-weight:760;color:var(--ink)}nav{display:flex;gap:14px;flex-wrap:wrap;font-size:14px}main{padding:28px 0 56px}.breadcrumbs{font-size:13px;color:var(--muted);margin:0 0 18px}.breadcrumbs a{color:var(--muted)}.breadcrumbs span{margin:0 6px}.hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:22px;align-items:start;margin-bottom:24px}h1{font-size:clamp(32px,4vw,56px);line-height:1.03;letter-spacing:0;margin:0 0 14px}h2{font-size:24px;line-height:1.2;margin:0 0 10px}h3{font-size:18px;margin:0 0 8px}p{margin:0 0 14px;color:var(--muted)}.panel,.card{background:var(--panel);border:1px solid var(--line);border-radius:8px}.panel{padding:20px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:20px 0}.card{padding:18px;min-height:124px}.meta{display:grid;gap:10px;font-size:14px}.meta div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #edf2ee;padding-bottom:8px}.meta div:last-child{border-bottom:0;padding-bottom:0}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.button{display:inline-flex;min-height:40px;align-items:center;justify-content:center;border:1px solid var(--accent);border-radius:7px;background:var(--accent);color:#fff;font-weight:650;padding:0 14px}.button.secondary{background:#fff;color:var(--accent)}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);margin:12px 0}th,td{text-align:left;vertical-align:top;border-bottom:1px solid var(--line);padding:10px 12px}th{width:210px;background:#eef6f3}ul{margin:10px 0 0;padding-left:20px}li{margin:5px 0}.small{font-size:14px;color:var(--muted)}.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:3px 9px;background:#fff;color:var(--muted);font-size:13px;margin:0 6px 6px 0}.notice{border-left:4px solid var(--accent);padding:12px 14px;background:#eef6f3;color:var(--ink);border-radius:4px;margin:14px 0}.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;background:#eef3ef;border:1px solid var(--line);border-radius:4px;padding:1px 5px}@media(max-width:820px){.hero,.grid{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}h1{font-size:34px}th{width:auto}}`;
}

function breadcrumbHtml(items = []) {
  if (!items.length) return "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item, index) => {
    const label = esc(item.name);
    const node = index === items.length - 1 ? `<strong>${label}</strong>` : `<a href="${esc(item.url)}">${label}</a>`;
    return `${index ? "<span>/</span>" : ""}${node}`;
  }).join("")}</nav>`;
}

function breadcrumbSchema(items = []) {
  if (!items.length) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function graphSchema(nodes) {
  const clean = nodes.filter(Boolean);
  return clean.length ? { "@context": "https://schema.org", "@graph": clean } : null;
}

function pageShell({ title, description, canonical, body, schema, breadcrumbs = [] }) {
  const schemaPayload = schema || graphSchema([
    {
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
      datePublished: artifactDate,
      dateModified: artifactDate,
      publisher: { "@type": "Organization", name: "Packrift", url: "https://packrift.com/" },
    },
    breadcrumbSchema(breadcrumbs),
  ]);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="stylesheet" href="${baseUrl}/assets/site.css">
  ${schemaPayload ? `<script type="application/ld+json">${JSON.stringify(schemaPayload)}</script>` : ""}
</head>
<body>
  <header><div class="wrap top"><a class="brand" href="${baseUrl}/">Packrift optimization benchmark corpus</a><nav><a href="${baseUrl}/sku-index.html">SKU index</a><a href="${baseUrl}/page-types.html">Page types</a><a href="${baseUrl}/programmatic-seo-workflow.html">pSEO workflow</a><a href="${baseUrl}/quality-policy.html">Quality policy</a><a href="${baseUrl}/sitemap.xml">Sitemap</a><a href="https://packrift.com/">Packrift.com</a></nav></div></header>
  <main class="wrap">${breadcrumbHtml(breadcrumbs)}${body}</main>
  <footer><div class="wrap">Packrift-owned benchmark/reference content. Static source snapshots are not live price, inventory, freight, or substitute approvals; verify on Packrift.com before buying or publishing downstream claims.</div></footer>
</body>
</html>
`;
}

function writeFile(rel, content, urls = null) {
  const filePath = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  if (urls && rel.endsWith(".html") && rel !== "404.html") {
    const urlPath = rel === "index.html" ? "" : rel.replace(/\/index\.html$/, "/");
    urls.push({ loc: `${baseUrl}/${urlPath.replace(/\\/g, "/")}`, rel });
  }
}

function schemaFor(row, type, canonical, description) {
  const org = { "@type": "Organization", name: "Packrift", url: "https://packrift.com/" };
  return graphSchema([
    {
      "@type": "TechArticle",
      headline: `${row.title} ${type.label}`,
      description,
      datePublished: artifactDate,
      dateModified: artifactDate,
      author: org,
      publisher: org,
      mainEntityOfPage: canonical,
      about: {
        "@type": "Product",
        name: row.title,
        sku: row.sku,
        url: row.productUrl,
        brand: { "@type": "Brand", name: "Packrift" },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Family", value: row.familyLabel },
          { "@type": "PropertyValue", name: "Source dimensions", value: row.dimensions.display || "Not listed" },
          { "@type": "PropertyValue", name: "Pack count", value: row.packCount ? `${round(row.packCount, 0)} ct` : "Not listed" },
        ],
      },
    },
    breadcrumbSchema([
      { name: "Benchmark corpus", url: `${baseUrl}/` },
      { name: type.label, url: `${baseUrl}/${type.id}/` },
      { name: row.sku, url: canonical },
    ]),
  ]);
}

function corpusSchema(canonical, description, rows) {
  const org = { "@type": "Organization", name: "Packrift", url: "https://packrift.com/" };
  return graphSchema([
    {
      "@type": "Dataset",
      name: "Packrift optimization benchmark corpus",
      description,
      url: canonical,
      datePublished: artifactDate,
      dateModified: artifactDate,
      creator: org,
      publisher: org,
      isAccessibleForFree: true,
      measurementTechnique: "Static generation from Packrift exact-spec source feed and product spec graph",
      variableMeasured: ["SKU", "dimensions", "weight", "pack count", "family", "quality score", "benchmark type"],
      distribution: [
        {
          "@type": "DataDownload",
          name: "Quality ledger CSV",
          encodingFormat: "text/csv",
          contentUrl: `${baseUrl}/data/quality-ledger.csv`,
        },
        {
          "@type": "DataDownload",
          name: "Corpus manifest JSON",
          encodingFormat: "application/json",
          contentUrl: `${baseUrl}/data/manifest.json`,
        },
      ],
      about: rows.slice(0, 25).map((row) => ({
      "@type": "Product",
      name: row.title,
      sku: row.sku,
      url: row.productUrl,
      brand: { "@type": "Brand", name: "Packrift" },
      })),
    },
    {
      "@type": "WebSite",
      name: "Packrift optimization benchmark corpus",
      url: `${baseUrl}/`,
      publisher: org,
    },
  ]);
}

function relatedRows(row, rows) {
  const target = row.metrics.volume || row.metrics.area || row.weight || 0;
  return rows
    .filter((other) => other.sku !== row.sku && other.family === row.family)
    .map((other) => ({ row: other, distance: Math.abs((other.metrics.volume || other.metrics.area || other.weight || 0) - target) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map((item) => item.row);
}

function skuPage(row, type, allRows) {
  const rel = `${type.id}/${row.slug}.html`;
  const canonical = `${baseUrl}/${rel}`;
  const description = `${type.label} for Packrift SKU ${row.sku}: ${type.intent}`;
  const related = relatedRows(row, allRows);
  const facts = table([
    ["SKU", row.sku],
    ["Title", row.title],
    ["Family", row.familyLabel],
    ["Dimensions", row.dimensions.display || "Not listed"],
    ["Material / Color", `${row.material || "not listed"} / ${row.color || "not listed"}`],
    ["Pack count", row.packCount ? `${round(row.packCount, 0)} ct` : "Not listed"],
    ["Weight", row.weight ? `${round(row.weight)} lb` : "Not listed"],
    ["Source quality", `${row.quality.score}/${row.quality.max}`],
    ["Canonical product", row.productUrl],
  ]);
  const body = `
    <div class="hero">
      <section>
        <h1>${esc(row.title)} ${esc(type.label.toLowerCase())}</h1>
        <p>${esc(type.intent)} This page is generated from Packrift's top-1,000 exact-spec feed plus SKU/title/URL enrichment from the local product graph.</p>
        <div class="links"><a class="button" href="${esc(row.productUrl)}">View on Packrift</a><a class="button secondary" href="${esc(row.purchaseUrl)}">Open variant URL</a><a class="button secondary" href="${baseUrl}/${type.id}/">More ${esc(type.label)}</a></div>
      </section>
      <aside class="panel meta">
        <div><strong>SKU</strong><span>${esc(row.sku)}</span></div>
        <div><strong>Family</strong><span>${esc(row.familyLabel)}</span></div>
        <div><strong>Benchmark</strong><span>${esc(type.label)}</span></div>
        <div><strong>Quality</strong><span>${row.quality.score}/${row.quality.max}</span></div>
      </aside>
    </div>
    <section class="panel"><h2>Benchmark question</h2><p>${esc(type.intent)}</p></section>
    <section class="panel"><h2>Source facts</h2>${facts}</section>
    <section class="panel"><h2>Calculated benchmark</h2>${list(metricBullets(type, row))}</section>
    <section class="panel"><h2>Operational checklist</h2>${list(checklist(type, row))}</section>
    <section class="panel"><h2>Quality guardrails</h2>${list(["Static source snapshots are not live price, inventory, freight, or final substitute approval.", "Missing dimensions or metrics are called out directly instead of guessed.", "Every page links to the canonical Packrift product page and keeps Packrift.com as the commerce source of truth."])}</section>
    <section class="panel"><h2>Related same-family references</h2><ul>${related.map((r) => `<li><a href="${baseUrl}/${type.id}/${r.slug}.html">${esc(r.sku)} - ${esc(r.title)}</a></li>`).join("\n")}</ul></section>
  `;
  return pageShell({
    title: `${row.title} ${type.label} | Packrift`,
    description,
    canonical,
    body,
    schema: schemaFor(row, type, canonical, description),
    breadcrumbs: [
      { name: "Benchmark corpus", url: `${baseUrl}/` },
      { name: type.label, url: `${baseUrl}/${type.id}/` },
      { name: row.sku, url: canonical },
    ],
  });
}

function buildHome(rows, urls, families) {
  const totalSkuPages = rows.length * pageTypes.length;
  const body = `
    <div class="hero">
      <section>
        <h1>Packrift optimization benchmark corpus</h1>
        <p>A GitHub Pages-ready corpus concept that turns 1,000 exact-spec Packrift feed records into ${totalSkuPages.toLocaleString("en-US")} SKU-specific benchmark pages across ${pageTypes.length} operational page types. It is built for buyers, warehouse teams, AI retrieval, and packaging ops workflows, not thin keyword swaps.</p>
        <div class="links"><a class="button" href="${baseUrl}/page-types.html">Browse page types</a><a class="button secondary" href="${baseUrl}/sku-index.html">Browse SKUs</a><a class="button secondary" href="${baseUrl}/programmatic-seo-workflow.html">Review pSEO workflow</a></div>
      </section>
      <aside class="panel meta">
        <div><strong>Source records</strong><span>${rows.length.toLocaleString("en-US")}</span></div>
        <div><strong>Benchmark types</strong><span>${pageTypes.length}</span></div>
        <div><strong>SKU pages</strong><span>${totalSkuPages.toLocaleString("en-US")}</span></div>
        <div><strong>Families</strong><span>${Object.keys(families).length}</span></div>
      </aside>
    </div>
    <section class="panel"><h2>Corpus concept</h2><p>Each SKU gets one page per operational benchmark: DIM weight, cube, fit, routing, material compatibility, reorder, bulk quote prep, AI retrieval, QA exceptions, and implementation handoff. The pages expose source facts, calculations, missing-field caveats, and Packrift product links.</p></section>
    <section class="panel"><h2>Data access</h2><p>The public source ledger and manifest make the corpus auditable instead of opaque.</p><div class="links"><a class="button secondary" href="${baseUrl}/data/quality-ledger.csv">Quality ledger CSV</a><a class="button secondary" href="${baseUrl}/data/manifest.json">Manifest JSON</a><a class="button secondary" href="${baseUrl}/sitemap.xml">Sitemap index</a></div></section>
    <div class="grid">${pageTypes.slice(0, 9).map((type) => `<article class="card"><h2>${esc(type.label)}</h2><p>${esc(type.intent)}</p><p><a href="${baseUrl}/${type.id}/">Open hub</a></p></article>`).join("\n")}</div>
    <section class="panel"><h2>Family mix</h2>${table(Object.entries(families).map(([family, count]) => [familyName(family), `${count.toLocaleString("en-US")} source records`]))}</section>
  `;
  const description = "Packrift optimization benchmark corpus generated from the top-1000 exact-spec feed, with public quality ledgers and operational benchmark pages.";
  writeFile("index.html", pageShell({
    title: "Packrift optimization benchmark corpus",
    description,
    canonical: `${baseUrl}/`,
    body,
    schema: corpusSchema(`${baseUrl}/`, description, rows),
  }), urls);
}

function buildIndexes(rows, urls, families) {
  const skuRows = rows.map((row) => `<tr><td>${esc(row.sku)}</td><td>${esc(row.title)}</td><td>${esc(row.familyLabel)}</td><td>${esc(row.dimensions.display || "Not listed")}</td><td>${row.quality.score}/${row.quality.max}</td><td><a href="${baseUrl}/dimensional-weight-benchmark/${row.slug}.html">Benchmark</a></td><td><a href="${esc(row.productUrl)}">Packrift</a></td></tr>`).join("\n");
  writeFile("sku-index.html", pageShell({
    title: "Packrift benchmark SKU index",
    description: "Index of the 1,000 Packrift exact-spec source records used in the benchmark corpus.",
    canonical: `${baseUrl}/sku-index.html`,
    body: `<h1>SKU index</h1><p>All source rows passed the generator's publishable gate and link back to canonical Packrift product pages.</p><table><thead><tr><th>SKU</th><th>Title</th><th>Family</th><th>Dimensions</th><th>Quality</th><th>Sample</th><th>Product</th></tr></thead><tbody>${skuRows}</tbody></table>`,
  }), urls);

  const typeRows = pageTypes.map((type) => `<tr><td><a href="${baseUrl}/${type.id}/">${esc(type.label)}</a></td><td>${esc(type.id)}</td><td>${esc(type.intent)}</td><td>${rows.length.toLocaleString("en-US")}</td></tr>`).join("\n");
  writeFile("page-types.html", pageShell({
    title: "Packrift optimization benchmark page types",
    description: "The 24 page types used by the Packrift optimization benchmark corpus.",
    canonical: `${baseUrl}/page-types.html`,
    body: `<h1>Page types</h1><p>The corpus creates operationally distinct pages. Each page type has different calculations, checks, and guardrails, which is the core anti-thin-content design.</p><table><thead><tr><th>Type</th><th>Folder</th><th>Intent</th><th>Pages</th></tr></thead><tbody>${typeRows}</tbody></table>`,
  }), urls);

  writeFile("quality-policy.html", pageShell({
    title: "Packrift benchmark corpus quality policy",
    description: "Quality safeguards for the Packrift optimization benchmark corpus.",
    canonical: `${baseUrl}/quality-policy.html`,
    body: `<h1>Quality policy</h1><section class="panel"><h2>Generation gates</h2>${list(["Requires 1,000 exact-spec feed rows, matching product graph rows, canonical product URLs, product details, highlights, weight, and source labels.", "Generates explicit missing-field language instead of invented dimensions, freight, fit, pallet, or price claims.", "Keeps live commerce, price, inventory, checkout, and approval decisions on Packrift.com.", "Uses 24 distinct benchmark types with different formulas and operational checklists, not only swapped keywords.", "Counts as Packrift-owned URL-scale reference content, not third-party backlinks or independent referring domains."])}</section><section class="panel"><h2>Source treatment</h2><p>The Merchant Center top-1000 exact-spec feed is the source selection. The local product graph is joined only for SKU, title, handle, product URL, price snapshot, and inventory snapshot so pages can point to the correct Packrift product.</p></section><section class="panel"><h2>Search policy treatment</h2>${list(["The corpus is built as Packrift-owned reference content, not automated third-party link creation.", "The generator blocks rows without product URL enrichment and publishes missing-field caveats visibly.", "Static pages do not mark up live offers, reviews, ratings, freight, or availability because those facts belong on Packrift.com."])}</section>`,
  }), urls);

  writeFile("programmatic-seo-workflow.html", pageShell({
    title: "Packrift programmatic SEO workflow",
    description: "The Packrift operating standard for source-backed programmatic SEO pages, crawl management, schema, and quality monitoring.",
    canonical: `${baseUrl}/programmatic-seo-workflow.html`,
    body: `<h1>Packrift programmatic SEO workflow</h1>
      <p class="notice">This is the operating standard for Packrift-owned programmatic pages. It exists to prevent thin-content scale, fake authority, unsupported claims, and link-spam accounting.</p>
      <section class="panel"><h2>1. Source authority gate</h2>${list(["Use first-party Packrift source feeds, product spec graphs, calculators, or directly verified public product pages.", "Require a canonical Packrift product URL or public source URL before a page can be indexable.", "Record weak fields in the quality ledger instead of filling gaps with generated claims."])}</section>
      <section class="panel"><h2>2. Intent matrix</h2>${list(["Each page type must answer a distinct job: fit, DIM weight, slotting, receiving, QA, reorder, AI retrieval, or implementation handoff.", "Do not create pages only because a keyword permutation exists.", "Treat page types that collapse into the same user task as candidates for consolidation."])}</section>
      <section class="panel"><h2>3. Template differentiation</h2>${list(["Every page needs unique title, description, H1, source facts, computed metrics, checklist, and same-family links.", "A page is allowed to state that data is missing; it is not allowed to invent dimensions, price, fit, pallet count, freight, or approval status.", "Low-information rows should be upgraded from source data or removed from indexable output."])}</section>
      <section class="panel"><h2>4. Crawl architecture</h2>${list(["Keep every page reachable through HTML hubs and XML sitemaps.", "Use canonical URLs, visible breadcrumbs, and sitemap lastmod dates.", "Split sitemaps by static, family, and page-type sections so Search Console/Bing feedback can be read by pattern."])}</section>
      <section class="panel"><h2>5. Structured data discipline</h2>${list(["Use JSON-LD only when it reflects visible page content.", "Use TechArticle, Dataset, Product-as-about, WebSite, Organization, and BreadcrumbList where accurate.", "Do not use Offer, AggregateRating, Review, or merchant listing markup on static reference pages unless the exact visible live commerce facts are present and maintained."])}</section>
      <section class="panel"><h2>6. Launch and monitoring</h2>${list(["Publish only after the automated quality audit passes.", "Submit sitemap indexes where the property is verified, and use IndexNow only for genuinely new or meaningfully updated URLs.", "Monitor indexation, crawl errors, page-type performance, and query overlap before adding another corpus layer."])}</section>
      <section class="panel"><h2>7. Ethical link accounting</h2>${list(["Owned GitHub Pages and Packrift-owned resources count as public crawlable presence, not third-party backlinks or referring domains.", "Pending GitHub pull requests, directory submissions, and resource listings stay pending until accepted.", "No paid links, reciprocal-link schemes, fake reviews, low-quality directories, automated comment links, or outreach emails are part of this workflow."])}</section>
      <section class="panel"><h2>Reference guidance</h2><p>This workflow is aligned to Google Search guidance on helpful content, spam policies, sitemaps, and structured data.</p>${list([`Helpful content: ${googleGuidance.helpfulContent}`, `Spam policies: ${googleGuidance.spamPolicies}`, `Sitemap generation: ${googleGuidance.sitemaps}`, `Structured data: ${googleGuidance.structuredData}`])}</section>`,
    schema: graphSchema([
      {
        "@type": "TechArticle",
        headline: "Packrift programmatic SEO workflow",
        description: "The Packrift operating standard for source-backed programmatic SEO pages, crawl management, schema, and quality monitoring.",
        datePublished: artifactDate,
        dateModified: artifactDate,
        author: { "@type": "Organization", name: "Packrift", url: "https://packrift.com/" },
        publisher: { "@type": "Organization", name: "Packrift", url: "https://packrift.com/" },
        mainEntityOfPage: `${baseUrl}/programmatic-seo-workflow.html`,
      },
      breadcrumbSchema([
        { name: "Benchmark corpus", url: `${baseUrl}/` },
        { name: "pSEO workflow", url: `${baseUrl}/programmatic-seo-workflow.html` },
      ]),
    ]),
    breadcrumbs: [
      { name: "Benchmark corpus", url: `${baseUrl}/` },
      { name: "pSEO workflow", url: `${baseUrl}/programmatic-seo-workflow.html` },
    ],
  }), urls);

  for (const [family, count] of Object.entries(families)) {
    const familyRows = rows.filter((row) => row.family === family);
    const links = familyRows.map((row) => `<li><a href="${baseUrl}/source-spec-audit/${row.slug}.html">${esc(row.sku)} - ${esc(row.title)}</a> <span class="small">${esc(row.dimensions.display || "dimensions not listed")}</span></li>`).join("\n");
    writeFile(`family/${slugify(family)}/index.html`, pageShell({
      title: `Packrift ${familyName(family)} benchmark references`,
      description: `${count} Packrift ${familyName(family)} source records in the optimization benchmark corpus.`,
      canonical: `${baseUrl}/family/${slugify(family)}/`,
      body: `<h1>${esc(familyName(family))} benchmark references</h1><p>${count.toLocaleString("en-US")} source records in this family. Each row has 24 benchmark pages available through the sitemap and page-type hubs.</p><ul>${links}</ul>`,
    }), urls);
  }

  for (const type of pageTypes) {
    const links = rows.map((row) => `<li><a href="${baseUrl}/${type.id}/${row.slug}.html">${esc(row.sku)} - ${esc(row.title)}</a> <span class="small">${esc(row.familyLabel)}</span></li>`).join("\n");
    writeFile(`${type.id}/index.html`, pageShell({
      title: `Packrift ${type.label.toLowerCase()} hub`,
      description: `${type.label} pages for 1,000 Packrift exact-spec source records.`,
      canonical: `${baseUrl}/${type.id}/`,
      body: `<h1>${esc(type.label)} pages</h1><p>${esc(type.intent)}</p><p><span class="badge">${rows.length.toLocaleString("en-US")} SKU pages</span><span class="badge">Source: top-1000 exact-spec feed</span></p><ul>${links}</ul>`,
    }), urls);
  }
}

function writeSupportFiles(urls, rows, families) {
  fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "assets/site.css"), css());
  fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
  fs.writeFileSync(path.join(outDir, `${indexNowKey}.txt`), `${indexNowKey}\n`);
  fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  writeSitemaps(urls);
  fs.writeFileSync(path.join(outDir, "llms.txt"), [
    "# Packrift optimization benchmark corpus",
    "",
    `Public URL: ${baseUrl}/`,
    "Purpose: source-backed Packrift packaging benchmark references for buyers, warehouse teams, AI retrieval, and packaging operations.",
    "Source treatment: static source snapshots; verify live price, inventory, freight, checkout, and approval decisions on Packrift.com.",
    `Manifest: ${baseUrl}/data/manifest.json`,
    `Quality ledger: ${baseUrl}/data/quality-ledger.csv`,
    `Programmatic SEO workflow: ${baseUrl}/programmatic-seo-workflow.html`,
    "",
  ].join("\n"));
  writeFile("404.html", pageShell({
    title: "Packrift benchmark page not found",
    description: "The requested Packrift benchmark page was not found.",
    canonical: `${baseUrl}/404.html`,
    body: `<h1>Page not found</h1><p>Use the SKU index, page-type index, or sitemap to find a Packrift benchmark page.</p><p><a class="button" href="${baseUrl}/sku-index.html">Open SKU index</a></p>`,
  }));
  const qualityCsv = [
    "sku,offer_id,family,title,product_url,quality_score,quality_max,missing_fields",
    ...rows.map((row) => [row.sku, row.offerId, row.family, row.title, row.productUrl, row.quality.score, row.quality.max, row.quality.missing.join("|")].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")),
  ].join("\n") + "\n";
  fs.mkdirSync(path.join(outDir, "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "quality-ledger.csv"), qualityCsv);
  fs.writeFileSync(path.join(outDir, "data/quality-ledger.csv"), qualityCsv);
  const manifest = {
    artifactDate,
    baseUrl,
    sourceFeed: feedPath,
    productGraph: graphPath,
    sourceRows: rows.length,
    pageTypes: pageTypes.length,
    skuPages: rows.length * pageTypes.length,
    sitemapUrls: urls.length,
    htmlFiles: urls.length + 1,
    families,
    quality: {
      minimumScore: 7,
      publishableRows: rows.filter((row) => row.quality.publishable).length,
      rowsWithMissingFields: rows.filter((row) => row.quality.missing.length).length,
      guardrails: [
        "No invented dimensions, fit, freight, price, or approval claims.",
        "Static snapshots defer live commerce facts to Packrift.com.",
        "Every SKU page has a page-type-specific benchmark and checklist.",
        "Owned URL-scale resource content is not counted as third-party backlinks.",
      ],
    },
  };
  fs.writeFileSync(path.join(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "data/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function sitemapSlug(value) {
  return slugify(value || "static").slice(0, 80) || "static";
}

function sitemapGroup(rel) {
  if (rel === "index.html" || !rel.includes("/")) return "static";
  const [first] = rel.split("/");
  if (first === "family") return "family";
  return first;
}

function sitemapUrlXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url><loc>${esc(entry.loc)}</loc><lastmod>${artifactDate}</lastmod></url>`).join("\n")}\n</urlset>\n`;
}

function writeSitemaps(urls) {
  const sitemapDir = path.join(outDir, "sitemaps");
  fs.mkdirSync(sitemapDir, { recursive: true });
  const groups = new Map();
  for (const entry of urls) {
    const group = sitemapGroup(entry.rel);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(entry);
  }
  const sitemapFiles = [...groups.entries()].map(([group, entries]) => {
    const file = `sitemaps/${sitemapSlug(group)}.xml`;
    fs.writeFileSync(path.join(outDir, file), sitemapUrlXml(entries));
    return `${baseUrl}/${file}`;
  });
  fs.writeFileSync(path.join(outDir, "sitemap-all.xml"), sitemapUrlXml(urls));
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((loc) => `  <sitemap><loc>${esc(loc)}</loc><lastmod>${artifactDate}</lastmod></sitemap>`).join("\n")}\n  <sitemap><loc>${baseUrl}/sitemap-all.xml</loc><lastmod>${artifactDate}</lastmod></sitemap>\n</sitemapindex>\n`);
}

function loadRows() {
  const graphRows = parseCsv(fs.readFileSync(graphPath, "utf8"));
  const graphByOffer = new Map(graphRows.map((row) => [row.offer_id, row]));
  const feedRows = fs.readFileSync(feedPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
  const rows = feedRows.slice(0, rowLimit).map((feedRow, index) => {
    const graphRow = graphByOffer.get(feedRow.offerId);
    if (!graphRow) {
      throw new Error(`Missing product graph enrichment for offerId ${feedRow.offerId}`);
    }
    return normalizeRow(feedRow, graphRow, index);
  });
  const notPublishable = rows.filter((row) => !row.quality.publishable);
  if (rows.length !== 1000) throw new Error(`Expected 1000 source rows, got ${rows.length}`);
  if (notPublishable.length) throw new Error(`${notPublishable.length} rows failed quality gate`);
  return rows;
}

function main() {
  const rows = loadRows();
  cleanDir(outDir);
  const urls = [];
  const families = rows.reduce((acc, row) => {
    acc[row.family] = (acc[row.family] || 0) + 1;
    return acc;
  }, {});
  buildHome(rows, urls, families);
  buildIndexes(rows, urls, families);
  for (const type of pageTypes) {
    for (const row of rows) {
      writeFile(`${type.id}/${row.slug}.html`, skuPage(row, type, rows), urls);
    }
  }
  writeSupportFiles(urls, rows, families);
  console.log(JSON.stringify({
    sourceRows: rows.length,
    pageTypes: pageTypes.length,
    skuPages: rows.length * pageTypes.length,
    sitemapUrls: urls.length,
    htmlFiles: urls.length + 1,
    baseUrl,
    outputDir: outDir,
  }, null, 2));
}

main();
