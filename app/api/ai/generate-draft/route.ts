import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest, NextResponse } from 'next/server'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const CATEGORY_PROMPTS: Record<string, string> = {
  tech: 'Write a professional and engaging blog post about the following technology topic. Include insights, trends, practical advice, and industry analysis.',
  life: 'Write an inspiring and relatable blog post about the following lifestyle topic. Include personal insights, practical tips, and motivation.',
  travel: 'Write an engaging travel blog post with tips, recommendations, and vivid descriptions.',
  food: 'Write a mouthwatering food blog with recipes, techniques, and tips.',
  health: 'Write a health blog with scientific insights, fitness tips, and wellness advice.',
  business: 'Write a strategic business blog with insights, case studies, and actionable advice.',
  education: 'Write an educational blog with study tips and learning strategies.',
  entertainment: 'Write an engaging entertainment blog with reviews and fun facts.',
  sports: 'Write a sports blog with analysis, insights, and updates.',
  gaming: 'Write a gaming blog with reviews, tips, and news.',
  arts: 'Write an arts and culture blog with creative insights and context.',
  science: 'Write a science blog with explanations and real-world applications.',
}

export async function POST(request: NextRequest) {
  try {
    const { topic, category, includeImage } = await request.json()

    // ✅ Validation
    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: topic and category' },
        { status: 400 }
      )
    }

    // ✅ Check API key
    const isApiKeyMissing =
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === 'your_groq_api_key_here'

    // ✅ Fallback (DEV MODE)
    if (isApiKeyMissing) {
      console.warn('⚠️ GROQ API key missing → using mock data')

      const title = `Demo Blog: ${topic}`

      return NextResponse.json({
        title,
        content: `# ${title}

## Introduction
This is a demo blog for **${topic}**.

## Why it matters
${topic} is an important concept in the **${category}** domain.

## Key Points
- Easy to understand
- Fast generation
- Works without API key

## Conclusion
Add your GROQ API key to get real AI-generated blogs 🚀
        `,
        category,
        imageUrl: includeImage
          ? `/api/generate-image?topic=${encodeURIComponent(topic)}`
          : undefined,
      })
    }

    // ✅ Generate Title
    const { text: title } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `Create a catchy blog title for this ${category} topic: "${topic}". Only return the title.`,
      maxTokens: 50,
    })

    // ✅ Generate Content
    const { text: content } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `
${CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.tech}

Topic: "${topic}"

Write a detailed blog (800–1000 words) with:
- Proper headings
- Clear structure
- Markdown formatting
`,
      maxTokens: 2000,
    })

    // ✅ Final Response
    return NextResponse.json({
      title: title.trim(),
      content: content.trim(),
      category,
      imageUrl: includeImage
        ? `/api/generate-image?topic=${encodeURIComponent(topic)}`
        : undefined,
    })

  } catch (error) {
    console.error('❌ Blog generation error:', error)

    return NextResponse.json(
      { error: 'Failed to generate blog' },
      { status: 500 }
    )
  }
}