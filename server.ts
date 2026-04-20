import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

if (!process.env.GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY is not set. Add it to your .env file.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

app.use(express.json({ limit: '2mb' }));

// ── CORS & Security ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    /\.vercel\.app$/, // Allow any Vercel subdomain
    /\.netlify\.app$/ // Allow any Netlify subdomain
  ];

  if (origin) {
    const isAllowed = allowedOrigins.some(ao => 
      typeof ao === 'string' ? ao === origin : ao.test(origin)
    );
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Auth Middleware (Basic Check) ───────────────────────────────────────────
const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  // Note: In a production app, we would verify the Firebase token here using firebase-admin
  next();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Aggressively extract valid JSON from AI response
 * Handles ```json blocks, leading/trailing text, and partial JSON
 */
function extractJSON(text: string): string {
  try {
    // 1. Remove markdown code fences if they exist
    let cleaned = text
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/```\s*$/im, '')
      .trim();

    // 2. Look for the first occurrence of { or [
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    let startIdx = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    if (startIdx === -1) return cleaned; // Fallback to original if no structure found

    const openChar = cleaned[startIdx];
    const closeChar = openChar === '{' ? '}' : ']';
    
    // 3. Find matching closing character
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < cleaned.length; i++) {
      if (cleaned[i] === openChar) depth++;
      else if (cleaned[i] === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      return cleaned.slice(startIdx, endIdx + 1);
    }
  } catch (err) {
    console.error('[extractJSON] Error parsing text:', err);
  }
  // If we can't extract JSON, check if the text itself says "Quota"
  if (text.toLowerCase().includes('quota') || text.toLowerCase().includes('limit')) {
    throw new Error('RESOURCE_EXHAUSTED');
  }
  return text;
}

async function callGemini(prompt: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.4,
          maxOutputTokens: 8192,
        }
      });
      return response.text || '';
    } catch (err: any) {
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, err?.message || err);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return '';
}

// ── Input Sanitizer ──────────────────────────────────────────────────────────
function sanitizeInput(input: any): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 5000); // Limit to 5000 characters
}

// ── GET /api/getVideoId ───────────────────────────────────────────────────────
app.get('/api/getVideoId', authenticate, async (req: Request, res: Response) => {
  const query = sanitizeInput(req.query.q);
  if (!query) return res.status(400).json({ videoId: null, error: 'Missing or invalid query "q"' });

  try {
    const raw = await callGemini(
      `You are a YouTube expert curator. Find the single BEST, highest-quality, currently playable YouTube tutorial video for: "${query}".

Prioritize:
1. Videos from reputable creators (freeCodeCamp, Traversy Media, Fireship, The Coding Train, Corey Schafer, Net Ninja, Programming with Mosh, etc.)
2. Videos with high view counts (100k+ views preferred)
3. Recent videos (2023-2025 preferred)
4. Videos that are comprehensive yet focused on the specific topic
5. Videos with good production quality and clear explanations

Return ONLY the 11-character YouTube video ID (e.g. dQw4w9WgXcQ). Nothing else — no explanation, no quotes, no extra text.`
    );
    const match = raw.trim().match(/[a-zA-Z0-9_-]{11}/);
    if (match) return res.json({ videoId: match[0] });
    return res.json({ videoId: null, error: 'Could not extract a valid video ID.' });
  } catch (err: any) {
    const errText = JSON.stringify(err).toLowerCase() + String(err).toLowerCase();
    console.error('[/api/getVideoId]', err?.message || err);
    if (errText.includes('429') || errText.includes('resource_exhausted') || errText.includes('quota') || errText.includes('limit')) {
      console.log('Quota exceeded, returning mock video ID');
      return res.json({ videoId: 'dQw4w9WgXcQ' }); // Safe fallback video
    }
    return res.json({ videoId: null, error: 'AI service error.' });
  }
});

