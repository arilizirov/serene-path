#!/usr/bin/env python3
"""bigbrain verify — the discipline cycle in ONE command.

This is the spine. AGENTS.md tells the agent to run it; the pre-commit hook
runs it; CI runs it. It chains the checks in order and reports a single
pass/fail, so "run the checks before done" is one runnable thing instead of a
list someone has to remember.

It does not reimplement anything — it shells out to your real tools:
    typecheck   ->  npm run typecheck        (TS)
    lint        ->  npm run lint  / ruff check .
    test        ->  npm run test  / pytest   (+ optional coverage floor)
    boundaries  ->  bigbrainBoundaryGuard/check_boundaries.py check

Cross-platform (Windows/macOS/Linux): pure Python, no make/bash required.

USAGE
    python bigbrain_verify.py                 # full cycle (auto-detect stack)
    python bigbrain_verify.py --no-boundaries # CI splits this into its own job
    python bigbrain_verify.py --min-coverage 80   # pytest coverage floor (TDD proxy)
    python bigbrain_verify.py --only test     # run a single step

Exit 0 = all green. Non-zero = something failed (which step is named).
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

STEPS_ORDER = ["typecheck", "lint", "test", "boundaries"]


def has(root: Path, name: str) -> bool:
    return (root / name).exists()


def npm_cmd(args: list[str]) -> list[str]:
    """npm is a .cmd shim on Windows, which CreateProcess can't launch directly
    (subprocess, shell=False). Route it through cmd.exe there; bare npm elsewhere."""
    if os.name == "nt":
        return ["cmd", "/c", "npm", *args]
    return ["npm", *args]


def run(label: str, cmd: list[str], root: Path, env=None) -> int:
    print(f"\n--- {label}: {' '.join(cmd)} ---")
    try:
        return subprocess.call(cmd, cwd=str(root), env=env)
    except FileNotFoundError:
        print(f"  tool not found for '{label}': {cmd[0]} (install it / skip with --only)", file=sys.stderr)
        return 2


def npm_script_exists(root: Path, script: str) -> bool:
    pkg = root / "package.json"
    if not pkg.exists():
        return False
    import json

    try:
        return script in (json.loads(pkg.read_text()).get("scripts") or {})
    except Exception:
        return False


def build_plan(root: Path, args) -> list[tuple[str, list[str]]]:
    is_ts = has(root, "package.json")
    is_py = has(root, "pyproject.toml") or has(root, "setup.cfg")
    plan: list[tuple[str, list[str]]] = []

    want = set(STEPS_ORDER) if not args.only else {args.only}
    if args.no_boundaries:
        want.discard("boundaries")

    if "typecheck" in want and is_ts and npm_script_exists(root, "typecheck"):
        plan.append(("typecheck", npm_cmd(["run", "typecheck"])))

    if "lint" in want:
        if is_ts and npm_script_exists(root, "lint"):
            plan.append(("lint", npm_cmd(["run", "lint"])))
        if is_py and shutil.which("ruff"):
            plan.append(("lint", ["ruff", "check", "."]))

    if "test" in want:
        if is_ts and npm_script_exists(root, "test"):
            plan.append(("test", npm_cmd(["run", "test"])))
        if is_py and shutil.which("pytest"):
            cmd = ["pytest", "-q"]
            if args.min_coverage is not None:
                # TDD proxy: new code must be covered; total may not drop below floor.
                cmd = ["pytest", "-q", f"--cov-fail-under={args.min_coverage}", "--cov"]
            plan.append(("test", cmd))

    if "boundaries" in want and (root / "boundaries.yaml").exists():
        guard = root / "bigbrainBoundaryGuard" / "check_boundaries.py"
        if guard.exists():
            # check_boundaries.py defines --root as a GLOBAL arg, so it must come
            # BEFORE the `check` subcommand (argparse rejects it after).
            plan.append(("boundaries", [sys.executable, str(guard), "--root", str(root), "check"]))

    return plan


def main() -> int:
    p = argparse.ArgumentParser(description="Run the bigbrain discipline cycle")
    p.add_argument("--root", default=".", type=Path)
    p.add_argument("--no-boundaries", action="store_true", help="skip boundaries (CI runs it separately)")
    p.add_argument("--only", choices=STEPS_ORDER, help="run a single step")
    p.add_argument("--min-coverage", type=int, default=None, help="pytest coverage floor (TDD proxy)")
    args = p.parse_args()
    root = args.root.resolve()

    plan = build_plan(root, args)
    if not plan:
        print(
            "Nothing to run. Expected a package.json (TS) or pyproject.toml (Python) "
            "with the standard scripts, and/or a boundaries.yaml.",
            file=sys.stderr,
        )
        return 2

    print(f"bigbrain verify — {len(plan)} step(s) in {root}")
    worst = 0
    results = []
    for label, cmd in plan:
        rc = run(label, cmd, root)
        results.append((label, rc))
        worst = max(worst, rc)

    print("\n================ summary ================")
    for label, rc in results:
        print(f"  {'PASS' if rc == 0 else 'FAIL'}  {label}")
    print("=========================================")
    print("VERIFY OK" if worst == 0 else "VERIFY FAILED — fix the failing step(s), don't skip them")
    return worst


if __name__ == "__main__":
    raise SystemExit(main())
