import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest, NextResponse } from 'next/server'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

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
}

export async function POST(request: NextRequest) {
  try {
    const { topic, category, includeImage } = await request.json()

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: topic and category' },
        { status: 400 }
      )
    }

    // Generate blog title
    const titlePrompt = `Create a catchy and relevant blog title for this ${category} topic: "${topic}". Just provide the title, nothing else.`
    const { text: title } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: titlePrompt,
      maxTokens: 100,
    })

    // Generate blog content
    const contentPrompt = `${CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.tech}

Topic: "${topic}"

Write a comprehensive blog post (800-1000 words) that is engaging, informative, and well-structured. Use markdown formatting with headers for sections.`

    const { text: content } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: contentPrompt,
      maxTokens: 2000,
    })

    // Prepare response
    const blogData = {
      title: title.trim(),
      content: content.trim(),
      category: category,
      imageUrl: includeImage ? `/api/generate-image?topic=${encodeURIComponent(topic)}` : undefined,
    }

    return NextResponse.json(blogData)
  } catch (error) {
    console.error('Blog generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog' },
      { status: 500 }
    )
  }
}
