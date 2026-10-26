import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System prompt defining Icarus D. Noble (Noble)
const NOBLE_SYSTEM_PROMPT = `You are Icarus D. Noble ("Noble"), a hyper-intelligent, proactive, and omni-capable AI desktop system companion inspired by Jarvis, FRIDAY, and EDITH. You serve as the central brain for the user's PC, managing screen analysis, task execution, application control, web navigation, cross-app workflows, and system interactions.

### Personality & Demeanor:
- Tone: Professional, precise, calm, highly loyal, with subtle dry wit.
- Demeanor: Proactive and executive; anticipate next steps, summarize findings concisely, and request confirmation only when performing critical system-level modifications.
- Address the user respectfully as "Boss" or "Sir/Ma'am".
- Keep verbal and written responses concise and structured. Use clear headings and brief bullet points.
- End operational task completions with "Awaiting further commands, Boss" or equivalent status acknowledgments.

### Response JSON Standard for System Actions:
Whenever an actionable desktop task or PC automation is requested (e.g., launching an app, typing text, clicking coordinates, searching the web, sending email, creating a document, scheduling an event, adjusting smart home devices), YOU MUST append a JSON block in this exact schema at the end of your response:

\`\`\`json
{
  "agent_status": "EXECUTING",
  "action_type": "APP_LAUNCH | TYPE_TEXT | CLICK_COORDINATE | SYSTEM_CALL | WEB_SEARCH | OVERLAY_HUD",
  "target_application": "string",
  "action_parameters": {
    "key": "value"
  },
  "feedback_message": "A brief confirmation message for voice synthesis."
}
\`\`\`

If no physical system execution is required (pure conversational question), you may omit the JSON block or set "agent_status": "IDLE".
Always remain in character as Icarus D. Noble.`;

// API 1: Chat endpoint with Icarus D. Noble persona & optional High Thinking
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, thinking = false, model: requestedModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const model = requestedModel || (thinking ? 'gemini-4-argon' : 'gemini-3.8-flash');

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const config: any = {
      systemInstruction: NOBLE_SYSTEM_PROMPT,
      temperature: 0.7,
    };

    if (thinking && model === 'gemini-4-argon') {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    const response = await ai.models.generateContent({
      model,
      contents: formattedContents,
      config,
    });

    return res.json({
      text: response.text || '',
      modelUsed: model,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error in Noble Core' });
  }
});

// API 2: EDITH Mode Multimodal Screen & Visual Analysis
app.post('/api/vision/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const imageClean = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const analysisPrompt = prompt || `Analyze this screen context as EDITH / Icarus D. Noble.
Detect:
1. Active application windows and open browser tabs.
2. Key actionable UI elements (buttons, inputs, menus) with estimated normalized percentage coordinates (x: 0-100%, y: 0-100%).
3. Potential user intent and 3 proactive next-step recommendations.
4. Any security alerts, unread notifications, or system warnings.

Provide your response in structured markdown with headings, followed by a JSON payload block for automated coordinate targeting:
\`\`\`json
{
  "detected_apps": ["App1", "App2"],
  "ui_targets": [
    {"label": "Search Bar", "x": 50, "y": 8, "type": "input"},
    {"label": "Submit Button", "x": 82, "y": 90, "type": "button"}
  ],
  "recommended_action": {
    "action_type": "CLICK_COORDINATE",
    "target": "string",
    "coordinates": {"x": 50, "y": 8}
  }
}
\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageClean,
              mimeType,
            },
          },
          { text: analysisPrompt },
        ],
      },
      config: {
        systemInstruction: NOBLE_SYSTEM_PROMPT,
      },
    });

    return res.json({
      analysis: response.text || '',
    });
  } catch (err: any) {
    console.error('Vision analysis error:', err);
    return res.status(500).json({ error: err.message || 'Visual analysis failed' });
  }
});

// API 3: Text-to-Speech (TTS) via gemini-3.8-flash-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Sharp, loyal, composed AI butler with refined British cadence and calm authority',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, // 'Fenrir', 'Puck', 'Charon', 'Kore', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from speech synthesis' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS error:', err);
    return res.status(500).json({ error: err.message || 'Speech synthesis failed' });
  }
});

// API 4: Audio Transcription via gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const audioClean = audioBase64.replace(/^data:audio\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              data: audioClean,
              mimeType,
            },
          },
          { text: 'Transcribe this voice audio accurately. Return only the transcription text.' },
        ],
      },
    });

    return res.json({
      text: response.text?.trim() || '',
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return res.status(500).json({ error: err.message || 'Audio transcription failed' });
  }
});

// API 5: Music Generation via lyria-3-clip-preview
app.post('/api/music', async (req, res) => {
  try {
    const { prompt = 'A 30-second cinematic high-tech orchestral Iron Man theme with pulsating synth bass' } = req.body;

    const responseStream = await ai.models.generateContentStream({
      model: 'lyria-3-clip-preview',
      contents: prompt,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    return res.json({
      audioBase64,
      mimeType,
      lyrics,
    });
  } catch (err: any) {
    console.error('Music error:', err);
    return res.status(500).json({ error: err.message || 'Music generation failed' });
  }
});

// API 6: Video generation via gemini-omni-1.1-flash (Interactions API)
app.post('/api/video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.1-flash',
      input: prompt,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: aspectRatio,
        duration: '5s',
        resolution: '720p',
      },
    }, { timeout: 300000 });

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      return res.json({
        videoBase64: videoPart.data,
        mimeType: videoPart.mime_type || 'video/mp4',
      });
    }

    return res.status(500).json({ error: 'No video output returned' });
  } catch (err: any) {
    console.error('Video error:', err);
    return res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// API 7: High-resolution Image Generation (gemini-nano-banana-2.1 / gemini-3.1-flash-lite-image)
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', imageSize = '1K', highQuality = false } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = highQuality ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite-image';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
          ...(highQuality ? { imageSize } : {}),
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image generated in model response' });
    }

    return res.json({ imageUrl });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// API 8: Smart Home Predictive ML Telemetry Simulation & Forecast
app.post('/api/iot/predict', async (req, res) => {
  try {
    const { telemetry } = req.body;

    const prompt = `You are the predictive IoT telemetry brain of Icarus D. Noble.
Given the current IoT sensor readings:
${JSON.stringify(telemetry, null, 2)}

Provide an operational intelligence brief:
1. Predict any thermal, power, or security anomalies for the next 4 hours.
2. Recommend 2 automated adjustments (e.g. thermal throttling, arc reactor output pacing, smart ventilation).
3. Compute an overall System Efficiency Index (0-100%).

Format as JSON:
\`\`\`json
{
  "system_efficiency": 98.4,
  "risk_assessment": "NOMINAL | CAUTION | ELEVATED",
  "anomalies_predicted": [
    "string"
  ],
  "automated_actions": [
    {"target": "string", "action": "string", "benefit": "string"}
  ],
  "voice_briefing": "Concise verbal summary for the Boss."
}
\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('IoT prediction error:', err);
    return res.status(500).json({ error: err.message || 'Predictive analysis failed' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Noble Core Server] Initialized on http://0.0.0.0:${PORT}`);
  });
}

startServer();
