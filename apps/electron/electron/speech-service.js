const { createClient } = require("@deepgram/sdk");
const { ElevenLabs } = require("@elevenlabs/elevenlabs-js");

let deepgramClient = null;
let elevenlabsClient = null;

async function initializeClients() {
  // Initialize speech synthesis clients from environment variables
  if (process.env.DEEPGRAM_API_KEY) {
    deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
  }

  if (process.env.ELEVENLABS_API_KEY) {
    elevenlabsClient = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
}

async function synthesizeWithDeepgram(text) {
  if (!deepgramClient) {
    await initializeClients();
  }

  if (!deepgramClient) {
    throw new Error("Deepgram API key not configured");
  }

  try {
    const response = await deepgramClient.speak.request(
      { text },
      {
        model: "aura-asteria-en",
        encoding: "mp3",
      }
    );

    const stream = await response.getStream();
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Deepgram TTS error:", error);
    throw error;
  }
}

async function synthesizeWithElevenlabs(text) {
  if (!elevenlabsClient) {
    await initializeClients();
  }

  if (!elevenlabsClient) {
    throw new Error("ElevenLabs API key not configured");
  }

  try {
    const audio = await elevenlabsClient.textToSpeech.convert("Rachel", {
      text: text,
      model_id: "eleven_monolingual_v1",
    });

    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    throw error;
  }
}

module.exports = {
  synthesizeWithDeepgram,
  synthesizeWithElevenlabs,
};

