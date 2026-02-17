// ---- FEED CONFIG ----

const NITTER_BASE = "https://nitter.net";

const FEEDS = [
  // ESPN (top sports)
  { id: "espn_top",   url: "https://www.espn.com/espn/rss/news",         source: "espn.com",              kind: "top" },
  { id: "espn_nba",   url: "https://www.espn.com/espn/rss/nba/news",     source: "espn.com",              kind: "top" },
  { id: "espn_nfl",   url: "https://www.espn.com/espn/rss/nfl/news",     source: "espn.com",              kind: "top" },
  { id: "espn_cfb",   url: "https://www.espn.com/espn/rss/ncf/news",     source: "espn.com",              kind: "important" },
  { id: "espn_cbk",   url: "https://www.espn.com/espn/rss/ncb/news",     source: "espn.com",              kind: "consistent" },
  { id: "espn_soccer",url: "https://www.espn.com/espn/rss/soccer/news",  source: "espn.com",              kind: "consistent" },
  { id: "espn_tennis",url: "https://www.espn.com/espn/rss/tennis/news",  source: "espn.com",              kind: "periodic" },

  // CBS Sports (top sports)
  { id: "cbs_top",    url: "https://www.cbssports.com/rss/headlines/",   source: "cbssports.com",         kind: "top" },

  // NYT / The Athletic (longform / general)
  { id: "nyt_home",   url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",               source: "nytimes.com",        kind: "top" },
  { id: "nyt_pro_basketball", url: "https://rss.nytimes.com/services/xml/rss/nyt/ProBasketball.xml", source: "nytimes.com",        kind: "important" },

  // WSJ (longform / business / news)
  { id: "wsj_world",  url: "https://feeds.content.dowjones.io/public/rss/RSSWorldNews",               source: "wsj.com",            kind: "top" },
  { id: "wsj_us_business", url: "https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness",      source: "wsj.com",            kind: "important" },
  { id: "wsj_markets",url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain",             source: "wsj.com",            kind: "consistnet" },
  { id: "wsj_tech",   url: "https://feeds.content.dowjones.io/public/rss/RSSWSJD",                    source: "wsj.com",            kind: "consistent" },
  { id: "wsj_politics", url: "https://feeds.content.dowjones.io/public/rss/socialpoliticsfeed",       source: "wsj.com",            kind: "consistent" },
  { id: "wsj_economy", url: "https://feeds.content.dowjones.io/public/rss/socialeconomyfeed",         source: "wsj.com",            kind: "consistent" },
  { id: "wsj_sports", url: "https://feeds.content.dowjones.io/public/rss/rsssportsfeed",              source: "wsj.com",            kind: "important" },

  { id: "morning_brew", url: "https://www.morningbrew.com/feed.xml",              source: "morningbrew.com",            kind: "important" },
  
  // Israel / Euro sports sites
  { id: "one_main",   url: "https://www.one.co.il/rss/",                     source: "one.co.il",           kind: "top" },
  { id: "yahoo_sports", url: "https://sports.yahoo.com/general/news/rss/",   source: "sports.yahoo.com",    kind: "top" },
  { id: "front_office_sports", url: "https://frontofficesports.com/feed/",   source: "frontofficesports.com", kind: "periodic" },
  { id: "eurohoops",  url: "https://www.eurohoops.net/en/feed/",             source: "eurohoops.net",       kind: "consistent" },
];

function getFeedById(id) {
  return FEEDS.find(f => f.id === id) || null;
}

// Interval (in minutes) per feed kind
const INTERVALS = {
  breaking: 1,
  critical: 5,
  top: 10,
  important: 20,
  consistent: 30,
  periodic: 60,
  social: 10000000,
};

function getIntervalMinutes(feed) {
  return INTERVALS[feed.kind] ?? INTERVALS.default;
}

// Test a single Nitter RSS URL from the Worker
async function testNitterFeed(url) {
  try {
    const resp = await fetch(url);
    console.log("Nitter test status:", resp.status);

    if (!resp.ok) {
      const text = await resp.text();
      console.log("Nitter error body (first 500 chars):", text.slice(0, 500));
      return { ok: false, status: resp.status };
    }

    const xml = await resp.text();
    console.log("Nitter RSS OK, sample:", xml.slice(0, 500));
    return { ok: true, status: resp.status };
  } catch (err) {
    console.log("Nitter test threw error:", err);
    return { ok: false, error: String(err) };
  }
}

// ---- SIMPLE RSS PARSING ----

function decodeHtmlEntities(text) {
  if (!text) return text;

  let out = text.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );

  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return out;
}

function cleanCData(text) {
  if (!text) return null;

  let cleaned = text
    .replace(/^<!\[CDATA\[/i, "")
    .replace(/\]\]>$/i, "")
    .replace(/\\u003C/gi, "<")
    .replace(/\\u003E/gi, ">");

  cleaned = cleaned.replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "");
  cleaned = cleaned.replace(/<\/?[^>]+>/g, "");
  return cleaned.trim();
}

