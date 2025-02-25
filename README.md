# Web Scraper for ML Dataset Generation

A powerful web application for extracting content from websites and building machine learning datasets. This enhanced web scraper extracts text, converts HTML to structured formats, and provides comprehensive domain crawling.

## Features

- 🌐 **Single URL Scraping**: Extract content from any individual web page
- 🔍 **Full Domain Crawling**: Recursively crawl entire domains to extract all available content
- 📊 **ML Dataset Generation**: Export data in formats optimized for machine learning training
- 📝 **Multiple Format Support**: Extract content as plain text, markdown, or HTML
- 🧠 **Metadata Extraction**: Collect titles, descriptions, keywords and other metadata
- 🔗 **Link Discovery**: Identify and follow links within the same domain
- 📦 **Data Export**: Download scraped content in JSON, Text, or Markdown formats

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Data Processing**: Custom HTML parsing and content extraction
- **Crawling Logic**: Breadth-first search algorithm for efficient domain traversal

## Setup and Installation

1. Clone the repository
```bash
git clone <repository-url>
cd web-scraper-app
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Single Page Scraping
1. Enter a URL in the input field
2. Keep "Enable full domain crawling" unchecked
3. Click "Scrape" to extract content from that specific URL
4. View the extracted content in various formats (Content, Markdown, HTML, Metadata)
5. Click "Export Data for ML" to download the data

### Full Domain Crawling
1. Enter the starting URL for your domain
2. Check "Enable full domain crawling" under Advanced Options
3. Configure crawling parameters:
   - Max Crawl Depth: How many links deep to crawl (1-10)
   - Max Pages: Maximum number of pages to crawl (10-500)
   - Request Delay: Time between requests to avoid overloading servers
   - Respect robots.txt: Follow website crawling rules
4. Select your preferred export format:
   - JSON: Complete dataset with all metadata
   - Text: Clean text content only
   - Markdown: Formatted content preserving basic structure
   - HTML: Raw HTML content
5. Click "Scrape" to start the domain crawling process
6. Review the extracted data in the Domain Crawl Results view
7. Click "Export Dataset for ML Training" to download all content

## Advanced Usage for Machine Learning

This web scraper is specifically designed to help create high-quality training datasets for machine learning models:

### Text Generation Models
- Use the Markdown export format to preserve document structure
- Crawl entire documentation sites to build domain-specific training data
- Extract clean text content from multiple pages to build a corpus

### Classification and NLP
- Use the JSON export with metadata for labeled datasets
- Extract content from multiple categories within a website
- Build training datasets with structured article content and metadata

### Web Mining and Analysis
- Extract and analyze link structures within domains
- Compare content across different sections of websites
- Build knowledge graphs from web content

## Project Structure

- `src/app/page.tsx`: Main application UI
- `src/app/api/crawl/route.ts`: API endpoint for web scraping & crawling
- `src/components/UrlInputForm.tsx`: URL input with advanced options
- `src/components/ScrapedContent.tsx`: Display component for single page results
- `src/components/DomainCrawlResults.tsx`: Display component for full domain crawl results

## Educational and Research Purposes

This web scraper is intended for educational and research purposes to demonstrate:
- How to build a Next.js application with API routes
- Techniques for basic web scraping and content extraction
- How to implement breadth-first search for web crawling
- Creating machine learning datasets from web content
- Working with different data formats for ML applications

## License

This project is MIT licensed.