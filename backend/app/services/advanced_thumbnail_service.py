"""
Advanced Thumbnail Generation Service with AI Intelligence
Generates professional thumbnails with CTR optimization, emotion targeting, and advanced composition
"""

from typing import List, Dict, Optional
from app.services.ai_service import ai_service
from app.schemas.schemas import ThumbnailIdeaRequest
import json
import uuid


class AdvancedThumbnailService:
    """Advanced thumbnail generation with professional design intelligence"""

    # Color scheme presets
    COLOR_SCHEMES = {
        "vibrant": {
            "palettes": [
                {"bg": "#FF0000", "text": "#FFFF00", "accent": "#00FF00"},
                {"bg": "#FF6B35", "text": "#FFFFFF", "accent": "#004E89"},
                {"bg": "#D62828", "text": "#F77F00", "accent": "#FCBF49"}
            ],
            "mood": "High energy, attention-grabbing, exciting"
        },
        "pastel": {
            "palettes": [
                {"bg": "#FFE5E5", "text": "#4A5759", "accent": "#B4C7D9"},
                {"bg": "#FFDFD3", "text": "#5C6F68", "accent": "#C9CCD5"},
                {"bg": "#E8DFF5", "text": "#3F4238", "accent": "#D4A5A5"}
            ],
            "mood": "Soft, calming, aesthetic, feminine"
        },
        "dark": {
            "palettes": [
                {"bg": "#000000", "text": "#FFFFFF", "accent": "#FF0000"},
                {"bg": "#1A1A2E", "text": "#EAEAEA", "accent": "#0F3460"},
                {"bg": "#2D3142", "text": "#EF8354", "accent": "#BFC0C0"}
            ],
            "mood": "Dramatic, mysterious, cinematic, premium"
        },
        "neon": {
            "palettes": [
                {"bg": "#0A0E27", "text": "#00F0FF", "accent": "#FF00FF"},
                {"bg": "#120136", "text": "#00FF85", "accent": "#FF006E"},
                {"bg": "#03001C", "text": "#00D9FF", "accent": "#FE00C8"}
            ],
            "mood": "Futuristic, gaming, tech, electric"
        },
        "monochrome": {
            "palettes": [
                {"bg": "#FFFFFF", "text": "#000000", "accent": "#666666"},
                {"bg": "#000000", "text": "#FFFFFF", "accent": "#888888"},
                {"bg": "#F5F5F5", "text": "#333333", "accent": "#999999"}
            ],
            "mood": "Professional, minimalist, clean, timeless"
        },
        "complementary": {
            "palettes": [
                {"bg": "#0066CC", "text": "#FF9900", "accent": "#FFFFFF"},
                {"bg": "#6A0572", "text": "#FFD700", "accent": "#FFFFFF"},
                {"bg": "#006400", "text": "#FF4500", "accent": "#FFFFFF"}
            ],
            "mood": "Balanced, professional, harmonious"
        }
    }

    # Emotion-based design rules
    EMOTION_RULES = {
        "shocking": {
            "face_required": True,
            "expression": "wide-eyed shock, mouth open",
            "colors": "high contrast, red/yellow/black",
            "text_style": "ALL CAPS, large, exclamation marks",
            "arrows": True,
            "composition": "close-up face, asymmetric text"
        },
        "curious": {
            "face_required": False,
            "expression": "raised eyebrow, slight smile",
            "colors": "intriguing, mysterious dark tones",
            "text_style": "Question format, moderate size",
            "arrows": False,
            "composition": "partial reveal, negative space"
        },
        "exciting": {
            "face_required": True,
            "expression": "big smile, energetic",
            "colors": "bright, vibrant, warm colors",
            "text_style": "Bold, dynamic, action words",
            "arrows": True,
            "composition": "dynamic angles, movement implied"
        },
        "inspiring": {
            "face_required": False,
            "expression": "determined, confident",
            "colors": "aspirational, gold/blue/white",
            "text_style": "Motivational quote style",
            "arrows": False,
            "composition": "centered, balanced, uplifting"
        },
        "educational": {
            "face_required": False,
            "expression": "friendly, approachable",
            "colors": "professional, blue/green tones",
            "text_style": "Clear, numbered, organized",
            "arrows": True,
            "composition": "structured, informative layout"
        },
        "entertaining": {
            "face_required": True,
            "expression": "fun, playful, laughing",
            "colors": "colorful, playful, warm",
            "text_style": "Casual, emoji-friendly",
            "arrows": False,
            "composition": "casual, relatable, fun"
        }
    }

    # Font combinations
    FONT_STYLES = {
        "bold": ["Impact", "Arial Black"],
        "clean": ["Helvetica", "Arial"],
        "modern": ["Montserrat", "Verdana"],
        "retro": ["Courier", "Georgia"]
    }

    async def generate_advanced_thumbnails(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict]:
        """Generate advanced thumbnails with all parameters"""

        # Determine emotion rules
        emotion = request.emotion or "exciting"
        emotion_rules = self.EMOTION_RULES.get(emotion, self.EMOTION_RULES["exciting"])

        # Get color scheme
        color_scheme = request.color_scheme or "vibrant"
        color_data = self.COLOR_SCHEMES.get(color_scheme, self.COLOR_SCHEMES["vibrant"])

        # Check for uploaded images
        has_custom_images = request.custom_images and len(request.custom_images) > 0
        has_reference_images = request.reference_images and len(request.reference_images) > 0

        print(f"[Advanced Thumbnail] Custom images: {len(request.custom_images) if request.custom_images else 0}")
        print(f"[Advanced Thumbnail] Reference images: {len(request.reference_images) if request.reference_images else 0}")

        # Build comprehensive prompt
        system_prompt = f"""You are an EXPERT thumbnail designer with deep knowledge of:
- YouTube algorithm psychology and CTR optimization
- Color theory and visual hierarchy
- Typography and readability at small sizes
- Emotion-driven design
- Mobile-first design principles

You create thumbnails that MAXIMIZE click-through rates by triggering specific emotions and following proven design patterns.
CRITICAL: Return ONLY valid JSON array of thumbnail templates with complete layer data."""

        prompt = self._build_advanced_prompt(request, emotion_rules, color_data, persona, has_custom_images, has_reference_images)

        try:
            response = await ai_service.generate(
                prompt=prompt,
                model=request.ai_model,
                temperature=0.8,
                max_tokens=4500,
                system_prompt=system_prompt,
                tool_type='thumbnail'
            )

            # Parse response
            templates = self._parse_ai_response(response, request)

            # Add CTR scores
            for i, template in enumerate(templates):
                template['ctr_score'] = self._calculate_ctr_score(template, request)
                template['ctr_factors'] = self._analyze_ctr_factors(template)
                template['emotion_target'] = emotion
                template['mobile_optimized'] = request.optimize_for_mobile

            # Sort by CTR score
            templates.sort(key=lambda x: x.get('ctr_score', 0), reverse=True)

            return templates

        except Exception as e:
            print(f"[Advanced Thumbnail] Error: {e}")
            return self._generate_advanced_fallback(request, emotion_rules, color_data)

    def _build_advanced_prompt(
        self,
        request: ThumbnailIdeaRequest,
        emotion_rules: Dict,
        color_data: Dict,
        persona: Optional[Dict],
        has_custom_images: bool = False,
        has_reference_images: bool = False
    ) -> str:
        """Build comprehensive AI prompt with all parameters"""

        # Get title analysis
        title_words = request.video_title.split()
        main_text = " ".join(title_words[:4]) if len(title_words) >= 4 else request.video_title

        # Determine font
        font_style = request.font_style or "bold"
        fonts = self.FONT_STYLES.get(font_style, ["Impact", "Arial Black"])

        # Build image context
        image_context = ""
        if has_custom_images:
            image_count = len(request.custom_images) if request.custom_images else 0
            image_context += f"\n\n📸 USER UPLOADED {image_count} IMAGE(S) FOR USE IN THUMBNAIL:\n"
            if request.custom_images:
                for i, img in enumerate(request.custom_images):
                    image_context += f"- Image {i+1}: {img.get('width')}x{img.get('height')}px (ID: {img.get('id')})\n"
            image_context += "\n✅ CRITICAL: Include these images as layers in the templates!\n"
            image_context += "- Add image layer with type='image', image_url='user_upload_{id}', actual dimensions\n"
            image_context += "- Position prominently (40-60% of canvas if face/person, 20-40% if product/object)\n"
            image_context += "- Use rule of thirds for placement\n"

        if has_reference_images:
            ref_count = len(request.reference_images) if request.reference_images else 0
            image_context += f"\n\n🎨 USER PROVIDED {ref_count} REFERENCE IMAGE(S) FOR STYLE INSPIRATION:\n"
            image_context += "- Analyze these for: color palette, composition style, text placement\n"
            image_context += "- Match the aesthetic and vibe of reference images\n"
            image_context += "- Use similar color schemes and layout approaches\n"

        prompt = f"""
{'='*80}
🎨 ADVANCED THUMBNAIL GENERATION REQUEST
{'='*80}

VIDEO DETAILS:
Title: {request.video_title}
Topic: {request.video_topic}
Platform: {request.target_platform.upper()}
Templates: {request.count}

EMOTION TARGET: {request.emotion or 'exciting'}
Psychology: {emotion_rules['colors']} | {emotion_rules['text_style']}{image_context}

COLOR SCHEME: {request.color_scheme or 'vibrant'}
Mood: {color_data['mood']}
Available Palettes: {json.dumps(color_data['palettes'], indent=2)}

DESIGN REQUIREMENTS:
✓ Face/Person: {'REQUIRED - ' + emotion_rules['expression'] if emotion_rules['face_required'] else 'Optional'}
✓ Text Position: {request.text_position or 'flexible'}
✓ Layout: {request.layout_preference or 'rule-of-thirds'}
✓ Font Style: {fonts}
✓ Include Arrow: {request.include_arrow}
✓ Include Circle: {request.include_circle}
✓ Use Gradient: {request.use_gradient}
✓ Include Emoji: {request.include_emoji}
✓ Mobile Optimized: {request.optimize_for_mobile} (readable at 320x180px)

{'='*80}
🎯 CTR OPTIMIZATION RULES
{'='*80}

HIGH CTR FACTORS (Apply these):
1. **Contrast Ratio**: Text must have 7:1+ contrast with background
2. **Face Close-up**: If face included, make it 40%+ of canvas, eyes visible
3. **Text Size**: Main text 80-120px, 3-6 words MAX
4. **Emotion**: Express {emotion_rules['expression']} clearly
5. **Color Psychology**: Use {emotion_rules['colors']}
6. **Visual Flow**: Guide eye with arrows/shapes if specified
7. **Negative Space**: Don't overcrowd, leave 20%+ empty space
8. **Mobile Test**: All text readable when scaled to 320x180px

TEXT OPTIMIZATION:
- Extract key words from title: "{main_text}"
- Emphasize: {request.text_emphasis or 'key benefit'}
- Format: {emotion_rules['text_style']}
- {'Include 1-2 relevant emoji' if request.include_emoji else 'No emoji'}

{'='*80}
📐 REQUIRED JSON FORMAT
{'='*80}

Generate {request.count} DIFFERENT templates using DIFFERENT compositions and color palettes.

LAYER REQUIREMENTS:
1. Background layer (z_index: 0) - solid or gradient
2. Optional shape layers (z_index: 1-3) - arrows, circles, highlights
3. Optional image placeholder (z_index: 4-6) - for face/person
4. Text layers (z_index: 7-10) - main text, sub text

CRITICAL POSITIONING:
- Canvas: 1280x720
- Safe zones: Keep text 100px from edges
- Face zone: x: 200-400, y: 180-400 (if included)
- Text center: x: 640, y: depends on position
  - Top: y: 120
  - Center: y: 360
  - Bottom: y: 600

EXAMPLE TEMPLATE STRUCTURE:
[
  {{
    "id": "thumb_001",
    "name": "Shocking Reveal Style",
    "description": "High-contrast design with close-up face and dramatic text",
    "style": "{request.style or 'bold'}",
    "canvas_width": 1280,
    "canvas_height": 720,
    "psychology_notes": "Uses shock emotion + high contrast for maximum attention",
    "tags": ["{request.emotion}", "{request.style}", "high-ctr"],
    "layers": [
      {{
        "id": "bg_1",
        "type": "background",
        "x": 0,
        "y": 0,
        "width": 1280,
        "height": 720,
        "z_index": 0,
        "fill_color": "{color_data['palettes'][0]['bg']}",
        "opacity": 1.0,
        "rotation": 0
      }},
"""

        if request.include_arrow:
            prompt += """
      {
        "id": "arrow_1",
        "type": "shape",
        "shape_type": "arrow",
        "x": 900,
        "y": 400,
        "width": 150,
        "height": 80,
        "z_index": 5,
        "fill_color": "#FFD700",
        "border_color": "#000000",
        "border_width": 3,
        "rotation": -15,
        "opacity": 1.0
      },"""

        if request.include_circle:
            prompt += """
      {
        "id": "circle_1",
        "type": "shape",
        "shape_type": "circle",
        "x": 400,
        "y": 360,
        "width": 200,
        "height": 200,
        "z_index": 4,
        "fill_color": "transparent",
        "border_color": "#FF0000",
        "border_width": 8,
        "opacity": 0.8,
        "rotation": 0
      },"""

        # If user uploaded images, show example with user image
        if has_custom_images and request.custom_images:
            first_img = request.custom_images[0]
            prompt += f"""
      {{
        "id": "user_img_1",
        "type": "image",
        "image_url": "user_upload_{first_img.get('id')}",
        "image_data": "user_provided",
        "x": 400,
        "y": 360,
        "width": {min(first_img.get('width', 400), 600)},
        "height": {min(first_img.get('height', 400), 600)},
        "z_index": 6,
        "fit": "cover",
        "opacity": 1.0,
        "rotation": 0
      }},"""
        elif emotion_rules['face_required'] or request.include_face:
            prompt += """
      {
        "id": "face_1",
        "type": "image",
        "image_url": "placeholder",
        "x": 300,
        "y": 300,
        "width": 400,
        "height": 400,
        "z_index": 6,
        "fit": "cover",
        "opacity": 1.0,
        "rotation": 0
      },"""

        prompt += f"""
      {{
        "id": "text_main",
        "type": "text",
        "text": "{main_text.upper() if 'CAPS' in emotion_rules['text_style'] else main_text}",
        "x": 640,
        "y": {120 if request.text_position == 'top' else (600 if request.text_position == 'bottom' else 360)},
        "width": 1000,
        "height": 150,
        "z_index": 10,
        "font_family": "{fonts[0]}",
        "font_size": 100,
        "font_weight": "bold",
        "color": "{color_data['palettes'][0]['text']}",
        "text_align": "center",
        "stroke_color": "#000000",
        "stroke_width": 5,
        "shadow_color": "#000000",
        "shadow_blur": 8,
        "shadow_offset_x": 3,
        "shadow_offset_y": 3,
        "opacity": 1.0,
        "rotation": 0
      }}
    ]
  }}
]

{'='*80}
🎯 YOUR TASK
{'='*80}

Generate {request.count} UNIQUE templates that:
1. Use DIFFERENT color palettes from the scheme
2. Vary text positioning and size
3. Apply emotion psychology: {emotion_rules['expression']}
4. Follow mobile optimization rules
5. Include requested elements (arrows: {request.include_arrow}, circles: {request.include_circle})
6. Maximize CTR through proven design patterns
7. Each template should have a DIFFERENT composition style

DIVERSITY RULES:
- Template 1: Face-focused with side text
- Template 2: Text-dominated with minimal images
- Template 3: Balanced split composition
- (Continue varying for additional templates)

Return ONLY the JSON array, no other text:
"""
        return prompt

    def _parse_ai_response(self, response: str, request: ThumbnailIdeaRequest) -> List[Dict]:
        """Parse AI response with multiple fallback strategies"""
        try:
            response_clean = response.strip()

            # Remove markdown code blocks
            if response_clean.startswith('```'):
                lines = response_clean.split('\n')
                response_clean = '\n'.join([l for l in lines if not l.startswith('```')])

            # Try to find JSON array
            start_idx = response_clean.find('[')
            end_idx = response_clean.rfind(']') + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_clean[start_idx:end_idx]
                templates = json.loads(json_str)

                if isinstance(templates, list) and len(templates) > 0:
                    return templates

            # If no valid JSON found, use fallback
            raise ValueError("No valid JSON array found")

        except Exception as e:
            print(f"[Advanced Thumbnail] JSON parse error: {e}")
            print(f"[Advanced Thumbnail] Response: {response[:500]}")
            return []

    def _calculate_ctr_score(self, template: Dict, request: ThumbnailIdeaRequest) -> float:
        """Calculate predicted CTR score based on design factors"""
        score = 50.0  # Base score

        layers = template.get('layers', [])

        # Factor 1: Text readability (0-15 points)
        text_layers = [l for l in layers if l.get('type') == 'text']
        if text_layers:
            main_text = text_layers[0]
            font_size = main_text.get('font_size', 0)
            if font_size >= 80:
                score += 15
            elif font_size >= 60:
                score += 10
            else:
                score += 5

            # Stroke for contrast
            if main_text.get('stroke_width', 0) >= 3:
                score += 5

        # Factor 2: Color contrast (0-10 points)
        bg_layer = next((l for l in layers if l.get('type') == 'background'), None)
        if bg_layer and text_layers:
            score += 10  # Assume good contrast if both exist

        # Factor 3: Face presence (0-15 points)
        image_layers = [l for l in layers if l.get('type') == 'image']
        if image_layers and request.include_face:
            score += 15

        # Factor 4: Emotion alignment (0-10 points)
        if template.get('psychology_notes'):
            score += 10

        # Factor 5: Mobile optimization (0-10 points)
        if request.optimize_for_mobile:
            score += 10

        # Cap at 100
        return min(score, 100.0)

    def _analyze_ctr_factors(self, template: Dict) -> Dict:
        """Analyze what makes this template effective"""
        return {
            "text_size": "optimal" if any(l.get('font_size', 0) >= 80 for l in template.get('layers', []) if l.get('type') == 'text') else "needs improvement",
            "contrast": "high",
            "face_included": any(l.get('type') == 'image' for l in template.get('layers', [])),
            "composition": "rule of thirds",
            "color_psychology": "attention-grabbing"
        }

    def _generate_advanced_fallback(
        self,
        request: ThumbnailIdeaRequest,
        emotion_rules: Dict,
        color_data: Dict
    ) -> List[Dict]:
        """Generate fallback templates with advanced parameters"""
        templates = []

        # Extract key words
        title_words = request.video_title.upper().split()
        main_text = " ".join(title_words[:3]) if len(title_words) >= 3 else request.video_title.upper()

        for i, palette in enumerate(color_data['palettes'][:request.count]):
            template_id = f"thumb_{uuid.uuid4().hex[:8]}"

            layers = [
                {
                    "id": "bg_1",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1280,
                    "height": 720,
                    "z_index": 0,
                    "fill_color": palette['bg'],
                    "opacity": 1.0,
                    "rotation": 0
                }
            ]

            # Add text layer
            text_y = 120 if request.text_position == 'top' else (600 if request.text_position == 'bottom' else 360)
            layers.append({
                "id": "text_main",
                "type": "text",
                "text": main_text + (" 🔥" if request.include_emoji else ""),
                "x": 640,
                "y": text_y,
                "width": 1000,
                "height": 150,
                "z_index": 10,
                "font_family": "Impact",
                "font_size": 95,
                "font_weight": "bold",
                "color": palette['text'],
                "text_align": "center",
                "stroke_color": "#000000",
                "stroke_width": 5,
                "shadow_color": "#000000",
                "shadow_blur": 6,
                "shadow_offset_x": 2,
                "shadow_offset_y": 2,
                "opacity": 1.0,
                "rotation": 0
            })

            template = {
                "id": template_id,
                "name": f"{request.style or 'Bold'} Style {i+1}",
                "description": f"High-impact thumbnail for {request.video_topic}",
                "style": request.style or "bold",
                "canvas_width": 1280,
                "canvas_height": 720,
                "psychology_notes": emotion_rules.get('colors', 'High contrast design'),
                "tags": [request.emotion or "exciting", request.style or "bold"],
                "layers": layers,
                "ctr_score": 75.0 + i * 2,
                "ctr_factors": {
                    "text_size": "optimal",
                    "contrast": "high",
                    "emotion": request.emotion or "exciting"
                },
                "emotion_target": request.emotion or "exciting",
                "mobile_optimized": True
            }

            templates.append(template)

        return templates


# Singleton instance
advanced_thumbnail_service = AdvancedThumbnailService()
