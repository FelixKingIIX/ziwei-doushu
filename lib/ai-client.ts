/**
 * Legacy request adapter: all analysis is performed locally in the browser.
 * No fetch, AI service, API key, token, backend or network access.
 * Preserves the existing streaming response shape for the presentation layer.
 */
import type { ZiweiChart } from './ziwei/types';
import { interpretChart, interpretHeming } from './local-interpret';

type InterpretPayload = { chart: ZiweiChart; messages: { role: 'user' | 'assistant'; content: string }[] };
type HemingPayload = { chartA: ZiweiChart; chartB: ZiweiChart; question?: string };

export async function requestAi(
  path: '/api/interpret' | '/api/heming',
  payload: InterpretPayload | HemingPayload,
): Promise<Response> {
  const result = path === '/api/interpret'
    ? interpretChart((payload as InterpretPayload).chart, (payload as InterpretPayload).messages)
    : interpretHeming((payload as HemingPayload).chartA, (payload as HemingPayload).chartB, (payload as HemingPayload).question);
  const encoder = new TextEncoder();
  // Use SSE compatible with existing UI readers, without opening a network connection.
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      const packet = 'data: ' + JSON.stringify({ delta: { text: result } }) + '\n\n';
      controller.enqueue(encoder.encode(packet + 'data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(source, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
  });
}
