# Packrift Optimization Benchmark Corpus

GitHub Pages-ready static corpus concept for Packrift-owned packaging optimization references.

This uses the Merchant Center top-1,000 exact-spec JSONL feed as the source selection and joins the local product spec graph only to recover SKU, title, handle, product URL, price snapshot, and inventory snapshot. The generator does not publish anything.

## Generate

```bash
node generate-optimization-benchmark-corpus.mjs
```

Then run the quality audit:

```bash
node audit-corpus.mjs
```

Default public URL target:

```text
https://packrift.github.io/packaging-optimization-benchmark-corpus
```

Override with:

```bash
BASE_URL=https://packrift.github.io/your-repo-name node generate-optimization-benchmark-corpus.mjs
```

## Corpus Shape

- Source records: 1,000 exact-spec Packrift feed rows
- Page types per SKU: 24
- SKU benchmark pages: 24,000
- Supporting index/hub/methodology pages: home, SKU index, page-type index, pSEO workflow, quality policy, 6 family hubs, and 24 page-type hubs
- Total sitemap URLs after local generation: 24,035
- HTML files after local generation: 24,036 including `404.html`
- GitHub Pages output folder: `docs/`

## Page Types

The 24 page types are operationally distinct: DIM-weight benchmark, cube utilization, length-plus-girth, carton-fit boundary, void-fill screen, parcel/freight router, pallet storage prompt, warehouse bin slotting, pick-path label card, receiving inspection, source-spec audit, substitute approval, damage risk, material compatibility, pack-count normalization, unit economics, reorder trigger, bulk quote prep, marketplace prep, returns repack, AI retrieval, buyer comparison, QA exception, and implementation handoff.

## Quality Safeguards

- Requires a product graph match for every feed `offerId`, so generated pages can link to real Packrift product URLs.
- Requires each row to pass a source-quality gate before pages are emitted.
- States missing dimensions or unsupported calculations explicitly instead of guessing.
- Keeps current price, inventory, freight, checkout, fit approval, and substitute approval on Packrift.com.
- Uses page-type-specific calculations and checklists rather than keyword-swapped duplicate pages.
- Publishes a Packrift-specific pSEO workflow page so quality rules are visible, not only internal.
- Splits XML sitemaps by static, family, and page-type sections with `<lastmod>` values for monitoring.
- Adds JSON-LD for Dataset, TechArticle, Product-as-about, WebSite, Organization, and BreadcrumbList where the visible page content supports it.
- Runs `audit-corpus.mjs` to block missing titles, missing descriptions, canonical/sitemap mismatches, bad structured data, missing H1s, missing breadcrumb schema, and missing Packrift product links.
- Counts as Packrift-owned URL-scale reference content, not third-party backlinks, referring domains, editorial endorsements, or directory listings.

## Publish Target

If approved later, create a public GitHub repository and serve GitHub Pages from `/docs` on `main`.

Do not publish this draft automatically.
