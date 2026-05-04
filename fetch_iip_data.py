#!/usr/bin/env python3
"""Fetch industrial zone data from IIP Vietnam API and emit GeoJSON for the map."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Tuple

import requests


API_URL = "https://api.iipvietnam.vn/files/filedata/dataIndustrial_2d6e5ca9-40c0-4785-979b-058c76049677.json"
OUT_GEOJSON = Path("data/industrial_zones.geojson")
OUT_RAW = Path("data/industrial_zones_iip_raw.json")


def normalize(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return text.strip()


def guess_kind(name: str) -> str:
    norm = normalize(name)
    if "cum cong nghiep" in norm or "ccn" in norm:
        return "CCN"
    if "khu cong nghiep" in norm or "kcn" in norm:
        return "KCN"
    return "KCN/CCN"


def extract_province(address: str) -> str:
    if not address:
        return ""
    patterns = [
        r"tỉnh\s+([^,]+)",
        r"tinh\s+([^,]+)",
        r"thành phố\s+([^,]+)",
        r"thanh pho\s+([^,]+)",
        r"tp\.?\s*([^,]+)",
    ]
    lower = address.lower()
    for pattern in patterns:
        match = re.search(pattern, lower, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip().title()
    parts = [part.strip() for part in address.split(",") if part.strip()]
    return parts[-1] if parts else ""


def coords_from_record(record: Dict[str, Any]) -> Tuple[float, float]:
    # API fields are reversed: Latitude ~ 105.x (lng), Longitude ~ 20.x (lat)
    lat_field = record.get("Longitude")
    lon_field = record.get("Latitude")
    try:
        lat = float(lat_field)
        lon = float(lon_field)
    except (TypeError, ValueError):
        return 0.0, 0.0
    return lat, lon


def coords_valid(lat: float, lon: float) -> bool:
    return lat != 0.0 and lon != 0.0 and -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


def build_feature(record: Dict[str, Any]) -> Dict[str, Any] | None:
    lat, lon = coords_from_record(record)
    if not coords_valid(lat, lon):
        return None
    name = (record.get("Name") or "").strip()
    address = record.get("Address") or ""
    province = extract_province(address)
    properties = {
        "name": name,
        "code": record.get("Code"),
        "address": address,
        "province": province,
        "price": record.get("Price"),
        "acreage": record.get("Acreage"),
        "occupancy": record.get("Occupancy"),
        "type_action": record.get("TypeAction"),
        "type_level_up": record.get("TypeLeveUp"),
        "career_id": record.get("CareerId"),
        "type_id": record.get("TypeId"),
        "accepted": record.get("Accpted"),
        "province_id": record.get("ProvinceId"),
        "district_id": record.get("DistricId"),
        "commune_id": record.get("CommuneId"),
        "kind": guess_kind(name),
        "source": "api.iipvietnam.vn",
        "images": record.get("Images"),
        "updated_at": record.get("LastModifiedTime"),
    }
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": properties,
    }


def main() -> None:
    resp = requests.get(API_URL, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    items: List[Dict[str, Any]] = data.get("Data", [])
    OUT_RAW.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    features: List[Dict[str, Any]] = []
    skipped = 0
    for record in items:
        feature = build_feature(record)
        if feature is None:
            skipped += 1
            continue
        features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}
    OUT_GEOJSON.write_text(json.dumps(geojson, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Tải {len(items)} bản ghi, ghi {len(features)} features, bỏ qua {skipped} do thiếu tọa độ hợp lệ.")
    print(f"- GeoJSON: {OUT_GEOJSON}")
    print(f"- Raw dump: {OUT_RAW}")


if __name__ == "__main__":
    main()