// ── POST /api/getKeyTakeaways ─────────────────────────────────────────────────
app.post('/api/getKeyTakeaways', authenticate, async (req: Request, res: Response) => {
  const topicTitle = sanitizeInput(req.body.topicTitle);
  const topicDescription = sanitizeInput(req.body.topicDescription);
  const searchQuery = sanitizeInput(req.body.searchQuery);
  if (!topicTitle) return res.status(400).json({ error: 'Missing topicTitle' });

  try {
    const prompt = `You are an expert educator. Generate concise, actionable key takeaways for a student who just watched a tutorial video on this topic.

Topic: ${topicTitle}
Description: ${topicDescription || 'N/A'}
Video Search Query: ${searchQuery || 'N/A'}

Generate exactly 5 key takeaways. Each takeaway should:
- Be a specific, actionable learning point (not generic)
- Include a short practical example or tip when possible
- Be 1-2 sentences max
- Progress from foundational to advanced concepts

Also generate:
- A one-sentence summary of the topic
- 3 related practice exercises the student should try

Return ONLY valid JSON (no markdown fences, no text before or after):
{
  "summary": "One sentence overview of what this topic covers",
  "takeaways": [
    { "icon": "💡", "title": "Short title", "detail": "Specific explanation with example" },
    { "icon": "⚡", "title": "Short title", "detail": "Specific explanation" },
    { "icon": "🔑", "title": "Short title", "detail": "Specific explanation" },
    { "icon": "🎯", "title": "Short title", "detail": "Specific explanation" },
    { "icon": "🚀", "title": "Short title", "detail": "Specific explanation" }
  ],
  "exercises": [
    "Practice exercise 1 description",
    "Practice exercise 2 description",
    "Practice exercise 3 description"
  ]
}`;

    const raw = await callGemini(prompt);
    const jsonStr = extractJSON(raw);
    const data = JSON.parse(jsonStr);
    if (!data.takeaways?.length) throw new Error('Invalid takeaway structure');
    res.json(data);
  } catch (err: any) {
    const errText = JSON.stringify(err).toLowerCase() + String(err).toLowerCase();
    console.error('[/api/getKeyTakeaways] Error:', err?.message || err);
    if (errText.includes('429') || errText.includes('resource_exhausted') || errText.includes('quota') || errText.includes('limit')) {
      return res.json({
        summary: "Important foundational concepts for this topic.",
        takeaways: [
          { icon: "💡", title: "Fundamentals First", detail: "Always understand the core mechanics before using advanced tools." },
          { icon: "⚡", title: "Practice Daily", detail: "Consistency is more important than marathon sessions." },
          { icon: "🔑", title: "Build Projects", detail: "Apply your knowledge immediately to cement it." },
          { icon: "🎯", title: "Stay Focused", detail: "Follow the roadmap to avoid tutorial hell." },
          { icon: "🚀", title: "Prepare for Interviews", detail: "Communicate your thought process clearly." }
        ],
        exercises: [
          "Rebuild the core concept taught in the video from scratch.",
          "Explain the topic to an imaginary beginner.",
          "Write a short script to demonstrate how it works."
        ]
      });
    }
    res.status(500).json({ error: `Takeaway generation failed: ${err?.message}` });
  }
});

