import { Loader2, CheckCircle2 } from 'lucide-react';

interface PipelineProgressIndicatorProps {
  isProcessing: boolean;
  stages?: Array<{
    name: string;
    completed?: boolean;
    current?: boolean;
  }>;
}

const DEFAULT_STAGES = [
  { id: 1, name: 'Planning' },
  { id: 2, name: 'Building Content' },
  { id: 3, name: 'Creating HTML' },
  { id: 4, name: 'Styling & Polish' }
];

export function PipelineProgressIndicator({ isProcessing, stages: customStages }: PipelineProgressIndicatorProps) {
  // Use custom stages if provided, otherwise use defaults
  const stages = customStages || DEFAULT_STAGES.map(s => ({ 
    name: s.name, 
    completed: false, 
    current: false 
  }));

  if (!isProcessing) return null;

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>AI is working...</span>
      </div>
      
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isCompleted = stage.completed || false;
          const isCurrent = stage.current || false;

          return (
            <div
              key={index}
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
                    <span className="text-xs text-muted-foreground/60">{index + 1}</span>
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
