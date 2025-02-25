'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, FileText, List, ExternalLink, Download, Image, FileIcon, Folder } from 'lucide-react';
import NextImage from 'next/image';

interface DownloadedFile {
  originalUrl: string;
  localPath: string;
  size: number;
  category?: string;
}

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
      downloadedImages: DownloadedFile[];
      downloadedFiles: DownloadedFile[];
    }>;
    downloads?: {
      images: DownloadedFile[];
      files: DownloadedFile[];
      stats: {
        totalImages: number;
        totalFiles: number;
        totalSize: number;
        filesByCategory: Record<string, number>;
      };
    };
  };
}

export default function DomainCrawlResults({ data }: DomainCrawlResultsProps) {
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mediaTab, setMediaTab] = useState<string>('images');

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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on category
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'images':
        return <Image size={16} />;
      case 'documents':
        return <FileText size={16} />;
      case 'videos':
        return <FileIcon size={16} />;
      case 'audio':
        return <FileIcon size={16} />;
      case 'archives':
        return <Folder size={16} />;
      default:
        return <FileIcon size={16} />;
    }
  };

  const hasDownloads = data.downloads && (data.downloads.images.length > 0 || data.downloads.files.length > 0);

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

      {/* Downloads stats if available */}
      {hasDownloads && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-1 flex items-center">
              <Image className="mr-2" size={18} />
              Downloaded Images
            </h3>
            <p className="text-2xl font-bold">{data.downloads?.images.length || 0}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-1 flex items-center">
              <FileText className="mr-2" size={18} />
              Downloaded Files
            </h3>
            <p className="text-2xl font-bold">{data.downloads?.files.length || 0}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-1 flex items-center">
              <Download className="mr-2" size={18} />
              Total Downloaded
            </h3>
            <p className="text-2xl font-bold">
              {formatFileSize(data.downloads?.stats.totalSize || 0)}
            </p>
          </div>
        </div>
      )}

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
          {hasDownloads && (
            <button
              onClick={() => setActiveTab('downloads')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'downloads'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Downloads ({(data.downloads?.images.length || 0) + (data.downloads?.files.length || 0)})
            </button>
          )}
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

            {/* Downloaded files by category if available */}
            {hasDownloads && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-lg mb-2">Downloaded Files by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(data.downloads?.stats.filesByCategory || {}).map(([category, count]) => (
                    <div key={category} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex items-center">
                        {getFileIcon(category)}
                        <span className="ml-2 capitalize">{category}</span>
                      </div>
                      <p className="text-xl font-semibold mt-1">{count}</p>
                    </div>
                  ))}
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center">
                      <Image size={16} />
                      <span className="ml-2">Images</span>
                    </div>
                    <p className="text-xl font-semibold mt-1">{data.downloads?.images.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

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
                      <div className="text-sm text-gray-500 flex items-center space-x-3">
                        {page.downloadedImages && page.downloadedImages.length > 0 && (
                          <span className="flex items-center">
                            <Image size={14} className="mr-1" />
                            {page.downloadedImages.length}
                          </span>
                        )}
                        {page.downloadedFiles && page.downloadedFiles.length > 0 && (
                          <span className="flex items-center">
                            <FileText size={14} className="mr-1" />
                            {page.downloadedFiles.length}
                          </span>
                        )}
                        <span>
                          {page.links?.length || 0} links • {Math.round((page.content?.length || 0) / 1024)} KB
                        </span>
                      </div>
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

                        {/* Downloaded images for this page */}
                        {page.downloadedImages && page.downloadedImages.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <Image size={14} className="mr-1" /> Downloaded Images ({page.downloadedImages.length}):
                            </h5>
                            <div className="bg-white p-3 rounded border border-gray-200 grid grid-cols-3 gap-2">
                              {page.downloadedImages.slice(0, 6).map((image, index) => (
                                <a 
                                  key={index} 
                                  href={`/${image.localPath}`} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block bg-gray-100 p-1 rounded hover:bg-gray-200 transition-colors"
                                >
                                  <div className="relative aspect-square overflow-hidden rounded">
                                    <NextImage 
                                      src={`/${image.localPath}`}
                                      alt={`Downloaded image ${index + 1}`}
                                      fill
                                      sizes="100px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="text-xs text-center mt-1 truncate">
                                    {formatFileSize(image.size)}
                                  </div>
                                </a>
                              ))}
                              {page.downloadedImages.length > 6 && (
                                <div className="flex items-center justify-center bg-gray-100 p-2 rounded aspect-square">
                                  <span className="text-sm text-gray-500">
                                    +{page.downloadedImages.length - 6} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Downloaded files for this page */}
                        {page.downloadedFiles && page.downloadedFiles.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <FileText size={14} className="mr-1" /> Downloaded Files ({page.downloadedFiles.length}):
                            </h5>
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <ul className="space-y-1">
                                {page.downloadedFiles.slice(0, 5).map((file, index) => (
                                  <li key={index} className="text-sm">
                                    <a 
                                      href={`/${file.localPath}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center hover:bg-gray-100 p-1 rounded"
                                    >
                                      {getFileIcon(file.category || 'other')}
                                      <span className="ml-2 truncate">{file.originalUrl.split('/').pop()}</span>
                                      <span className="ml-auto text-gray-500">{formatFileSize(file.size)}</span>
                                    </a>
                                  </li>
                                ))}
                                {page.downloadedFiles.length > 5 && (
                                  <li className="text-sm text-gray-500 p-1">
                                    + {page.downloadedFiles.length - 5} more files
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}

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

        {/* Downloads Tab */}
        {activeTab === 'downloads' && hasDownloads && (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setMediaTab('images')}
                  className={`flex items-center px-4 py-2 ${
                    mediaTab === 'images'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Image size={16} className="mr-1" />
                  Images ({data.downloads?.images.length || 0})
                </button>
                <button
                  onClick={() => setMediaTab('files')}
                  className={`flex items-center px-4 py-2 ${
                    mediaTab === 'files'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText size={16} className="mr-1" />
                  Files ({data.downloads?.files.length || 0})
                </button>
              </div>

              {/* Images Gallery */}
              {mediaTab === 'images' && (
                <div>
                  <p className="mb-2 text-sm text-gray-600">Downloaded images:</p>
                  {data.downloads?.images && data.downloads.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {data.downloads.images.map((image, index) => (
                        <a
                          key={index}
                          href={`/${image.localPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white rounded border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="relative aspect-square">
                            <NextImage
                              src={`/${image.localPath}`}
                              alt={`Downloaded image ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs truncate text-gray-500">{image.originalUrl.split('/').pop()}</p>
                            <p className="text-xs font-medium">{formatFileSize(image.size)}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No images downloaded.</p>
                  )}
                </div>
              )}

              {/* Files List */}
              {mediaTab === 'files' && (
                <div>
                  <p className="mb-2 text-sm text-gray-600">Downloaded files:</p>
                  {data.downloads?.files && data.downloads.files.length > 0 ? (
                    <div className="bg-white rounded border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Download</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data.downloads.files.map((file, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getFileIcon(file.category || 'other')}
                                  <span className="ml-1 text-xs capitalize">{file.category || 'other'}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <p className="truncate max-w-[200px]">{file.originalUrl.split('/').pop()}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{file.originalUrl}</p>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {formatFileSize(file.size)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <a
                                  href={`/${file.localPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Download size={14} className="mr-1" />
                                  Open
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No files downloaded.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 