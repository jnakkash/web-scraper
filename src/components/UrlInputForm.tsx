'use client';

import { useState } from 'react';
import { Globe, Settings, Database, Cpu } from 'lucide-react';

interface UrlInputFormProps {
  onSubmit: (url: string, options: any) => void;
  isLoading: boolean;
}

export default function UrlInputForm({ onSubmit, isLoading }: UrlInputFormProps) {
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState({
    bypassCache: false,
    screenshot: false,
    wordCountThreshold: 10,
    recursive: false,
    maxDepth: 3,
    maxPages: 50,
    respectRobotsTxt: true,
    delay: 500,
    exportFormat: 'json',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url, options);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setOptions({
      ...options,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Globe className="mr-2" size={24} />
        Enter URL to Scrape
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:bg-blue-400 whitespace-nowrap"
          >
            {isLoading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Settings size={16} className="mr-1" />
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {showAdvanced && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="border-b pb-4 mb-4">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <Database className="mr-2" size={18} />
                Domain Crawling Options
              </h3>
              
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="recursive"
                  name="recursive"
                  checked={options.recursive}
                  onChange={handleOptionChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="recursive" className="text-sm">
                  Enable full domain crawling (crawl all pages on the domain)
                </label>
              </div>

              {options.recursive && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label htmlFor="maxDepth" className="block text-sm mb-1">
                      Max Crawl Depth:
                    </label>
                    <input
                      type="number"
                      id="maxDepth"
                      name="maxDepth"
                      value={options.maxDepth}
                      min="1"
                      max="10"
                      onChange={handleOptionChange}
                      className="p-2 border border-gray-300 rounded w-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How many links deep to crawl (1-10)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="maxPages" className="block text-sm mb-1">
                      Max Pages:
                    </label>
                    <input
                      type="number"
                      id="maxPages"
                      name="maxPages"
                      value={options.maxPages}
                      min="10"
                      max="500"
                      onChange={handleOptionChange}
                      className="p-2 border border-gray-300 rounded w-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of pages to crawl (10-500)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="delay" className="block text-sm mb-1">
                      Request Delay (ms):
                    </label>
                    <input
                      type="number"
                      id="delay"
                      name="delay"
                      value={options.delay}
                      min="0"
                      max="5000"
                      step="100"
                      onChange={handleOptionChange}
                      className="p-2 border border-gray-300 rounded w-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Delay between requests to avoid overwhelming the server
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="respectRobotsTxt"
                      name="respectRobotsTxt"
                      checked={options.respectRobotsTxt}
                      onChange={handleOptionChange}
                      className="h-4 w-4 mr-2"
                    />
                    <label htmlFor="respectRobotsTxt" className="text-sm">
                      Respect robots.txt (recommended)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-b pb-4 mb-4">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <Cpu className="mr-2" size={18} />
                ML Dataset Options
              </h3>

              <div>
                <label htmlFor="exportFormat" className="block text-sm mb-1">
                  Export Format:
                </label>
                <select
                  id="exportFormat"
                  name="exportFormat"
                  value={options.exportFormat}
                  onChange={handleOptionChange}
                  className="p-2 border border-gray-300 rounded w-full"
                >
                  <option value="json">JSON (Full Content + Metadata)</option>
                  <option value="text">Text Only (Clean Content)</option>
                  <option value="markdown">Markdown (Formatted Content)</option>
                  <option value="html">HTML (Raw Content)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose format that works best for your ML training needs
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Basic Options</h3>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="bypassCache"
                  name="bypassCache"
                  checked={options.bypassCache}
                  onChange={handleOptionChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="bypassCache" className="text-sm">
                  Bypass cache (force fresh crawl)
                </label>
              </div>

              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="screenshot"
                  name="screenshot"
                  checked={options.screenshot}
                  onChange={handleOptionChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="screenshot" className="text-sm">
                  Take screenshot
                </label>
              </div>

              <div className="flex flex-col">
                <label htmlFor="wordCountThreshold" className="text-sm mb-1">
                  Word Count Threshold:
                </label>
                <input
                  type="number"
                  id="wordCountThreshold"
                  name="wordCountThreshold"
                  value={options.wordCountThreshold}
                  min="1"
                  max="100"
                  onChange={handleOptionChange}
                  className="p-2 border border-gray-300 rounded w-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum word count for meaningful content blocks
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 