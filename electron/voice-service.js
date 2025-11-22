const { createClient } = require("@deepgram/sdk");

let deepgramClient = null;

async function initializeClient() {
  // Initialize Deepgram client from environment variables for STT
  if (process.env.DEEPGRAM_API_KEY) {
    deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
  }
}

async function transcribeWithDeepgram(audioData) {
  if (!deepgramClient) {
    await initializeClient();
  }

  if (!deepgramClient) {
    throw new Error("Deepgram API key not configured");
  }

  try {
    const { result } = await deepgramClient.listen.prerecorded.transcribeFile(
      audioData,
      {
        model: "nova-2",
        smart_format: true,
      }
    );

    return result.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error("Deepgram transcription error:", error);
    throw error;
  }
}

module.exports = {
  transcribeWithDeepgram,
};
