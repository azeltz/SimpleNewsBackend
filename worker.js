// ---- FEED CONFIG ----

const NITTER_BASE = "https://nitter.net";

// Default feeds if KV has no config yet
const DEFAULT_FEEDS = [
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
  { id: "wsj_markets",url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain",             source: "wsj.com",            kind: "consistent" },
  { id: "wsj_tech",   url: "https://feeds.content.dowjones.io/public/rss/RSSWSJD",                    source: "wsj.com",            kind: "consistent" },
  { id: "wsj_politics", url: "https://feeds.content.dowjones.io/public/rss/socialpoliticsfeed",       source: "wsj.com",            kind: "consistent" },
  { id: "wsj_economy", url: "https://feeds.content.dowjones.io/public/rss/socialeconomyfeed",         source: "wsj.com",            kind: "consistent" },
  { id: "wsj_sports", url: "https://feeds.content.dowjones.io/public/rss/rsssportsfeed",              source: "wsj.com",            kind: "important" },

  // Morning Brew: daily schedule kind
  { id: "morning_brew", url: "https://www.morningbrew.com/feed.xml",     source: "morningbrew.com",      kind: "morning_daily" },
  
  // Israel / Euro sports sites
  { id: "one_main",   url: "https://www.one.co.il/rss/",                     source: "one.co.il",           kind: "top" },
  { id: "yahoo_sports", url: "https://sports.yahoo.com/general/news/rss/",   source: "sports.yahoo.com",    kind: "top" },
  { id: "front_office_sports", url: "https://frontofficesports.com/feed/",   source: "frontofficesports.com", kind: "periodic" },
  { id: "eurohoops",  url: "https://www.eurohoops.net/en/feed/",             source: "eurohoops.net",       kind: "consistent" },
];

// Load feeds from KV; fall back to defaults
async function loadFeeds(env) {
  const stored = await env.SIMPLE_RSS_CACHE.get("feeds:config", { type: "json" });
  if (!stored || !Array.isArray(stored)) {
    return DEFAULT_FEEDS;
  }
  return stored;
}

async function getFeedByIdDynamic(env, id) {
  const feeds = await loadFeeds(env);
  return feeds.find(f => f.id === id) || null;
}

// ---- KIND-BASED SCHEDULES (interval OR fixed time) ----

const INTERVALS = {
  // interval-based kinds
  breaking:   { minutes: 1 },
  critical:   { minutes: 5 },
  top:        { minutes: 10 },
  important:  { minutes: 20 },
  consistent: { minutes: 30 },
  periodic:   { minutes: 60 },
  social:     { minutes: 10000000 },

  // time-based kind: once per day at 12:30 UTC
  morning_daily: { timeUTC: "12:30" },
};

// If feed has its own schedule (from KV), that overrides kind
function getScheduleForFeed(feed) {
  if (feed.schedule) return feed.schedule;
  return INTERVALS[feed.kind] || {};
}

function isFeedDueByKind(feed, lastTimestamp, nowMs) {
  const schedule = getScheduleForFeed(feed);
  const now = new Date(nowMs);
  const last = lastTimestamp || 0;

  // Case 1: fixed daily time in UTC
  if (schedule.timeUTC) {
    const [hh, mm] = schedule.timeUTC.split(":").map(Number);

    const todayRun = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hh,
      mm,
      0
    );
    const yesterdayRun = todayRun - 24 * 60 * 60 * 1000;

    return nowMs >= todayRun && last < yesterdayRun;
  }

  // Case 2: interval in minutes
  const minutes =
    typeof schedule.minutes === "number"
      ? schedule.minutes
      : 10; // fallback

  const intervalMs = minutes * 60 * 1000;
  if (!last) return true;

  return nowMs - last >= intervalMs;
}

// ---- TEST NITTER ----

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
  const regex = new RegExp(`<${tag}>([\s\S]*?)<\\/${tag}>`, "i");
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
  const itemRegex = /<item>([\s\\S]*?)<\/item>/gi;
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

// ---- FETCHING WITH KIND-BASED SCHEDULES ----

async function fetchFeedIfDue(env, feed, options = {}) {
  const { force = false } = options;

  const now = Date.now();
  const lastKey = `last:${feed.id}`;
  const lastStr = await env.SIMPLE_RSS_CACHE.get(lastKey);
  const last = lastStr ? parseInt(lastStr, 10) : 0;

  if (!force && !isFeedDueByKind(feed, last, now)) {
    console.log(
      JSON.stringify({
        type: "feed_not_due",
        ts: new Date().toISOString(),
        feedId: feed.id,
        source: feed.source,
        last,
        kind: feed.kind,
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

  console.log(
    JSON.stringify({
      type: "feed_pulled_ok",
      ts: new Date().toISOString(),
      feedId: feed.id,
      source: feed.source,
      url: feed.url,
      kind: feed.kind,
    })
  );

  return { ok: true, feedId: feed.id, source: feed.source };
}

async function aggregateAllFromKV(env) {
  let all = [];
  const feeds = await loadFeeds(env);

  for (const feed of feeds) {
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

    // 1) Sync feeds from app: POST /feeds
    if (url.pathname === "/feeds" && request.method === "POST") {
      const body = await request.json();
      if (!Array.isArray(body.feeds)) {
        return new Response("Expected { feeds: [...] }", { status: 400 });
      }

      const cleaned = body.feeds.map(f => ({
        id: String(f.id),
        url: String(f.url),
        source: String(f.source),
        kind: String(f.kind),
        schedule: f.schedule || undefined, // optional { minutes, timeUTC }
      }));

      await env.SIMPLE_RSS_CACHE.put("feeds:config", JSON.stringify(cleaned));

      return new Response(
        JSON.stringify({ ok: true, count: cleaned.length }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Manual refresh: only fetch feeds that are due
    if (url.pathname === "/fetch-all") {
      const feeds = await loadFeeds(env);
      const results = await Promise.all(feeds.map(feed => fetchFeedIfDue(env, feed)));
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

    // Test a single feed by id, e.g. /test-feed?feedId=morning_brew&force=true
    if (url.pathname === "/test-feed") {
      const feedId = url.searchParams.get("feedId");
      const force = url.searchParams.get("force") === "true";
    
      if (!feedId) {
        return new Response("Missing feedId query param", { status: 400 });
      }
    
      const feed = await getFeedByIdDynamic(env, feedId);
      if (!feed) {
        return new Response(`Unknown feedId: ${feedId}`, { status: 404 });
      }
    
      const fetchResult = await fetchFeedIfDue(env, feed, { force });
    
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
            fetchResult,
            count: items.length,
            items,
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
    const feeds = await loadFeeds(env);
    const results = await Promise.all(feeds.map(feed => fetchFeedIfDue(env, feed)));

    const pulledFeeds = results
      .filter(r => r && r.ok)
      .map(r => ({ feedId: r.feedId, source: r.source }));

    console.log(
      JSON.stringify({
        type: "cron_summary",
        ts: new Date().toISOString(),
        run: "rss-aggregator",
        pulledFeeds,
      })
    );
  },
};
