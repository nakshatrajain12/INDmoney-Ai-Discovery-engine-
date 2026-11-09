import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DemoProvider } from '@/context/DemoContext';
import { DemoDrawer } from '@/components/demo/DemoDrawer';
import { BottomNav } from '@/components/layout/BottomNav';
import { GlobalToast } from '@/components/common/GlobalToast';

export const metadata: Metadata = {
  title: 'SIP Steady (prototype)',
  description: 'INDmoney SIP Confidence and Recovery Experience. Demo prototype with mock data only.'
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

// Theme before paint, same mechanism and storage key as the AI engine: default dark, saved choice wins.
const themeScript = `(function(){try{var t=localStorage.getItem('ind_theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-canvas text-t1 antialiased selection:bg-ind-blue/20">
        <DemoProvider>
          <div className="mx-auto flex min-h-screen max-w-[430px] flex-col relative pb-20 border-x border-border/40 shadow-ind-float">
            <GlobalToast />
            {children}
            <BottomNav />
            <DemoDrawer />
          </div>
        </DemoProvider>
      </body>
    </html>
  );
}
