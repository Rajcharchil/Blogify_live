import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ reply: 'Please send a message.' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Fallback if no API key
    if (!apiKey) {
      return NextResponse.json({
        reply: getFallbackReply(message),
      });
    }

    const systemPrompt = `You are Blogify AI, a helpful assistant for the BLOGIFY platform.
BLOGIFY is an AI-powered blogging and live streaming platform.

You help users with:
- Blog writing tips and ideas
- SEO optimization advice  
- Content strategy
- How to use BLOGIFY features (create blog, go live, dashboard)
- General writing and creativity advice

Keep responses concise (2-4 sentences max unless user asks for details).
Be friendly, helpful, and encouraging.
If asked about something unrelated to blogging/writing/content, 
politely redirect to your area of expertise.`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        reply: getFallbackReply(message),
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || getFallbackReply(message);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({
      reply: 'Sorry, I am having trouble right now. Please try again!',
    });
  }
}

function getFallbackReply(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('blog') || msg.includes('write') || msg.includes('article')) {
    return 'To create a blog on BLOGIFY, go to the Create page, enter your title, select a category, and click "Generate First Draft" to let AI write for you!';
  }
  if (msg.includes('live') || msg.includes('stream')) {
    return 'To go live on BLOGIFY, click the "GO LIVE" button in the header, fill in your stream title, and click "Continue to Studio". Your audience can join via the stream link!';
  }
  if (msg.includes('seo')) {
    return 'Use the "Optimize for Discovery" button in the blog editor to get AI-powered SEO suggestions including title, meta description, and keywords!';
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hello! I am Blogify AI. I can help you with blog writing tips, SEO advice, and how to use BLOGIFY features. What would you like to know?';
  }
  return 'I am here to help with your blogging journey! Ask me about writing tips, SEO, blog ideas, or how to use any BLOGIFY feature.';
}
