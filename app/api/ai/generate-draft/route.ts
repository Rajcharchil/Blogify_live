import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, category, title, userId } = body;
    const promptTopic = topic || title || 'interesting topic';
    const promptCategory = category || 'general';

    console.log('Generating draft for:', promptTopic, promptCategory);

    // Check API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('No API key - returning fallback');
      return NextResponse.json(getFallback(promptTopic, promptCategory));
    }

    // Call Groq API directly with fetch
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: `Write a comprehensive blog post about "${promptTopic}" in category "${promptCategory}".

Return ONLY valid JSON with these fields:
{
  "title": "engaging blog title",
  "content": "full blog post in markdown with ## headings, 500-700 words",
  "excerpt": "2 sentence summary"
}

Make it engaging, informative, and well-structured.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    console.log('Groq response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', errText);
      return NextResponse.json(getFallback(promptTopic, promptCategory));
    }

    const groqData = await groqResponse.json();
    const messageContent = groqData.choices?.[0]?.message?.content || '';

    console.log('Groq raw response length:', messageContent.length);

    // Parse JSON from response
    let parsed: any = {};
    try {
      // Remove markdown code blocks if present
      const cleaned = messageContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.log('JSON parse failed, using raw content');
      parsed = {
        title: `Guide to ${promptTopic}`,
        content: messageContent,
        excerpt: `Learn about ${promptTopic}`,
      };
    }

    return NextResponse.json({
      title: parsed.title || `Guide to ${promptTopic}`,
      content: parsed.content || messageContent,
      excerpt: parsed.excerpt || `A comprehensive guide about ${promptTopic}`,
      category: promptCategory,
      imageUrl: null,
    });

  } catch (error: any) {
    console.error('Generate draft error:', error?.message || error);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(
      getFallback(body.topic || body.title || 'topic', body.category)
    );
  }
}

function getFallback(topic: string, category: string = 'general') {
  return {
    title: `The Complete Guide to ${topic}`,
    content: `# The Complete Guide to ${topic}

## Introduction

${topic} is a fascinating subject that has gained significant attention in recent years. In this comprehensive guide, we will explore everything you need to know to get started and excel.

## Why ${topic} Matters

Understanding ${topic} can transform the way you approach problems and create solutions. Whether you are a beginner or an experienced professional, there is always something new to discover.

## Key Concepts

### Getting Started
The first step is to understand the fundamentals. Take your time to build a solid foundation before moving to advanced topics.

### Best Practices
- Always start with clear goals in mind
- Learn from real-world examples and case studies
- Practice consistently to build your skills
- Connect with a community of like-minded people

### Common Mistakes to Avoid
Many beginners make the same mistakes. Being aware of them early can save you significant time and effort.

## Practical Applications

The real value of ${topic} becomes clear when you start applying it to real-world situations. Start with small projects and gradually take on more complex challenges.

## Conclusion

${topic} offers incredible opportunities for those willing to invest time in learning it properly. Start your journey today and see where it takes you.`,
    excerpt: `A comprehensive guide covering everything you need to know about ${topic}.`,
    category,
    imageUrl: null,
  };
}