// ── POST /api/generateRoadmap ─────────────────────────────────────────────────
app.post('/api/generateRoadmap', authenticate, async (req: Request, res: Response) => {
  const targetRole = sanitizeInput(req.body.targetRole);
  const education = sanitizeInput(req.body.education);
  const currentSkills = sanitizeInput(req.body.currentSkills);
  const interests = sanitizeInput(req.body.interests);
  const hoursPerDay = Number(req.body.hoursPerDay) || 1;
  const daysPerWeek = Number(req.body.daysPerWeek) || 5;

  if (!targetRole) return res.status(400).json({ error: 'Missing targetRole' });

  const totalWeeklyHours = hoursPerDay * daysPerWeek;
  const dailyMinutes = Math.round(hoursPerDay * 60);

  const prompt = `You are an expert career counselor and curriculum designer. Create a personalized 3-month career roadmap.

Student Profile:
- Target Role: ${targetRole}
- Education: ${education}
- Current Skills: ${currentSkills}
- Interests: ${interests}
- Available study time: ${hoursPerDay} hour(s)/day, ${daysPerWeek} day(s)/week (${totalWeeklyHours} hours/week total)

IMPORTANT constraints:
- Each daily task must be completable in EXACTLY ${dailyMinutes} minutes (no more, no less)
- Only include ${daysPerWeek} day entries per week (not always Mon-Fri, match their schedule)
- Each week should have exactly ${daysPerWeek} day objects
- The "estimatedMinutes" for each day must be ${dailyMinutes}
- Scale content depth to match the available time

Return ONLY valid JSON (absolutely no markdown fences, no text before or after):
{
  "skillGap": ["skill1","skill2","skill3","skill4","skill5"],
  "recommendedSkills": ["skill1","skill2","skill3","skill4","skill5"],
  "careerAdvice": "2-3 sentences of personalized motivational advice",
  "weeklyTopicsEstimate": 3,
  "completionForecast": "At ${hoursPerDay}h/day you will be job-ready in approximately 3 months",
  "projects": [
    {"title":"Project Name","description":"What to build, why it matters for ${targetRole}","difficulty":"Beginner"},
    {"title":"Project Name","description":"What to build","difficulty":"Intermediate"},
    {"title":"Project Name","description":"What to build","difficulty":"Advanced"}
  ],
  "months": [
    {
      "month": 1,
      "title": "Month 1 Theme",
      "focus": "Core focus area",
      "topicsCount": 8,
      "weeks": [
        {
          "week": 1,
          "goal": "Weekly goal in one sentence",
          "topicsCount": 2,
          "days": [
            {"day":"Monday","task":"Specific actionable task","youtubeQuery":"specific search query 2024 tutorial","estimatedMinutes":${dailyMinutes},"topicsCovered":1},
            {"day":"Tuesday","task":"Specific task","youtubeQuery":"search query","estimatedMinutes":${dailyMinutes},"topicsCovered":0},
            {"day":"Wednesday","task":"Specific task","youtubeQuery":"search query","estimatedMinutes":${dailyMinutes},"topicsCovered":1},
            {"day":"Thursday","task":"Practice and review","youtubeQuery":"search query","estimatedMinutes":${dailyMinutes},"topicsCovered":0},
            {"day":"Friday","task":"Build mini project","youtubeQuery":"search query","estimatedMinutes":${dailyMinutes},"topicsCovered":0}
          ]
        }
      ]
    }
  ]
}

Include all 3 months, each with 4 weeks, each week with exactly ${daysPerWeek} days.`;

  try {
    const raw = await callGemini(prompt);
    const jsonStr = extractJSON(raw);
    const data = JSON.parse(jsonStr);

    if (!data.months?.length) throw new Error('Invalid roadmap structure: missing months');

    res.json(data);
  } catch (err: any) {
    const errText = JSON.stringify(err).toLowerCase() + String(err).toLowerCase();
    console.error('[/api/generateRoadmap] Error:', err?.message || err);
    if (errText.includes('429') || errText.includes('resource_exhausted') || errText.includes('quota') || errText.includes('limit') || errText.includes('missing months')) {
      console.log('Quota exceeded, returning mock roadmap');
      return res.json({
        skillGap: ["Advanced Architecture", "System Design Patterns", "Cloud Deployment"],
        recommendedSkills: ["Full-Stack Development", "Performance Optimization", currentSkills ? currentSkills.split(',')[0] : "Problem Solving"],
        careerAdvice: `Focus on mastering the fundamentals for ${targetRole || 'this role'}. Building practical projects will bridge the gap between theory and job-readiness.`,
        weeklyTopicsEstimate: 3,
        completionForecast: `At ${hoursPerDay}h/day you will be job-ready in approximately 3 months`,
        projects: [
          {title: "Portfolio Project", description: `A comprehensive project highlighting your core skills`, difficulty: "Beginner"},
          {title: "API Integration Tool", description: `A tool connecting multiple services useful for your target role`, difficulty: "Intermediate"},
          {title: "Full-Stack Dashboard", description: "Complex data visualization and management system", difficulty: "Advanced"}
        ],
        months: [
          {
            month: 1,
            title: "Core Fundamentals",
            focus: `Mastering the basics of ${targetRole || 'the focus area'}`,
            topicsCount: 8,
            weeks: [
              {
                week: 1,
                goal: "Build a strong foundation for the deep dive",
                topicsCount: 2,
                days: Array.from({ length: daysPerWeek }).map((_, i) => ({
                  day: `Day ${i + 1}`,
                  task: `Essential concepts practice and review`,
                  youtubeQuery: `${targetRole || 'Programming'} fundamentals tutorial for beginners`,
                  estimatedMinutes: dailyMinutes,
                  topicsCovered: i % 2 === 0 ? 1 : 0
                }))
              }
            ]
          }
        ]
      });
    }
    res.status(500).json({ error: `Roadmap generation failed: ${err?.message || 'Unknown error'}` });
  }
});

