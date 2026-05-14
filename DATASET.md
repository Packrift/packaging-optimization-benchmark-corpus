# Dataset Card: Packrift Packaging Optimization Benchmark Corpus

## Summary

The Packrift Packaging Optimization Benchmark Corpus is a public, Packrift-owned benchmark corpus built from 1,000 exact-spec Packrift packaging product records. It generates 24 operational page types per SKU for packaging selection, dimensional-weight checks, carton-fit boundaries, warehouse handling, reorder prompts, source-spec audits, and AI retrieval tests.

## Source

- Publisher: Packrift
- Live corpus: https://packrift.github.io/packaging-optimization-benchmark-corpus/
- Source repository: https://github.com/Packrift/packaging-optimization-benchmark-corpus
- Source product URLs: included per row in `quality-ledger.csv`
- Generated at: see `manifest.json` and `seo-quality-audit.json`

## Files

- `quality-ledger.csv`: SKU-level ledger with SKU, offer ID, product family, title, Packrift product URL, quality score, and missing-field flags.
- `manifest.json`: corpus counts, family counts, page-type counts, source paths, and guardrails.
- `seo-quality-audit.json`: static quality audit for generated HTML and sitemap coverage.
- `datapackage.json`: Frictionless Data Package metadata for the public corpus files.
- `croissant.json`: MLCommons Croissant metadata for machine-learning dataset discovery.
- `schema-dataset.jsonld`: standalone schema.org `Dataset` JSON-LD record.
- `datacite.json`: DataCite-style citation metadata for DOI/archive preparation.
- `ro-crate-metadata.json`: Research Object Crate metadata tying the corpus files to the Packrift publisher record.
- `kaggle-dataset-metadata-draft.json`: Kaggle metadata draft; publication still requires a license decision and account auth.
- `docs/dataset-metadata.html`: public metadata index page served by GitHub Pages.
- `docs/`: generated static HTML corpus, sitemaps, robots.txt, methodology pages, and page-type hubs.

## Intended Uses

- Packaging optimization benchmark and retrieval tests.
- Ecommerce packaging data-quality and source-spec audits.
- AI-agent retrieval evaluation for packaging product pages.
- Warehouse and fulfillment planning examples for carton, mailer, label, tape, poly bag, and strapping SKUs.

## Not Intended Uses

- Do not treat static snapshots as live price, inventory, freight, checkout, or approval facts.
- Do not infer package fit, substitute approval, or freight routing unless the live Packrift product page and checkout flow support it.
- Do not count the generated pages as independent third-party backlinks or editorial endorsements.

## Quality Controls

- Every row must resolve to a source Packrift product URL.
- Pages with missing dimensions or unsupported calculations state the limitation instead of guessing.
- Page types are operationally distinct, not keyword-swapped duplicates.
- The static audit checks title/description duplication, canonical/sitemap agreement, structured data, breadcrumbs, H1s, and Packrift product-link coverage.

## License And Reuse

No separate open-data license is declared in this release. Treat the files as a public Packrift-published reference corpus unless Packrift later publishes a formal license.
