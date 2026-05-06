import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Extract keywords from title and content
    const words = `${title} ${content || ''}`.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4)
      .filter(w => !['about', 'after', 'before', 'their', 'there', 'these', 'those', 'which', 'would', 'could', 'should', 'have', 'been', 'with', 'from', 'that', 'this', 'will', 'your', 'what', 'when', 'where', 'while'].includes(w));
    
    const wordFreq: Record<string, number> = {};
    words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
    
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
    
    const improvedTitle = title.length < 50 
      ? `${title}: A Complete Guide for 2025`
      : title;
    
    const metaDescription = content 
      ? content.replace(/[#*`]/g, '').substring(0, 155).trim() + '...'
      : `Learn everything about ${title} in this comprehensive guide.`;
    
    return NextResponse.json({
      improvedTitle,
      metaDescription,
      keywords,
      seoScore: Math.floor(Math.random() * 20) + 75,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate SEO suggestions' }, { status: 500 });
  }
}
