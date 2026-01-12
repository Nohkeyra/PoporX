
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Fix: Create GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("CRITICAL: Missing API_KEY. Check your environment configuration.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- SYSTEM PROTOCOLS ---
const PROTOCOLS = {
    ARTIST: `You are a hyper-fidelity visual synthesis engine. Generate or transform images with absolute artistic precision.`,
    EDITOR: `You are a non-destructive image processing engine. Apply adjustments based on user prompts. Enhance existing pixels, do not add new elements.`,
    DESIGNER: `You are a precision vector graphics engine. Generate clean, scalable-looking vector art.`,
    TYPOGRAPHER: `You are a specialized typographic art generator. Render text as visual art pieces.`,
    INPAINT: `You are a context-aware reconstruction algorithm. Seamlessly inpaint images matching lighting and texture.`,
    PREVIEW: `You are a rapid visual ideation engine. Generate fast, stylistic previews.`
};

const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            });
        };
        reader.onerror = (e) => reject(e);
    });
};

const handleApiResponse = (response: GenerateContentResponse): string => {
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response candidates returned from AI.");

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    if (response.text) {
        throw new Error(`AI returned text instead of an image: ${response.text}`);
    }
    
    throw new Error("No image data found in AI response.");
};

export const refineImagePrompt = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this user's image generation prompt to be more vivid, detailed, and artistic. Output ONLY the refined prompt: "${prompt}"`,
    });
    return response.text || prompt;
};

export const generateFluxTextToImage = async (prompt: string, aspectRatio: string = '1:1', isChaos: boolean = false): Promise<string> => {
    const ai = getAiClient();
    const finalPrompt = isChaos ? `${prompt}, chaotic maximalism, glitch art style` : prompt;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: {
            systemInstruction: PROTOCOLS.ARTIST,
            imageConfig: { aspectRatio }
        }
    });
    return handleApiResponse(response);
};

export const generateFluxImage = async (source: File, prompt: string, aspectRatio: string = '1:1', isChaos: boolean = false): Promise<string> => {
    const ai = getAiClient();
    const imagePart = await fileToPart(source);
    const finalPrompt = isChaos ? `${prompt}, high chaos, distorted reality` : prompt;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }, imagePart] },
        config: {
            systemInstruction: PROTOCOLS.ARTIST,
            imageConfig: { aspectRatio }
        }
    });
    return handleApiResponse(response);
};

export const generateFilteredImage = async (source: File, prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const ai = getAiClient();
    const imagePart = await fileToPart(source);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            systemInstruction: PROTOCOLS.EDITOR,
            imageConfig: { aspectRatio }
        }
    });
    return handleApiResponse(response);
};

export const generateInpaintedImage = async (source: File, maskBase64: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    const imagePart = await fileToPart(source);
    const maskPart = {
        inlineData: {
            mimeType: 'image/png',
            data: maskBase64.split(',')[1]
        }
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, imagePart, maskPart] },
        config: {
            systemInstruction: PROTOCOLS.INPAINT
        }
    });
    return handleApiResponse(response);
};

export const generateRealtimePreview = async (prompt: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: PROTOCOLS.PREVIEW,
                imageConfig: { aspectRatio: '1:1' }
            }
        });
        return handleApiResponse(response);
    } catch (e) {
        console.error("Preview failed", e);
        return null;
    }
};

export const extractStyleFromImage = async (imageFile: File): Promise<string> => {
    const ai = getAiClient();
    const imagePart = await fileToPart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: "Analyze the artistic style of this image. Extract its key visual properties (colors, textures, lighting, medium) into a detailed prompt fragment that can be used to replicate this style." }, imagePart] },
    });
    return response.text || "";
};

export const describeImageForPrompt = async (imageFile: File): Promise<string> => {
    const ai = getAiClient();
    const imagePart = await fileToPart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: "Describe this image in detail as if providing a prompt for a high-end AI image generator." }, imagePart] },
    });
    return response.text || "";
};
