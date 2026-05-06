import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      // Fallback
      return NextResponse.json({
        improvedTitle: title.length < 50 ? `${title}: A Complete Guide` : title,
        metaDescription: content ? content.replace(/[#*`]/g, '').substring(0, 155).trim() + '...' : `Learn everything about ${title} in this comprehensive guide.`,
        keywords: ['blogify', 'guide', 'tips', 'content'],
        seoScore: 85,
      });
    }

    const prompt = `Analyze the following blog post title and content to provide SEO suggestions.
Title: "${title}"
Content: "${content || 'No content yet'}"

Return ONLY a valid JSON object with the following structure, no markdown blocks, no extra text:
{
  "improvedTitle": "A more catchy and SEO-friendly version of the title",
  "metaDescription": "A compelling meta description (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "seoScore": 85
}
`;

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
      maxTokens: 500,
    });

    // Parse JSON safely
    let result;
    try {
      const jsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse SEO JSON', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI SEO error:', error);
    return NextResponse.json({ error: 'Failed to generate SEO suggestions' }, { status: 500 });
  }
}
