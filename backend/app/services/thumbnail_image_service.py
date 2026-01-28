"""
Thumbnail Image Generation Service using DALL-E 3

This service generates actual thumbnail images using AI image generation
instead of canvas-based layer rendering.
"""

from typing import List, Dict, Optional
import logging
from app.services.ai_service import ai_service
from app.schemas.schemas import ThumbnailIdeaRequest
import base64
import httpx
import asyncio

logger = logging.getLogger(__name__)


class ThumbnailImageService:
    """Generate professional thumbnail images using DALL-E 3"""

    # Emotion-based visual styles
    EMOTION_STYLES = {
        "shocking": {
            "description": "extreme shock, wide eyes, open mouth, dramatic expression",
            "composition": "close-up face taking 60% of frame, bold all-caps text",
            "colors": "high contrast with red, yellow, and black",
            "effects": "dramatic lighting, motion blur, exclamation marks",
            "text_style": "BOLD ALL CAPS with thick stroke, yellow or white on dark background"
        },
        "curious": {
            "description": "intrigued expression, raised eyebrow, thoughtful look",
            "composition": "rule of thirds with mysterious element, question mark motif",
            "colors": "deep blues, purples, with neon accents",
            "effects": "soft glow, question marks, arrows pointing",
            "text_style": "Bold with question mark, mysterious font style"
        },
        "exciting": {
            "description": "energetic, happy, enthusiastic expression",
            "composition": "dynamic diagonal layout, action-packed",
            "colors": "vibrant rainbow colors, bright and energetic",
            "effects": "explosion effects, star bursts, dynamic shapes",
            "text_style": "Bold with exclamation marks, energetic font"
        },
        "inspiring": {
            "description": "confident, aspirational, uplifting expression",
            "composition": "upward angle, golden ratio composition",
            "colors": "gold, white, light blues, warm sunset tones",
            "effects": "lens flare, inspirational quotes, upward arrows",
            "text_style": "Elegant bold font with inspirational feel"
        },
        "educational": {
            "description": "friendly, knowledgeable, approachable expression",
            "composition": "centered with educational elements, clear hierarchy",
            "colors": "professional blues, greens, white",
            "effects": "diagrams, icons, clean infographic style",
            "text_style": "Clear readable font with numbers or statistics"
        },
        "entertaining": {
            "description": "fun, playful, humorous expression",
            "composition": "asymmetric, quirky, unexpected layout",
            "colors": "playful pastels or bright primary colors",
            "effects": "cartoon elements, emojis, fun shapes",
            "text_style": "Playful bold font with emojis"
        }
    }

    # Color scheme palettes
    COLOR_PALETTES = {
        "vibrant": "bright red (#FF0000), electric yellow (#FFFF00), vivid green (#00FF00), high saturation",
        "pastel": "soft pink (#FFE5E5), lavender (#E8DFF5), mint (#D3F8E2), light and dreamy",
        "dark": "deep black (#000000), charcoal (#1A1A2E), dark blue (#2D3142), moody and dramatic",
        "neon": "electric cyan (#00F0FF), hot pink (#FF00FF), neon green (#00FF85), cyberpunk style",
        "monochrome": "pure white (#FFFFFF), pure black (#000000), grays, high contrast black and white",
        "complementary": "royal blue (#0066CC), orange (#FF9900), white accents, balanced contrast"
    }

    # Layout compositions
    LAYOUT_STYLES = {
        "centered": "subject centered, symmetrical balance, text at top or bottom",
        "split": "split screen 50/50, before-after or comparison layout",
        "rule-of-thirds": "subject positioned at intersection points, asymmetric balance",
        "asymmetric": "dynamic off-center composition, diagonal energy"
    }

    async def generate_thumbnails(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Generate thumbnail images using DALL-E 3

        Args:
            request: Thumbnail generation request with all parameters
            persona: Optional persona context

        Returns:
            List of thumbnail dictionaries with image URLs and metadata
        """
        try:
            logger.info(f"Generating {request.count} thumbnail images for: {request.thumbnail_prompt[:100]}")

            # Generate thumbnails using standard approach
            # If user uploaded images, they'll be added as layers in the editor
            return await self._generate_standard_thumbnails(request, persona)

        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")
            raise Exception(f"Failed to generate thumbnails: {str(e)}")

    async def _generate_standard_thumbnails(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict]:
        """Generate thumbnails using specified image model"""
        # Get the image model from request, default to dall-e-3
        image_model = getattr(request, 'image_model', 'dall-e-3')
        logger.info(f"Using image model: {image_model}")

        # If user uploaded images for GPT-Image 1.5, analyze them first
        enhanced_request = request
        if image_model == 'gpt-image-1.5' and request.custom_images and len(request.custom_images) > 0:
            logger.info(f"Analyzing {len(request.custom_images)} uploaded images with GPT-4o Vision")

            # Extract base64 data from custom images
            base64_images = [img.get('base64_data', '') for img in request.custom_images]

            # Analyze images and get enhanced prompt
            enhanced_prompt = await ai_service.analyze_images_for_thumbnail(
                base64_images=base64_images,
                user_prompt=request.thumbnail_prompt
            )

            logger.info(f"Enhanced prompt created: {enhanced_prompt[:200]}...")

            # Create a modified request with the enhanced prompt
            from copy import deepcopy
            enhanced_request = deepcopy(request)
            enhanced_request.thumbnail_prompt = enhanced_prompt

        # Generate prompts based on user inputs (using enhanced prompt if available)
        prompts = await self._create_dalle_prompts(enhanced_request, persona)

        # Generate images in parallel with selected model
        image_urls = await ai_service.generate_multiple_images(
            prompts=prompts,
            size="1792x1024",  # YouTube thumbnail aspect ratio
            quality="hd",
            style="vivid",  # Vivid for eye-catching thumbnails
            model=image_model
        )

        # Download and convert images to base64 for immediate display
        thumbnails = []
        for idx, image_url in enumerate(image_urls):
            try:
                # Check if image_url is valid
                if not image_url:
                    logger.error(f"Image {idx + 1}/{len(image_urls)}: Received None or empty URL, skipping")
                    continue

                image_preview = str(image_url)[:100] if image_url else "None"
                logger.info(f"Processing image {idx + 1}/{len(image_urls)}: {image_preview}...")
                base64_data = await self._download_and_encode_image(image_url)

                if not base64_data:
                    logger.error(f"Empty base64_data for image {idx + 1}, skipping")
                    continue

                thumbnail = {
                    "id": f"thumb_{idx + 1}",
                    "title": request.thumbnail_prompt[:50],  # First 50 chars as title
                    "image_url": image_url,
                    "base64_data": base64_data,
                    "prompt": prompts[idx] if idx < len(prompts) else "",
                    "emotion": request.emotion or "exciting",
                    "color_scheme": request.color_scheme or "vibrant",
                    "layout": request.layout_preference or "rule-of-thirds",
                    "ctr_score": self._predict_ctr_score(request, idx),
                    "optimized_for_mobile": request.optimize_for_mobile,
                    "platform": request.target_platform or "youtube",
                    "variation": idx + 1
                }

                # Add uploaded images as layers for editor
                if request.custom_images and len(request.custom_images) > 0:
                    thumbnail["uploaded_layers"] = request.custom_images
                    logger.info(f"Added {len(request.custom_images)} uploaded images as layers for thumbnail {idx + 1}")

                logger.info(f"Successfully processed thumbnail {idx + 1} with base64 data length: {len(base64_data)}")
                thumbnails.append(thumbnail)
            except Exception as e:
                logger.error(f"Failed to process image {idx + 1}: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                continue

        logger.info(f"Successfully generated {len(thumbnails)} thumbnails")
        return thumbnails

    async def _generate_with_uploaded_images(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Generate thumbnails using image-to-image generation with uploaded images

        Uses Google Vertex Imagen to incorporate the user's uploaded images
        directly into the thumbnail design.
        """
        thumbnails = []

        # Get the primary uploaded image
        base_image = request.custom_images[0]
        base_image_data = base_image.get('base64_data', '')

        # Create thumbnail-specific prompts
        prompts = await self._create_thumbnail_prompts_for_img2img(request, persona)

        logger.info(f"Generating {len(prompts)} thumbnail variations using uploaded image")

        # Generate each variation
        for idx, prompt in enumerate(prompts):
            try:
                # Try Vertex Imagen first (best for img2img)
                try:
                    generated_data = await ai_service.generate_image_with_base(
                        prompt=prompt,
                        base_image_data=base_image_data,
                        model="vertex"
                    )
                    logger.info(f"Generated thumbnail {idx + 1} with Vertex Imagen")
                except Exception as vertex_error:
                    logger.warning(f"Vertex Imagen failed: {vertex_error}, trying DALL-E 2")
                    # Fallback to DALL-E 2 variation
                    generated_data = await ai_service.generate_image_with_base(
                        prompt=prompt,
                        base_image_data=base_image_data,
                        model="dalle"
                    )
                    logger.info(f"Generated thumbnail {idx + 1} with DALL-E 2")

                thumbnail = {
                    "id": f"thumb_{idx + 1}",
                    "title": request.video_title,
                    "image_url": "",  # No URL for base64 data
                    "base64_data": generated_data,
                    "prompt": prompt,
                    "emotion": request.emotion or "exciting",
                    "color_scheme": request.color_scheme or "vibrant",
                    "layout": request.layout_preference or "rule-of-thirds",
                    "ctr_score": self._predict_ctr_score(request, idx),
                    "optimized_for_mobile": request.optimize_for_mobile,
                    "platform": request.target_platform or "youtube",
                    "variation": idx + 1,
                    "generation_method": "img2img"  # Mark as image-to-image
                }

                thumbnails.append(thumbnail)

            except Exception as e:
                logger.error(f"Failed to generate thumbnail {idx + 1} with uploaded image: {e}")
                continue

        if len(thumbnails) == 0:
            raise Exception("Failed to generate any thumbnails with uploaded images")

        logger.info(f"Successfully generated {len(thumbnails)} thumbnails using uploaded images")
        return thumbnails

    async def _create_thumbnail_prompts_for_img2img(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict]
    ) -> List[str]:
        """
        Create prompts specifically for image-to-image thumbnail generation

        These prompts focus on enhancing/transforming the uploaded image
        into a professional YouTube thumbnail.
        """
        emotion = request.emotion or "exciting"
        color_scheme = request.color_scheme or "vibrant"

        emotion_style = self.EMOTION_STYLES.get(emotion, self.EMOTION_STYLES["exciting"])
        color_palette = self.COLOR_PALETTES.get(color_scheme, self.COLOR_PALETTES["vibrant"])

        base_prompt_parts = [
            f"Transform this image into a professional YouTube thumbnail for '{request.video_title}'",
            "",
            "REQUIREMENTS:",
            f"- Keep the main subject/person from the original image",
            f"- Add bold, eye-catching text: \"{self._extract_key_words(request.video_title)}\"",
            f"- Text style: {emotion_style['text_style']}",
            f"- Enhance with {emotion_style['effects']}",
            f"- Apply color scheme: {color_palette}",
            f"- Make it {emotion} and attention-grabbing",
            "",
            "STYLE:",
            f"- YouTube thumbnail aesthetic",
            f"- High contrast and vibrant",
            f"- Professional graphic design",
            f"- CTR-optimized layout",
            "- 16:9 aspect ratio (1792x1024)"
        ]

        if request.include_emoji:
            base_prompt_parts.append("- Add relevant emojis")
        if request.include_arrow:
            base_prompt_parts.append("- Include pointing arrow to key element")
        if request.include_circle:
            base_prompt_parts.append("- Add circle highlight around important area")

        if request.optimize_for_mobile:
            base_prompt_parts.extend([
                "",
                "MOBILE OPTIMIZATION:",
                "- Extra large, bold text readable on small screens",
                "- High contrast colors"
            ])

        # Create variations
        prompts = []
        base_prompt = "\n".join(base_prompt_parts)

        for i in range(request.count):
            if i == 0:
                variation = f"{base_prompt}\n\nSTYLE: Bold and dramatic with maximum visual impact"
            elif i == 1:
                variation = f"{base_prompt}\n\nSTYLE: Alternative text placement with dynamic layout"
            elif i == 2:
                variation = f"{base_prompt}\n\nSTYLE: Creative interpretation with unique effects"
            else:
                variation = f"{base_prompt}\n\nSTYLE: Variation {i + 1}"

            prompts.append(variation)

        return prompts

    async def _create_dalle_prompts(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict]
    ) -> List[str]:
        """
        Create detailed DALL-E 3 prompts for thumbnail generation

        Args:
            request: Thumbnail generation request
            persona: Optional persona context

        Returns:
            List of detailed prompts
        """
        # Base prompt components
        emotion = request.emotion or "exciting"
        color_scheme = request.color_scheme or "vibrant"
        layout = request.layout_preference or "rule-of-thirds"

        emotion_style = self.EMOTION_STYLES.get(emotion, self.EMOTION_STYLES["exciting"])
        color_palette = self.COLOR_PALETTES.get(color_scheme, self.COLOR_PALETTES["vibrant"])
        layout_style = self.LAYOUT_STYLES.get(layout, self.LAYOUT_STYLES["rule-of-thirds"])

        # Build base prompt using the user's combined description
        base_prompt_parts = [
            f"Create a professional YouTube thumbnail based on this description:",
            f"\"{request.thumbnail_prompt}\"",
            "",
            "VISUAL STYLE:",
            f"- Emotion/feeling: {emotion_style['description']}",
            f"- Color palette: {color_palette}",
            f"- Composition: {layout_style}",
            f"- Effects: {emotion_style['effects']}",
            "",
            "TEXT REQUIREMENTS:",
            f"- Text style: {emotion_style['text_style']}",
            f"- Text must be large, bold, and clearly readable",
            f"- Use high contrast for text visibility",
            f"- Incorporate any text mentioned in the description above",
        ]

        # Add face/person requirements if requested
        # Note: If user uploaded images, the enhanced prompt from vision analysis
        # will already incorporate them, so include_face may be less relevant
        if request.include_face:
            face_expression = request.face_expression or "excited"
            base_prompt_parts.extend([
                "",
                "HUMAN ELEMENT:",
                f"- Include a {face_expression} face/person with {emotion_style['description']}",
                f"- Face should be prominent and expressive",
                f"- Professional photography quality"
            ])

        # Add uploaded image references (style matching)
        if request.reference_images and len(request.reference_images) > 0:
            base_prompt_parts.extend([
                "",
                "STYLE REFERENCE:",
                f"- Match the visual style and aesthetic of successful thumbnails",
                f"- Use similar color grading and composition techniques",
                f"- Professional, high-quality finish"
            ])

        # Add platform-specific optimizations
        if request.optimize_for_mobile:
            base_prompt_parts.extend([
                "",
                "MOBILE OPTIMIZATION:",
                "- Extra large text that's readable on small screens",
                "- Simple, bold design elements",
                "- High contrast colors"
            ])

        # Add visual elements
        visual_elements = []
        if request.include_emoji:
            visual_elements.append("relevant emojis")
        if request.include_arrow:
            visual_elements.append("bold arrow pointing to key element")
        if request.include_circle:
            visual_elements.append("circle highlight around important area")

        if visual_elements:
            base_prompt_parts.extend([
                "",
                f"VISUAL ELEMENTS: Include {', '.join(visual_elements)}"
            ])

        # Add refinement feedback if provided
        if request.refinement_feedback:
            base_prompt_parts.extend([
                "",
                "="*80,
                "🔄 REFINEMENT INSTRUCTIONS (CRITICAL - MUST FOLLOW)",
                "="*80,
                "This is a refinement of a previous thumbnail. Apply these changes:",
                "",
                f"USER FEEDBACK: {request.refinement_feedback}",
                "",
                "IMPORTANT:",
                "- Keep the same video title and overall theme",
                "- Apply ONLY the specific changes requested",
                "- Maintain professional quality",
                "- Ensure changes improve the design",
                "="*80
            ])

        # Add style requirements
        base_prompt_parts.extend([
            "",
            "TECHNICAL REQUIREMENTS:",
            "- 16:9 aspect ratio (1792x1024)",
            "- High quality, sharp details",
            "- Professional graphic design",
            "- Eye-catching and clickable",
            "- YouTube thumbnail style",
            "- CTR optimized design"
        ])

        # Create variations
        prompts = []
        base_prompt = "\n".join(base_prompt_parts)

        for i in range(request.count):
            # Add variation-specific instructions
            variation_prompt = f"{base_prompt}\n\n"

            if i == 0:
                variation_prompt += "VARIATION 1: Bold and dramatic with maximum impact"
            elif i == 1:
                variation_prompt += "VARIATION 2: Alternative layout with different text placement"
            elif i == 2:
                variation_prompt += "VARIATION 3: Unique creative interpretation with different color emphasis"
            elif i == 3:
                variation_prompt += "VARIATION 4: Minimalist approach with clean design"
            else:
                variation_prompt += f"VARIATION {i + 1}: Creative unique interpretation"

            prompts.append(variation_prompt)

        return prompts

    def _extract_key_words(self, title: str) -> str:
        """
        Extract key words from title for prominent display

        Args:
            title: Video title

        Returns:
            Key words (max 5-6 words for readability)
        """
        # Remove common filler words
        filler_words = {'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but'}

        words = title.split()
        key_words = [w for w in words if w.lower() not in filler_words]

        # Take first 5-6 important words
        key_text = ' '.join(key_words[:6])

        # If too long, take first 4 words
        if len(key_text) > 40:
            key_text = ' '.join(key_words[:4])

        return key_text.upper() if len(key_text) < 20 else key_text

    async def _download_and_encode_image(self, image_url: str) -> str:
        """
        Download image from URL and encode to base64, or return if already base64

        Args:
            image_url: URL of the image or base64 data URI

        Returns:
            Base64 encoded image data URI
        """
        try:
            # Check if it's already a base64 data URI
            if image_url.startswith('data:image/'):
                logger.info(f"Image is already base64 encoded, returning as-is")
                return image_url

            # Otherwise, download the image from URL
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(image_url)
                response.raise_for_status()

                image_data = response.content
                base64_encoded = base64.b64encode(image_data).decode('utf-8')

                return f"data:image/png;base64,{base64_encoded}"

        except Exception as e:
            logger.error(f"Failed to download/encode image: {e}")
            return ""

    def _predict_ctr_score(self, request: ThumbnailIdeaRequest, variation: int) -> float:
        """
        Predict CTR score based on thumbnail parameters

        Args:
            request: Thumbnail request
            variation: Variation index

        Returns:
            Predicted CTR percentage (0-100)
        """
        score = 50.0  # Base score

        # Emotion impact
        emotion_scores = {
            "shocking": 15,
            "curious": 12,
            "exciting": 10,
            "inspiring": 8,
            "educational": 6,
            "entertaining": 9
        }
        score += emotion_scores.get(request.emotion or "exciting", 8)

        # Face impact
        if request.include_face:
            score += 12

        # Color scheme impact
        color_scores = {
            "vibrant": 8,
            "neon": 7,
            "complementary": 6,
            "dark": 5,
            "pastel": 4,
            "monochrome": 3
        }
        score += color_scores.get(request.color_scheme or "vibrant", 6)

        # Visual elements
        if request.include_emoji:
            score += 3
        if request.include_arrow:
            score += 4
        if request.include_circle:
            score += 3

        # Mobile optimization
        if request.optimize_for_mobile:
            score += 5

        # Add variation randomness
        score += (variation * 2) - 2

        # Cap at realistic maximum
        return min(score, 95.0)


# Singleton instance
thumbnail_image_service = ThumbnailImageService()