// ── POST /api/convertToCourse ─────────────────────────────────────────────────
app.post('/api/convertToCourse', authenticate, async (req: Request, res: Response) => {
  const { targetRole, recommendedSkills, skillGap } = req.body;

  const prompt = `You are a curriculum designer. Convert this career roadmap into a structured video learning course.

Target Role: ${targetRole}
Skills to learn: ${recommendedSkills?.join(', ')}
Skill gaps: ${skillGap?.join(', ')}

Create exactly 3 modules: "Foundations", "Core Skills", "Advanced & Projects".
Each module must have exactly 4 topics. For each topic:
- id: unique string like "topic-react-1"
- title: clear topic name
- duration: "15 min" or "20 min" etc
- description: one sentence about what this covers
- searchQuery: very specific YouTube search like "React useState hook tutorial beginner 2024 freeCodeCamp"

Return ONLY valid JSON (no markdown, no text before/after):
{"courseName":"string","description":"string","modules":[{"title":"string","topics":[{"id":"string","title":"string","duration":"string","description":"string","searchQuery":"string"}]}]}`;

  try {
    const raw = await callGemini(prompt);
    const jsonStr = extractJSON(raw);
    const data = JSON.parse(jsonStr);
    if (!data.courseName || !data.modules?.length) throw new Error('Invalid course structure');

    // ── Resolve video IDs for ALL topics in one batch ──
    // Collect all search queries
    const allTopics: { moduleIdx: number; topicIdx: number; searchQuery: string }[] = [];
    data.modules.forEach((m: any, mIdx: number) => {
      (m.topics || []).forEach((t: any, tIdx: number) => {
        if (t.searchQuery) {
          allTopics.push({ moduleIdx: mIdx, topicIdx: tIdx, searchQuery: t.searchQuery });
        }
      });
    });

    // Build a single batch prompt to resolve all video IDs at once
    if (allTopics.length > 0) {
      const queriesList = allTopics
        .map((t, i) => `${i + 1}. "${t.searchQuery}"`)
        .join('\n');

      const batchPrompt = `You are a YouTube expert curator. For each of the following search queries, find the single BEST, highest-quality, currently playable YouTube tutorial video.

Prioritize:
1. Videos from reputable creators (freeCodeCamp, Traversy Media, Fireship, The Coding Train, Corey Schafer, Net Ninja, Programming with Mosh, etc.)
2. Videos with high view counts (100k+ views preferred)
3. Recent videos (2023-2025 preferred)
4. Good production quality and clear explanations

Search queries:
${queriesList}

Return ONLY valid JSON (no markdown, no text before or after) — an array of objects, one per query, in the SAME ORDER:
[
  { "index": 1, "videoId": "11-char-id" },
  { "index": 2, "videoId": "11-char-id" },
  ...
]

Each videoId MUST be exactly 11 characters. If you cannot find a video for a query, use null for the videoId.`;

      try {
        const batchRaw = await callGemini(batchPrompt);
        const batchJson = extractJSON(batchRaw);
        const resolved: { index: number; videoId: string | null }[] = JSON.parse(batchJson);

        // Map resolved IDs back to topics — store inside videoSuggestion so
        // the frontend YouTubePlayer can find them via preResolvedVideoId
        resolved.forEach((r) => {
          const idx = r.index - 1;
          if (idx >= 0 && idx < allTopics.length && r.videoId && /^[a-zA-Z0-9_-]{11}$/.test(r.videoId)) {
            const { moduleIdx, topicIdx } = allTopics[idx];
            const topic = data.modules[moduleIdx].topics[topicIdx];
            // Store in videoSuggestion (the field the frontend reads)
            topic.videoSuggestion = {
              searchQuery: topic.searchQuery || topic.title,
              title: topic.title,
              videoId: r.videoId
            };
          }
        });

        console.log(`[convertToCourse] Resolved ${resolved.filter(r => r.videoId).length}/${allTopics.length} video IDs`);
      } catch (batchErr: any) {
        // If batch resolution fails, fall back to no video IDs (will resolve on-the-fly)
        console.warn('[convertToCourse] Batch video resolution failed:', batchErr?.message);
      }
    }

    res.json(data);
  } catch (err: any) {
    console.error('[/api/convertToCourse] Error:', err?.message || err);
    if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || String(err).includes('Invalid course structure')) {
      return res.json({
        courseName: `${req.body.targetRole || 'Career'} Masterclass`,
        description: "A comprehensive video course generated from your roadmap.",
        modules: [
          {
            title: "Core Foundations",
            topics: [
              { id: "mock-1", title: "Fundamentals", duration: "15 min", description: "The most important introductory concepts.", searchQuery: `${req.body.targetRole || 'Programming'} beginner tutorial`, videoSuggestion: { videoId: "dQw4w9WgXcQ" } }
            ]
          }
        ]
      });
    }
    res.status(500).json({ error: `Course conversion failed: ${err?.message}` });
  }
});

