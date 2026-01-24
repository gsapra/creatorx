#!/bin/bash

# Script to generate PWA icons from a source image
# You need to have ImageMagick installed: sudo apt-get install imagemagick

SOURCE_IMAGE="$1"
OUTPUT_DIR="$(dirname "$0")/public/icons"

if [ -z "$SOURCE_IMAGE" ]; then
    echo "Usage: $0 <source-image.png>"
    echo "Example: $0 logo.png"
    echo ""
    echo "This script generates PWA icons in multiple sizes from a source image."
    echo "The source image should ideally be 512x512 or larger."
    exit 1
fi

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image '$SOURCE_IMAGE' not found"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Array of icon sizes
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons from $SOURCE_IMAGE..."

for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$OUTPUT_DIR/icon-${SIZE}x${SIZE}.png"
    echo "Creating ${SIZE}x${SIZE} icon..."
    convert "$SOURCE_IMAGE" -resize "${SIZE}x${SIZE}" "$OUTPUT_FILE"
done

echo ""
echo "✓ All icons generated successfully in $OUTPUT_DIR"
echo ""
echo "Icon files created:"
ls -lh "$OUTPUT_DIR"
