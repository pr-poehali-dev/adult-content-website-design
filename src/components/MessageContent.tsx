import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MessageContentProps {
  content: string;
}

const MessageContent = ({ content }: MessageContentProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      className="prose prose-sm dark:prose-invert max-w-none"
      components={{
        code: ({ node, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          
          return isInline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto my-3">
            {children}
          </pre>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic my-2">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 mt-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-2">{children}</h3>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MessageContent;
