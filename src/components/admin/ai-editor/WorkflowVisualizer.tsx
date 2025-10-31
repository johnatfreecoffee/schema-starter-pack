import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StageCard } from './StageCard';

interface PipelineStage {
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
}

interface PipelineConfig {
  version: string;
  stages: PipelineStage[];
  features: {
    selfHealing: boolean;
    intelligentRetries: boolean;
    contextPreservation: boolean;
    tokenLimitHandling: boolean;
  };
}

interface ProgressUpdate {
  stage: string;
  status: 'idle' | 'running' | 'validating' | 'complete' | 'error';
  attempt?: number;
  duration?: number;
  tokens?: { input: number; output: number };
  validationPassed?: boolean;
}

export function WorkflowVisualizer() {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageProgress, setStageProgress] = useState<Map<string, ProgressUpdate>>(new Map());

  useEffect(() => {
    fetchPipelineConfig();
  }, []);

  const fetchPipelineConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get Supabase URL from env or construct from project ID
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
      
      const url = `${supabaseUrl}/functions/v1/ai-edit-page?action=get-pipeline-config`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Failed to fetch pipeline config: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || `Failed to fetch pipeline config: ${response.statusText}`);
      }

      const pipelineConfig = await response.json();
      setConfig(pipelineConfig);
    } catch (err) {
      console.error('Error fetching pipeline config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pipeline configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStageProgress = (update: ProgressUpdate) => {
    setStageProgress(prev => new Map(prev).set(update.stage, update));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <div className="text-destructive">
          <h3 className="font-semibold mb-2">Error Loading Pipeline</h3>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No pipeline configuration available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Pipeline Workflow</h2>
          <p className="text-sm text-muted-foreground">
            4-stage generation pipeline with validation & self-healing (v{config.version})
          </p>
        </div>
        <div className="flex gap-2">
          {Object.entries(config.features).map(([key, value]) => 
            value && (
              <div key={key} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            )
          )}
        </div>
      </div>

      <div className="space-y-4">
        {config.stages.map((stage, index) => {
          const progress = stageProgress.get(stage.name);
          const isLastStage = index === config.stages.length - 1;
          
          return (
            <div key={stage.id} className="relative">
              <StageCard
                stage={stage}
                stageNumber={index + 1}
                progress={progress}
              />
              
              {!isLastStage && (
                <div className="flex justify-center my-2">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2 text-sm">Pipeline Features</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground">Self-Healing:</strong> Automatic validation & retry with intelligent continuation
          </div>
          <div>
            <strong className="text-foreground">Token Management:</strong> Handles large outputs with content accumulation
          </div>
          <div>
            <strong className="text-foreground">Context Preservation:</strong> Maintains context across validation retries
          </div>
          <div>
            <strong className="text-foreground">Cost-Effective:</strong> Uses Gemini Flash for validation to minimize costs
          </div>
        </div>
      </Card>
    </div>
  );
}
