# OR-Tools Carton Selection Example

This example uses Google OR-Tools CP-SAT to choose the smallest feasible Packrift carton from a static sample set.

It is intentionally a screening model, not a buying approval engine. It checks:

- whether an item can fit inside a candidate carton in at least one orientation
- whether a relaxed volume screen passes for the requested item count
- which feasible carton has the smallest internal volume

Current price, inventory, freight, checkout terms, and final fit approval stay on Packrift.com.

## Run

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install ortools
python carton_selection.py
```

Or install from the pinned dependency file:

```bash
pip install -r requirements.txt
python carton_selection.py
```

## Files

- `carton_selection.py` - OR-Tools CP-SAT model and CSV loader.
- `requirements.txt` - Python dependency for the runnable example.
- `sample_cartons.csv` - small static Packrift carton subset with dimensions and product URLs.
- `sample_orders.csv` - sample item-dimension rows for the solver.

## Model Notes

The model uses one boolean decision variable per candidate carton and enforces exactly one selection per order. Candidates that fail the orientation or volume screen are fixed to zero. The objective minimizes carton volume among feasible candidates.

This is useful for demos, QA checks, and starter optimization workflows. It is not a substitute for a full 3D packing solver, material compatibility review, carrier-specific DIM/freight policy, or live Packrift product checks.
