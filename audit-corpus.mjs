import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(root, "docs");
const baseUrl = "https://packrift.github.io/packaging-optimization-benchmark-corpus";

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function matchOne(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || "";
}

function allMatches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

function rel(file) {
  return path.relative(docsDir, file).replaceAll(path.sep, "/");
}

function parseJsonLd(html, file, issues) {
  const blocks = allMatches(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  return blocks.map((block) => {
    try {
      return JSON.parse(block);
    } catch (error) {
      issues.badStructuredData.push({ file: rel(file), error: error.message });
      return null;
    }
  }).filter(Boolean);
}

function collectSitemapLocs() {
  const sitemapFiles = walk(docsDir).filter((file) => rel(file).startsWith("sitemaps/") && file.endsWith(".xml"));
  const locs = new Set();
  for (const file of sitemapFiles) {
    for (const loc of allMatches(read(file), /<loc>(.*?)<\/loc>/g)) locs.add(loc);
  }
  for (const loc of allMatches(read(path.join(docsDir, "sitemap-all.xml")), /<loc>(.*?)<\/loc>/g)) locs.add(loc);
  return { locs, sitemapFiles: sitemapFiles.map(rel) };
}

function canonicalForRel(relativePath) {
  if (relativePath === "index.html") return `${baseUrl}/`;
  return `${baseUrl}/${relativePath.replace(/\/index\.html$/, "/")}`;
}

function main() {
  const { locs, sitemapFiles } = collectSitemapLocs();
  const htmlFiles = walk(docsDir).filter((file) => file.endsWith(".html"));
  const indexableHtml = htmlFiles.filter((file) => rel(file) !== "404.html");
  const titleMap = new Map();
  const descriptionMap = new Map();
  const issues = {
    missingTitle: [],
    duplicateTitle: [],
    missingDescription: [],
    duplicateDescription: [],
    missingCanonical: [],
    canonicalMismatch: [],
    missingFromSitemap: [],
    missingH1: [],
    badStructuredData: [],
    missingStructuredData: [],
    missingBreadcrumbSchema: [],
    missingPackriftProductLink: [],
  };

  for (const file of indexableHtml) {
    const html = read(file);
    const relativePath = rel(file);
    const title = matchOne(html, /<title>(.*?)<\/title>/s);
    const description = matchOne(html, /<meta name="description" content="(.*?)">/s);
    const canonical = matchOne(html, /<link rel="canonical" href="(.*?)">/s);
    const h1Count = (html.match(/<h1[\s>]/g) || []).length;
    const schemas = parseJsonLd(html, file, issues);
    const expectedCanonical = canonicalForRel(relativePath);

    if (!title) issues.missingTitle.push(relativePath);
    else titleMap.set(title, [...(titleMap.get(title) || []), relativePath]);

    if (!description) issues.missingDescription.push(relativePath);
    else descriptionMap.set(description, [...(descriptionMap.get(description) || []), relativePath]);

    if (!canonical) issues.missingCanonical.push(relativePath);
    else if (canonical !== expectedCanonical) issues.canonicalMismatch.push({ file: relativePath, canonical, expectedCanonical });

    if (!locs.has(expectedCanonical)) issues.missingFromSitemap.push({ file: relativePath, expectedCanonical });
    if (h1Count !== 1) issues.missingH1.push({ file: relativePath, h1Count });
    if (!schemas.length) issues.missingStructuredData.push(relativePath);

    const isSkuPage = /^[-a-z]+\/.+\.html$/.test(relativePath) && !relativePath.endsWith("/index.html");
    if (isSkuPage) {
      const schemaText = schemas.map((schema) => JSON.stringify(schema)).join("\n");
      if (!schemaText.includes('"BreadcrumbList"')) issues.missingBreadcrumbSchema.push(relativePath);
      if (!html.includes("https://packrift.com/products/")) issues.missingPackriftProductLink.push(relativePath);
    }
  }

  for (const [title, files] of titleMap.entries()) {
    if (files.length > 1) issues.duplicateTitle.push({ title, files: files.slice(0, 10), count: files.length });
  }
  for (const [description, files] of descriptionMap.entries()) {
    if (files.length > 1) issues.duplicateDescription.push({ description, files: files.slice(0, 10), count: files.length });
  }

  const critical =
    issues.missingTitle.length +
    issues.missingDescription.length +
    issues.missingCanonical.length +
    issues.canonicalMismatch.length +
    issues.missingFromSitemap.length +
    issues.missingH1.length +
    issues.badStructuredData.length +
    issues.missingStructuredData.length +
    issues.missingBreadcrumbSchema.length +
    issues.missingPackriftProductLink.length;

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    htmlFiles: htmlFiles.length,
    indexableHtmlFiles: indexableHtml.length,
    sitemapLocs: locs.size,
    sitemapFiles,
    duplicates: {
      titleGroups: issues.duplicateTitle.length,
      descriptionGroups: issues.duplicateDescription.length,
    },
    criticalIssues: critical,
    issues,
  };

  fs.mkdirSync(path.join(docsDir, "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "seo-quality-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(docsDir, "data/seo-quality-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    htmlFiles: report.htmlFiles,
    indexableHtmlFiles: report.indexableHtmlFiles,
    sitemapLocs: report.sitemapLocs,
    sitemapFiles: report.sitemapFiles.length,
    duplicateTitleGroups: report.duplicates.titleGroups,
    duplicateDescriptionGroups: report.duplicates.descriptionGroups,
    criticalIssues: report.criticalIssues,
  }, null, 2));
  if (critical) process.exit(1);
}

main();
