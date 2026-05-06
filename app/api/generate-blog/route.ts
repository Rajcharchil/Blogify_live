import { NextRequest, NextResponse } from 'next/server';

const CATEGORY_PROMPTS: Record<string, string> = {
  tech: 'Write a professional and engaging blog post about the following technology topic. Include insights, trends, practical advice, and industry analysis. Format with clear sections and paragraphs.',
  life: 'Write an inspiring and relatable blog post about the following lifestyle topic. Include personal insights, practical tips, and motivational elements. Use a conversational, friendly tone.',
  travel: 'Write an entertaining and informative travel blog post about the following destination or travel topic. Include practical tips, local recommendations, vivid descriptions, and travel hacks.',
  food: 'Write a delicious and engaging food blog post about the following culinary topic. Include recipes, cooking techniques, ingredient tips, and food recommendations. Make it mouthwatering and practical!',
  health: 'Write an informative and helpful blog post about the following health and fitness topic. Include scientific insights, expert tips, exercise routines, and wellness advice. Keep it accessible and evidence-based.',
  business: 'Write a professional and strategic blog post about the following business topic. Include industry insights, actionable strategies, case studies, and expert recommendations for entrepreneurs and business leaders.',
  education: 'Write an educational and engaging blog post about the following learning topic. Include useful tips, study techniques, educational resources, and practical advice for students and learners.',
  entertainment: 'Write an entertaining and engaging blog post about the following entertainment topic. Include reviews, recommendations, industry insights, and fun facts. Keep it lively and engaging!',
  sports: 'Write an exciting and informative blog post about the following sports topic. Include expert analysis, player insights, game strategies, and sports news. Appeal to both casual fans and enthusiasts.',
  gaming: 'Write an engaging and comprehensive blog post about the following gaming topic. Include game reviews, strategy guides, gaming news, and tips for players. Keep it enthusiastic and detailed!',
  arts: 'Write a thoughtful and inspiring blog post about the following arts and culture topic. Include historical context, artist insights, cultural significance, and creative inspiration.',
  science: 'Write an informative and fascinating blog post about the following science topic. Include scientific explanations, recent discoveries, research insights, and practical applications in everyday life.',
};

export async function POST(request: NextRequest) {
  try {
    const { topic, category, includeImage } = await request.json();

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: topic and category' },
        { status: 400 }
      );
    }

    console.log('Generating full blog for:', topic, category);

    // Check API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('No API key - returning fallback');
      return NextResponse.json(getFallback(topic, category, includeImage));
    }

    // Call Groq API for Title
    const titlePrompt = `Create a catchy and relevant blog title for this ${category} topic: "${topic}". Just provide the title, nothing else.`;
    const titleResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: titlePrompt }],
        max_tokens: 100,
      }),
    });

    let title = topic;
    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      title = titleData.choices?.[0]?.message?.content?.trim() || topic;
    }

    // Call Groq API for Content
    const contentPrompt = `${CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.tech}

Topic: "${topic}"

Write a comprehensive blog post (800-1000 words) that is engaging, informative, and well-structured. Use markdown formatting with headers for sections.`;

    const contentResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: contentPrompt }],
        max_tokens: 2000,
      }),
    });

    console.log('Groq response status (content):', contentResponse.status);

    if (!contentResponse.ok) {
      const errText = await contentResponse.text();
      console.error('Groq API error:', errText);
      return NextResponse.json(getFallback(topic, category, includeImage));
    }

    const contentData = await contentResponse.json();
    const content = contentData.choices?.[0]?.message?.content?.trim() || '';

    console.log('Groq raw response length:', content.length);

    // Prepare response
    const blogData = {
      title: title,
      content: content,
      category: category,
      imageUrl: includeImage ? `/api/generate-image?topic=${encodeURIComponent(topic)}` : undefined,
    };

    return NextResponse.json(blogData);
  } catch (error: any) {
    console.error('Blog generation error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to generate blog' },
      { status: 500 }
    );
  }
}

function getFallback(topic: string, category: string, includeImage: boolean) {
  return {
    title: `Exploring ${topic}: A Deep Dive`,
    content: `# Exploring ${topic}: A Deep Dive

## Introduction

${topic} is an essential aspect of the modern ${category} landscape. In this post, we explore its impact and the reasons why it is capturing so much attention right now.

## Key Insights

1. **Innovation**: People are continually finding new ways to approach this.
2. **Growth**: The sheer scale of development is staggering.
3. **Community**: Enthusiasts and professionals alike are sharing knowledge.

## Practical Steps Forward

If you're just getting started with ${topic}, the best approach is to dive in. Read resources, practice consistently, and never stop experimenting.

## Conclusion

The future of ${topic} looks incredibly bright. By staying informed and engaged, you can make the most out of what it has to offer.`,
    category,
    imageUrl: includeImage ? `/api/generate-image?topic=${encodeURIComponent(topic)}` : undefined,
  };
}
