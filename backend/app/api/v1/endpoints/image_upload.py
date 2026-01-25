"""
Image Upload API for Thumbnails
Handles user image uploads, storage, and processing
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User
from app.api.v1.endpoints.auth import get_current_user
import base64
import uuid
import os
from pathlib import Path
from PIL import Image
import io

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("uploads/thumbnails")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def optimize_image(image_data: bytes, max_size: tuple = (1920, 1080)) -> bytes:
    """Optimize image: resize if too large, compress"""
    img = Image.open(io.BytesIO(image_data))

    # Convert RGBA to RGB if necessary
    if img.mode == 'RGBA':
        # Create white background
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Resize if too large
    if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

    # Save optimized
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    return output.getvalue()


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image for thumbnail creation
    Returns: image_id, url, base64_data
    """

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    try:
        # Optimize image
        optimized_data = optimize_image(contents)

        # Generate unique filename
        file_id = uuid.uuid4().hex
        file_extension = Path(file.filename).suffix.lower()
        filename = f"{current_user.id}_{file_id}{file_extension}"
        filepath = UPLOAD_DIR / filename

        # Save to disk
        with open(filepath, 'wb') as f:
            f.write(optimized_data)

        # Convert to base64 for canvas rendering
        base64_data = base64.b64encode(optimized_data).decode('utf-8')

        # Get image dimensions
        img = Image.open(io.BytesIO(optimized_data))
        width, height = img.size

        return {
            "success": True,
            "image_id": file_id,
            "filename": filename,
            "url": f"/uploads/thumbnails/{filename}",
            "base64_data": f"data:image/jpeg;base64,{base64_data}",
            "width": width,
            "height": height,
            "size": len(optimized_data)
        }

    except Exception as e:
        print(f"[Image Upload] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")


@router.post("/upload-multiple")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple images at once
    Returns: array of image data
    """

    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images at once")

    results = []

    for file in files:
        try:
            # Validate file
            if not allowed_file(file.filename):
                results.append({
                    "success": False,
                    "filename": file.filename,
                    "error": "File type not allowed"
                })
                continue

            # Read and optimize
            contents = await file.read()

            if len(contents) > MAX_FILE_SIZE:
                results.append({
                    "success": False,
                    "filename": file.filename,
                    "error": "File too large"
                })
                continue

            optimized_data = optimize_image(contents)

            # Generate unique filename
            file_id = uuid.uuid4().hex
            file_extension = Path(file.filename).suffix.lower()
            filename = f"{current_user.id}_{file_id}{file_extension}"
            filepath = UPLOAD_DIR / filename

            # Save to disk
            with open(filepath, 'wb') as f:
                f.write(optimized_data)

            # Convert to base64
            base64_data = base64.b64encode(optimized_data).decode('utf-8')

            # Get dimensions
            img = Image.open(io.BytesIO(optimized_data))
            width, height = img.size

            results.append({
                "success": True,
                "image_id": file_id,
                "filename": filename,
                "original_filename": file.filename,
                "url": f"/uploads/thumbnails/{filename}",
                "base64_data": f"data:image/jpeg;base64,{base64_data}",
                "width": width,
                "height": height,
                "size": len(optimized_data)
            })

        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "uploaded": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "results": results
    }


@router.delete("/delete/{image_id}")
async def delete_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an uploaded image"""

    try:
        # Find file matching user_id and image_id
        pattern = f"{current_user.id}_{image_id}.*"
        matching_files = list(UPLOAD_DIR.glob(pattern))

        if not matching_files:
            raise HTTPException(status_code=404, detail="Image not found")

        # Delete file
        for filepath in matching_files:
            filepath.unlink()

        return {
            "success": True,
            "message": "Image deleted",
            "image_id": image_id
        }

    except Exception as e:
        print(f"[Image Delete] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze an image for thumbnail generation
    Extracts: colors, composition, style, suggested text placement
    """

    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Get dominant colors
        img_small = img.resize((150, 150))
        pixels = list(img_small.getdata())

        # Simple color extraction (top 5 colors)
        from collections import Counter
        color_counter = Counter(pixels)
        dominant_colors = color_counter.most_common(5)

        # Convert to hex
        hex_colors = []
        for color, count in dominant_colors:
            hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
            hex_colors.append({
                "hex": hex_color,
                "rgb": color,
                "percentage": (count / len(pixels)) * 100
            })

        # Analyze brightness
        grayscale = img.convert('L')
        pixels_gray = list(grayscale.getdata())
        avg_brightness = sum(pixels_gray) / len(pixels_gray)

        # Determine if dark or light
        is_dark = avg_brightness < 128

        # Suggest text placement zones (avoid busy areas)
        width, height = img.size
        suggested_zones = []

        # Top zone
        top_section = img.crop((0, 0, width, height // 3))
        top_brightness = sum(list(top_section.convert('L').getdata())) / (width * height // 3)
        suggested_zones.append({
            "zone": "top",
            "y_range": [50, height // 3],
            "suitability": "high" if top_brightness < 100 or top_brightness > 200 else "medium",
            "suggested_color": "#FFFFFF" if top_brightness < 128 else "#000000"
        })

        # Bottom zone
        bottom_section = img.crop((0, height * 2 // 3, width, height))
        bottom_brightness = sum(list(bottom_section.convert('L').getdata())) / (width * height // 3)
        suggested_zones.append({
            "zone": "bottom",
            "y_range": [height * 2 // 3, height - 50],
            "suitability": "high" if bottom_brightness < 100 or bottom_brightness > 200 else "medium",
            "suggested_color": "#FFFFFF" if bottom_brightness < 128 else "#000000"
        })

        return {
            "success": True,
            "analysis": {
                "dimensions": {
                    "width": width,
                    "height": height,
                    "aspect_ratio": f"{width}:{height}"
                },
                "colors": {
                    "dominant": hex_colors,
                    "palette_type": "dark" if is_dark else "light",
                    "average_brightness": avg_brightness
                },
                "text_placement": {
                    "suggested_zones": suggested_zones,
                    "recommended_zone": "top" if top_brightness < bottom_brightness else "bottom"
                },
                "style_suggestions": {
                    "text_color": "#FFFFFF" if is_dark else "#000000",
                    "stroke_color": "#000000" if is_dark else "#FFFFFF",
                    "overlay_recommended": avg_brightness > 100 and avg_brightness < 200
                }
            }
        }

    except Exception as e:
        print(f"[Image Analysis] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")
