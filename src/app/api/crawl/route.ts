import { NextRequest, NextResponse } from 'next/server';

// A simple queue implementation for BFS crawling
class Queue<T> {
  private items: T[] = [];
  
  enqueue(item: T): void {
    this.items.push(item);
  }
  
  dequeue(): T | undefined {
    return this.items.shift();
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  contains(item: T): boolean {
    return this.items.includes(item);
  }
}

// Extract the domain from a URL
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch (error) {
    return '';
  }
}

// Check if a URL belongs to the same domain
function isSameDomain(url: string, domain: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
  } catch (error) {
    return false;
  }
}

// Extract links from HTML content
function extractLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1].trim();
      
      // Skip empty links, javascript, mailto, tel links
      if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        continue;
      }
      
      // Construct absolute URL
      const absoluteUrl = new URL(href, baseUrl).toString();
      links.push(absoluteUrl);
    } catch (error) {
      // Skip invalid URLs
      continue;
    }
  }
  
  return links;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { url, options } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Check if recursive crawling is requested
    const isRecursive = options?.recursive || false;
    const maxDepth = options?.maxDepth || 3; // Default max depth of 3
    const maxPages = options?.maxPages || 50; // Default max pages of 50
    const exportFormat = options?.exportFormat || 'json'; // Get the export format

    // For single page scraping
    if (!isRecursive) {
      return scrapeSinglePage(url, options);
    }
    
    // For recursive crawling
    return scrapeFullDomain(url, maxDepth, maxPages, options);
  } catch (error: any) {
    console.error('API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape the URL', 
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Function to scrape a single page
async function scrapeSinglePage(url: string, options: any) {
  try {
    // Fetch the HTML content of the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    // Get the HTML content
    const html = await response.text();

    // Extract metadata
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || '';
    const keywords = html.match(/<meta name="keywords" content="(.*?)"/i)?.[1] || '';
    
    // Extract text content
    const bodyText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                     .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                     .replace(/<[^>]*>/g, ' ')
                     .replace(/\s{2,}/g, ' ')
                     .trim();

    // Create simple markdown from HTML
    const markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<a href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, (match) => {
        return match
          .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
          .replace(/<[^>]*>/g, '')
          .trim() + '\n\n';
      })
      .replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, (match) => {
        let counter = 0;
        return match
          .replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${++counter}. $1\n`)
          .replace(/<[^>]*>/g, '')
          .trim() + '\n\n';
      })
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Extract image URLs
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const images = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      images.push(imgMatch[1]);
    }

    // Return the scraped content
    return NextResponse.json({
      success: true,
      data: {
        extractedContent: bodyText,
        markdown: markdown,
        cleanedHtml: html,
        metadata: {
          title,
          description,
          keywords,
          url,
          images: images.slice(0, 10) // Limit to 10 images
        },
        screenshot: null,
      }
    });
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  }
}

// Function to recursively crawl an entire domain
async function scrapeFullDomain(startUrl: string, maxDepth: number, maxPages: number, options: any) {
  const domain = extractDomain(startUrl);
  const exportFormat = options?.exportFormat || 'json';
  
  if (!domain) {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    );
  }
  
  const visitedUrls = new Set<string>();
  const urlQueue = new Queue<{ url: string; depth: number }>();
  const crawledPages: Array<{
    url: string;
    title: string;
    content: string;
    markdown: string;
    html: string;
    links: string[];
  }> = [];
  
  // Add the starting URL to the queue
  urlQueue.enqueue({ url: startUrl, depth: 0 });
  
  while (!urlQueue.isEmpty() && crawledPages.length < maxPages) {
    const current = urlQueue.dequeue();
    
    if (!current) break;
    
    const { url, depth } = current;
    
    // Skip if we've already visited this URL
    if (visitedUrls.has(url)) {
      continue;
    }
    
    // Mark as visited
    visitedUrls.add(url);
    
    try {
      console.log(`Crawling ${url} (depth: ${depth})`);
      
      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: ${response.status}`);
        continue;
      }
      
      // Get HTML content
      const html = await response.text();
      
      // Extract title
      const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
      
      // Extract text content
      const bodyText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/\s{2,}/g, ' ')
                      .trim();

      // Create simple markdown from HTML
      const markdown = html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
        .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
        .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<a href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, (match) => {
          return match
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<[^>]*>/g, '')
            .trim() + '\n\n';
        })
        .replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, (match) => {
          let counter = 0;
          return match
            .replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${++counter}. $1\n`)
            .replace(/<[^>]*>/g, '')
            .trim() + '\n\n';
        })
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Extract all links
      const links = extractLinks(html, url);
      
      // Store the crawled page data
      crawledPages.push({
        url,
        title,
        content: bodyText,
        markdown,
        html, // Store the HTML content for export
        links,
      });
      
      // If we haven't reached the maximum depth, add all same-domain links to the queue
      if (depth < maxDepth) {
        for (const link of links) {
          if (isSameDomain(link, domain) && !visitedUrls.has(link)) {
            urlQueue.enqueue({ url: link, depth: depth + 1 });
          }
        }
      }
      
      // Throttle requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, options?.delay || 500));
      
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      // Continue with the next URL
      continue;
    }
  }
  
  return NextResponse.json({
    success: true,
    data: {
      domainCrawl: true,
      domain,
      pagesCount: crawledPages.length,
      visitedUrls: Array.from(visitedUrls),
      pages: crawledPages,
      exportFormat, // Include the export format in the response
    }
  });
} 