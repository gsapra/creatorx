from typing import List, Dict, Optional, Tuple
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
import re
import logging

logger = logging.getLogger(__name__)


class CreatorToolsService:
    """Service for all creator-focused AI tools"""

    @staticmethod
    def calculate_dynamic_timing(
        duration_minutes: int,
        style: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Calculate optimal timing breakdown based on video duration and content style.
        Returns timing in seconds for each section.
        """
        total_seconds = duration_minutes * 60

        # Adjust hook based on duration
        if duration_minutes <= 3:
            # Short videos need punchy, quick hooks
            hook_seconds = min(20, int(total_seconds * 0.15))
        elif duration_minutes <= 10:
            # Medium videos - standard hook
            hook_seconds = min(45, int(total_seconds * 0.12))
        else:
            # Long-form content - can have longer setup
            hook_seconds = min(90, int(total_seconds * 0.10))

        # Adjust outro based on style
        if style in ["documentary", "educational", "tutorial", "case-study"]:
            # Educational content needs stronger CTAs and summary
            outro_seconds = min(60, int(total_seconds * 0.10))
        elif style in ["storytelling", "vlog-style"]:
            # Story content needs natural conclusions
            outro_seconds = min(30, int(total_seconds * 0.07))
        else:
            # Default balanced outro
            outro_seconds = min(40, int(total_seconds * 0.08))

        # Content gets the remaining time
        content_seconds = total_seconds - hook_seconds - outro_seconds

        return {
            "total": total_seconds,
            "hook": hook_seconds,
            "content": content_seconds,
            "outro": outro_seconds
        }

    @staticmethod
    def validate_script_requirements(
        script: str,
        request: ScriptGenerationRequest,
        timing: Dict[str, int]
    ) -> Tuple[bool, List[str]]:
        """
        Validate that generated script meets all user requirements.
        Returns (is_valid, list_of_issues)
        """
        issues = []

        # 1. Validate key points are present
        if request.key_points and len(request.key_points) > 0:
            missing_points = []
            for point in request.key_points:
                # Check if point or semantic match exists (case-insensitive)
                # Use word boundary matching for more accurate detection
                point_words = point.lower().split()
                # Check if all words from the key point appear in script
                if not all(word in script.lower() for word in point_words if len(word) > 3):
                    missing_points.append(point)

            if missing_points:
                issues.append(f"Missing key points: {', '.join(missing_points)}")

        # 2. Validate duration (word count check)
        words = len(script.split())
        expected_words = request.duration_minutes * 150  # 150 words/min average speaking rate
        word_variance = abs(words - expected_words) / expected_words

        if word_variance > 0.30:  # More than 30% off target
            issues.append(
                f"Script length mismatch: {words} words (expected ~{expected_words} for {request.duration_minutes} min video). "
                f"Current script is {'too long' if words > expected_words else 'too short'} by {abs(words - expected_words)} words."
            )

        # 3. Validate structure markers exist
        required_markers = ["[HOOK", "[OUTRO", "[CALL", "[CTA"]
        has_hook = any(marker in script.upper() for marker in ["[HOOK", "HOOK -", "HOOK:"])
        has_outro = any(marker in script.upper() for marker in ["[OUTRO", "[CALL", "[CTA", "OUTRO -"])

        if not has_hook:
            issues.append("Missing HOOK section marker in script")
        if not has_outro:
            issues.append("Missing OUTRO/CTA section marker in script")

        # 4. Validate timing markers exist
        timing_pattern = r'\d+:\d+'
        if not re.search(timing_pattern, script):
            issues.append("No timing markers found in script (format: 0:00)")

        # 5. Check for minimum content quality (not just outline)
        lines = script.split('\n')
        substantial_lines = [line for line in lines if len(line.strip()) > 50]
        if len(substantial_lines) < request.duration_minutes * 5:  # At least 5 substantial lines per minute
            issues.append("Script appears too sparse - needs more detailed content")

        return len(issues) == 0, issues

    @staticmethod
    def post_process_script(script: str, request: ScriptGenerationRequest) -> str:
        """
        Clean and format script for production readiness.
        Ensures consistent formatting and ACCURATE timing based on actual word count.
        """
        # Remove excessive whitespace while preserving paragraph breaks
        script = re.sub(r'\n{4,}', '\n\n\n', script)

        # Ensure section headers are properly formatted
        script = re.sub(r'\[HOOK\s*-?\s*', '[HOOK - ', script, flags=re.IGNORECASE)
        script = re.sub(r'\[OUTRO\s*-?\s*', '[OUTRO - ', script, flags=re.IGNORECASE)
        script = re.sub(r'\[INTRODUCTION\s*-?\s*', '[INTRODUCTION - ', script, flags=re.IGNORECASE)

        # Ensure production notes are properly formatted
        script = re.sub(r'\[B-ROLL\s*:\s*', '[B-ROLL: ', script, flags=re.IGNORECASE)
        script = re.sub(r'\[TEXT ON SCREEN\s*:\s*', '[TEXT ON SCREEN: ', script, flags=re.IGNORECASE)
        script = re.sub(r'\[PAUSE\s*-?\s*', '[PAUSE - ', script, flags=re.IGNORECASE)

        # FIX TIMESTAMPS: Recalculate based on actual word count (150 words/min)
        script = CreatorToolsService._fix_script_timestamps(script)

        return script.strip()

    @staticmethod
    def _fix_script_timestamps(script: str) -> str:
        """
        Fix all timestamps in script based on actual word count.
        Replaces AI-generated timestamps with accurate ones based on 150 words/minute speaking rate.
        """
        # Find all timestamp patterns: "0:00-0:09", "(0:00-0:09)", "0:00 - 0:09", etc.
        timestamp_pattern = r'\(?(\d+):(\d{2})\s*[-–—]\s*(\d+):(\d{2})\)?'

        # Split script into sections by timestamps to count words per section
        sections = re.split(r'\[.*?\]|\(.*?\d+:\d+.*?\)', script)

        # Count cumulative words
        cumulative_seconds = 0

        def replace_timestamp(match):
            nonlocal cumulative_seconds

            # Get the text after this timestamp marker (until next marker or end)
            match_end_pos = match.end()
            next_marker_match = re.search(r'\[|\((?=\d+:\d+)', script[match_end_pos:])

            if next_marker_match:
                section_text = script[match_end_pos:match_end_pos + next_marker_match.start()]
            else:
                section_text = script[match_end_pos:]

            # Count words in this section (excluding bracketed production notes)
            clean_text = re.sub(r'\[.*?\]', '', section_text)
            word_count = len(clean_text.split())

            # Calculate duration in seconds (150 words per minute = 2.5 words per second)
            section_duration_seconds = int(word_count / 2.5)

            # Calculate start and end times
            start_seconds = cumulative_seconds
            end_seconds = cumulative_seconds + section_duration_seconds

            # Update cumulative time
            cumulative_seconds = end_seconds

            # Format as MM:SS
            start_min, start_sec = divmod(start_seconds, 60)
            end_min, end_sec = divmod(end_seconds, 60)

            # Return formatted timestamp
            return f"{start_min}:{start_sec:02d}-{end_min}:{end_sec:02d}"

        # Replace all timestamps with accurate ones
        fixed_script = re.sub(timestamp_pattern, replace_timestamp, script)

        return fixed_script
    
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

        # Calculate dynamic timing breakdown based on duration and style
        timing = self.calculate_dynamic_timing(request.duration_minutes, request.style)
        total_seconds = timing["total"]
        hook_seconds = timing["hook"]
        content_seconds = timing["content"]
        outro_seconds = timing["outro"]
        
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
        
        # Handle regeneration with emphasized feedback and DELTA ANALYSIS
        regeneration_section = ""
        if request.regenerate_feedback:
            # Extract the actual feedback (remove the prefix if it exists)
            actual_feedback = request.regenerate_feedback.replace('IMPORTANT USER FEEDBACK - MUST FOLLOW: ', '')

            regeneration_section = f"""
{'='*80}
🚨🚨🚨 CRITICAL REGENERATION INSTRUCTIONS - DELTA ANALYSIS REQUIRED 🚨🚨🚨
{'='*80}

THIS IS A REFINEMENT REQUEST. You are creating VERSION 2 (or higher) of this script.

USER'S SPECIFIC FEEDBACK:
┌{'─'*76}┐
│ {actual_feedback.center(74)} │
└{'─'*76}┘

⚠️  MANDATORY DELTA ANALYSIS PROCESS ⚠️

STEP 1: ANALYZE THE FEEDBACK
- What EXACTLY does the user want changed?
- Which sections need modification?
- What should stay the same vs what must change?

STEP 2: IDENTIFY CHANGES TO MAKE
- List 3-5 specific modifications based on feedback
- Be CONCRETE about what will be different

STEP 3: GENERATE NEW VERSION
- Implement ALL requested changes
- Increase variation (higher temperature for creativity)
- Make it NOTICEABLY different where requested
- Keep successful elements that weren't criticized

🔥 CRITICAL REQUIREMENTS FOR REGENERATION 🔥
1. DO NOT copy-paste large sections unchanged
2. DO NOT ignore any part of the feedback
3. DO NOT make the script "slightly different" - make it SIGNIFICANTLY improved
4. DO apply creative problem-solving to address the feedback
5. DO maintain overall script quality while implementing changes

"""
            if request.previous_script:
                # Show FULL previous script for complete context (NO TRUNCATION)
                regeneration_section += f"""
{'='*80}
📜 PREVIOUS VERSION (FULL SCRIPT - Read carefully to understand context)
{'='*80}
{request.previous_script}
{'='*80}
END OF PREVIOUS VERSION
{'='*80}

Now create a NEW VERSION that:
✅ Incorporates the user's feedback COMPLETELY
✅ Improves upon weaknesses they identified
✅ Maintains strengths of the previous version
✅ Feels fresh and refined, not repetitive

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
📝 REQUIRED SCRIPT FORMAT WITH TIMING EXAMPLES
{'='*60}

[HOOK - 0:00-0:{int(hook_seconds):02d}]
Write a POWERFUL attention-grabbing opening. Make viewers WANT to keep watching.
Use pattern interrupts, curiosity gaps, or bold statements.

✅ GOOD HOOK EXAMPLE:
"If you're still editing videos the way I was 3 months ago, you're wasting 5 hours every single week.
I discovered a method that cut my editing time by 70%, and I'm about to show you exactly how."
[TIMING NOTE: This hook is ~12 seconds at normal speaking pace]

❌ BAD HOOK EXAMPLE:
"Hey guys, welcome back to my channel. Today we're going to talk about video editing tips."
[TOO GENERIC - No curiosity gap, no specific value promise]

[INTRODUCTION - 0:{int(hook_seconds):02d}-0:{int(hook_seconds + 20):02d}]
Quick intro, preview value, establish credibility. Keep it brief but impactful.
[B-ROLL: Suggest relevant visual]

[MAIN CONTENT - Organized by flow: {flow_structure}]
Structure with clear timing markers:

[Section 1: First Major Point - 0:{int(hook_seconds + 20):02d}-1:30]
Full dialogue with natural transitions, examples, and details...

✅ GOOD CONTENT EXAMPLE:
"Let me show you the first technique. Open your editing software, and instead of scrubbing through
clips manually—which is what I used to do—use keyboard shortcuts. I mapped 'J' to rewind and 'L'
to fast forward. Sounds simple, right? But this alone saves me 45 minutes per project."
[B-ROLL: Screen recording showing the technique]
[TEXT ON SCREEN: "J = Rewind | L = Fast Forward"]
[TIMING NOTE: ~20 seconds - specific, actionable, with exact time savings]

❌ BAD CONTENT EXAMPLE:
"Another important thing is keyboard shortcuts. They're really useful and can help you edit faster."
[TOO VAGUE - No specific shortcuts, no time savings quantified, no demo]

[Section 2: Second Major Point - 1:30-2:45]
Full dialogue with smooth transitions...
[PAUSE for 2 seconds - let the information sink in]

[Continue with clear sections covering ALL key points...]

[CONCLUSION - {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d}-...]
Powerful summary reinforcing main message and value delivered.

✅ GOOD CONCLUSION EXAMPLE:
"So let's recap: keyboard shortcuts, batch processing, and project templates. These three changes
took my editing from 8 hours down to 2.5 hours per video. That's 5.5 hours I get back every week
to create more content or spend with my family."
[TIMING NOTE: Specific recap with quantified results]

[OUTRO/CALL-TO-ACTION - {int((total_seconds - outro_seconds) // 60)}:{int((total_seconds - outro_seconds) % 60):02d}-{request.duration_minutes}:00]
Strong, specific CTA. Tell viewers EXACTLY what to do next.

✅ GOOD CTA EXAMPLE:
"If you want the complete keyboard shortcut cheat sheet I mentioned, I've linked it in the description.
Download it, print it out, and stick it next to your monitor. And if this saved you time, hit that
like button so more creators can find this video."
[TIMING NOTE: ~15 seconds - specific action, clear benefit, secondary engagement ask]

❌ BAD CTA EXAMPLE:
"Thanks for watching! Don't forget to like and subscribe!"
[TOO GENERIC - No specific value offer, just asks without giving]

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
        
        # Use significantly higher temperature for regeneration to encourage creative changes
        temperature = 0.95 if request.regenerate_feedback else 0.7

        # Generate initial script
        script = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=temperature,  # 0.95 for regeneration (high variation), 0.7 for initial (balanced)
            max_tokens=4000,  # Enough for detailed scripts
            system_prompt=system_prompt,
            tool_type='script'  # Enable tool-specific optimizations
        )

        # Validate the generated script meets requirements
        is_valid, validation_issues = self.validate_script_requirements(script, request, timing)

        # If validation fails, retry with feedback (max 1 retry to avoid excessive costs)
        if not is_valid and not request.regenerate_feedback:  # Only auto-retry for initial generation
            logger.warning(f"Script validation failed: {validation_issues}. Attempting retry with feedback.")

            # Create validation feedback prompt
            validation_feedback = f"""
The previous script had the following issues that MUST be fixed:
{chr(10).join(f"• {issue}" for issue in validation_issues)}

Please regenerate the script ensuring ALL requirements are met:
- Include ALL key points naturally in the narrative
- Match the target duration precisely (~{request.duration_minutes * 150} words)
- Include proper section markers: [HOOK], [CONTENT], [OUTRO]
- Add timing markers throughout (format: 0:00)
- Write full detailed content, not an outline

Now create the COMPLETE, PRODUCTION-READY SCRIPT that addresses all issues:
"""

            retry_prompt = validation_feedback + "\n\n" + prompt

            # Retry generation with validation feedback
            script = await ai_service.generate(
                prompt=retry_prompt,
                model=request.ai_model,
                temperature=temperature + 0.1,  # Slightly higher temperature for variation
                max_tokens=4000,
                system_prompt=system_prompt,
                tool_type='script'
            )

            # Validate retry
            is_valid_retry, retry_issues = self.validate_script_requirements(script, request, timing)
            if not is_valid_retry:
                logger.warning(f"Script retry still has issues: {retry_issues}")
                # Continue with script even if retry fails - better than no script

        # Post-process script for consistent formatting
        script = self.post_process_script(script, request)

        return script
    
    async def generate_titles(
        self,
        request: TitleGenerationRequest,
        persona: Optional[Dict] = None
    ) -> List[str]:
        """Generate video titles optimized for maximum CTR with proven formulas"""

        system_prompt = """You are a master of viral video title creation with deep knowledge of YouTube algorithm and viewer psychology.
You create titles that maximize click-through rates using proven formulas, curiosity gaps, and emotional triggers.
CRITICAL: All titles MUST be under 70 characters for optimal display across devices."""

        # Build comprehensive prompt with multiple style examples
        prompt = f"""
{'='*80}
🎯 VIDEO TITLE GENERATION REQUEST
{'='*80}

TOPIC: {request.video_topic}
NUMBER OF TITLES: {request.count}
"""

        if request.keywords:
            keyword_list = ', '.join(request.keywords)
            prompt += f"""
TARGET KEYWORDS (MUST INCLUDE): {keyword_list}
→ Integrate keywords naturally - don't force them
→ Prioritize the most important keyword in each title
→ Keyword density: Include at least ONE target keyword per title

"""

        prompt += f"""
{'='*80}
📊 CTR OPTIMIZATION FORMULAS (Use a variety)
{'='*80}

1. CURIOSITY GAP FORMULA
"[Unexpected Result] + [Common Action] + [Time Period]"
✅ GOOD: "I Tried Meditation for 30 Days and It Cured My Anxiety"
✅ GOOD: "What Happened When I Quit Coffee for a Month (Shocking)"
❌ BAD: "The Benefits of Meditation" (No curiosity, no specificity)

2. NUMBERED LIST FORMULA
"[Number] + [Thing] + [Benefit/Result]"
✅ GOOD: "7 Photography Tricks That Will Change Your Instagram Forever"
✅ GOOD: "5 Budget Meals Under $3 (Better Than Restaurant Quality)"
❌ BAD: "Some Photography Tips" (No number, no specific benefit)

3. HOW-TO FORMULA
"How [Target Audience] Can [Achieve Specific Result] [Time/Cost Qualifier]"
✅ GOOD: "How Beginners Can Edit Like a Pro in 10 Minutes (Free)"
✅ GOOD: "How I Built a 6-Figure Business with Zero Investment"
❌ BAD: "How to Edit Videos" (Not specific, no qualifier, no target audience)

4. CONTROVERSIAL/UNPOPULAR OPINION
"[Bold Statement] + [Why/How]"
✅ GOOD: "Why Your Morning Routine is Ruining Your Productivity"
✅ GOOD: "Stop Buying These Camera Gear (Do This Instead)"
❌ BAD: "Morning Routines Are Important" (Not controversial, boring)

5. BEFORE/AFTER TRANSFORMATION
"[Starting Point] → [End Result] + [Method/Time]"
✅ GOOD: "From 1,000 to 100K Subscribers in 6 Months (My Strategy)"
✅ GOOD: "Broke to $10K/Month: My Side Hustle Blueprint"
❌ BAD: "How I Grew My Channel" (Vague transformation, no numbers)

6. LISTICLE WITH SHOCK FACTOR
"[Number] [Things] That [Unexpected Outcome] (#X Will [Emotion])"
✅ GOOD: "10 Foods That Are Healthier Than You Think (#7 Will Shock You)"
✅ GOOD: "8 Editing Mistakes Killing Your Views (You're Doing #3)"
❌ BAD: "Top 10 Foods List" (No shock factor, generic)

{'='*80}
🎨 POWER WORDS FOR CTR (Use strategically)
{'='*80}

CURIOSITY: Secret, Hidden, Nobody Tells You, What They Don't Want You to Know
URGENCY: Now, Today, Before It's Too Late, Limited, Fast
AUTHORITY: Ultimate, Complete, Definitive, Expert, Proven, Scientific
EXCLUSIVITY: Only, Insiders, Elite, VIP, Private, Untold
EMOTION: Shocking, Insane, Incredible, Mind-Blowing, Life-Changing, Devastating
RESULTS: Guaranteed, Exactly, Step-by-Step, Blueprint, Formula, System
EASE: Simple, Easy, Effortless, Quick, Fast, Minutes, Without

{'='*80}
CHARACTER LIMIT ENFORCEMENT
{'='*80}

⚠️  CRITICAL REQUIREMENT ⚠️
ALL titles MUST be UNDER 70 characters including spaces.
Titles over 70 characters get truncated on mobile devices = lower CTR.

CHECK YOUR WORK:
✅ "I Quit My Job to Travel Full-Time (Best Decision Ever)" = 57 chars ✓
✅ "7 Passive Income Ideas That Actually Work in 2026" = 51 chars ✓
❌ "The Complete Comprehensive Ultimate Guide to Building a Successful YouTube Channel from Scratch" = 95 chars ✗

{'='*80}
📝 QUALITY CHECKLIST (Every title must pass)
{'='*80}

Before including any title, verify:
✅ Under 70 characters? (Count carefully!)
✅ Includes target keyword naturally?
✅ Creates curiosity or promises specific value?
✅ Uses at least one power word or formula?
✅ Specific (not vague)?
✅ Clear benefit or outcome?
✅ Would YOU click on this?

{'='*80}
🎯 YOUR TASK
{'='*80}

Generate {request.count} high-CTR titles that:
1. Follow different formulas for variety
2. ALL stay under 70 characters
3. Include target keywords naturally (if provided)
4. Use power words strategically
5. Create strong curiosity gaps
6. Promise specific, valuable outcomes
7. Match YouTube algorithm best practices

DIVERSITY REQUIREMENT:
- Use at least 3 different formulas across your titles
- Vary the emotional angle (curiosity, shock, aspiration, fear-of-missing-out)
- Mix different power words—don't repeat the same phrases

Return ONLY a valid JSON array of title strings, no other text.
Example format: ["Title 1 Under 70 Chars", "Title 2 Under 70 Chars", "Title 3 Under 70 Chars"]
"""

        # Inject persona context for audience-specific titles
        prompt = ai_service.inject_persona_context(prompt, persona, tool_type='title')

        response = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.85,  # High creativity while maintaining quality
            max_tokens=800,  # More space for diverse title generation
            system_prompt=system_prompt,
            tool_type='title'  # Enable tool-specific optimizations
        )

        # Parse JSON response with better error handling
        try:
            # Try to extract JSON from response (handle markdown code blocks)
            response_clean = response.strip()
            if response_clean.startswith('```'):
                # Extract JSON from markdown code block
                lines = response_clean.split('\n')
                response_clean = '\n'.join(lines[1:-1]) if len(lines) > 2 else response_clean

            titles = json.loads(response_clean)

            if isinstance(titles, list):
                # Validate and filter titles by character limit
                valid_titles = [t for t in titles if isinstance(t, str) and len(t) <= 70]
                return valid_titles[:request.count] if valid_titles else titles[:request.count]
            else:
                return [response]
        except json.JSONDecodeError:
            # Fallback: split by newlines and clean
            lines = [line.strip().strip('"').strip("'") for line in response.split('\n') if line.strip()]
            # Filter out JSON artifacts and empty lines
            titles = [line for line in lines if line and not line.startswith(('[', ']', '{', '}'))]
            return titles[:request.count]
    
    async def generate_thumbnail_ideas(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict]:
        """Generate actual thumbnail images using DALL-E 3 AI image generation"""

        # Use new AI image generation service
        from app.services.thumbnail_image_service import thumbnail_image_service
        print("[Thumbnail Service] Using AI image generation (DALL-E 3)")
        return await thumbnail_image_service.generate_thumbnails(request, persona)

    async def _generate_basic_thumbnails(
        self,
        request: ThumbnailIdeaRequest,
        persona: Optional[Dict] = None
    ) -> List[Dict]:
        """Basic thumbnail generation (original logic)"""

        system_prompt = """You are a master thumbnail designer who creates structured, layer-based thumbnail templates.
You design thumbnails optimized for YouTube CTR using professional layout principles.
CRITICAL: Return valid JSON array with complete layer-based thumbnail templates."""

        # Define style presets
        style_presets = {
            "modern": "Clean geometric shapes, sans-serif fonts (Montserrat, Inter), bright gradients, minimalist",
            "bold": "High contrast, large bold text (Impact, Anton), dramatic colors (red, yellow, black), intense",
            "minimalist": "Simple, few elements, elegant fonts (Helvetica, Roboto), pastel or monochrome colors",
            "dramatic": "Dark backgrounds, spotlight effects, cinematic look, strong shadows, moody",
            "gaming": "Neon colors, glitch effects, futuristic fonts, high energy, RGB accents",
            "vlog": "Casual, friendly, expressive faces, hand-drawn elements, warm colors"
        }

        style_hint = style_presets.get(request.style, "") if request.style else "varied styles"

        prompt = f"""
{'='*80}
🎨 LAYER-BASED THUMBNAIL TEMPLATE GENERATION
{'='*80}

VIDEO TITLE: {request.video_title}
VIDEO TOPIC: {request.video_topic}
NUMBER OF TEMPLATES: {request.count}
STYLE PREFERENCE: {style_hint}

{'='*80}
🎯 CANVAS SPECIFICATIONS
{'='*80}

CANVAS SIZE: 1280x720 pixels (YouTube standard)
COORDINATE SYSTEM: Top-left origin (0,0), x increases right, y increases down
LAYER STACKING: Higher z_index renders on top

{'='*80}
📐 LAYOUT GUIDELINES
{'='*80}

SAFE ZONES:
- Title text: Keep within 100px from edges (for mobile visibility)
- Key elements: Centered or using rule of thirds (x: 427 or 853, y: 240 or 480)
- Face close-ups: Position eyes in upper third (y: 180-240)

TYPOGRAPHY SCALE:
- Hero text (main message): 80-120px
- Secondary text: 40-60px
- Subtitle/detail: 24-36px

TEXT POSITIONING EXAMPLES:
- Top banner: y: 50-100
- Center focus: y: 280-360
- Bottom banner: y: 620-670
- Left aligned: x: 100-150
- Right aligned: x: 1130-1180
- Centered: x: 640

{'='*80}
🎨 COLOR & DESIGN PRINCIPLES
{'='*80}

HIGH-CTR COLOR SCHEMES:
1. Bold Energy: Background #FF0000, Text #FFFF00 with #000000 stroke
2. Tech Modern: Background #1E3A8A, Text #FFFFFF, Accent #F97316
3. Dramatic: Background #000000, Text #FFFFFF, Accent #EF4444
4. Fresh Clean: Background #10B981, Text #FFFFFF with shadow
5. Luxury: Background #1F2937, Text #FCD34D (gold)

TEXT EFFECTS FOR READABILITY:
- Always use stroke (3-5px black or white) for text on complex backgrounds
- Drop shadows: offset 2-4px, blur 4-8px, color #000000 with 50-70% opacity
- High contrast between text and background (minimum 4.5:1 ratio)

{'='*80}
📝 REQUIRED JSON STRUCTURE
{'='*80}

Generate thumbnails as layer-based templates. Each template contains multiple layers stacked on a canvas.

LAYER TYPES:
1. **background**: Canvas background (always z_index: 0)
2. **shape**: Geometric shapes for design elements (z_index: 1-3)
3. **image**: Image placeholders with descriptions (z_index: 4-6)
4. **text**: Text overlays with full styling (z_index: 7-10)

REQUIRED JSON FORMAT:
[
  {{
    "id": "thumbnail_1",
    "name": "Bold Impact Style",
    "description": "High-contrast thumbnail with dramatic text overlay",
    "style": "bold",
    "canvas_width": 1280,
    "canvas_height": 720,
    "psychology_notes": "Creates urgency through high contrast and bold typography",
    "tags": ["bold", "high-energy", "text-focused"],
    "layers": [
      {{
        "id": "bg_1",
        "type": "background",
        "x": 0,
        "y": 0,
        "width": 1280,
        "height": 720,
        "z_index": 0,
        "opacity": 1.0,
        "fill_color": "#FF0000"
      }},
      {{
        "id": "text_main",
        "type": "text",
        "text": "INSANE RESULTS",
        "x": 640,
        "y": 360,
        "width": 1000,
        "height": 150,
        "z_index": 10,
        "font_family": "Impact",
        "font_size": 100,
        "font_weight": "bold",
        "color": "#FFFF00",
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
✅ EXAMPLE TEMPLATE PATTERNS
{'='*80}

**PATTERN 1: Bold Text Center**
- Background layer: Solid bold color (red, blue, black)
- Main text layer: Large 90-110px, centered (x: 640, y: 360), high contrast, thick stroke
- Optional: Accent shape for emphasis

**PATTERN 2: Top/Bottom Split**
- Background: Gradient or solid
- Top text (x: 640, y: 120): Main message, 80px
- Bottom text (x: 640, y: 600): Secondary message, 50px
- Optional: Middle image/shape layer

**PATTERN 3: Asymmetric Dynamic**
- Background: Dark or vibrant
- Large text on one side (x: 300 or 980, y: 300-400): Main word, 100px
- Smaller text opposite side: Context, 40-50px
- Shape accents: Arrows, circles for visual flow

**PATTERN 4: Minimalist Clean**
- Background: Light solid or subtle gradient
- Single text element: Clean sans-serif, 70-90px, centered or offset
- Minimal colors: 2-3 total including background

{'='*80}
🎯 YOUR TASK
{'='*80}

Generate {request.count} thumbnail templates that:
1. Use DIFFERENT layout patterns for variety
2. Have 2-4 layers each (background + text + optional shapes/images)
3. Follow positioning guidelines (safe zones, rule of thirds)
4. Use high-CTR color schemes
5. Include 3-6 words maximum of text total
6. Provide complete, valid layer data for immediate rendering

CRITICAL REQUIREMENTS:
✅ All coordinates must fit within 1280x720 canvas
✅ Text layers must have: font_family, font_size, color, text, position
✅ Background must be z_index: 0
✅ Text must have stroke_color and stroke_width for readability
✅ X/Y positions for text represent the CENTER point
✅ Use web-safe fonts: Impact, Arial, Helvetica, Georgia, "Times New Roman", Verdana, Courier

LAYER ID NAMING:
- bg_1, bg_2 for backgrounds
- text_main, text_sub, text_accent for text layers
- shape_1, shape_2 for shapes
- img_1, img_2 for image placeholders

Return ONLY the JSON array, no other text:
"""

        # Inject persona context
        prompt = ai_service.inject_persona_context(prompt, persona, tool_type='thumbnail')

        response = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.75,  # Balanced creativity with structure adherence
            max_tokens=3500,  # More space for layer-based templates
            system_prompt=system_prompt,
            tool_type='thumbnail'  # Enable tool-specific optimizations
        )

        # Parse JSON response with better error handling
        try:
            response_clean = response.strip()
            if response_clean.startswith('```'):
                # Extract JSON from markdown code block
                lines = response_clean.split('\n')
                response_clean = '\n'.join([l for l in lines if not l.startswith('```')])

            templates = json.loads(response_clean)
            if isinstance(templates, list) and len(templates) > 0:
                return templates
            else:
                # Return fallback template if parsing succeeds but format is wrong
                return self._generate_fallback_template(request)
        except json.JSONDecodeError as e:
            # Return fallback template on JSON error
            print(f"[Thumbnail Generation] JSON parse error: {e}")
            print(f"[Thumbnail Generation] Response preview: {response[:500]}")
            return self._generate_fallback_template(request)

    def _generate_fallback_template(self, request: ThumbnailIdeaRequest) -> List[Dict]:
        """Generate a simple fallback template when AI generation fails"""
        import uuid

        # Extract key words from title for text overlay
        words = request.video_title.upper().split()
        main_text = " ".join(words[:3]) if len(words) >= 3 else request.video_title.upper()

        return [{
            "id": f"thumbnail_{uuid.uuid4().hex[:8]}",
            "name": "Bold Impact Style",
            "description": f"High-contrast thumbnail for: {request.video_topic}",
            "style": "bold",
            "canvas_width": 1280,
            "canvas_height": 720,
            "psychology_notes": "High contrast design for maximum visibility",
            "tags": ["bold", "fallback"],
            "layers": [
                {
                    "id": "bg_1",
                    "type": "background",
                    "x": 0,
                    "y": 0,
                    "width": 1280,
                    "height": 720,
                    "z_index": 0,
                    "opacity": 1.0,
                    "fill_color": "#1E40AF",
                    "rotation": 0
                },
                {
                    "id": "text_main",
                    "type": "text",
                    "text": main_text,
                    "x": 640,
                    "y": 360,
                    "width": 1000,
                    "height": 150,
                    "z_index": 10,
                    "font_family": "Impact",
                    "font_size": 90,
                    "font_weight": "bold",
                    "color": "#FFFFFF",
                    "text_align": "center",
                    "stroke_color": "#000000",
                    "stroke_width": 4,
                    "shadow_color": "#000000",
                    "shadow_blur": 6,
                    "shadow_offset_x": 2,
                    "shadow_offset_y": 2,
                    "opacity": 1.0,
                    "rotation": 0
                }
            ]
        }]
    
    async def generate_social_caption(
        self,
        request: SocialCaptionRequest,
        persona: Optional[Dict] = None
    ) -> str:
        """Generate platform-optimized social media caption with examples"""

        platform_specs = {
            "instagram": {
                "char_limit": 2200,
                "optimal_length": "150-300 characters for main message, additional context below",
                "hashtag_strategy": "5-10 relevant hashtags (mix of popular and niche)",
                "emoji_usage": "Moderate - use to break up text and add personality",
                "best_practices": [
                    "Start with a hook that stops the scroll",
                    "Line breaks for readability (every 2-3 lines)",
                    "Include a clear call-to-action",
                    "Add hashtags at the end or in first comment",
                    "Ask a question to boost engagement"
                ],
                "good_example": """Just spent 3 hours testing the new camera lens and WOW 🤯

The difference in low-light shots is actually insane. Check the carousel to see the side-by-side comparison—you won't believe these are from the same setup.

Here's what I learned:
→ Aperture matters more than I thought
→ Manual focus gave me way sharper results
→ The lens hood is NOT optional

Which photo is your favorite? Drop a number 1-5 in the comments 👇

#photography #cameragear #photographytips #contentcreator #photographylife #bts #cameralens #photooftheday #photographylovers #learnphotography""",
                "bad_example": """New lens review

It's good. Check it out.

#photography #camera #photo #pic #instagood #picoftheday #photooftheday #art #beautiful #nature

[TOO VAGUE - No specific value, generic hashtags, no engagement prompt]"""
            },
            "twitter": {
                "char_limit": 280,
                "optimal_length": "240-270 characters (leaves room for RT with comment)",
                "hashtag_strategy": "1-2 hashtags maximum (or none for higher engagement)",
                "emoji_usage": "Minimal - one strategic emoji for emphasis",
                "best_practices": [
                    "Front-load the key message",
                    "Be concise and punchy",
                    "Include a controversial/interesting take",
                    "Use threads for longer content",
                    "Ask questions or create polls"
                ],
                "good_example": """Unpopular opinion: Your content calendar is killing your creativity.

I ditched mine 3 months ago and engagement is up 40%. Here's why planning too far ahead is actually hurting your growth 🧵

[THREAD INDICATOR, SPECIFIC CLAIM, QUANTIFIED RESULT]""",
                "bad_example": """Just posted a new blog post about social media marketing tips. Link in bio. Check it out! #marketing #socialmedia #tips #blog

[TOO SALESY - Multiple hashtags, generic pitch, no value in tweet itself]"""
            },
            "youtube": {
                "char_limit": 5000,
                "optimal_length": "200-300 characters for visible portion, full details below",
                "hashtag_strategy": "3-5 relevant hashtags (YouTube uses first 3 in search)",
                "emoji_usage": "Use for section headers and visual organization",
                "best_practices": [
                    "First 2-3 lines are visible before 'Show more'—make them count",
                    "Include timestamps for easy navigation",
                    "Add links to related videos/playlists",
                    "List tools, resources, or products mentioned",
                    "Include social media links"
                ],
                "good_example": """This editing technique cut my production time by 60% (and it's free).

In this video, I'm breaking down my complete editing workflow—from importing footage to export. No fluff, just the exact steps I use for every single video.

⏱️ TIMESTAMPS
0:00 - Intro
0:42 - Setting up your project (the right way)
2:15 - The 3-pass editing method
5:30 - Color grading shortcuts
8:12 - Export settings that actually matter

🔧 TOOLS MENTIONED
• DaVinci Resolve (free): [link]
• My LUT pack: [link]
• Keyboard shortcut template: [link]

📱 LET'S CONNECT
Instagram: @username
Twitter: @username

#videoediting #davinciresolve #filmmaking""",
                "bad_example": """New video! Check it out and subscribe!

[NO CONTEXT - No description, no timestamps, no value preview]"""
            },
            "tiktok": {
                "char_limit": 2200,
                "optimal_length": "100-150 characters (concise hooks work best)",
                "hashtag_strategy": "3-5 hashtags mixing trending and niche",
                "emoji_usage": "Liberal use for personality and trend-alignment",
                "best_practices": [
                    "Match the energy of the platform (casual, fun)",
                    "Use trending sounds/hashtags when relevant",
                    "Create curiosity without spoiling the video",
                    "Encourage duets, stitches, or responses",
                    "Keep it SHORT—the video is the main content"
                ],
                "good_example": """POV: You just discovered the secret menu hack that Starbucks employees don't want you to know 🤫☕

(It's actually free but shhh)

#starbucks #secretmenu #lifehack #fyp #barista""",
                "bad_example": """Check out this cool thing I found. What do you think? #fyp #foryou #foryoupage #viral #trending

[TOO GENERIC - No specifics, spam hashtags, doesn't match TikTok energy]"""
            },
            "linkedin": {
                "char_limit": 3000,
                "optimal_length": "150-200 characters for preview, 1200-1500 total",
                "hashtag_strategy": "3-5 professional/industry hashtags",
                "emoji_usage": "Minimal and professional (📊 ✅ 💡 are safe)",
                "best_practices": [
                    "Start with a compelling professional story",
                    "Use short paragraphs (1-2 sentences)",
                    "Include data/results when possible",
                    "Professional but conversational tone",
                    "End with a thought-provoking question"
                ],
                "good_example": """I got fired from my first marketing job.

My boss said I "didn't understand the fundamentals."

That was 5 years ago. Last month, that same company reached out asking me to consult on their rebrand.

Here's what I learned about resilience in this industry:

✅ Rejection is redirection, not failure
✅ Your current role doesn't define your potential
✅ Skills compound—every project makes you better
✅ The people who doubt you today might hire you tomorrow

The marketing manager who fired me? We're actually friends now. Turns out we were both learning.

What's a professional setback that ended up being a turning point for you?

#marketing #careergrowth #professionaldev #marketingtips #careeradvice""",
                "bad_example": """Just finished a great project! So excited about the results. Check out my website for more info.

[TOO VAGUE - No story, no specifics, no professional value, self-promotional]"""
            }
        }

        platform = request.platform.lower()
        spec = platform_specs.get(platform, {})

        system_prompt = f"""You are an expert social media copywriter specializing in {platform.upper()} content.
You create captions that stop scrolls, drive engagement, and feel native to the platform.
You understand platform algorithms, character limits, and what makes content perform."""

        # Inject persona context FIRST for brand voice alignment
        base_prompt = f"""
{'='*80}
📱 {platform.upper()} CAPTION GENERATION REQUEST
{'='*80}

CONTENT TO PROMOTE:
{request.content_description}

{'='*80}
🎯 {platform.upper()}-SPECIFIC REQUIREMENTS
{'='*80}

ABSOLUTE CHARACTER LIMIT: {spec.get('char_limit', 2000)} characters (MUST NOT EXCEED)
OPTIMAL LENGTH: {spec.get('optimal_length', 'Concise and engaging')}

HASHTAG STRATEGY: {spec.get('hashtag_strategy', 'Platform-appropriate')}
→ Include hashtags: {'YES - Required' if request.include_hashtags else 'NO - Omit hashtags'}

EMOJI USAGE: {spec.get('emoji_usage', 'Use appropriately')}
→ Include emojis: {'YES - Use strategically' if request.include_emojis else 'NO - Text only'}

PLATFORM BEST PRACTICES:
"""

        for i, practice in enumerate(spec.get('best_practices', []), 1):
            base_prompt += f"{i}. {practice}\n"

        base_prompt += f"""
{'='*80}
✅ GOOD {platform.upper()} CAPTION EXAMPLE
{'='*80}
{spec.get('good_example', 'N/A')}

{'='*80}
❌ BAD {platform.upper()} CAPTION EXAMPLE (DO NOT DO THIS)
{'='*80}
{spec.get('bad_example', 'N/A')}

{'='*80}
🎯 YOUR TASK
{'='*80}

Create a {platform.upper()} caption that:
✅ Matches the platform's tone and style perfectly
✅ Stays UNDER the {spec.get('char_limit', 2000)} character limit
✅ Includes a strong hook in the first line
✅ Provides clear value or entertainment
✅ Has a specific call-to-action
✅ Uses line breaks for readability (when appropriate for platform)
✅ Follows the hashtag and emoji guidelines above
✅ Feels authentic and engaging, not robotic or corporate

NOW WRITE THE CAPTION:
"""

        # Inject persona for brand voice (after platform context)
        prompt = ai_service.inject_persona_context(base_prompt, persona, tool_type='caption')

        return await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.8,
            max_tokens=800,
            system_prompt=system_prompt,
            tool_type='caption'  # Enable tool-specific optimizations
        )
    
    async def optimize_seo(
        self,
        request: SEOOptimizationRequest,
        persona: Optional[Dict] = None
    ) -> SEOOptimizationResponse:
        """Optimize content for SEO with keyword density and meta tag formulas"""

        system_prompt = """You are an expert SEO strategist with deep knowledge of search engine algorithms, keyword optimization, and content ranking factors.
You optimize content for maximum search visibility while maintaining natural readability and user value.
CRITICAL: Return valid JSON with all required SEO optimization fields."""

        prompt = f"""
{'='*80}
🔍 SEO CONTENT OPTIMIZATION REQUEST
{'='*80}

ORIGINAL CONTENT:
{request.content}

TARGET KEYWORDS: {', '.join(request.target_keywords)}

{'='*80}
📊 SEO OPTIMIZATION GUIDELINES
{'='*80}

**KEYWORD DENSITY RULES:**
→ Primary keyword: 1-2% density (appears naturally 2-3 times per 200 words)
→ Secondary keywords: 0.5-1% density each
→ LSI (Latent Semantic Indexing) keywords: Contextually related terms that support main keywords
→ AVOID keyword stuffing (>3% density triggers spam filters)
→ Use keywords in: Title, first paragraph, subheadings, conclusion, meta tags

**META TITLE FORMULAS (50-60 characters):**
✅ GOOD FORMULAS:
- "[Primary Keyword] - [Benefit] | [Brand]" (e.g., "SEO Tips - Rank #1 Fast | MarketingPro")
- "[Number] [Primary Keyword] [Year]" (e.g., "10 SEO Strategies for 2026")
- "How to [Primary Keyword] [Benefit]" (e.g., "How to SEO Optimize Content Fast")
- "[Primary Keyword]: [Unique Angle]" (e.g., "Content Marketing: The 2026 Playbook")

❌ BAD EXAMPLES:
- "Welcome to our website about stuff" (No keywords, vague)
- "The Complete Comprehensive Ultimate Guide..." (Too long, keyword stuffing)
- "Home | About | Services" (Not descriptive, no keywords)

**META DESCRIPTION FORMULAS (150-160 characters):**
✅ GOOD FORMULAS:
- "[Value Prop] + [Benefit] + [Call-to-Action]"
  Example: "Discover proven SEO strategies that boost rankings. Get actionable tips from experts. Start optimizing your content today."

- "[Answer Query] + [Social Proof] + [CTA]"
  Example: "Learn how to rank #1 on Google with our tested methods. Used by 10K+ marketers. Download free checklist now."

❌ BAD EXAMPLES:
- "This is an article about SEO and marketing and optimization" (Keyword stuffing, no CTA)
- "Click here to read more" (No value, vague, short)

**LSI KEYWORD STRATEGY:**
LSI keywords are contextually related terms that help search engines understand your content topic.

For "SEO optimization" LSI keywords include:
→ search engine rankings, keyword research, content strategy, organic traffic, SERP position,
  on-page SEO, meta tags, backlinks, domain authority, search visibility

ALWAYS include 5-10 LSI keywords naturally throughout optimized content.

{'='*80}
✅ GOOD SEO CONTENT EXAMPLE
{'='*80}

**Original:** "This post talks about tips for websites."

**Optimized:** "Boost Your Search Rankings: 10 SEO Optimization Strategies for 2026

Improving your website's search engine rankings requires a strategic approach to SEO optimization.
This comprehensive guide covers proven techniques to increase organic traffic and enhance your SERP position.

Whether you're focusing on keyword research, on-page SEO, or building quality backlinks, these actionable
strategies will help you dominate search results and drive more qualified visitors to your content."

**Why this works:**
- Primary keyword "SEO optimization" in title and first paragraph
- LSI keywords naturally integrated (search engine rankings, organic traffic, SERP position, keyword research, on-page SEO, backlinks)
- Keyword density ~1.5% (optimal range)
- Clear value proposition
- Natural, readable flow

{'='*80}
❌ BAD SEO CONTENT EXAMPLE
{'='*80}

**Over-optimized:** "SEO optimization is important for SEO. Our SEO optimization services provide SEO optimization
to help your SEO optimization needs. Contact us for SEO optimization today for SEO optimization solutions."

**Why this fails:**
- Keyword stuffing (8+ repetitions in 2 sentences = ~15% density)
- No value or information provided
- Unnatural, robotic language
- No LSI keywords
- Triggers spam filters

{'='*80}
📝 REQUIRED JSON OUTPUT STRUCTURE
{'='*80}

Return EXACTLY this JSON structure:
{{
    "optimized_content": "SEO-optimized version with natural keyword integration, LSI keywords, and improved readability",
    "meta_title": "50-60 char title with primary keyword",
    "meta_description": "150-160 char description with value prop, benefit, and CTA",
    "suggested_keywords": ["LSI keyword 1", "LSI keyword 2", "long-tail variation 1", "semantic keyword 1", "..."],
    "seo_score": 85.0
}}

**SEO SCORE CALCULATION (0-100):**
- Keyword optimization (25 points): Natural integration, proper density
- Meta tags (20 points): Title and description follow formulas
- Content quality (20 points): Readability, value, engagement
- LSI keywords (15 points): Semantic relevance, natural inclusion
- Structure (10 points): Headings, paragraphs, formatting
- Length (10 points): Sufficient depth for topic coverage

{'='*80}
🎯 YOUR TASK
{'='*80}

Optimize the provided content by:
1. **Rewrite content** with natural keyword integration (1-2% density for primary keywords)
2. **Add LSI keywords** throughout (5-10 related terms)
3. **Create meta title** using proven formula (50-60 chars, includes primary keyword)
4. **Create meta description** with value + benefit + CTA (150-160 chars)
5. **Suggest additional keywords** (LSI, long-tail, semantic variations)
6. **Calculate SEO score** based on optimization quality (0-100)

CRITICAL REQUIREMENTS:
✅ Keep content natural and readable (NOT robotic)
✅ Primary keyword density: 1-2% (not more!)
✅ Include LSI keywords naturally
✅ Meta title: 50-60 characters
✅ Meta description: 150-160 characters
✅ Provide 5-10 suggested keywords
✅ Calculate accurate SEO score

NOW GENERATE THE OPTIMIZED SEO CONTENT AS JSON:
"""

        # Inject persona context
        prompt = ai_service.inject_persona_context(prompt, persona, tool_type='seo')

        response = await ai_service.generate(
            prompt=prompt,
            model=request.ai_model,
            temperature=0.7,
            max_tokens=2500,
            system_prompt=system_prompt,
            tool_type='seo'  # Enable tool-specific optimizations
        )

        # Parse JSON response with better error handling
        try:
            response_clean = response.strip()
            if response_clean.startswith('```'):
                # Extract JSON from markdown code block
                lines = response_clean.split('\n')
                response_clean = '\n'.join([l for l in lines if not l.startswith('```')])

            data = json.loads(response_clean)
            return SEOOptimizationResponse(**data)
        except (json.JSONDecodeError, Exception) as e:
            # Better fallback response
            return SEOOptimizationResponse(
                optimized_content=f"[SEO Optimized] {request.content}",
                meta_title=f"{request.target_keywords[0] if request.target_keywords else 'Content'} - Complete Guide 2026"[:60],
                meta_description=f"Learn everything about {request.target_keywords[0] if request.target_keywords else 'this topic'}. Expert tips, strategies, and actionable advice. Start now!"[:160],
                suggested_keywords=request.target_keywords + ["guide", "tips", "strategies", "2026"],
                seo_score=70.0
            )


# Singleton instance
creator_tools_service = CreatorToolsService()
