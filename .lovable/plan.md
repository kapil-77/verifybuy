## Fix: Voice assistant crashes app on render

### Root cause

`@elevenlabs/react` v1.9 changed the API: `useConversation` must now be rendered inside a `<ConversationProvider>`. Our `VoiceAssistant.tsx` calls `useConversation` at the top level with no provider, so it throws `useRegisterCallbacks must be used within a ConversationProvider`. That throw crashes the root route → user sees "Something went wrong."

### Change

Refactor `src/components/VoiceAssistant.tsx`:

1. Split into two components in the same file:
   - `VoiceAssistant` (exported) — renders `<ConversationProvider>` wrapping…
   - `VoiceAssistantInner` — contains all current logic (`useConversation`, tool handlers, UI).
2. Move the `clientTools` map and `onConnect/onDisconnect/onMessage/onError` callbacks from the `useConversation({...})` call into `<ConversationProvider {...}>` props (same `HookOptions` shape). Keep `useConversation()` inside `Inner` for `status`, `isSpeaking`, `startSession`, `endSession`.
3. Leave the existing `<ClientOnly>` wrapper in `__root.tsx` as-is (provider is client-only, so no SSR concern).

No other files change. This is a presentation-layer fix only.

### Verify

- Flush HMR, reload preview, confirm home renders (no error boundary).
- Confirm the floating mic button is visible.