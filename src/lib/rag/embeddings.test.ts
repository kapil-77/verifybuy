import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGeminiEmbedder,
  createHashEmbedder,
  embedInBatches,
  EMBEDDING_MODEL,
  EMBEDDING_TASK_QUERY,
  MAX_EMBEDDINGS_PER_CALL,
} from "./embeddings.ts";

type EmbeddingRequest = {
  model: string;
  taskType?: string;
  content: { parts: Array<{ text: string }> };
};
type FetchCall = { url: string; body: { requests: EmbeddingRequest[] } };

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`;

function fakeResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    async text() {
      return JSON.stringify(body);
    },
    async json() {
      return body;
    },
  };
}

/** Builds a fetch spy that records calls and answers with the right shape. */
function makeFetcher(calls: FetchCall[], status: number = 200) {
  return async (url: string, init?: RequestInit) => {
    const call: FetchCall = {
      url,
      body: JSON.parse(String(init?.body ?? "{}")) as FetchCall["body"],
    };
    calls.push(call);
    const ok = status < 400;
    if (!ok) return fakeResponse({ error: { message: "embeddings unavailable" } }, false, status);
    return fakeResponse({
      embeddings: call.body.requests.map(() => ({ values: [3, 4] })),
    });
  };
}

describe("embedInBatches", () => {
  it("returns [] and makes no calls for empty input", async () => {
    let calls = 0;
    const out = await embedInBatches([], 10, async () => {
      calls++;
      return [];
    });
    assert.deepEqual(out, []);
    assert.equal(calls, 0);
  });

  it("respects the batch cap and preserves order", async () => {
    const sizes: number[] = [];
    const out = await embedInBatches(["a", "bb", "ccc", "dddd", "eeeee"], 2, async (batch) => {
      sizes.push(batch.length);
      return batch.map((value) => [value.length]);
    });
    assert.deepEqual(sizes, [2, 2, 1]);
    assert.deepEqual(out, [[1], [2], [3], [4], [5]]);
  });

  it("stops at the first failing batch", async () => {
    let calls = 0;
    await assert.rejects(
      embedInBatches(["a", "b", "c"], 1, async (batch) => {
        calls++;
        if (batch[0] === "b") throw new Error("boom");
        return [[batch[0].length]];
      }),
      /boom/,
    );
    // "a" succeeded, "b" failed — "c" must never be embedded.
    assert.equal(calls, 2);
  });

  it("normalizes non-positive batch sizes to 1", async () => {
    const out = await embedInBatches(["a", "b"], 0, async (batch) => [batch.length]);
    assert.deepEqual(out, [1, 1]);
  });
});

describe("createGeminiEmbedder", () => {
  it("POSTs to :batchEmbedContents with the right URL, body and task type", async () => {
    const calls: FetchCall[] = [];
    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl: makeFetcher(calls),
    });

    const out = await embedder.embed(["whey protein isolate"], { taskType: EMBEDDING_TASK_QUERY });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${ENDPOINT}?key=secret123`);
    assert.equal(calls[0].body.requests.length, 1);
    const req = calls[0].body.requests[0];
    assert.equal(req.model, `models/${EMBEDDING_MODEL}`);
    assert.equal(req.taskType, EMBEDDING_TASK_QUERY);
    assert.equal(req.content.parts[0].text, "whey protein isolate");
    // [3,4] normalized to unit length.
    assert.ok(Math.abs(Math.hypot(out[0][0], out[0][1]) - 1) < 1e-9);
  });

  it("omits taskType when none is given", async () => {
    const calls: FetchCall[] = [];
    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl: makeFetcher(calls),
    });
    await embedder.embed(["hello"]);
    assert.ok(!("taskType" in calls[0].body.requests[0]));
  });

  it("defaults to MAX_EMBEDDINGS_PER_CALL batching", async () => {
    const calls: FetchCall[] = [];
    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl: makeFetcher(calls),
    });
    const values = Array.from({ length: 70 }, (_, i) => `value ${i}`);

    const out = await embedder.embed(values);

    assert.deepEqual(
      calls.map((c) => c.body.requests.length),
      [MAX_EMBEDDINGS_PER_CALL, 6],
    );
    assert.equal(out.length, values.length);
  });

  it("is env-overridable for the model id", () => {
    const previous = process.env.GEMINI_EMBEDDING_MODEL;
    process.env.GEMINI_EMBEDDING_MODEL = "custom-embedding";
    try {
      const embedder = createGeminiEmbedder({ apiKey: "x" });
      assert.equal(embedder.modelId, "custom-embedding");
    } finally {
      if (previous === undefined) delete process.env.GEMINI_EMBEDDING_MODEL;
      else process.env.GEMINI_EMBEDDING_MODEL = previous;
    }
  });

  it("throws a clear error when the API returns a failure", async () => {
    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl: makeFetcher([], 400),
    });
    await assert.rejects(embedder.embed(["hello"]), /failed \(400\)/);
  });

  it("throws when the response has the wrong number of embeddings", async () => {
    const calls: FetchCall[] = [];
    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl: async (url: string, init?: RequestInit) => {
        const call: FetchCall = {
          url,
          body: JSON.parse(String(init?.body ?? "{}")) as FetchCall["body"],
        };
        calls.push(call);
        return fakeResponse({ embeddings: [] }); // 0 results for 1 input
      },
    });
    await assert.rejects(embedder.embed(["hello"]), /returned 0 results for 1 inputs/);
  });

  it("throws when no API key is available", async () => {
    const embedder = createGeminiEmbedder({
      apiKey: "",
      modelId: EMBEDDING_MODEL,
      fetchImpl: makeFetcher([]),
    });
    await assert.rejects(embedder.embed(["hello"]), /Missing GEMINI_API_KEY/);
  });

  it("skips blank inputs and makes zero requests when nothing remains", async () => {
    const calls: FetchCall[] = [];
    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl: makeFetcher(calls),
    });
    const out = await embedder.embed(["   ", "", "\t"]);
    assert.deepEqual(out, []);
    assert.equal(calls.length, 0);
  });

  it("retries a quota (429) response once, honoring the retry delay", async () => {
    const calls: FetchCall[] = [];
    const sleeps: number[] = [];
    let first = true;
    const fetchImpl = async (url: string, init?: RequestInit) => {
      const call: FetchCall = {
        url,
        body: JSON.parse(String(init?.body ?? "{}")) as FetchCall["body"],
      };
      calls.push(call);
      if (first) {
        first = false;
        return fakeResponse(
          {
            error: {
              code: 429,
              message: "quota exceeded",
              details: [{ "@type": "google.rpc.RetryInfo", retryDelay: "0.01s" }],
            },
          },
          false,
          429,
        );
      }
      return fakeResponse({ embeddings: call.body.requests.map(() => ({ values: [3, 4] })) });
    };

    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl,
      sleepImpl: async (ms: number) => {
        sleeps.push(ms);
      },
      maxRetries: 2,
    });

    const out = await embedder.embed(["hello"]);
    assert.equal(calls.length, 2);
    assert.equal(out.length, 1);
    assert.deepEqual(sleeps, [10]); // 0.01s -> 10ms
  });

  it("gives up after maxRetries on a persistent 429", async () => {
    const calls: FetchCall[] = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      const call: FetchCall = {
        url,
        body: JSON.parse(String(init?.body ?? "{}")) as FetchCall["body"],
      };
      calls.push(call);
      return fakeResponse({ error: { code: 429, message: "quota exceeded" } }, false, 429);
    };

    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl,
      sleepImpl: async () => {},
      maxRetries: 2,
    });

    await assert.rejects(embedder.embed(["hello"]), /failed \(429\)/);
    assert.equal(calls.length, 3); // initial + 2 retries
  });

  it("does not retry non-quota failures", async () => {
    const calls: FetchCall[] = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      const call: FetchCall = {
        url,
        body: JSON.parse(String(init?.body ?? "{}")) as FetchCall["body"],
      };
      calls.push(call);
      return fakeResponse({ error: { message: "bad request" } }, false, 400);
    };

    const embedder = createGeminiEmbedder({
      apiKey: "secret123",
      modelId: EMBEDDING_MODEL,
      fetchImpl,
      sleepImpl: async () => {
        throw new Error("sleep must not be called");
      },
      maxRetries: 3,
    });

    await assert.rejects(embedder.embed(["hello"]), /failed \(400\)/);
    assert.equal(calls.length, 1);
  });

  it("createHashEmbedder is deterministic and ignores task options", async () => {
    const embedder = createHashEmbedder();
    const first = await embedder.embed(["same text again"], { taskType: EMBEDDING_TASK_QUERY });
    const second = await embedder.embed(["same text again"]);
    assert.deepEqual(first, second);
  });
});
