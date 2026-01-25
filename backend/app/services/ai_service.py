from typing import Optional, Dict, List
from openai import AsyncOpenAI
import google.auth
from google.cloud import aiplatform
from google.oauth2 import service_account
import json
from groq import AsyncGroq
from app.core.config import settings
import logging
import asyncio
from functools import wraps
import os

logger = logging.getLogger(__name__)

# Tool-specific parameter optimization for best results per content type
TOOL_CONFIGS = {
    'script': {
        'temperature': 0.7,
        'max_tokens': 4000,
        'top_p': 0.9,
        'description': 'Balanced creativity with structure for video scripts'
    },
    'title': {
        'temperature': 0.85,
        'max_tokens': 300,
        'top_p': 0.95,
        'description': 'High creativity for catchy, CTR-optimized titles'
    },
    'caption': {
        'temperature': 0.8,
        'max_tokens': 500,
        'top_p': 0.9,
        'description': 'Creative yet platform-appropriate social captions'
    },
    'thumbnail': {
        'temperature': 0.8,
        'max_tokens': 1000,
        'top_p': 0.9,
        'description': 'Creative visual concepts with structured output'
    },
    'seo': {
        'temperature': 0.7,
        'max_tokens': 2000,
        'top_p': 0.85,
        'description': 'Precise, keyword-focused SEO optimization'
    },
    'default': {
        'temperature': 0.7,
        'max_tokens': 2000,
        'top_p': 0.9,
        'description': 'Balanced default settings'
    }
}