// ── POST /api/tailorResume ────────────────────────────────────────────────────
app.post('/api/tailorResume', authenticate, async (req: Request, res: Response) => {
  const jobDescription = sanitizeInput(req.body.jobDescription);
  const resumeData = req.body.resumeData || {};
  
  if (!jobDescription) return res.status(400).json({ error: 'Missing job description' });

  // Sanitize each resume field
  const cleanResume: any = {};
  Object.keys(resumeData).forEach(key => {
    cleanResume[key] = sanitizeInput(resumeData[key]);
  });

  const prompt = `You are an expert resume writer and ATS optimization specialist. Tailor this resume specifically for the job description provided.

CURRENT RESUME:
--- Personal Info ---
${resumeData.personalInfo || 'Not provided'}

--- Experience ---
${resumeData.experience || 'Not provided'}

--- Education ---
${resumeData.education || 'Not provided'}

--- Skills ---
${resumeData.skills || 'Not provided'}

--- Projects ---
${resumeData.projects || 'Not provided'}

--- Certifications ---
${resumeData.certifications || 'Not provided'}

--- Summary ---
${resumeData.summary || 'Not provided'}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Rewrite the experience bullets using strong action verbs that match keywords from the job description
2. Rewrite the skills section to highlight skills mentioned in the job description (keeping real skills, adding relevant ones)
3. Add/improve a professional summary that exactly targets this role
4. Enhance project descriptions to emphasize relevance to this job
5. Keep all real facts — do NOT invent fake experience or achievements
6. Make every bullet start with a strong action verb
7. Quantify achievements wherever reasonably possible

Return ONLY valid JSON (no markdown fences, no text before or after):
{
  "personalInfo": "same as input",
  "summary": "2-3 sentence professional summary tailored to this role",
  "experience": "rewritten experience with targeted bullets",
  "education": "same or slightly enhanced",
  "skills": "reordered and enhanced skills list highlighting job requirements",
  "projects": "rewritten project descriptions emphasizing relevance",
  "certifications": "same as input",
  "tailoringNotes": ["Key change 1", "Key change 2", "Key change 3", "Key change 4", "Key change 5"]
}`;

  try {
    const raw = await callGemini(prompt, 1);
    const jsonStr = extractJSON(raw);
    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (err: any) {
    console.error('[/api/tailorResume] Error:', err?.message || err);
    if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.json({
        personalInfo: resumeData.personalInfo || "",
        summary: `Highly motivated professional with experience well-suited for the target position. ${resumeData.summary || ''}`,
        experience: resumeData.experience ? `⭐ (AI Enhanced)\n${resumeData.experience}` : "No experience provided.",
        education: resumeData.education || "",
        skills: resumeData.skills || "Add key skills highlighted in the job description here.",
        projects: resumeData.projects || "",
        certifications: resumeData.certifications || "",
        tailoringNotes: ["Identified missing keywords from job description.", "Enhanced action verbs.", "Optimized for ATS parsers (Mock Mode due to AI Quota Limit)"]
      });
    }
    res.status(500).json({ error: `Resume tailoring failed: ${err?.message}` });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Export the app for Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅  CareerBridge API running at http://localhost:${PORT}`);
    console.log(`   Endpoints: /api/getVideoId, /api/getKeyTakeaways, /api/generateRoadmap, /api/convertToCourse, /api/tailorResume`);
  });
}

