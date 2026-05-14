#!/usr/bin/env python3
"""Small OR-Tools CP-SAT carton-selection example for Packrift sample data."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from itertools import permutations
from pathlib import Path

from ortools.sat.python import cp_model


ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Carton:
    sku: str
    title: str
    length: float
    width: float
    height: float
    product_url: str

    @property
    def volume(self) -> float:
        return self.length * self.width * self.height


@dataclass(frozen=True)
class Order:
    order_id: str
    item_length: float
    item_width: float
    item_height: float
    item_count: int

    @property
    def item_volume(self) -> float:
        return self.item_length * self.item_width * self.item_height * self.item_count


def load_cartons(path: Path) -> list[Carton]:
    with path.open(newline="") as handle:
        return [
            Carton(
                sku=row["sku"],
                title=row["title"],
                length=float(row["length_in"]),
                width=float(row["width_in"]),
                height=float(row["height_in"]),
                product_url=row["product_url"],
            )
            for row in csv.DictReader(handle)
        ]


def load_orders(path: Path) -> list[Order]:
    with path.open(newline="") as handle:
        return [
            Order(
                order_id=row["order_id"],
                item_length=float(row["item_length_in"]),
                item_width=float(row["item_width_in"]),
                item_height=float(row["item_height_in"]),
                item_count=int(row["item_count"]),
            )
            for row in csv.DictReader(handle)
        ]


def orientation_fits(order: Order, carton: Carton) -> bool:
    item_dims = (order.item_length, order.item_width, order.item_height)
    carton_dims = (carton.length, carton.width, carton.height)
    return any(all(item <= box for item, box in zip(orientation, carton_dims)) for orientation in set(permutations(item_dims)))


def relaxed_volume_fits(order: Order, carton: Carton, void_allowance: float = 1.15) -> bool:
    return order.item_volume * void_allowance <= carton.volume


def solve_order(order: Order, cartons: list[Carton]) -> Carton | None:
    feasible = [
        orientation_fits(order, carton) and relaxed_volume_fits(order, carton)
        for carton in cartons
    ]
    if not any(feasible):
        return None

    model = cp_model.CpModel()
    chosen = [model.NewBoolVar(f"choose_{carton.sku}") for carton in cartons]
    model.Add(sum(chosen) == 1)
    for var, ok in zip(chosen, feasible):
        if not ok:
            model.Add(var == 0)

    scaled_volumes = [round(carton.volume * 1000) for carton in cartons]
    model.Minimize(sum(var * volume for var, volume in zip(chosen, scaled_volumes)))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    for var, carton in zip(chosen, cartons):
        if solver.BooleanValue(var):
            return carton
    return None


def main() -> None:
    cartons = load_cartons(ROOT / "sample_cartons.csv")
    orders = load_orders(ROOT / "sample_orders.csv")

    for order in orders:
        carton = solve_order(order, cartons)
        if carton is None:
            print(f"{order.order_id}: no sample carton passed the screen")
            continue
        print(
            f"{order.order_id}: {carton.sku} | "
            f"{carton.length:g}x{carton.width:g}x{carton.height:g} in | "
            f"{carton.product_url}"
        )


if __name__ == "__main__":
    main()
