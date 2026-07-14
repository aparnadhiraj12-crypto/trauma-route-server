import json
import argparse
import sys
from pathlib import Path


def load_json(path: str):
    p = Path(path)
    if not p.exists():
        print(f"[ERROR] File not found: {path}")
        sys.exit(1)
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Validate requirementRules.json vs hospitals.json")
    parser.add_argument("--rules", default="../data/requirementRules.json")
    parser.add_argument("--hospitals", default="../data/hospitals.json")
    args = parser.parse_args()

    rules = load_json(args.rules)
    hospitals = load_json(args.hospitals)

    required_specialties = set()
required_resources = set()
for injury, details in rules.items():
    if injury.startswith("_"):
        continue
    if not isinstance(details, dict):
        continue
    required_specialties.update(details.get("requiredSpecialties", []))
    required_resources.update(details.get("requiredResources", []))

    print("=" * 60)
    print(f"Specialties referenced in requirementRules.json ({len(required_specialties)}):")
    print(sorted(required_specialties))
    print("=" * 60)

    all_hospital_specialties = set()
    per_hospital = {}
    for hosp in hospitals:
        name = hosp.get("name", hosp.get("id", "UNKNOWN"))
        specs = hosp.get("specialties", {})
        if not isinstance(specs, dict):
            print(f"[WARN] {name}: 'specialties' is not an object - check formatting")
            continue
        per_hospital[name] = set(specs.keys())
        all_hospital_specialties.update(specs.keys())

    never_present = required_specialties - all_hospital_specialties
    if never_present:
        print(f"\n[FAIL] {len(never_present)} specialty name(s) used in requirementRules.json ")
        print("       never appear as a field on any hospital (typo, or schema gap):")
        for spec in sorted(never_present):
            print(f"   - {spec}")
    else:
        print("\n[PASS] Every specialty in requirementRules.json exists on at least one hospital.")

    print("\n" + "-" * 60)
    print("Per-hospital specialty coverage vs required list:")
    for name, fields in per_hospital.items():
        missing_fields = (required_specialties & all_hospital_specialties) - fields
        if missing_fields:
            print(f"  [MISSING FIELD] {name}: {sorted(missing_fields)}")
        else:
            print(f"  [OK] {name}: has all required specialty fields")

    KNOWN_INJURY_TAGS = {
        "head_injury", "skull_fracture", "chest_penetrating",
        "rib_fracture", "internal_bleeding", "limb_fracture", "crush_injury"
    }
    mapped_injuries = {k for k in rules.keys() if not k.startswith("_")}
    unmapped = KNOWN_INJURY_TAGS - mapped_injuries
    if unmapped:
        print(f"\n[FAIL] Injury tags from API_CONTRACT.md with NO entry in requirementRules.json:")
        for tag in sorted(unmapped):
            print(f"   - {tag}")
    else:
        print("\n[PASS] Every injury tag from API_CONTRACT.md has a rule entry.")

    print("\nDone.")


if __name__ == "__main__":
    main()
