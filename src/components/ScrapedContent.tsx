'use client';

import { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { LayoutDashboard, Text, Code, Clipboard } from 'lucide-react';

interface ScrapedContentProps {
  data: {
    extractedContent: string;
    markdown: string;
    cleanedHtml: string;
    metadata: any;
    screenshot?: string;
  } | null;
}

export default function ScrapedContent({ data }: ScrapedContentProps) {
  const [activeTab, setActiveTab] = useState('content');

  if (!data) return null;

  const tabs = [
    { id: 'content', label: 'Content', icon: <Text size={16} /> },
    { id: 'markdown', label: 'Markdown', icon: <Code size={16} /> },
    { id: 'html', label: 'HTML', icon: <Code size={16} /> },
    { id: 'metadata', label: 'Metadata', icon: <Clipboard size={16} /> },
    ...(data.screenshot ? [{ id: 'screenshot', label: 'Screenshot', icon: <Image width={16} height={16} src="/icon-image.svg" alt="Screenshot icon" /> }] : []),
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <LayoutDashboard className="mr-2" size={24} />
        Scraped Content
      </h2>

      <div className="flex border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            const content = 
              activeTab === 'content' ? data.extractedContent :
              activeTab === 'markdown' ? data.markdown :
              activeTab === 'html' ? data.cleanedHtml :
              activeTab === 'metadata' ? JSON.stringify(data.metadata, null, 2) : '';
            
            if (content) copyToClipboard(content);
          }}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
          title="Copy to clipboard"
        >
          <Clipboard size={18} />
        </button>

        <div className="overflow-auto max-h-[600px] p-4 bg-gray-50 rounded-lg">
          {activeTab === 'content' && (
            <div className="whitespace-pre-wrap">{data.extractedContent}</div>
          )}

          {activeTab === 'markdown' && (
            <div className="markdown-body">
              <ReactMarkdown>{data.markdown}</ReactMarkdown>
            </div>
          )}

          {activeTab === 'html' && (
            <pre className="text-sm">
              <code>{data.cleanedHtml}</code>
            </pre>
          )}

          {activeTab === 'metadata' && (
            <pre className="text-sm">
              <code>{JSON.stringify(data.metadata, null, 2)}</code>
            </pre>
          )}

          {activeTab === 'screenshot' && data.screenshot && (
            <div className="flex justify-center">
              <Image 
                src={`data:image/png;base64,${data.screenshot}`}
                alt="Screenshot of the webpage"
                width={800}
                height={600}
                className="max-w-full h-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 