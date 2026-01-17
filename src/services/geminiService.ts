import { GoogleGenerativeAI } from "@google/generative-ai";

// Factory to always get the freshest instance
const getAiClient = () => {
  // Use import.meta.env for Vite projects
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("CRITICAL: Missing API_KEY. Check system configuration.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const PROTOCOLS = {
  ARTIST: `You are the PIXSHOP Synthesis Engine. Transform prompts into hyper-detailed visual DNA.`,
  EDITOR: `Role: High-End Neural Retoucher. Apply technical adjustments to visual matrices.`,
  DESIGNER: `Role: Professional Urban Vector Designer. Output clean, scalable aesthetic logic.`,
  TYPOGRAPHER: `Role: Master Street Typographer. Render text as a structural element.`,
  IMAGE_TRANSFORMER: `Role: Stylistic Diffusion Core. Infuse themes into existing imagery.`,
  STYLE_ROUTER: `Analyze visual DNA and route to: 'filter_panel', 'neural_upscale', or 'vector_gen'.`,
  PRESET_GENERATOR: `Analyze prompt and generate urban metadata for preset application.`,
};

// Example function using the client
export const generateResponse = async (protocolKey: keyof typeof PROTOCOLS, prompt: string) => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const fullPrompt = `${PROTOCOLS[protocolKey]}\n\nUser Input: ${prompt}`;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
};

// NEW FUNCTION: Describe image for prompt generation
export const describeImageForPrompt = async (imageFile: File): Promise<string> => {
  try {
    const genAI = getAiClient();
    
    // Use vision model for image analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 100,
      }
    });

    // Convert image to base64
    const imageBytes = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Create prompt for image description
    const prompt = `Describe the main subject of this image in 3-5 words. 
    Focus on what the primary visual element is.
    Examples: "a street cat", "urban landscape", "portrait person", "graffiti wall".
    Be concise and descriptive.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBytes,
          mimeType: imageFile.type
        }
      }
    ]);

    const description = result.response.text().trim();
    return description;
    
  } catch (error) {
    console.error('Error describing image:', error);
    // Return a default description if analysis fails
    return "the primary subject";
  }
};

// NEW FUNCTION: Refine image prompt
export const refineImagePrompt = async (basePrompt: string, imageDescription?: string): Promise<string> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    });

    let fullPrompt = `Refine and enhance this image generation prompt:\n\n"${basePrompt}"\n\n`;
    
    if (imageDescription) {
      fullPrompt += `The image contains: ${imageDescription}\n\n`;
    }
    
    fullPrompt += `Make it more descriptive, vivid, and suitable for AI image generation. 
    Include details about composition, lighting, style, and mood. 
    Keep the essence but make it more compelling.`;

    const result = await model.generateContent(fullPrompt);
    return result.response.text().trim();
    
  } catch (error) {
    console.error('Error refining prompt:', error);
    // Return the original prompt if refinement fails
    return basePrompt;
  }
};
// NEW FUNCTION: Extract style from image
export const extractStyleFromImage = async (imageFile: File): Promise<string> => {
  try {
    const genAI = getAiClient();
    
    // Use vision model for style analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 300,
      }
    });

    // Convert image to base64
    const imageBytes = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Create prompt for style analysis
    const prompt = `Analyze the visual style of this image and describe it in detail.
    Include:
    1. Color palette (dominant colors, color scheme)
    2. Lighting (type, direction, mood)
    3. Composition (layout, framing, perspective)
    4. Artistic style (realistic, abstract, painterly, etc.)
    5. Texture and details
    6. Mood and atmosphere
    
    Be descriptive and specific. Format as a JSON-like structure or bullet points.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBytes,
          mimeType: imageFile.type
        }
      }
    ]);

    const styleAnalysis = result.response.text().trim();
    return styleAnalysis;
    
  } catch (error) {
    console.error('Error extracting style from image:', error);
    // Return a default style analysis if extraction fails
    return "Color palette: Varied\nLighting: Balanced\nComposition: Standard\nStyle: Photographic\nMood: Neutral";
  }
};
