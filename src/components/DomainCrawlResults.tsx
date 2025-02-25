'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, FileText, List, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface DomainCrawlResultsProps {
  data: {
    domain: string;
    pagesCount: number;
    visitedUrls: string[];
    pages: Array<{
      url: string;
      title: string;
      content: string;
      markdown: string;
      links: string[];
    }>;
  };
}

export default function DomainCrawlResults({ data }: DomainCrawlResultsProps) {
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const togglePageExpand = (url: string) => {
    if (expandedPage === url) {
      setExpandedPage(null);
    } else {
      setExpandedPage(url);
    }
  };

  // Show a preview of text content (first 200 chars)
  const getContentPreview = (content: string, length = 200) => {
    if (!content) return 'No content available';
    return content.length > length ? `${content.substring(0, length)}...` : content;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Globe className="mr-2" size={24} />
        Domain Crawl Results: {data.domain}
      </h2>

      {/* Stats overview */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-1">Total Pages Crawled</h3>
          <p className="text-2xl font-bold">{data.pagesCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-1">Total Content Size</h3>
          <p className="text-2xl font-bold">
            {Math.round(
              data.pages.reduce((acc, page) => acc + (page.content?.length || 0), 0) / 1024
            )}{' '}
            KB
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-1">Unique URLs</h3>
          <p className="text-2xl font-bold">{data.visitedUrls.length}</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'pages'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pages ({data.pagesCount})
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'urls'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All URLs ({data.visitedUrls.length})
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-lg mb-2">Domain Information</h3>
              <p className="mb-1">
                <strong>Domain:</strong> {data.domain}
              </p>
              <p className="mb-1">
                <strong>Pages Crawled:</strong> {data.pagesCount}
              </p>
              <p>
                <strong>Dataset Size:</strong>{' '}
                {Math.round(
                  data.pages.reduce((acc, page) => acc + (page.content?.length || 0), 0) / 1024
                )}{' '}
                KB
              </p>
            </div>

            <h3 className="font-medium text-lg mb-2">Top Pages by Content Length</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {data.pages
                  .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))
                  .slice(0, 5)
                  .map((page) => (
                    <li key={page.url} className="p-4 hover:bg-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{page.title || 'Untitled Page'}</h4>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center"
                          >
                            {page.url.length > 50 ? `${page.url.substring(0, 50)}...` : page.url}
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        </div>
                        <span className="text-sm text-gray-500">
                          {Math.round((page.content?.length || 0) / 1024)} KB
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {data.pages.map((page) => (
                <li key={page.url} className="hover:bg-gray-100">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => togglePageExpand(page.url)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="mr-2 mt-1">
                          {expandedPage === page.url ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{page.title || 'Untitled Page'}</h4>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {page.url.length > 50 ? `${page.url.substring(0, 50)}...` : page.url}
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {page.links?.length || 0} links • {Math.round((page.content?.length || 0) / 1024)} KB
                      </span>
                    </div>

                    {expandedPage === page.url && (
                      <div className="mt-4 pl-6 border-l-2 border-gray-200">
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <FileText size={14} className="mr-1" /> Content Preview:
                          </h5>
                          <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                            {getContentPreview(page.content)}
                          </div>
                        </div>

                        {page.links && page.links.length > 0 && (
                          <div className="mb-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <List size={14} className="mr-1" /> Links Found ({page.links.length}):
                            </h5>
                            <ul className="bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                              {page.links.slice(0, 10).map((link, index) => (
                                <li key={index} className="text-sm mb-1">
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {link.length > 60 ? `${link.substring(0, 60)}...` : link}
                                  </a>
                                </li>
                              ))}
                              {page.links.length > 10 && (
                                <li className="text-sm text-gray-500">
                                  + {page.links.length - 10} more links
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* URLs Tab */}
        {activeTab === 'urls' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="mb-2 text-sm text-gray-600">All URLs discovered during crawling:</p>
            <div className="bg-white p-3 rounded border border-gray-200 max-h-96 overflow-y-auto">
              <ul className="space-y-1">
                {data.visitedUrls.map((url, index) => (
                  <li key={index} className="text-sm">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 