import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      companyData,
      socialMedia,
      aiTraining,
      systemInstructions,
      userPrompt,
      supabaseData,
      includeImages = false,
      needsResearch = false,
      fixMode = false,
      htmlSource,
      existingHtml,
      serviceInstructions, // Optional: MD instructions for service pages
      useTestWebhook = true, // Default to test webhook
      instructions, // AI instruction files from frontend
    } = await req.json();

    // Extract instruction files
    const {
      imageGenInstructions = "",
      builderStageInstructionsWithImages = "",
      builderStageInstructionsWithoutImages = "",
      researchPrompt = "",
      stage1TaskWithImages = "",
      stage2TaskWithImages = "",
      stage3TaskWithImages = "",
      stage4TaskWithImages = "",
      stage1TaskNoImages = "",
      stage2TaskNoImages = "",
      stage3TaskNoImages = "",
      stage4TaskNoImages = "",
    } = instructions || {};

    // Get webhook URL from environment based on mode
    const webhookUrl = useTestWebhook
      ? Deno.env.get("TEST_WEBHOOK_PAGE_BUILDER")
      : Deno.env.get("PRODUCTION_WEBHOOK_PAGE_BUILDER");

    if (!webhookUrl) {
      const webhookType = useTestWebhook ? "test" : "production";
      console.error(`${webhookType.toUpperCase()}_WEBHOOK_PAGE_BUILDER secret not configured`);
      return new Response(JSON.stringify({ error: `${webhookType} webhook URL not configured` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Choose instructions based on mode - use systemInstructions for Fix Mode since we don't have a separate fixInstructions file
    const builderInstructions = fixMode 
      ? systemInstructions // Use system instructions for fix mode
      : (includeImages ? builderStageInstructionsWithImages : builderStageInstructionsWithoutImages);

    // Prepare webhook payload based on mode
    const basePayload = {
      body: {
          companyData: {
            business_name: companyData?.business_name || "",
            business_slogan: companyData?.business_slogan || "",
            description: companyData?.description || "",
            id: companyData?.id || "",
            brand_voice: aiTraining?.brand_voice || "",
            mission_statement: aiTraining?.mission_statement || "",
            customer_promise: aiTraining?.customer_promise || "",
            competitive_positioning: aiTraining?.competitive_positioning || "",
            unique_selling_points: aiTraining?.unique_selling_points || "",
            competitive_advantages: aiTraining?.competitive_advantages || "",
            target_audience: aiTraining?.target_audience || "",
            service_standards: aiTraining?.service_standards || "",
            certifications: aiTraining?.certifications || "",
            emergency_response: aiTraining?.emergency_response || "",
            service_area_coverage: aiTraining?.service_area_coverage || "",
            project_timeline: aiTraining?.project_timeline || "",
            payment_options: aiTraining?.payment_options || "",
            phone: companyData?.phone || "",
            email: companyData?.email || "",
            address_street: companyData?.address_street || "",
            address_city: companyData?.address_city || "",
            address_state: companyData?.address_state || "",
            address_zip: companyData?.address_zip || "",
            address: companyData?.address || "",
            website_url: companyData?.website_url || "",
            years_experience: companyData?.years_experience || null,
          },
          userPrompt: {
            content: userPrompt || "",
            type: "user_prompt",
            length: userPrompt?.length || null,
          },
          systemInstructions: {
            content: systemInstructions || "",
            type: "system_instructions",
            length: systemInstructions?.length || null,
          },
          ...(fixMode ? {
            // Fix Mode: Simple payload with fix instructions and existing HTML
            fixInstructions: {
              content: systemInstructions || "", // Use system instructions for fix mode
              type: "fix_instructions",
              length: systemInstructions?.length || null,
            },
            existingHtml: {
              content: existingHtml || "",
              htmlSource: htmlSource || "",
              type: "existing_html",
              length: existingHtml?.length || null,
            },
          } : {
            // Build Mode: Full stage-based instructions
            builderStageInstructions: {
              content: builderInstructions,
              type: "builder_stages",
              length: builderInstructions?.length || null,
            },
            stage1Task: {
              content: includeImages ? stage1TaskWithImages : stage1TaskNoImages,
              type: "stage_1_task",
              length: includeImages ? stage1TaskWithImages?.length || null : stage1TaskNoImages?.length || null,
            },
            stage2Task: {
              content: includeImages ? stage2TaskWithImages : stage2TaskNoImages,
              type: "stage_2_task",
              length: includeImages ? stage2TaskWithImages?.length || null : stage2TaskNoImages?.length || null,
            },
            stage3Task: {
              content: includeImages ? stage3TaskWithImages : stage3TaskNoImages,
              type: "stage_3_task",
              length: includeImages ? stage3TaskWithImages?.length || null : stage3TaskNoImages?.length || null,
            },
            stage4Task: {
              content: includeImages ? stage4TaskWithImages : stage4TaskNoImages,
              type: "stage_4_task",
              length: includeImages ? stage4TaskWithImages?.length || null : stage4TaskNoImages?.length || null,
            },
            // Only include imageGenInstructions if images are enabled
            ...(includeImages && {
              imageGenInstructions: {
                content: imageGenInstructions || "",
                type: "image_generation",
                length: imageGenInstructions?.length || null,
              },
            }),
          }),
          supabaseData: {
            pageType: supabaseData?.pageType || "",
            pageTitle: supabaseData?.pageTitle || "",
            table: supabaseData?.table || "",
            id: supabaseData?.id || supabaseData?.pageRowId || "",
            pageId: supabaseData?.pageId || "",
            pageRowId: supabaseData?.pageRowId || "",
            field: supabaseData?.field || "",
            includeImages: fixMode ? false : includeImages,
            needsResearch: fixMode ? false : needsResearch,
            fixMode: fixMode,
            htmlSource: htmlSource || "",
          },
          researchPrompt: (needsResearch && !fixMode)
            ? researchPrompt || ""
            : undefined,
          output_tokens: 150000,
      }
    };

    const webhookPayload = [basePayload];

    console.log("Sending webhook to n8n:", {
      webhookType: useTestWebhook ? "TEST" : "PRODUCTION",
      url: webhookUrl.substring(0, 50) + "...",
      hasCompanyData: !!companyData,
      hasSocialMedia: !!socialMedia,
      hasAiTraining: !!aiTraining,
      hasSystemInstructions: !!systemInstructions,
      fixMode,
      htmlSource: fixMode ? htmlSource : undefined,
      hasExistingHtml: fixMode ? !!existingHtml : undefined,
      includeImages: fixMode ? false : includeImages,
      needsResearch: fixMode ? false : needsResearch,
      hasResearchPrompt: needsResearch && !fixMode,
      supabaseData,
      timestamp: new Date().toISOString(),
    });

    // Send to Make.com webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Webhook failed:", webhookResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Webhook failed with status ${webhookResponse.status}`,
          details: errorText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const responseData = await webhookResponse.json().catch(() => ({}));

    const webhookType = useTestWebhook ? "test" : "production";
    console.log(`Webhook sent successfully to ${webhookType} endpoint`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhook sent to ${webhookType} endpoint successfully`,
        webhookType,
        response: responseData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-makecom-webhook:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
