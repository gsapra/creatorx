from typing import Optional, Dict, List
from openai import AsyncOpenAI
import google.auth
from google.cloud import aiplatform
import json
from groq import AsyncGroq
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class AIService:
    """Unified AI service supporting OpenAI, Google Vertex AI, and Groq"""
    
    def __init__(self):
        # Initialize OpenAI
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Initialize Groq
        if settings.GROQ_API_KEY:
            self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        else:
            self.groq_client = None
            
        # Initialize Vertex AI
        if settings.GOOGLE_VERTEX_PROJECT_ID:
            try:
                aiplatform.init(
                    project=settings.GOOGLE_VERTEX_PROJECT_ID,
                    location=settings.GOOGLE_VERTEX_LOCATION
                )
                self.vertex_available = True
            except Exception as e:
                logger.warning(f"Vertex AI initialization failed: {e}")
                self.vertex_available = False
        else:
            self.vertex_available = False
    
    async def generate(
        self,
        prompt: str,
        model: str = "vertex",
        temperature: float = 0.7,
        max_tokens: int = 5000,
        system_prompt: Optional[str] = None,
        response_format: Optional[Dict] = None
    ) -> str:
        """Generate text using specified AI model"""
        
        if model == "openai":
            return await self._generate_openai(prompt, temperature, max_tokens, system_prompt, response_format)
        elif model == "groq":
            return await self._generate_groq(prompt, temperature, max_tokens, system_prompt)
        elif model == "vertex":
            return await self._generate_vertex(prompt, temperature, max_tokens, system_prompt)
        else:
            raise ValueError(f"Unsupported model: {model}")
    
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
            
            # Add response format if provided (for structured outputs)
            if response_format:
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
                model="mixtral-8x7b-32768",
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
            from vertexai.preview.generative_models import GenerativeModel
            
            model = GenerativeModel("gemini-pro")
            
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
    
    def inject_persona_context(self, prompt: str, persona: Optional[Dict]) -> str:
        """Inject persona information into prompt"""
        if not persona:
            return prompt
        
        persona_context = f"""
Persona Context:
- Name: {persona.get('name')}
- Type: {persona.get('type')}
- Description: {persona.get('description', 'N/A')}
"""
        
        if persona.get('attributes'):
            persona_context += "\nAttributes:\n"
            for key, value in persona['attributes'].items():
                persona_context += f"- {key}: {value}\n"
        
        return f"{persona_context}\n\n{prompt}"


# Singleton instance
ai_service = AIService()
