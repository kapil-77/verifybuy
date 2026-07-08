import { createFileRoute } from "@tanstack/react-router";

export const AGENT_ID = "agent_5001kx0meymyf1f8kg0tnm5ry3am";

export const Route = createFileRoute("/api/elevenlabs/token")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ElevenLabs not connected" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const res = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
          { headers: { "xi-api-key": apiKey } },
        );

        if (!res.ok) {
          const text = await res.text();
          return new Response(JSON.stringify({ error: text }), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = (await res.json()) as { token: string };
        return new Response(JSON.stringify({ token: data.token }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
