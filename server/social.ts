/**
 * server/social.ts
 * ──────────────────
 * Posting to social platforms from the admin. Deliberately small and
 * pluggable: add a new class implementing SocialProvider and wire it into
 * getActiveProviders() when a platform is ready to support.
 *
 * Config lives in the content k/v table (same pattern as SumUp payments):
 *   social_fb_enabled      : "true" | "false"
 *   social_fb_page_id      : Facebook Page ID
 *   social_fb_page_token   : Page access token (long-lived) — from a Meta
 *                            developer app with pages_manage_posts +
 *                            pages_read_engagement on this page.
 *   social_autopost_result : "true" | "false" — auto-post when a fixture
 *                            score is saved.
 */

import { storage } from "./storage";

export type PostResult = { ok: boolean; externalPostId?: string; error?: string };

export interface SocialProvider {
  name: string;
  post(message: string, imageUrl?: string): Promise<PostResult>;
  testConnection(): Promise<{ ok: boolean; detail?: string; error?: string }>;
}

export type SocialConfig = {
  fbEnabled: boolean;
  fbPageId: string;
  fbPageToken: string;
  autoPostOnResult: boolean;
};

export async function readSocialConfig(): Promise<SocialConfig> {
  const get = (k: string) => storage.getContent(k).then((r) => r?.value || "");
  const [fbEnabled, fbPageId, fbPageToken, autoPostOnResult] = await Promise.all([
    get("social_fb_enabled"), get("social_fb_page_id"), get("social_fb_page_token"), get("social_autopost_result"),
  ]);
  return { fbEnabled: fbEnabled === "true", fbPageId, fbPageToken, autoPostOnResult: autoPostOnResult === "true" };
}

const GRAPH_VERSION = "v19.0";

class FacebookPageProvider implements SocialProvider {
  name = "facebook";
  constructor(private pageId: string, private token: string) {}

  async post(message: string, imageUrl?: string): Promise<PostResult> {
    try {
      const url = imageUrl
        ? `https://graph.facebook.com/${GRAPH_VERSION}/${this.pageId}/photos`
        : `https://graph.facebook.com/${GRAPH_VERSION}/${this.pageId}/feed`;
      const body = imageUrl
        ? { url: imageUrl, caption: message, access_token: this.token }
        : { message, access_token: this.token };
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json() as any;
      if (!r.ok) return { ok: false, error: data?.error?.message || `Facebook error (${r.status})` };
      return { ok: true, externalPostId: data?.post_id || data?.id };
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) };
    }
  }

  async testConnection() {
    try {
      const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${this.pageId}?fields=name&access_token=${encodeURIComponent(this.token)}`);
      const data = await r.json() as any;
      if (!r.ok) return { ok: false, error: data?.error?.message || `Facebook error (${r.status})` };
      return { ok: true, detail: data?.name };
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) };
    }
  }
}

async function getActiveProviders(): Promise<SocialProvider[]> {
  const cfg = await readSocialConfig();
  const providers: SocialProvider[] = [];
  if (cfg.fbEnabled && cfg.fbPageId && cfg.fbPageToken) {
    providers.push(new FacebookPageProvider(cfg.fbPageId, cfg.fbPageToken));
  }
  return providers;
}

// Posts to every enabled provider, logging one history row per attempt
// (success or failure) so the admin can see what actually went out.
export async function postToSocial(
  message: string,
  imageUrl: string | undefined,
  trigger: "manual" | "fixture_result"
): Promise<Array<{ provider: string } & PostResult>> {
  const providers = await getActiveProviders();
  if (providers.length === 0) {
    await storage.createSocialPost({
      provider: "none", message, imageUrl: imageUrl || "", trigger, status: "failed",
      externalPostId: "", error: "No social platform is connected yet — see the Social tab.",
    });
    return [{ provider: "none", ok: false, error: "No social platform is connected yet" }];
  }

  const results = await Promise.all(providers.map(async (p) => {
    const result = await p.post(message, imageUrl);
    await storage.createSocialPost({
      provider: p.name, message, imageUrl: imageUrl || "", trigger,
      status: result.ok ? "sent" : "failed",
      externalPostId: result.externalPostId || "", error: result.error || "",
    });
    return { provider: p.name, ...result };
  }));
  return results;
}
