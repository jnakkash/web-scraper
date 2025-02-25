import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

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

// Detect if a URL is an image based on extension or content type
function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return imageExtensions.includes(extension);
}

// Detect if a URL is a downloadable file (non-HTML)
function isDownloadableFile(url: string): boolean {
  const fileExtensions = [
    // Documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv',
    // Archives
    '.zip', '.rar', '.7z', '.tar', '.gz',
    // Media
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.flv', '.wmv',
    // Images (already covered by isImageUrl, but included for completeness)
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
    // Other
    '.json', '.xml', '.rss', '.atom'
  ];
  
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return fileExtensions.includes(extension);
}

// Get file type category based on extension
function getFileCategory(url: string): string {
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'].includes(extension)) {
    return 'images';
  } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv'].includes(extension)) {
    return 'documents';
  } else if (['.mp3', '.wav', '.ogg', '.flac'].includes(extension)) {
    return 'audio';
  } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(extension)) {
    return 'videos';
  } else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) {
    return 'archives';
  } else {
    return 'other';
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

// Extract image URLs from HTML content
function extractImageUrls(html: string, baseUrl: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  const imageUrls: string[] = [];
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    try {
      const src = match[1].trim();
      
      if (!src) continue;
      
      // Construct absolute URL
      const absoluteUrl = new URL(src, baseUrl).toString();
      imageUrls.push(absoluteUrl);
    } catch (error) {
      // Skip invalid URLs
      continue;
    }
  }
  
  return imageUrls;
}

// Extract files from other tags (like video, audio, source, link, etc.)
function extractOtherFileUrls(html: string, baseUrl: string): string[] {
  const fileUrls: string[] = [];
  
  // Video sources
  const videoSrcRegex = /<source[^>]+src=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = videoSrcRegex.exec(html)) !== null) {
    try {
      const absoluteUrl = new URL(match[1].trim(), baseUrl).toString();
      fileUrls.push(absoluteUrl);
    } catch (error) {
      continue;
    }
  }
  
  // Audio sources
  const audioSrcRegex = /<audio[^>]+src=["']([^"']+)["'][^>]*>/g;
  while ((match = audioSrcRegex.exec(html)) !== null) {
    try {
      const absoluteUrl = new URL(match[1].trim(), baseUrl).toString();
      fileUrls.push(absoluteUrl);
    } catch (error) {
      continue;
    }
  }
  
  // Link tags (stylesheets, etc.)
  const linkHrefRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/g;
  while ((match = linkHrefRegex.exec(html)) !== null) {
    try {
      const href = match[1].trim();
      if (isDownloadableFile(href)) {
        const absoluteUrl = new URL(href, baseUrl).toString();
        fileUrls.push(absoluteUrl);
      }
    } catch (error) {
      continue;
    }
  }
  
  return fileUrls;
}