class AIService:
    """Unified AI service supporting OpenAI, Google Vertex AI, and Groq with retry logic and optimization"""

    def __init__(self):
        # Initialize OpenAI
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # Initialize Groq
        if settings.GROQ_API_KEY:
            self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        else:
            self.groq_client = None

        # Initialize Vertex AI
        self.vertex_credentials = None
        if settings.GOOGLE_VERTEX_PROJECT_ID:
            try:
                # Set up credentials from JSON file if GOOGLE_APPLICATION_CREDENTIALS is set
                if settings.GOOGLE_APPLICATION_CREDENTIALS:
                    creds_path = settings.GOOGLE_APPLICATION_CREDENTIALS
                    if os.path.exists(creds_path):
                        self.vertex_credentials = service_account.Credentials.from_service_account_file(creds_path)
                        logger.info(f"Loaded Vertex AI credentials from: {creds_path}")
                    else:
                        logger.warning(f"Credentials file not found at: {creds_path}")

                # Initialize Vertex AI with explicit credentials
                import vertexai
                vertexai.init(
                    project=settings.GOOGLE_VERTEX_PROJECT_ID,
                    location=settings.GOOGLE_VERTEX_LOCATION,
                    credentials=self.vertex_credentials
                )
                self.vertex_available = True
                logger.info(f"Vertex AI initialized successfully for project: {settings.GOOGLE_VERTEX_PROJECT_ID}")
            except Exception as e:
                logger.error(f"Vertex AI initialization failed: {e}")
                self.vertex_available = False
        else:
            self.vertex_available = False

    def get_tool_config(self, tool_type: str) -> Dict:
        """Get optimized parameters for specific content generation tool"""
        return TOOL_CONFIGS.get(tool_type, TOOL_CONFIGS['default'])

    async def _retry_with_backoff(self, func, max_retries: int = 3, initial_delay: float = 1.0):
        """Retry function with exponential backoff"""
        for attempt in range(max_retries):
            try:
                return await func()
            except Exception as e:
                if attempt == max_retries - 1:
                    # Last attempt, raise the error
                    raise

                # Calculate exponential backoff delay
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)

        raise Exception("Max retries exceeded")
    
    async def generate(
        self,
        prompt: str,
        model: str = "vertex",
        temperature: float = 0.7,
        max_tokens: int = 5000,
        system_prompt: Optional[str] = None,
        response_format: Optional[Dict] = None,
        tool_type: Optional[str] = None,
        use_retry: bool = True
    ) -> str:
        """
        Generate text using specified AI model with automatic retry logic

        Args:
            prompt: The main prompt text
            model: AI model to use (openai, vertex, groq)
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt for context
            response_format: Optional format specification (OpenAI structured outputs)
            tool_type: Optional tool type for parameter optimization (script, title, caption, thumbnail, seo)
            use_retry: Whether to use retry logic with exponential backoff

        Returns:
            Generated text content
        """

        # Apply tool-specific optimizations if tool_type provided
        if tool_type:
            tool_config = self.get_tool_config(tool_type)
            temperature = tool_config['temperature']
            max_tokens = tool_config['max_tokens']
            logger.info(f"Using optimized config for {tool_type}: temp={temperature}, max_tokens={max_tokens}")

        async def _generate():
            if model == "openai":
                return await self._generate_openai(prompt, temperature, max_tokens, system_prompt, response_format)
            elif model == "groq":
                return await self._generate_groq(prompt, temperature, max_tokens, system_prompt)
            elif model == "vertex":
                return await self._generate_vertex(prompt, temperature, max_tokens, system_prompt)
            else:
                raise ValueError(f"Unsupported model: {model}")

        if use_retry:
            try:
                return await self._retry_with_backoff(_generate)
            except Exception as e:
                # User-friendly error message
                error_msg = self._format_user_error(e, model)
                logger.error(f"Generation failed after retries: {error_msg}")
                raise Exception(error_msg)
        else:
            return await _generate()

    def _format_user_error(self, error: Exception, model: str) -> str:
        """Convert technical errors to user-friendly messages"""
        error_str = str(error).lower()

        if "rate limit" in error_str or "quota" in error_str:
            return f"The AI service is currently experiencing high demand. Please try again in a moment."
        elif "authentication" in error_str or "api key" in error_str:
            return f"AI service authentication issue. Please contact support."
        elif "timeout" in error_str:
            return f"Request timed out. Please try again with a shorter prompt."
        elif "invalid" in error_str or "bad request" in error_str:
            return f"Invalid request format. Please check your inputs and try again."
        else:
            return f"AI generation failed: {str(error)}"
    
    async def _generate_openai(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        response_format: Optional[Dict] = None
    ) -> str:
        """Generate using OpenAI GPT-4"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            # Build request parameters
            request_params = {
                "model": "gpt-4-turbo-preview",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }

            # Add response format if provided (for structured outputs like JSON)
            if response_format:
                if response_format.get("type") == "json":
                    request_params["response_format"] = {"type": "json_object"}
                else:
                    request_params["response_format"] = response_format
            
            response = await self.openai_client.chat.completions.create(**request_params)
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise
    
    async def _generate_groq(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str]
    ) -> str:
        """Generate using Groq (fast open-source models)"""
        if not self.groq_client:
            raise ValueError("Groq API key not configured")
        
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = await self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise
    
    async def _generate_vertex(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str]
    ) -> str:
        """Generate using Google Vertex AI"""
        if not self.vertex_available:
            raise ValueError("Vertex AI not configured")

        try:
            import vertexai
            from vertexai.preview.generative_models import GenerativeModel

            # Try gemini-1.5-flash-001 which should be available in most projects
            model = GenerativeModel("gemini-2.5-pro")

            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"

            response = await model.generate_content_async(
                full_prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                }
            )

            return response.text
        except Exception as e:
            logger.error(f"Vertex AI generation failed: {e}")
            raise
    
    def inject_persona_context(self, prompt: str, persona: Optional[Dict], tool_type: Optional[str] = None) -> str:
        """
        Inject comprehensive persona information into prompt with tool-specific guidance

        Args:
            prompt: Original prompt text
            persona: Persona dictionary with attributes
            tool_type: Type of content being generated for context-aware injection

        Returns:
            Enhanced prompt with persona context
        """
        if not persona:
            return prompt

        persona_type = persona.get('type', 'unknown')

        # Build comprehensive persona context
        persona_context = f"""
