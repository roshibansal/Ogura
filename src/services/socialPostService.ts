import { supabase } from "@/integrations/supabase/client";

export interface SocialPostData {
  title: string;
  description: string;
  imageUrl: string;
  designerName?: string;
  designerCity?: string;
  customizations: {
    dressType: string;
    fabric: string;
    color: string;
    colorHex: string;
    embroideryLevel: string;
  };
  priceRange: string;
  occasion?: string;
  pageUrl: string;
}

interface SocialPostPayload {
  event: string;
  timestamp: string;
  design: {
    title: string;
    description: string;
    imageUrl: string;
    designer?: {
      name: string;
      city: string;
    };
    customizations: {
      dressType: string;
      fabric: string;
      color: string;
      colorHex: string;
      embroideryLevel: string;
    };
    priceRange: string;
    occasion?: string;
  };
  source: {
    url: string;
    platform: string;
  };
}

/**
 * Triggers a social media post via Make.com webhook
 * This is fire-and-forget - failures are logged but don't block the user flow
 */
export async function triggerSocialPost(
  data: SocialPostData,
  event: "custom_design_created" | "custom_order_confirmed" = "custom_design_created"
): Promise<boolean> {
  try {
    const payload: SocialPostPayload = {
      event,
      timestamp: new Date().toISOString(),
      design: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        designer: data.designerName
          ? {
              name: data.designerName,
              city: data.designerCity || "India",
            }
          : undefined,
        customizations: data.customizations,
        priceRange: data.priceRange,
        occasion: data.occasion,
      },
      source: {
        url: data.pageUrl,
        platform: "Ogura Fashion",
      },
    };

    console.log("Triggering social post:", payload);

    const { data: response, error } = await supabase.functions.invoke(
      "social-post-webhook",
      {
        body: payload,
      }
    );

    if (error) {
      console.error("Social post webhook error:", error);
      return false;
    }

    console.log("Social post webhook response:", response);
    return response?.success === true;
  } catch (error) {
    console.error("Failed to trigger social post:", error);
    return false;
  }
}

/**
 * Generates a description for social media based on customizations
 */
export function generateSocialDescription(
  customizations: SocialPostData["customizations"],
  designerName?: string
): string {
  const { dressType, fabric, color, embroideryLevel } = customizations;
  
  const colorName = getColorName(color);
  const designerText = designerName ? `, crafted by ${designerName}` : "";
  
  return `A stunning ${embroideryLevel.toLowerCase()} embroidered ${fabric} ${dressType} in ${colorName}${designerText}.`;
}

/**
 * Maps hex color to human-readable name
 */
function getColorName(hexColor: string): string {
  const colorMap: Record<string, string> = {
    "#8B0000": "Maroon",
    "#4169E1": "Royal Blue",
    "#50C878": "Emerald",
    "#C9A56B": "Gold",
    "#FFB6C1": "Blush Pink",
    "#FFFFF0": "Ivory",
    "#722F37": "Burgundy",
    "#008080": "Teal",
    "#F7E7CE": "Champagne",
    "#000080": "Navy",
    "#FF7F50": "Coral",
    "#E6E6FA": "Lavender",
  };
  
  return colorMap[hexColor.toUpperCase()] || "Custom";
}
