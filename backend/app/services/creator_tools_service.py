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
        
        system_prompt = """You are an EXPERT scriptwriter for digital content creators.
You create ENGAGING, WELL-PACED video scripts designed to be SPOKEN NATURALLY.
You DEEPLY understand video storytelling, audience retention, and production requirements.
You ALWAYS write COMPLETE, WORD-FOR-WORD scripts - NEVER outlines or summaries.
Your scripts are ACTIONABLE, SPECIFIC, and READY FOR RECORDING without modification."""
        
        # Calculate timing breakdown
        total_seconds = request.duration_minutes * 60
        hook_seconds = min(15, total_seconds * 0.1)  # ~10% for hook, max 15s
        outro_seconds = min(20, total_seconds * 0.08)  # ~8% for outro
        content_seconds = total_seconds - hook_seconds - outro_seconds
        
        # Determine script flow structure
        flow_structure = request.script_flow or "Hook → Introduction → Main Content → Conclusion → Call-to-Action"
        
        # Build persona context string (only if persona exists)
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
        
        # Build key points section (only if provided)
        key_points_section = ""
        if request.key_points and len(request.key_points) > 0:
            key_points_section = "\n=== MANDATORY KEY POINTS ===\nYOU MUST INCORPORATE ALL OF THESE POINTS NATURALLY INTO THE SCRIPT:\n"
            for i, point in enumerate(request.key_points, 1):
                key_points_section += f"{i}. {point}\n"
        
        # Build target audience section (only if provided)
        audience_section = ""
        if request.target_audience:
            audience_section = f"\nTarget Audience: {request.target_audience} (Tailor language, examples, and complexity for THIS specific audience)"
        
        # Build tone section (only if provided and no persona)
        tone_section = ""
        if request.tone and not persona:
            tone_section = f"\nTone: {request.tone} (Maintain this tone CONSISTENTLY throughout)"
        
        # Build style section (only if provided)
        style_section = ""
        if request.style:
            style_section = f"\nContent Style: {request.style} (Structure and deliver content in this format)"
        
        # Handle regeneration with emphasized feedback
        regeneration_section = ""
        if request.regenerate_feedback:
            # Extract the actual feedback (remove the prefix if it exists)
            actual_feedback = request.regenerate_feedback.replace('IMPORTANT USER FEEDBACK - MUST FOLLOW: ', '')
            
            regeneration_section = f"""
{'='*60}
🚨🚨🚨 CRITICAL REGENERATION INSTRUCTIONS 🚨🚨🚨
{'='*60}

THIS IS A REFINEMENT REQUEST. THE USER PROVIDED SPECIFIC FEEDBACK THAT YOU **MUST** FOLLOW.

USER'S FEEDBACK:
\"\"\"{actual_feedback}\"\"\"

⚠️  READ THE FEEDBACK ABOVE CAREFULLY AND IMPLEMENT IT EXACTLY ⚠️

This is NOT optional. The user wants SPECIFIC CHANGES based on their feedback.
DO NOT produce the same script. DO NOT ignore the feedback. APPLY IT COMPLETELY.

"""
            if request.previous_script:
                # Show a snippet of the previous script for context
                script_preview = request.previous_script[:800] if len(request.previous_script) > 800 else request.previous_script
                regeneration_section += f"""
=== PREVIOUS VERSION (for context) ===
{script_preview}{'...' if len(request.previous_script) > 800 else ''}

The user wants you to IMPROVE this based on the feedback above.
Keep what works, but CHANGE what the user asked you to change.

"""
        
        # Build comprehensive prompt with ONLY provided fields
        prompt = f"""
{'='*60}
🎬 VIDEO SCRIPT GENERATION REQUEST
{'='*60}

📌 CORE REQUIREMENTS:
Topic: {request.topic}
Duration: {request.duration_minutes} minutes ({total_seconds} seconds total){audience_section}{tone_section}{style_section}
Flow Structure: {flow_structure}
{persona_context}{key_points_section}
{regeneration_section}
{'='*60}
⏱️ TIMING BREAKDOWN
{'='*60}
• Hook: 0:00 - 0:{int(hook_seconds):02d} ({int(hook_seconds)} seconds)
• Main Content: 0:{int(hook_seconds):02d} - {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d} ({int(content_seconds)} seconds)
• Outro/CTA: {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d} - {request.duration_minutes}:00 ({int(outro_seconds)} seconds)

{'='*60}
🎯 CRITICAL INSTRUCTIONS (MUST FOLLOW)
{'='*60}

1. ✅ WRITE THE COMPLETE SCRIPT - Not an outline, not a summary, but EVERY WORD to be spoken
2. ✅ WORD-FOR-WORD DIALOGUE - Write exactly what the creator will say on camera
3. ✅ MATCH DURATION PRECISELY - Aim for approximately {request.duration_minutes * 150} words (150 words/minute speaking rate)
4. ✅ NATURAL CONVERSATIONAL FLOW - Write how people ACTUALLY talk (contractions, questions, direct address)
5. ✅ INCORPORATE ALL KEY POINTS - Weave them seamlessly into the narrative, don't just list them
6. ✅ FOLLOW THE EXACT FLOW - Structure must match: {flow_structure}
7. ✅ MAINTAIN CONSISTENT TONE - Keep the specified tone throughout every section
8. ✅ MAKE IT ENGAGING - Use storytelling techniques, examples, analogies, and emotional hooks
9. ✅ PRODUCTION-READY - Include timing markers, B-ROLL suggestions, and visual cues
10. ✅ SPEAK TO THE AUDIENCE - Address them directly, anticipate questions, create connection

{'='*60}
📝 REQUIRED SCRIPT FORMAT
{'='*60}

[HOOK - 0:00-0:{int(hook_seconds):02d}]
Write a POWERFUL attention-grabbing opening. Make viewers WANT to keep watching.
Use pattern interrupts, curiosity gaps, or bold statements.

[INTRODUCTION - 0:{int(hook_seconds):02d}-...]
Quick intro, preview value, establish credibility. Keep it brief but impactful.
[B-ROLL: Suggest relevant visual]

[MAIN CONTENT - Organized by flow: {flow_structure}]

[Section 1: First Major Point]
Full dialogue with natural transitions, examples, and details...
[TEXT ON SCREEN: Key phrase or statistic]
[B-ROLL: Relevant visual suggestion]

[Section 2: Second Major Point]  
Full dialogue with smooth transitions...
[PAUSE for emphasis]

[Continue with clear sections covering ALL key points...]

[CONCLUSION - {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d}-...]
Powerful summary reinforcing main message and value delivered.

[OUTRO/CALL-TO-ACTION]
Strong, specific CTA. Tell viewers EXACTLY what to do next.

{'='*60}
🎨 PRODUCTION ENHANCEMENTS
{'='*60}
- Mark [TIMING] transitions clearly  
- Suggest [B-ROLL] for visual storytelling
- Note [TEXT ON SCREEN] for emphasis
- Include [PAUSE] for dramatic effect
- Suggest [GRAPHICS/ANIMATIONS] where helpful
- Keep paragraphs SHORT (2-3 sentences) for teleprompter readability

NOW CREATE THE COMPLETE, PRODUCTION-READY SCRIPT:
"""
        
        # Use higher temperature for regeneration to encourage changes
        temperature = 0.85 if request.regenerate_feedback else 0.7
        
        return await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=temperature,  # Higher for regeneration, balanced for initial generation
            max_tokens=4000,  # Enough for detailed scripts
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