=== PERSONA CONTEXT (CRITICAL - MUST FOLLOW) ===
Persona Name: {persona.get('name')}
Persona Type: {persona_type}
Description: {persona.get('description', 'N/A')}
"""

        # Add type-specific attributes with full details
        if persona.get('attributes'):
            attributes = persona['attributes']

            if persona_type == 'audience':
                persona_context += self._build_audience_context(attributes)
            elif persona_type == 'script':
                persona_context += self._build_script_context(attributes)
            elif persona_type == 'brand_voice':
                persona_context += self._build_brand_voice_context(attributes)
            elif persona_type == 'character':
                persona_context += self._build_character_context(attributes)
            else:
                # Generic attribute listing
                persona_context += "\nAttributes:\n"
                for key, value in attributes.items():
                    if value:
                        persona_context += f"- {key}: {value}\n"

        # Add tool-specific instructions
        if tool_type:
            persona_context += self._get_persona_tool_guidance(persona_type, tool_type)

        persona_context += "=== END PERSONA CONTEXT ===\n\n"

        return f"{persona_context}{prompt}"

    def _build_audience_context(self, attrs: Dict) -> str:
        """Build detailed audience persona context"""
        context = "\n--- Target Audience Details ---\n"
        if attrs.get('age_range'):
            context += f"Age Range: {attrs['age_range']}\n"
        if attrs.get('interests'):
            context += f"Interests: {attrs['interests']}\n"
        if attrs.get('pain_points'):
            context += f"Pain Points: {attrs['pain_points']}\n"
        if attrs.get('goals'):
            context += f"Goals: {attrs['goals']}\n"
        if attrs.get('language_level'):
            context += f"Language Level: {attrs['language_level']}\n"
        if attrs.get('platform_preferences'):
            context += f"Platform Preferences: {attrs['platform_preferences']}\n"
        return context

    def _build_script_context(self, attrs: Dict) -> str:
        """Build detailed script persona context"""
        context = "\n--- Script Style Requirements ---\n"
        if attrs.get('pacing'):
            context += f"Pacing: {attrs['pacing']}\n"
        if attrs.get('tone'):
            context += f"Tone: {attrs['tone']}\n"
        if attrs.get('structure'):
            context += f"Structure: {attrs['structure']}\n"
        if attrs.get('hook_style'):
            context += f"Hook Style: {attrs['hook_style']}\n"
        if attrs.get('cta_approach'):
            context += f"CTA Approach: {attrs['cta_approach']}\n"
        return context

    def _build_brand_voice_context(self, attrs: Dict) -> str:
        """Build detailed brand voice persona context"""
        context = "\n--- Brand Voice Guidelines ---\n"
        if attrs.get('tone'):
            context += f"Tone: {attrs['tone']}\n"
        if attrs.get('vocabulary'):
            context += f"Vocabulary: {attrs['vocabulary']}\n"
        if attrs.get('formality'):
            context += f"Formality Level: {attrs['formality']}\n"
        if attrs.get('values'):
            context += f"Core Values: {attrs['values']}\n"
        if attrs.get('avoid'):
            context += f"Avoid: {attrs['avoid']}\n"
        return context

    def _build_character_context(self, attrs: Dict) -> str:
        """Build detailed character persona context"""
        context = "\n--- Character Profile ---\n"
        if attrs.get('personality'):
            context += f"Personality: {attrs['personality']}\n"
        if attrs.get('speech_pattern'):
            context += f"Speech Pattern: {attrs['speech_pattern']}\n"
        if attrs.get('backstory'):
            context += f"Backstory: {attrs['backstory']}\n"
        if attrs.get('catchphrase'):
            context += f"Catchphrase: {attrs['catchphrase']}\n"
        return context

    async def generate_image(
        self,
        prompt: str,
        size: str = "1792x1024",
        quality: str = "hd",
        style: str = "vivid",
        n: int = 1
    ) -> List[str]:
        """
        Generate images using DALL-E 3

        Args:
            prompt: Detailed image generation prompt
            size: Image size (1024x1024, 1792x1024, 1024x1792)
            quality: Image quality (standard or hd)
            style: Style preset (vivid or natural)
            n: Number of images to generate (1-10)

        Returns:
            List of image URLs
        """
        try:
            logger.info(f"Generating {n} image(s) with DALL-E 3: {prompt[:100]}...")

            response = await self.openai_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                style=style,
                n=1  # DALL-E 3 only supports n=1
            )

            image_urls = [img.url for img in response.data]
            logger.info(f"Successfully generated {len(image_urls)} image(s)")
            return image_urls

        except Exception as e:
            logger.error(f"DALL-E image generation failed: {e}")
            raise Exception(f"Image generation failed: {str(e)}")

    async def generate_multiple_images(
        self,
        prompts: List[str],
        size: str = "1792x1024",
        quality: str = "hd",
        style: str = "vivid"
    ) -> List[str]:
        """
        Generate multiple images from a list of prompts

        Args:
            prompts: List of image generation prompts
            size: Image size for all images
            quality: Image quality
            style: Style preset

        Returns:
            List of image URLs (one per prompt)
        """
        import asyncio

        tasks = [
            self.generate_image(prompt, size, quality, style, n=1)
            for prompt in prompts
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten results and filter out errors
        image_urls = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Image generation failed: {result}")
            elif isinstance(result, list):
                image_urls.extend(result)

        return image_urls

    async def generate_image_with_base(
        self,
        prompt: str,
        base_image_data: str,
        model: str = "vertex",
        size: str = "1792x1024"
    ) -> str:
        """
        Generate image based on uploaded base image (image-to-image)

        This is ideal for thumbnails where users upload their own photo/product
        and want it incorporated into the design.

        Args:
            prompt: Description of desired thumbnail design
            base_image_data: Base64 encoded image data
            model: AI model to use (vertex for Imagen, dalle for DALL-E edit)
            size: Output image size

        Returns:
            Generated image URL or base64 data
        """
        if model == "vertex" and self.vertex_available:
            return await self._generate_with_vertex_imagen(prompt, base_image_data)
        elif model == "dalle":
            return await self._generate_with_dalle_edit(prompt, base_image_data)
        else:
            raise Exception(f"Image-to-image generation not supported for model: {model}")

    async def _generate_with_vertex_imagen(
        self,
        prompt: str,
        base_image_data: str
    ) -> str:
        """
        Generate image using Google Vertex AI Imagen with base image

        Imagen supports image-to-image generation which can incorporate
        uploaded images into the design.
        """
        try:
            from vertexai.preview.vision_models import ImageGenerationModel, Image
            import base64
            import io
            from PIL import Image as PILImage

            logger.info(f"Generating image with Vertex Imagen using base image")

            # Load the image generation model
            model = ImageGenerationModel.from_pretrained("imagegeneration@006")

            # Decode base64 image
            if base_image_data.startswith('data:'):
                base_image_data = base_image_data.split(',')[1]

            image_bytes = base64.b64decode(base_image_data)
            base_image = Image(image_bytes=image_bytes)

            # Generate with base image reference
            # Imagen can use the base image as a starting point
            response = model.edit_image(
                base_image=base_image,
                prompt=prompt,
                number_of_images=1,
                guidance_scale=15,  # Higher = more adherence to prompt
                edit_mode="inpainting-insert"  # Insert new elements while keeping base
            )

            # Get the generated image
            if response and len(response.images) > 0:
                generated_image = response.images[0]

                # Convert to base64 for frontend
                img_byte_arr = io.BytesIO()
                generated_image._pil_image.save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                base64_encoded = base64.b64encode(img_byte_arr).decode('utf-8')

                logger.info("Successfully generated image with Vertex Imagen")
                return f"data:image/png;base64,{base64_encoded}"
            else:
                raise Exception("No images generated")

        except Exception as e:
            logger.error(f"Vertex Imagen generation failed: {e}")
            raise Exception(f"Vertex Imagen generation failed: {str(e)}")

    async def _generate_with_dalle_edit(
        self,
        prompt: str,
        base_image_data: str
    ) -> str:
        """
        Generate image using DALL-E 2 edit API

        Note: DALL-E 3 doesn't support editing, only DALL-E 2 does
        """
        try:
            import base64
            import io
            from PIL import Image as PILImage

            logger.info(f"Generating image with DALL-E 2 edit API")

            # Decode base64 image
            if base_image_data.startswith('data:'):
                base_image_data = base_image_data.split(',')[1]

            image_bytes = base64.b64decode(base_image_data)
            image = PILImage.open(io.BytesIO(image_bytes))

            # Convert to RGBA if not already (required by DALL-E)
            if image.mode != 'RGBA':
                image = image.convert('RGBA')

            # Resize to 1024x1024 (DALL-E 2 requirement)
            image = image.resize((1024, 1024))

            # Save to bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)

            # Create variation using DALL-E 2
            response = await self.openai_client.images.create_variation(
                image=img_byte_arr,
                n=1,
                size="1024x1024"
            )

            image_url = response.data[0].url
            logger.info("Successfully generated image with DALL-E 2 edit")
            return image_url

        except Exception as e:
            logger.error(f"DALL-E edit generation failed: {e}")
            raise Exception(f"DALL-E edit generation failed: {str(e)}")

    def _get_persona_tool_guidance(self, persona_type: str, tool_type: str) -> str:
        """Get specific guidance for how to apply persona to this tool"""
        guidance = "\n--- Application Guidance ---\n"

        if tool_type == "script" and persona_type == "audience":
            guidance += "Tailor language complexity, examples, and pacing to this audience's level and interests.\n"
        elif tool_type == "title" and persona_type == "audience":
            guidance += "Use keywords and emotional triggers that resonate with this audience's pain points and goals.\n"
        elif tool_type == "caption" and persona_type == "brand_voice":
            guidance += "Match the brand's tone, vocabulary, and values in every sentence.\n"
        elif tool_type == "script" and persona_type == "script":
            guidance += "Follow the specified pacing, structure, and hook style exactly.\n"

        return guidance

    def parse_json_with_validation(
        self,
        response: str,
        schema: Optional[Dict] = None,
        fallback: Optional[any] = None
    ) -> any:
        """
        Parse JSON response with validation, error recovery, and helpful fallback

        Args:
            response: Raw AI response that should contain JSON
            schema: Optional JSON schema for validation
            fallback: Fallback value if parsing fails completely

        Returns:
            Parsed and validated JSON data, or fallback
        """
        try:
            # Step 1: Try direct JSON parsing
            data = json.loads(response)

            # Step 2: Validate against schema if provided
            if schema:
                self._validate_json_schema(data, schema)

            return data

        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}. Attempting recovery...")

            # Step 3: Try to extract JSON from markdown code blocks
            extracted = self._extract_json_from_markdown(response)
            if extracted:
                try:
                    data = json.loads(extracted)
                    if schema:
                        self._validate_json_schema(data, schema)
                    return data
                except json.JSONDecodeError:
                    pass

            # Step 4: Try to fix common JSON errors
            fixed = self._fix_common_json_errors(response)
            if fixed:
                try:
                    data = json.loads(fixed)
                    if schema:
                        self._validate_json_schema(data, schema)
                    return data
                except json.JSONDecodeError:
                    pass

            # Step 5: All recovery attempts failed, use fallback
            logger.error(f"All JSON parsing attempts failed. Using fallback. Original response: {response[:200]}")
            return fallback if fallback is not None else {"error": "JSON parsing failed", "raw": response[:500]}

    def _extract_json_from_markdown(self, text: str) -> Optional[str]:
        """Extract JSON from markdown code blocks"""
        import re

        # Pattern 1: ```json ... ```
        pattern1 = r'```json\s*\n(.*?)\n```'
        match = re.search(pattern1, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Pattern 2: ``` ... ``` (any code block)
        pattern2 = r'```\s*\n(.*?)\n```'
        match = re.search(pattern2, text, re.DOTALL)
        if match:
            content = match.group(1).strip()
            # Check if it looks like JSON
            if content.startswith('{') or content.startswith('['):
                return content

        # Pattern 3: JSON between curly braces (extract largest valid-looking JSON)
        if '{' in text and '}' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            return text[start:end]

        if '[' in text and ']' in text:
            start = text.find('[')
            end = text.rfind(']') + 1
            return text[start:end]

        return None

    def _fix_common_json_errors(self, text: str) -> Optional[str]:
        """Attempt to fix common JSON formatting errors"""
        try:
            # Remove any leading/trailing whitespace
            text = text.strip()

            # Fix single quotes to double quotes (common AI mistake)
            # Be careful not to break strings that contain apostrophes
            text = text.replace("'", '"')

            # Fix trailing commas before closing brackets (invalid in JSON)
            import re
            text = re.sub(r',\s*}', '}', text)
            text = re.sub(r',\s*]', ']', text)

            # Fix missing commas between array elements
            text = re.sub(r'"\s*\n\s*"', '",\n"', text)

            # Remove comments (not valid in JSON)
            text = re.sub(r'//.*\n', '\n', text)
            text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)

            return text
        except Exception as e:
            logger.warning(f"Error while fixing JSON: {e}")
            return None

    def _validate_json_schema(self, data: any, schema: Dict) -> bool:
        """
        Basic JSON schema validation

        Args:
            data: Parsed JSON data
            schema: Schema definition with expected fields and types

        Returns:
            True if valid

        Raises:
            ValueError if validation fails
        """
        if not isinstance(schema, dict):
            return True

        # Check required fields
        required_fields = schema.get('required', [])
        if isinstance(data, dict):
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Required field '{field}' missing from JSON response")

        # Check field types if specified
        field_types = schema.get('types', {})
        if isinstance(data, dict):
            for field, expected_type in field_types.items():
                if field in data:
                    actual_value = data[field]
                    if expected_type == 'string' and not isinstance(actual_value, str):
                        raise ValueError(f"Field '{field}' should be string, got {type(actual_value)}")
                    elif expected_type == 'number' and not isinstance(actual_value, (int, float)):
                        raise ValueError(f"Field '{field}' should be number, got {type(actual_value)}")
                    elif expected_type == 'array' and not isinstance(actual_value, list):
                        raise ValueError(f"Field '{field}' should be array, got {type(actual_value)}")
                    elif expected_type == 'object' and not isinstance(actual_value, dict):
                        raise ValueError(f"Field '{field}' should be object, got {type(actual_value)}")

        return True

    def validate_output_constraints(
        self,
        output: str,
        constraints: Dict
    ) -> tuple[bool, List[str]]:
        """
        Validate output meets specified constraints

        Args:
            output: Generated text output
            constraints: Dictionary of constraints to check
                - max_length: Maximum character count
                - min_length: Minimum character count
                - required_keywords: List of keywords that must appear
                - forbidden_keywords: List of keywords that must NOT appear

        Returns:
            Tuple of (is_valid, list_of_violations)
        """
        violations = []

        # Check length constraints
        output_length = len(output)
        if 'max_length' in constraints and output_length > constraints['max_length']:
            violations.append(f"Output exceeds max length: {output_length} > {constraints['max_length']}")

        if 'min_length' in constraints and output_length < constraints['min_length']:
            violations.append(f"Output below min length: {output_length} < {constraints['min_length']}")

        # Check required keywords
        if 'required_keywords' in constraints:
            for keyword in constraints['required_keywords']:
                if keyword.lower() not in output.lower():
                    violations.append(f"Required keyword missing: '{keyword}'")

        # Check forbidden keywords
        if 'forbidden_keywords' in constraints:
            for keyword in constraints['forbidden_keywords']:
                if keyword.lower() in output.lower():
                    violations.append(f"Forbidden keyword found: '{keyword}'")

        # Check required fields for structured output
        if 'required_fields' in constraints and isinstance(output, dict):
            for field in constraints['required_fields']:
                if field not in output:
                    violations.append(f"Required field missing: '{field}'")

        is_valid = len(violations) == 0
        return is_valid, violations


# Singleton instance
ai_service = AIService()
