from typing import List, Dict, Optional
from app.services.ai_service import ai_service
from app.schemas.schemas import (
    ScriptGenerationRequest,
    TitleGenerationRequest,
    ThumbnailIdeaRequest,
    SocialCaptionRequest,
    SEOOptimizationRequest,
    SEOOptimizationResponse
)
import json


class CreatorToolsService:
    """Service for all creator-focused AI tools"""
    
    async def generate_script(
        self,
        request: ScriptGenerationRequest,
        persona: Optional[Dict] = None
    ) -> str:
        """Generate video script"""
        
        system_prompt = """You are an expert scriptwriter for digital content creators.
You create engaging, well-paced video scripts that are designed to be spoken naturally.
You understand video storytelling, audience retention techniques, and production requirements.
Your scripts are actionable, specific, and ready for recording without modification."""
        
        # Calculate timing breakdown
        total_seconds = request.duration_minutes * 60
        hook_seconds = min(15, total_seconds * 0.1)  # ~10% for hook, max 15s
        outro_seconds = min(20, total_seconds * 0.08)  # ~8% for outro
        content_seconds = total_seconds - hook_seconds - outro_seconds
        
        # Determine script flow structure
        flow_structure = request.script_flow or "Hook → Introduction → Main Content → Conclusion → Call-to-Action"
        
        # Build persona context string
        persona_context = ""
        if persona:
            if persona.get('type') == 'audience':
                persona_context = f"""
                
AUDIENCE PERSONA INSIGHTS (use this to tailor language, examples, and approach):
- Demographics: {persona.get('age_range', 'General')}, {persona.get('occupation', 'various backgrounds')}
- Interests: {persona.get('interests', 'general topics')}
- Pain Points: {persona.get('pain_points', 'common challenges')}
- Goals: {persona.get('goals', 'personal growth')}
- Language Level: {persona.get('language_level', 'intermediate')}
- Content Preferences: {persona.get('preferred_content', 'varied formats')}
"""
            elif persona.get('type') == 'script':
                persona_context = f"""
                
SCRIPT STYLE GUIDELINES (apply these characteristics throughout):
- Style: {persona.get('style', 'conversational')}
- Tone: {persona.get('tone', 'friendly')}
- Pacing: {persona.get('pacing', 'moderate')}
- Hook Style: {persona.get('hook_style', 'curiosity-driven')}
- Vocabulary Level: {persona.get('vocabulary_level', 'accessible')}
"""
        
        # Build key points section
        key_points_section = ""
        if request.key_points and len(request.key_points) > 0:
            key_points_section = "\nKEY POINTS TO COVER (incorporate these naturally into the script flow):\n"
            for i, point in enumerate(request.key_points, 1):
                key_points_section += f"{i}. {point}\n"
        
        # Build comprehensive prompt
        prompt = f"""
GENERATE A VIDEO SCRIPT

=== VIDEO DETAILS ===
Topic: {request.topic}
Duration: {request.duration_minutes} minutes ({total_seconds} seconds total)
Target Audience: {request.target_audience or 'General audience'}
Tone: {request.tone}
Style: {request.style or 'Educational/Engaging'}
Flow Structure: {flow_structure}
{persona_context}{key_points_section}

=== TIMING BREAKDOWN ===
• Hook: 0:00 - 0:{int(hook_seconds):02d} ({int(hook_seconds)} seconds)
• Main Content: 0:{int(hook_seconds):02d} - {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d} ({int(content_seconds)} seconds)
• Outro/CTA: {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d} - {request.duration_minutes}:00 ({int(outro_seconds)} seconds)

=== CRITICAL INSTRUCTIONS ===

1. WRITE AN ACTUAL SCRIPT - Do NOT just list the structure or outline.
2. USE THE INPUTS AS GUIDANCE - The topic, audience, key points, flow, and style should SHAPE how you write the script, not be repeated as metadata.
3. WRITE WORD-FOR-WORD DIALOGUE - Every word should be ready to be spoken by the creator on camera.
4. MATCH THE SPECIFIED DURATION - Aim for approximately {request.duration_minutes * 150} words (150 words per minute speaking rate).
5. NATURAL LANGUAGE - Write conversationally, as the creator would actually speak. Use contractions, questions, and direct address.
6. INCORPORATE KEY POINTS SEAMLESSLY - Don't just list them; weave them naturally into the narrative.
7. FOLLOW THE FLOW - Structure your script according to the specified flow: {flow_structure}
8. MATCH THE TONE & STYLE - Write in a {request.tone} tone with a {request.style or 'engaging'} style throughout.

=== SCRIPT FORMAT ===

Use this format:

[HOOK - 0:00-0:{int(hook_seconds):02d}]
[Write the attention-grabbing opening. Make it compelling and relevant to {request.target_audience or 'the audience'}. Use the {request.tone} tone.]

[INTRODUCTION - 0:{int(hook_seconds):02d}-...]
[Introduce yourself if needed, preview what's coming, and establish credibility.]
[B-ROLL: Suggest relevant visual here if needed]

[MAIN CONTENT]
[Organize into clear sections based on the flow: {flow_structure}]
[Each section should have:
 - Clear transitions
 - Specific examples and details
 - Natural pacing breaks
 - Visual suggestions where relevant]

[Section 1: ...]
[Full dialogue here...]
[TEXT ON SCREEN: Key statistic or phrase]

[Section 2: ...]
[Full dialogue here...]
[B-ROLL: Relevant visual suggestion]

[Continue with more sections as needed to cover all key points...]

[CONCLUSION - {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d}-...]
[Summarize key takeaways, reinforce the main message.]

[OUTRO/CALL-TO-ACTION - ...]
[Strong call-to-action aligned with creator's goals, encourage engagement.]

=== PRODUCTION NOTES ===
- Mark timing transitions clearly
- Suggest B-ROLL visuals where they enhance storytelling
- Note TEXT ON SCREEN for important statistics, quotes, or emphasis
- Include pause markers [PAUSE] where natural dramatic pauses work
- Suggest GRAPHICS or ANIMATIONS where helpful
- Keep paragraphs short for teleprompter readability

Now create the complete, word-for-word script following these guidelines.
"""
        
        return await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.7,  # Slightly lower for more consistent structure
            max_tokens=4000,  # Increased for longer, detailed scripts
            system_prompt=system_prompt
        )
    
    async def generate_titles(
        self,
        request: TitleGenerationRequest,
        persona: Optional[Dict] = None
    ) -> List[str]:
        """Generate video titles optimized for CTR"""
        
        system_prompt = """You are an expert in creating viral video titles that maximize click-through rates.
Use proven techniques: curiosity gaps, numbers, power words, emotional triggers, and specificity."""
        
        prompt = f"""
Generate {request.count} compelling video titles for: {request.video_topic}

"""
        
        if request.keywords:
            prompt += f"Target Keywords: {', '.join(request.keywords)}\n"
        
        if request.optimize_ctr:
            prompt += """
CTR Optimization Techniques:
- Use power words (Ultimate, Secrets, Proven, Shocking)
- Include numbers and lists
- Create curiosity gaps
- Promise specific value
- Keep under 70 characters
- Use emotional triggers
- Add brackets with context [2024 Update]

"""
        
        prompt += """
Return ONLY a JSON array of title strings, no other text.
Example: ["Title 1", "Title 2", "Title 3"]
"""
        
        # Inject persona context
        prompt = ai_service.inject_persona_context(prompt, persona)
        
        response = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.9,
            max_tokens=500,
            system_prompt=system_prompt
        )
        
        # Parse JSON response
        try:
            titles = json.loads(response)
            return titles if isinstance(titles, list) else [response]
        except json.JSONDecodeError:
            # Fallback: split by newlines
            return [line.strip() for line in response.split('\n') if line.strip()]
    
    async def generate_thumbnail_ideas(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict[str, str]]:
        """Generate thumbnail design ideas"""
        
        system_prompt = """You are an expert in creating eye-catching YouTube thumbnail designs 
that drive clicks and views. Focus on visual impact, emotion, and clarity."""
        
        prompt = f"""
Generate {request.count} thumbnail design concepts for:
Title: {request.video_title}
Topic: {request.video_topic}

For each thumbnail concept, provide:
1. Main Visual Element (what's the focal point)
2. Text Overlay (short, punchy text)
3. Color Scheme (dominant colors and mood)
4. Facial Expression (if featuring a person)
5. Composition Style (close-up, split screen, etc.)

Best Practices:
- High contrast for readability
- Clear focal point
- Emotion-driven expressions
- Minimal text (3-5 words max)
- Bright, saturated colors
- Rule of thirds composition

Return as JSON array with objects containing: visual_element, text_overlay, color_scheme, expression, composition
Example: [{{"visual_element": "...", "text_overlay": "...", "color_scheme": "...", "expression": "...", "composition": "..."}}]
"""
        
        # Inject persona context
        prompt = ai_service.inject_persona_context(prompt, persona)
        
        response = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.8,
            max_tokens=1000,
            system_prompt=system_prompt
        )
        
        # Parse JSON response
        try:
            ideas = json.loads(response)
            return ideas if isinstance(ideas, list) else [{"description": response}]
        except json.JSONDecodeError:
            return [{"description": response}]
    
    async def generate_social_caption(
        self,
        request: SocialCaptionRequest,
        persona: Optional[Dict] = None
    ) -> str:
        """Generate social media caption"""
        
        platform_guidelines = {
            "youtube": "Detailed description, timestamps, links. No character limit.",
            "instagram": "Engaging caption, 2-3 paragraphs, strategic hashtags (5-10). Max 2,200 chars.",
            "twitter": "Concise and punchy. Max 280 characters. Use thread if needed.",
            "tiktok": "Short, trendy caption with relevant hashtags. Max 150 chars recommended.",
            "linkedin": "Professional tone, storytelling format. 1-3 paragraphs with insights."
        }
        
        system_prompt = f"""You are a social media expert specializing in {request.platform} content.
Create engaging captions that drive engagement and conversions."""
        
        prompt = f"""
Create a {request.platform} caption for:
{request.content_description}

Platform Guidelines: {platform_guidelines.get(request.platform, 'Standard social media best practices')}

Requirements:
- Include hashtags: {request.include_hashtags}
- Include emojis: {request.include_emojis}
- Optimize for engagement
- Include call-to-action

"""
        
        # Inject persona context
        prompt = ai_service.inject_persona_context(prompt, persona)
        
        return await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.8,
            max_tokens=800,
            system_prompt=system_prompt
        )
    
    async def optimize_seo(
        self,
        request: SEOOptimizationRequest,
        persona: Optional[Dict] = None
    ) -> SEOOptimizationResponse:
        """Optimize content for SEO"""
        
        system_prompt = """You are an SEO expert. Optimize content for search engines 
while maintaining readability and value for humans."""
        
        prompt = f"""
Optimize this content for SEO:

Original Content:
{request.content}

Target Keywords: {', '.join(request.target_keywords)}

Provide:
1. Optimized content (naturally integrate keywords)
2. SEO-optimized meta title (50-60 chars)
3. Meta description (150-160 chars)
4. Additional keyword suggestions
5. SEO score (0-100)

Return as JSON:
{{
    "optimized_content": "...",
    "meta_title": "...",
    "meta_description": "...",
    "suggested_keywords": ["...", "..."],
    "seo_score": 85
}}
"""
        
        # Inject persona context
        prompt = ai_service.inject_persona_context(prompt, persona)
        
        response = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.7,
            max_tokens=2000,
            system_prompt=system_prompt
        )
        
        # Parse JSON response
        try:
            data = json.loads(response)
            return SEOOptimizationResponse(**data)
        except (json.JSONDecodeError, Exception):
            # Fallback response
            return SEOOptimizationResponse(
                optimized_content=request.content,
                meta_title=request.content[:60],
                meta_description=request.content[:160],
                suggested_keywords=request.target_keywords,
                seo_score=70.0
            )


# Singleton instance
creator_tools_service = CreatorToolsService()
