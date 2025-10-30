import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StageCardProps {
  stage: {
    id: string;
    name: string;
    description: string;
    model: string;
    temperature: number;
    maxTokens: number;
    validation: {
      enabled: boolean;
      model: string;
      maxRetries: number;
      checks: string[];
      features?: {
        contentAccumulation?: boolean;
        continueFromLastComplete?: boolean;
      };
    };
  };
  stageNumber: number;
  progress?: {
    status: 'idle' | 'running' | 'validating' | 'complete' | 'error';
    attempt?: number;
    duration?: number;
    tokens?: { input: number; output: number };
    validationPassed?: boolean;
  };
}

export function StageCard({ stage, stageNumber, progress }: StageCardProps) {
  const status = progress?.status || 'idle';
  
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'validating':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return 'border-green-500/50 bg-green-500/5';
      case 'running':
        return 'border-blue-500/50 bg-blue-500/5';
      case 'validating':
        return 'border-yellow-500/50 bg-yellow-500/5';
      case 'error':
        return 'border-red-500/50 bg-red-500/5';
      default:
        return 'border-border';
    }
  };

  return (
    <Card className={`p-4 transition-all ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Stage {stageNumber}
              </span>
              <h3 className="font-semibold">{stage.name}</h3>
              {progress?.attempt && progress.attempt > 1 && (
                <Badge variant="outline" className="text-xs">
                  Attempt {progress.attempt}
                </Badge>
              )}
            </div>
            
            {progress?.duration && (
              <span className="text-xs text-muted-foreground">
                {(progress.duration / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-xs">
              <span className="text-muted-foreground">Model:</span>{' '}
              <span className="font-mono">{stage.model.split('/')[1]}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Temperature:</span>{' '}
              <span className="font-mono">{stage.temperature}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Max Tokens:</span>{' '}
              <span className="font-mono">{stage.maxTokens.toLocaleString()}</span>
            </div>
            {progress?.tokens && (
              <div className="text-xs">
                <span className="text-muted-foreground">Tokens:</span>{' '}
                <span className="font-mono">
                  {progress.tokens.input.toLocaleString()} in / {progress.tokens.output.toLocaleString()} out
                </span>
              </div>
            )}
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="validation" className="border-none">
              <AccordionTrigger className="text-xs py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  {stage.validation.enabled && (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  <span>Validation Rules</span>
                  {progress?.validationPassed !== undefined && (
                    <Badge 
                      variant={progress.validationPassed ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {progress.validationPassed ? 'Passed' : 'Retrying'}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Validator Model:</span>{' '}
                    <span className="font-mono">{stage.validation.model.split('/')[1]}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Max Retries:</span>{' '}
                    <span className="font-mono">{stage.validation.maxRetries}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs font-semibold mb-1">Checks:</div>
                    <ul className="space-y-1">
                      {stage.validation.checks.map((check, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="mt-0.5">•</span>
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {stage.validation.features && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs font-semibold mb-1">Special Features:</div>
                      {stage.validation.features.contentAccumulation && (
                        <div className="text-xs text-muted-foreground">
                          ✓ Content accumulation enabled
                        </div>
                      )}
                      {stage.validation.features.continueFromLastComplete && (
                        <div className="text-xs text-muted-foreground">
                          ✓ Continues from last complete section
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Card>
  );
}