function extractTag(text, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractFirstImageSrc(htmlLike) {
  if (!htmlLike) return null;
  const imgMatch = htmlLike.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : null;
}

function parseItems(xml, feed) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const link = cleanCData(extractTag(block, "link"));
    const rawTitle = extractTag(block, "title");
    const rawDescription = extractTag(block, "description");

    let title = decodeHtmlEntities(cleanCData(rawTitle));
    let description = decodeHtmlEntities(cleanCData(rawDescription));
    let imageURL = null;

    if (feed.source === "one.co.il") {
      imageURL = extractFirstImageSrc(rawDescription);
      if (rawDescription) {
        let withoutImg = rawDescription.replace(/<img[^>]*>/i, "").trim();
        description = decodeHtmlEntities(cleanCData(withoutImg));
      }
    }

    items.push({
      id: link ?? `${feed.id}-${items.length}`,
      title,
      url: link,
      description,
      publishedAt: extractTag(block, "pubDate"),
      source: feed.source,
      category: null,
      imageURL,
      feedId: feed.id,
    });
  }

  return items;
}

// ---- FETCHING WITH PER-FEED INTERVALS ----

async function fetchFeedIfDue(env, feed, options = {}) {
  const { force = false } = options;

  const now = Date.now();
  const lastKey = `last:${feed.id}`;
  const lastStr = await env.SIMPLE_RSS_CACHE.get(lastKey);
  const last = lastStr ? parseInt(lastStr, 10) : 0;

  const intervalMs = getIntervalMinutes(feed) * 60 * 1000;

  if (!force && last && now - last < intervalMs) {
    console.log(
      JSON.stringify({
        type: "feed_not_due",
        ts: new Date().toISOString(),
        feedId: feed.id,
        source: feed.source,
        last,
        intervalMs,
      })
    );
    return { ok: false, reason: "not_due", feedId: feed.id, source: feed.source };
  }

  const resp = await fetch(feed.url);
  if (!resp.ok) {
    console.log("RSS fetch failed", feed.id, feed.url, resp.status);
    return {
      ok: false,
      reason: "http_error",
      status: resp.status,
      feedId: feed.id,
      source: feed.source,
    };
  }

  const xml = await resp.text();
  console.log("RSS fetched OK", feed.id, xml.slice(0, 200));

  await env.SIMPLE_RSS_CACHE.put(`rss:${feed.id}`, xml, {
    expirationTtl: 60 * 60 * 12,
  });
  await env.SIMPLE_RSS_CACHE.put(lastKey, now.toString());

  // Indicate this feed was actually pulled
  console.log(
    JSON.stringify({
      type: "feed_pulled_ok",
      ts: new Date().toISOString(),
      feedId: feed.id,
      source: feed.source,
      url: feed.url,
    })
  );

  return { ok: true, feedId: feed.id, source: feed.source };
}

async function aggregateAllFromKV(env) {
  let all = [];

  for (const feed of FEEDS) {
    const xml = await env.SIMPLE_RSS_CACHE.get(`rss:${feed.id}`);
    if (!xml) continue;

    const items = parseItems(xml, feed);
    all = all.concat(items);
  }

  all.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  return all;
}

// ---- WORKER HANDLERS ----

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/fetch-all") {
      const results = await Promise.all(FEEDS.map(feed => fetchFeedIfDue(env, feed)));
      const pulledFeeds = results
        .filter(r => r && r.ok)
        .map(r => ({ feedId: r.feedId, source: r.source }));

      console.log(
        JSON.stringify({
          type: "manual_fetch_summary",
          ts: new Date().toISOString(),
          pulledFeeds,
        })
      );

      return new Response("Fetched due feeds");
    }

    // New: test a single feed by id, e.g. /test-feed?feedId=morning_brew
    if (url.pathname === "/test-feed") {
      const feedId = url.searchParams.get("feedId");
      const force = url.searchParams.get("force") === "true";
    
      if (!feedId) {
        return new Response("Missing feedId query param", { status: 400 });
      }
    
      const feed = getFeedById(feedId);
      if (!feed) {
        return new Response(`Unknown feedId: ${feedId}`, { status: 404 });
      }
    
      // Optionally force a fresh fetch
      const fetchResult = await fetchFeedIfDue(env, feed, { force });
    
      // Always read the latest XML from KV
      const xml = await env.SIMPLE_RSS_CACHE.get(`rss:${feed.id}`);
      if (!xml) {
        return new Response(
          JSON.stringify({
            feedId,
            force,
            fetchResult,
            items: [],
            note: "No XML found in KV for this feed yet",
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }
    
      const items = parseItems(xml, feed);
    
      return new Response(
        JSON.stringify(
          {
            feedId,
            force,
            fetchResult,      // { ok: true/false, reason, ... }
            count: items.length,
            items,            // full parsed articles from just this source
          },
          null,
          2
        ),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (url.pathname === "/test-nitter") {
      const testUrl = "https://nitter.privacydev.net/ShamsCharania/rss";
      const result = await testNitterFeed(testUrl);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    if (url.pathname === "/api/news") {
      const articles = await aggregateAllFromKV(env);
      return new Response(JSON.stringify({ articles }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("OK from rss-aggregator");
  },

  async scheduled(event, env, ctx) {
    const results = await Promise.all(FEEDS.map(feed => fetchFeedIfDue(env, feed)));

    const pulledFeeds = results
      .filter(r => r && r.ok)
      .map(r => ({ feedId: r.feedId, source: r.source }));

    console.log(
      JSON.stringify({
        type: "cron_summary",
        ts: new Date().toISOString(),
        run: "rss-aggregator",
        pulledFeeds,  // list of { feedId, source } that actually fetched
      })
    );
  },
};
