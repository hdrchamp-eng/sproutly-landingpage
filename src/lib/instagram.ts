import "server-only";
// Instagram API with Instagram Login. Tokens remain server-side. Never scrape.
export async function latestInstagramPost(manual: string): Promise<string> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN,
    user = process.env.INSTAGRAM_USER_ID,
    version = process.env.META_API_VERSION;
  if (
    !token ||
    !user ||
    !/^\d+$/.test(user) ||
    !version ||
    !/^v\d+\.\d+$/.test(version)
  )
    return manual;
  try {
    const url = new URL(`https://graph.instagram.com/${version}/${user}/media`);
    url.searchParams.set("fields", "id,permalink,timestamp");
    url.searchParams.set("limit", "25");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("upstream");
    const json = await res.json();
    if (!Array.isArray(json.data)) return manual;
    const posts = json.data
      .filter(
        (p: Record<string, unknown>) =>
          typeof p.permalink === "string" &&
          /^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/?$/.test(
            p.permalink,
          ) &&
          typeof p.timestamp === "string",
      )
      .sort(
        (a: { timestamp: string }, b: { timestamp: string }) =>
          Date.parse(b.timestamp) - Date.parse(a.timestamp),
      );
    return posts[0]?.permalink || manual;
  } catch {
    console.error(JSON.stringify({ event: "instagram_unavailable" }));
    return manual;
  }
}
