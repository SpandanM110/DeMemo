import type { Metadata } from 'next';
import './globals.css';
import ErrorSuppressor from '@/components/ErrorSuppressor';

export const metadata: Metadata = {
  title: 'DeMemo - Decentralized AI Memory',
  description: 'Your decentralized AI memory. Chat freely, save what matters. Encrypted conversations stored on IPFS, powered by Arc Network.',
  keywords: ['AI', 'Memory', 'Blockchain', 'IPFS', 'Web3', 'Arc Network', 'USDC', 'Decentralized'],
  authors: [{ name: 'DeMemo' }],
  openGraph: {
    title: 'DeMemo - Decentralized AI Memory',
    description: 'Your decentralized AI memory built on Arc Network',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inline script to suppress MetaMask Event errors before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason instanceof Event || 
                    (e.reason && typeof e.reason === 'object' && 'type' in e.reason) ||
                    String(e.reason) === '[object Event]') {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                }
              }, true);
              window.addEventListener('error', function(e) {
                if (e.message === '[object Event]' || 
                    (e.error instanceof Event) ||
                    String(e.error) === '[object Event]') {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="gradient-mesh grid-pattern noise-overlay">
        <ErrorSuppressor>
          {children}
        </ErrorSuppressor>
      </body>
    </html>
  );
}
