import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


YELLOW = (255, 220, 36, 255)
RED = (255, 60, 60, 255)
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 210)
ZOOM_FILL = (255, 220, 36, 34)
FRAME_FILL = (255, 60, 60, 22)


def load_font(size):
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/meiryo.ttc",
    ]

    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)

    return ImageFont.load_default()


def point_to_px(point, width, height):
    return (round(point["x"] * width), round(point["y"] * height))


def rect_polygon(rect):
    x = rect["x"]
    y = rect["y"]
    w = rect["w"]
    h = rect["h"]

    return [
        {"x": x, "y": y},
        {"x": x + w, "y": y},
        {"x": x + w, "y": y + h},
        {"x": x, "y": y + h},
    ]


def normalized_rect_polygon(rect):
    return rect_polygon(rect)


def normalized_polygon(shape):
    polygon = shape.get("polygon")

    if isinstance(polygon, list) and len(polygon) >= 3:
        return polygon

    return normalized_rect_polygon(shape["rect"])


def label_box(draw, xy, text, font, fill=BLACK, outline=YELLOW, text_fill=YELLOW):
    padding_x = 8
    padding_y = 5
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x, y = xy
    box = (
        x,
        y,
        x + text_w + padding_x * 2,
        y + text_h + padding_y * 2,
    )
    draw.rounded_rectangle(box, radius=6, fill=fill, outline=outline, width=2)
    draw.text((x + padding_x, y + padding_y - 1), text, fill=text_fill, font=font)


def draw_shape(draw, shape, width, height, outline, fill, label, font, line_scale=0.006):
    polygon = [point_to_px(vertex, width, height) for vertex in normalized_polygon(shape)]
    draw.polygon(polygon, fill=fill)
    draw.line(polygon + [polygon[0]], fill=outline, width=max(4, round(width * line_scale)), joint="curve")

    min_x = min(x for x, _ in polygon)
    min_y = min(y for _, y in polygon)
    return polygon, (min_x + 8, min_y + 8)


def render_metadata(metadata_path, output_dir):
    metadata_path = Path(metadata_path)
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    image_path = metadata_path.parent / metadata["image"]
    image = Image.open(image_path).convert("RGBA")
    width, height = image.size

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    label_font = load_font(max(18, round(width * 0.024)))

    frames = metadata.get("zoom", {}).get("frames", [])

    for index, frame in enumerate(frames, start=1):
        frame_id = frame.get("id") or f"frame{index}"
        _, label_xy = draw_shape(
            draw,
            frame,
            width,
            height,
            RED,
            FRAME_FILL,
            frame_id,
            label_font,
            line_scale=0.007,
        )
        label_box(draw, label_xy, frame_id, label_font, fill=(80, 0, 0, 220), outline=RED, text_fill=WHITE)

    for index, point in enumerate(metadata.get("zoom", {}).get("points", []), start=1):
        frame_id = point.get("frameId")
        label = f"zoom{index}" + (f" -> {frame_id}" if frame_id else "")
        _, label_xy = draw_shape(
            draw,
            point,
            width,
            height,
            YELLOW,
            ZOOM_FILL,
            label,
            label_font,
        )
        label_box(draw, label_xy, label, label_font)

    result = Image.alpha_composite(image, overlay).convert("RGB")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{metadata['bookId']}-{metadata['pageId']}-zoom-debug.png"
    result.save(output_path, quality=95)
    return output_path


def metadata_paths(args):
    if args.metadata:
        return [Path(args.metadata)]

    book_dir = Path(args.book_dir)

    if args.page:
        return [book_dir / "pages" / args.page / "metadata.json"]

    return sorted(book_dir.glob("pages/page-*/metadata.json"))


def main():
    parser = argparse.ArgumentParser(description="Render LearnWithStory zoom frames onto page images.")
    parser.add_argument(
        "--book-dir",
        default="assets/contextual-situation/tokyo-train-quest",
        help="Book asset directory containing pages/page-XXX/metadata.json.",
    )
    parser.add_argument("--page", help="Single page id such as page-001. Omit to render all pages.")
    parser.add_argument("--metadata", help="Direct path to one metadata.json file.")
    parser.add_argument(
        "--output-dir",
        default="artifacts/zoom-debug",
        help="Directory where debug PNGs should be written.",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    paths = metadata_paths(args)

    if not paths:
        raise SystemExit("No metadata files found.")

    for path in paths:
        output_path = render_metadata(path, output_dir)
        print(output_path)


if __name__ == "__main__":
    main()
