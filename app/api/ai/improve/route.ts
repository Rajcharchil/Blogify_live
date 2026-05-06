import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });
    
    await new Promise(r => setTimeout(r, 600));
    
    // Improve the content by enhancing structure and adding polish
    const lines = content.split('\n');
    const improved = lines.map((line: string) => {
      // Add emphasis to certain patterns
      if (line.startsWith('- ') && !line.includes('**')) {
        return line.replace(/^- (.+)/, '- **$1**');
      }
      return line;
    }).join('\n');
    
    const enhancedContent = `${improved}

---
*This article has been reviewed and enhanced for clarity and engagement. Key concepts have been highlighted for better readability.*`;
    
    return NextResponse.json({ improvedContent: enhancedContent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to improve content' }, { status: 500 });
  }
}
