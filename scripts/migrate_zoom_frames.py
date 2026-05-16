import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MIN_FRAME_AREA = 0.015
MAX_ZOOM_W = 0.42
MAX_ZOOM_H = 0.24


def rect_polygon(rect):
    x, y, w, h = rect["x"], rect["y"], rect["w"], rect["h"]
    return [
        {"x": x, "y": y},
        {"x": x + w, "y": y},
        {"x": x + w, "y": y + h},
        {"x": x, "y": y + h},
    ]


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def normalized_rect(x1, y1, x2, y2, width, height, pad=0.004):
    x = clamp(x1 / width + pad)
    y = clamp(y1 / height + pad)
    right = clamp(x2 / width - pad)
    bottom = clamp(y2 / height - pad)
    return {
        "x": round(x, 4),
        "y": round(y, 4),
        "w": round(max(0.02, right - x), 4),
        "h": round(max(0.02, bottom - y), 4),
    }


def contiguous_bands(values, threshold, min_len):
    bands = []
    start = None
    for index, value in enumerate(values):
        if value >= threshold and start is None:
            start = index
        elif value < threshold and start is not None:
            if index - start >= min_len:
                bands.append((start, index))
            start = None
    if start is not None and len(values) - start >= min_len:
        bands.append((start, len(values)))
    return bands


def intervals_from_bands(total, bands, min_size):
    intervals = []
    last = 0
    for start, end in bands:
        if start - last >= min_size:
            intervals.append((last, start))
        last = end
    if total - last >= min_size:
        intervals.append((last, total))
    return intervals


def sort_rects(rects):
    if not rects:
        return rects
    median_h = np.median([r[3] - r[1] for r in rects])
    row_key = max(1, int(median_h * 0.42))
    return sorted(rects, key=lambda r: (round(r[1] / row_key), r[0]))


def merge_near_duplicates(rects):
    merged = []
    for rect in sort_rects(rects):
        x1, y1, x2, y2 = rect
        area = (x2 - x1) * (y2 - y1)
        duplicate = False
        for existing in merged:
            ex1, ey1, ex2, ey2 = existing
            ix1, iy1 = max(x1, ex1), max(y1, ey1)
            ix2, iy2 = min(x2, ex2), min(y2, ey2)
            if ix2 <= ix1 or iy2 <= iy1:
                continue
            inter = (ix2 - ix1) * (iy2 - iy1)
            smaller = min(area, (ex2 - ex1) * (ey2 - ey1))
            if inter / smaller > 0.86:
                duplicate = True
                break
        if not duplicate:
            merged.append(rect)
    return merged


def detected_panel_rects(image_path):
    image = cv2.imread(str(image_path))
    if image is None:
        return []
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    dark = (gray < 35).astype(np.uint8)

    row_dark = dark.mean(axis=1)
    horizontal_bands = contiguous_bands(row_dark, 0.62, max(5, height // 300))
    horizontal_bands = [band for band in horizontal_bands if band[1] - band[0] < height * 0.04]
    y_intervals = intervals_from_bands(height, horizontal_bands, max(70, height // 16))

    rects = []
    for y1, y2 in y_intervals:
        if (y2 - y1) / height >= 0.30:
            x_intervals = [(0, width)]
        else:
            sub = dark[y1:y2, :]
            col_dark = sub.mean(axis=0)
            vertical_bands = contiguous_bands(col_dark, 0.80, max(5, width // 250))
            vertical_bands = [band for band in vertical_bands if band[1] - band[0] < width * 0.025]
            x_intervals = intervals_from_bands(width, vertical_bands, max(70, width // 10))

        for x1, x2 in x_intervals:
            if (x2 - x1) * (y2 - y1) >= width * height * MIN_FRAME_AREA:
                rects.append((x1, y1, x2, y2))

    return merge_near_duplicates(rects)


def fallback_frame_rects(metadata):
    points = metadata.get("zoom", {}).get("points", [])
    rects = []
    for point in points:
        rect = point.get("rect")
        if not rect:
            continue
        x1 = rect["x"]
        y1 = rect["y"]
        x2 = rect["x"] + rect["w"]
        y2 = rect["y"] + rect["h"]
        pad_x = max(0.04, rect["w"] * 0.18)
        pad_y = max(0.035, rect["h"] * 0.18)
        rects.append(
            {
                "x": round(clamp(x1 - pad_x), 4),
                "y": round(clamp(y1 - pad_y), 4),
                "w": round(clamp(x2 + pad_x) - clamp(x1 - pad_x), 4),
                "h": round(clamp(y2 + pad_y) - clamp(y1 - pad_y), 4),
            }
        )

    if not rects:
        return [{"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}]

    return rects


def frame_rects(metadata, image_path, width, height):
    detected = [
        normalized_rect(x1, y1, x2, y2, width, height)
        for x1, y1, x2, y2 in detected_panel_rects(image_path)
    ]

    if detected:
        return detected

    return fallback_frame_rects(metadata)


def tile_frame(frame, frame_index):
    columns = max(1, math.ceil(frame["w"] / MAX_ZOOM_W))
    rows = max(1, math.ceil(frame["h"] / MAX_ZOOM_H))
    points = []

    for row in range(rows):
        for column in range(columns):
            x1 = frame["x"] + frame["w"] * column / columns
            x2 = frame["x"] + frame["w"] * (column + 1) / columns
            y1 = frame["y"] + frame["h"] * row / rows
            y2 = frame["y"] + frame["h"] * (row + 1) / rows
            points.append(
                {
                    "label": f"Frame {frame_index} area {len(points) + 1}",
                    "frameId": f"frame{frame_index}",
                    "rect": {
                        "x": round(x1, 4),
                        "y": round(y1, 4),
                        "w": round(x2 - x1, 4),
                        "h": round(y2 - y1, 4),
                    },
                    "scale": 2.9,
                }
            )

    return points


def migrate_metadata(metadata_path):
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    image_path = metadata_path.parent / metadata["image"]
    with Image.open(image_path) as image:
        width, height = image.size

    metadata["width"] = width
    metadata["height"] = height

    rects = frame_rects(metadata, image_path, width, height)
    frames = []
    points = []

    for index, rect in enumerate(rects, start=1):
        frame = {
            "id": f"frame{index}",
            "label": f"Frame {index}",
            "polygon": rect_polygon(rect),
        }
        frames.append(frame)
        points.extend(tile_frame(rect, index))

    metadata["zoom"] = {
        "frames": frames,
        "points": points,
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return metadata_path, len(frames), len(points)


def main():
    metadata_paths = sorted(ROOT.glob("assets/*/*/pages/page-*/metadata.json"))
    for metadata_path in metadata_paths:
        path, frame_count, point_count = migrate_metadata(metadata_path)
        print(f"{path.relative_to(ROOT)} frames={frame_count} zooms={point_count}")


if __name__ == "__main__":
    main()