// Download and save a file
async function downloadFile(url: string, domain: string, saveFiles: boolean): Promise<{ success: boolean, filePath: string | null, size: number, category: string }> {
  if (!saveFiles) {
    return { 
      success: false, 
      filePath: null, 
      size: 0, 
      category: getFileCategory(url) 
    };
  }
  
  try {
    // Create directory structure if it doesn't exist
    const category = getFileCategory(url);
    const downloadsDir = path.join(process.cwd(), 'public', 'downloads', domain, category);
    
    try {
      fs.mkdirSync(downloadsDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${downloadsDir}:`, error);
      return { success: false, filePath: null, size: 0, category };
    }
    
    // Get filename from URL
    const urlObj = new URL(url);
    let filename = path.basename(urlObj.pathname);
    
    // If filename is empty or doesn't have an extension, generate one
    if (!filename || filename === '/' || !path.extname(filename)) {
      const timestamp = Date.now();
      const extension = category === 'images' ? '.jpg' : '.bin';
      filename = `file_${timestamp}${extension}`;
    }
    
    // Generate unique filename to avoid overwriting
    let uniqueFilename = filename;
    let counter = 1;
    while (fs.existsSync(path.join(downloadsDir, uniqueFilename))) {
      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      uniqueFilename = `${name}_${counter}${ext}`;
      counter++;
    }
    
    const filePath = path.join(downloadsDir, uniqueFilename);
    const relativeFilePath = path.join('downloads', domain, category, uniqueFilename);
    
    // Fetch the file
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Get file content as ArrayBuffer
    const fileBuffer = await response.arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    
    // Save the file - Fixed to use proper Node.js Buffer
    fs.writeFileSync(filePath, Buffer.from(fileBuffer));
    
    return { 
      success: true, 
      filePath: relativeFilePath, 
      size: fileSize,
      category 
    };
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error);
    return { 
      success: false, 
      filePath: null, 
      size: 0,
      category: getFileCategory(url) 
    };
  }
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
    const downloadFiles = options?.downloadFiles !== false; // Default to true
    const downloadImages = options?.downloadImages !== false; // Default to true
    const maxFileSize = options?.maxFileSize || 50 * 1024 * 1024; // Default 50MB max file size

    // For single page scraping
    if (!isRecursive) {
      return scrapeSinglePage(url, { ...options, downloadFiles, downloadImages, maxFileSize });
    }
    
    // For recursive crawling
    return scrapeFullDomain(url, maxDepth, maxPages, { ...options, downloadFiles, downloadImages, maxFileSize });
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
    const domain = extractDomain(url);

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
    const imageUrls = extractImageUrls(html, url);
    
    // Extract other file URLs
    const otherFileUrls = extractOtherFileUrls(html, url);
    
    // Download images if enabled
    const downloadedImages = [];
    if (options.downloadImages) {
      for (const imageUrl of imageUrls.slice(0, 30)) { // Limit to 30 images per page
        const downloadResult = await downloadFile(imageUrl, domain, true);
        if (downloadResult.success) {
          downloadedImages.push({
            originalUrl: imageUrl,
            localPath: downloadResult.filePath,
            size: downloadResult.size
          });
        }
      }
    }
    
    // Download other files if enabled
    const downloadedFiles = [];
    if (options.downloadFiles) {
      for (const fileUrl of otherFileUrls.slice(0, 15)) { // Limit to 15 other files per page
        const downloadResult = await downloadFile(fileUrl, domain, true);
        if (downloadResult.success) {
          downloadedFiles.push({
            originalUrl: fileUrl,
            localPath: downloadResult.filePath,
            size: downloadResult.size,
            category: downloadResult.category
          });
        }
      }
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
          images: imageUrls.slice(0, 10) // Limit to 10 image URLs in metadata
        },
        screenshot: null,
        downloads: {
          images: downloadedImages,
          files: downloadedFiles
        }
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
    downloadedImages: any[];
    downloadedFiles: any[];
  }> = [];
  
  // Track all downloaded files
  const allDownloadedImages: any[] = [];
  const allDownloadedFiles: any[] = [];
  
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
    
    // Skip file URLs that would be downloaded separately
    if (isDownloadableFile(url) && !isImageUrl(url)) {
      if (options.downloadFiles) {
        const downloadResult = await downloadFile(url, domain, true);
        if (downloadResult.success) {
          allDownloadedFiles.push({
            originalUrl: url,
            localPath: downloadResult.filePath,
            size: downloadResult.size,
            category: downloadResult.category
          });
        }
      }
      visitedUrls.add(url);
      continue;
    }
    
    // Skip image URLs that should be downloaded separately
    if (isImageUrl(url)) {
      if (options.downloadImages) {
        const downloadResult = await downloadFile(url, domain, true);
        if (downloadResult.success) {
          allDownloadedImages.push({
            originalUrl: url,
            localPath: downloadResult.filePath,
            size: downloadResult.size
          });
        }
      }
      visitedUrls.add(url);
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
      
      // Extract image URLs
      const imageUrls = extractImageUrls(html, url);
      
      // Extract other file URLs
      const fileUrls = extractOtherFileUrls(html, url);
      
      // Download images for this page
      const pageDownloadedImages = [];
      if (options.downloadImages) {
        for (const imageUrl of imageUrls.slice(0, 20)) { // Limit to 20 images per page
          // Skip if we've already downloaded this image
          if (allDownloadedImages.some(img => img.originalUrl === imageUrl)) {
            continue;
          }
          
          const downloadResult = await downloadFile(imageUrl, domain, true);
          if (downloadResult.success) {
            const downloadedImage = {
              originalUrl: imageUrl,
              localPath: downloadResult.filePath,
              size: downloadResult.size
            };
            pageDownloadedImages.push(downloadedImage);
            allDownloadedImages.push(downloadedImage);
          }
        }
      }
      
      // Download other files for this page
      const pageDownloadedFiles = [];
      if (options.downloadFiles) {
        for (const fileUrl of fileUrls.slice(0, 10)) { // Limit to 10 files per page
          // Skip if we've already downloaded this file
          if (allDownloadedFiles.some(file => file.originalUrl === fileUrl)) {
            continue;
          }
          
          const downloadResult = await downloadFile(fileUrl, domain, true);
          if (downloadResult.success) {
            const downloadedFile = {
              originalUrl: fileUrl,
              localPath: downloadResult.filePath,
              size: downloadResult.size,
              category: downloadResult.category
            };
            pageDownloadedFiles.push(downloadedFile);
            allDownloadedFiles.push(downloadedFile);
          }
        }
      }
      
      // Store the crawled page data
      crawledPages.push({
        url,
        title,
        content: bodyText,
        markdown,
        html, // Store the HTML content for export
        links,
        downloadedImages: pageDownloadedImages,
        downloadedFiles: pageDownloadedFiles
      });
      
      // If we haven't reached the maximum depth, add all same-domain links to the queue
      if (depth < maxDepth) {
        for (const link of links) {
          if (isSameDomain(link, domain) && !visitedUrls.has(link)) {
            urlQueue.enqueue({ url: link, depth: depth + 1 });
          }
        }
        
        // Add relevant file URLs to the queue for downloading (but not for crawling HTML content)
        for (const fileUrl of [...imageUrls, ...fileUrls]) {
          if (isSameDomain(fileUrl, domain) && !visitedUrls.has(fileUrl)) {
            urlQueue.enqueue({ url: fileUrl, depth: depth + 1 });
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
  
  // Calculate downloads statistics
  const downloadStats = {
    totalImages: allDownloadedImages.length,
    totalFiles: allDownloadedFiles.length,
    totalSize: allDownloadedImages.reduce((sum, img) => sum + img.size, 0) + 
              allDownloadedFiles.reduce((sum, file) => sum + file.size, 0),
    filesByCategory: {} as Record<string, number>
  };
  
  // Group files by category
  allDownloadedFiles.forEach(file => {
    const category = file.category || 'other';
    if (!downloadStats.filesByCategory[category]) {
      downloadStats.filesByCategory[category] = 0;
    }
    downloadStats.filesByCategory[category]++;
  });
  
  return NextResponse.json({
    success: true,
    data: {
      domainCrawl: true,
      domain,
      pagesCount: crawledPages.length,
      visitedUrls: Array.from(visitedUrls),
      pages: crawledPages,
      downloads: {
        images: allDownloadedImages,
        files: allDownloadedFiles,
        stats: downloadStats
      },
      exportFormat, // Include the export format in the response
    }
  });
} 