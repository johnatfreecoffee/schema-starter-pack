import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Loader2 } from "lucide-react";

interface AIModelConfig {
  id: string;
  provider: string;
  stage: string;
  stage_order: number;
  model_name: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
}

export default function AdminAIConfig() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, AIModelConfig>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch configs
  const { data: configs, isLoading } = useQuery({
    queryKey: ["ai-model-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_model_configs")
        .select("*")
        .order("provider")
        .order("stage_order");

      if (error) throw error;
      return data as AIModelConfig[];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (configs: AIModelConfig[]) => {
      const updates = configs.map((config) =>
        supabase
          .from("ai_model_configs")
          .update({
            model_name: config.model_name,
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            is_active: config.is_active,
          })
          .eq("id", config.id)
          .select("*")
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} configs`);
      }

      // Ensure at least one row was updated for each request
      const zeroUpdates = results.filter((r) => !r.error && (!r.data || (Array.isArray(r.data) && r.data.length === 0)));
      // Only error if ALL attempted updates resulted in zero rows changed
      if (zeroUpdates.length === results.length) {
        throw new Error("No rows were updated. You may not have permission or data is unchanged.");
      }
    },
    onSuccess: (_data, updatedConfigs) => {
      // Optimistically update cache immediately so UI reflects changes
      queryClient.setQueryData<AIModelConfig[] | undefined>(["ai-model-configs"], (old) => {
        if (!old) return old;
        const map = new Map(old.map((c) => [c.id, c]));
        (updatedConfigs as AIModelConfig[]).forEach((u) => {
          const existing = map.get(u.id);
          if (existing) {
            map.set(u.id, { ...existing, ...u });
          }
        });
        return Array.from(map.values());
      });

      // Then refetch from server to ensure consistency
      queryClient.refetchQueries({ queryKey: ["ai-model-configs"] });
      setIsEditing(false);
      setEditedConfigs({});
      toast({ title: "Saved", description: "AI model configurations updated." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (configs) {
      const configMap: Record<string, AIModelConfig> = {};
      configs.forEach((config) => {
        configMap[config.id] = { ...config };
      });
      setEditedConfigs(configMap);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConfigs({});
  };

  const handleSave = () => {
    const originals = configs || [];
    const configsToSave = Object.values(editedConfigs).filter((cfg) => {
      const orig = originals.find((o) => o.id === cfg.id);
      if (!orig) return true;
      return (
        orig.model_name !== cfg.model_name ||
        Number(orig.temperature) !== Number(cfg.temperature) ||
        Number(orig.max_tokens) !== Number(cfg.max_tokens) ||
        Boolean(orig.is_active) !== Boolean(cfg.is_active)
      );
    });

    if (configsToSave.length === 0) {
      toast({ title: "No changes", description: "There are no edits to save." });
      setIsEditing(false);
      setEditedConfigs({});
      return;
    }

    saveMutation.mutate(configsToSave);
  };

  const handleFieldChange = (id: string, field: keyof AIModelConfig, value: any) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const displayConfigs = isEditing ? Object.values(editedConfigs) : configs || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Model Configuration</CardTitle>
              <CardDescription>
                Manage temperature, tokens, and model names for each AI provider and pipeline stage
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleEdit} disabled={isLoading}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saveMutation.isPending}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Max Tokens</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.stage_order}</TableCell>
                      <TableCell className="font-medium capitalize">{config.provider}</TableCell>
                      <TableCell className="capitalize">{config.stage}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={config.model_name}
                            onChange={(e) => handleFieldChange(config.id, "model_name", e.target.value)}
                            className="max-w-xs"
                          />
                        ) : (
                          config.model_name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={config.temperature}
                            onChange={(e) =>
                              handleFieldChange(config.id, "temperature", parseFloat(e.target.value))
                            }
                            className="w-20"
                          />
                        ) : (
                          config.temperature
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="1024"
                            min="512"
                            value={config.max_tokens}
                            onChange={(e) => handleFieldChange(config.id, "max_tokens", parseInt(e.target.value))}
                            className="w-24"
                          />
                        ) : (
                          config.max_tokens.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="checkbox"
                            checked={config.is_active}
                            onChange={(e) => handleFieldChange(config.id, "is_active", e.target.checked)}
                            className="w-4 h-4"
                          />
                        ) : (
                          <span className={config.is_active ? "text-green-600" : "text-gray-400"}>
                            {config.is_active ? "✓" : "✗"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Name Reference</CardTitle>
          <CardDescription>Valid model identifiers for each provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Claude (Anthropic)</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>• claude-sonnet-4-5 (recommended)</li>
              <li>• claude-opus-4-1</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Grok (xAI)</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>• grok-4-fast-reasoning (recommended)</li>
              <li>• grok-4</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Gemini (Google)</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>• gemini-2.5-pro (most capable)</li>
              <li>• gemini-2.5-flash (balanced)</li>
              <li>• gemini-2.5-flash-lite (fastest)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
