'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export default function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks with syntax highlighting
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return !inline && match ? (
              <div className="relative my-4">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 rounded-t-lg">
                  <span className="text-xs text-zinc-500 font-mono">{language || 'code'}</span>
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  className="rounded-b-lg !m-0"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0 0 0.5rem 0.5rem',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="px-1.5 py-0.5 bg-zinc-900 text-zinc-300 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-zinc-100 mt-6 mb-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-zinc-100 mt-5 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2 first:mt-0">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-3 text-zinc-200 leading-relaxed last:mb-0">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-zinc-200 ml-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-zinc-200 ml-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-200">{children}</li>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-zinc-600 pl-4 py-2 my-3 bg-zinc-900/50 rounded-r text-zinc-300 italic">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-zinc-700 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-900">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-zinc-800/50">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-zinc-700">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-200 border-r border-zinc-700 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-zinc-300 border-r border-zinc-700 last:border-r-0">
              {children}
            </td>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-4 border-zinc-700" />
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-zinc-200">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
