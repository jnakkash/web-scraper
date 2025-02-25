'use client';

import { useState } from 'react';
import UrlInputForm from '@/components/UrlInputForm';
import ScrapedContent from '@/components/ScrapedContent';
import DomainCrawlResults from '@/components/DomainCrawlResults';
import { ArrowDown, Download } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDomainCrawl, setIsDomainCrawl] = useState(false);

  const handleSubmit = async (url: string, options: any) => {
    try {
      setIsLoading(true);
      setError(null);
      setScrapedData(null);
      setIsDomainCrawl(options.recursive);

      // Make API request to our scraping endpoint
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to scrape URL');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape URL');
      }

      setScrapedData(data.data);
    } catch (err: any) {
      console.error('Scraping error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    if (!scrapedData) return;
    
    let exportData;
    let filename;
    let contentType;
    
    if (isDomainCrawl) {
      // For domain crawls, export based on the selected format
      switch (scrapedData.exportFormat) {
        case 'text':
          exportData = scrapedData.pages.map((page: any) => 
            `--- ${page.url} ---\n\n${page.content}\n\n`
          ).join('');
          filename = `${scrapedData.domain}-crawl.txt`;
          contentType = 'text/plain';
          break;
        case 'markdown':
          exportData = scrapedData.pages.map((page: any) => 
            `# ${page.title || page.url}\n\nURL: ${page.url}\n\n${page.markdown}\n\n---\n\n`
          ).join('');
          filename = `${scrapedData.domain}-crawl.md`;
          contentType = 'text/markdown';
          break;
        case 'html':
          exportData = scrapedData.pages.map((page: any) => 
            `<!-- ${page.url} -->\n${page.html || ''}\n\n`
          ).join('');
          filename = `${scrapedData.domain}-crawl.html`;
          contentType = 'text/html';
          break;
        case 'json':
        default:
          exportData = JSON.stringify(scrapedData, null, 2);
          filename = `${scrapedData.domain}-crawl.json`;
          contentType = 'application/json';
      }
    } else {
      // For single page, export full JSON
      exportData = JSON.stringify(scrapedData, null, 2);
      filename = `${new URL(scrapedData.metadata.url).hostname}-page.json`;
      contentType = 'application/json';
    }
    
    // Create and trigger download
    const blob = new Blob([exportData], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-center text-3xl font-bold mb-8">Web Scraper for ML Datasets</h1>
      
      <div className="max-w-6xl mx-auto space-y-8">
        <UrlInputForm onSubmit={handleSubmit} isLoading={isLoading} />
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Scraping the website, please wait...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}
        
        {!isLoading && scrapedData && !isDomainCrawl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <ArrowDown className="text-gray-400" size={32} />
            </div>
            <ScrapedContent data={scrapedData} />
            <div className="flex justify-center mt-6">
              <button
                onClick={handleExportData}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                <Download size={16} className="mr-2" />
                Export Data for ML
              </button>
            </div>
          </div>
        )}
        
        {!isLoading && scrapedData && isDomainCrawl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <ArrowDown className="text-gray-400" size={32} />
            </div>
            <DomainCrawlResults data={scrapedData} />
            <div className="flex justify-center mt-6">
              <button
                onClick={handleExportData}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                <Download size={16} className="mr-2" />
                Export Dataset for ML Training
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
