# Packrift Cartonization Solver Fixtures

Small deterministic fixture pack for carton-selection and bin-packing examples.

The files use static Packrift packaging dimensions and demo order dimensions so maintainers can add parser tests, examples, or regression fixtures without pulling live commerce data.

## Files

- `fixture_cartons.csv` - five Packrift carton candidates with SKU, dimensions, and product URLs.
- `fixture_orders.csv` - four demo order rows with item dimensions and item counts.
- `py3dbp_fixture.json` - generic bins/items shape that can be adapted to `py3dbp`-style examples.
- `dwave_sample_data_ecommerce_cartons.txt` - D-Wave 3D bin-packing sample input shape.

## Boundaries

- This fixture pack does not claim known optimal or quasi-optimal solutions.
- Current price, inventory, freight, checkout terms, and final fit approval stay on Packrift.com.
- The data is meant for parser coverage, examples, and small solver smoke tests, not production packing approval.

Source corpus: https://github.com/Packrift/packaging-optimization-benchmark-corpus
Live fixture page: https://packrift.github.io/packaging-optimization-benchmark-corpus/cartonization-solver-fixtures.html
