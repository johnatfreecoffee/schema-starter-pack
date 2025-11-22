import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PROMPT_DISMISSED_KEY = 'ios-install-prompt-dismissed';

export const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check if it's not already in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if user has already dismissed the prompt
    const isDismissed = localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true';
    
    // Show prompt only if it's iOS, not standalone, and not dismissed
    if (isIOS && !isStandalone && !isDismissed) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:max-w-sm">
      <Card className="relative border-2 shadow-lg bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="p-6 pr-12">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-border">
              <img 
                src="/pwa-192x192.png" 
                alt="Clear Home" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Install Clear Home</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add to your home screen for quick access
              </p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                1
              </span>
              <div className="flex items-center gap-1.5">
                <span>Tap the Share button</span>
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                  <Share className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                2
              </span>
              <div className="flex items-center gap-1.5">
                <span>Select "Add to Home Screen"</span>
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
