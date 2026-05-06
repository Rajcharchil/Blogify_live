import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      // Fallback if no API key
      const lines = content.split('\n');
      const improved = lines.map((line: string) => {
        if (line.startsWith('- ') && !line.includes('**')) {
          return line.replace(/^- (.+)/, '- **$1**');
        }
        return line;
      }).join('\n');
      return NextResponse.json({ improvedContent: improved + '\n\n*Note: Add GROQ API key for AI improvements.*' });
    }

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `Please improve the following blog content. Enhance its structure, clarity, and engagement. Make it sound professional yet accessible. Do not change the core meaning, just improve the writing quality and fix any grammatical errors. Return only the improved content, using markdown formatting.\n\nContent to improve:\n${content}`,
      maxTokens: 2000,
    });

    return NextResponse.json({ improvedContent: text.trim() });
  } catch (error) {
    console.error('AI Improve error:', error);
    return NextResponse.json({ error: 'Failed to improve content' }, { status: 500 });
  }
}
