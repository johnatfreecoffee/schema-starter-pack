import { Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PipelineProgressIndicatorProps {
  isProcessing: boolean;
}

const STAGES = [
  { id: 1, name: 'Planning', duration: 8000 },
  { id: 2, name: 'Building Content', duration: 12000 },
  { id: 3, name: 'Creating HTML', duration: 10000 },
  { id: 4, name: 'Styling & Polish', duration: 10000 }
];

export function PipelineProgressIndicator({ isProcessing }: PipelineProgressIndicatorProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStage(0);
      setCompletedStages([]);
      return;
    }

    // Start from stage 0
    setCurrentStage(0);
    setCompletedStages([]);

    let cumulativeTime = 0;
    const timeouts: NodeJS.Timeout[] = [];

    STAGES.forEach((stage, index) => {
      cumulativeTime += stage.duration;
      
      const timeout = setTimeout(() => {
        setCompletedStages(prev => [...prev, stage.id]);
        
        if (index < STAGES.length - 1) {
          setCurrentStage(index + 1);
        }
      }, cumulativeTime);
      
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>AI is working...</span>
      </div>
      
      <div className="space-y-2">
        {STAGES.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.id);
          const isCurrent = currentStage === index;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isCurrent 
                  ? 'bg-primary/10 border border-primary/20 scale-[1.02]' 
                  : isCompleted 
                  ? 'bg-muted/50' 
                  : 'bg-muted/20'
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 animate-in fade-in zoom-in duration-300" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/60">{stage.id}</span>
                  </div>
                )}
              </div>
              
              <span className={`text-sm font-medium transition-colors ${
                isCurrent 
                  ? 'text-primary' 
                  : isCompleted 
                  ? 'text-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
