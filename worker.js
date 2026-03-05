// ---- FEED CONFIG ----

const NITTER_BASE = "https://nitter.net";

// Keep articles for the last 14 days
const ARTICLE_TTL_DAYS = 14;
const ARTICLE_TTL_MS = ARTICLE_TTL_DAYS * 24 * 60 * 60 * 1000;

// Default feeds if KV has no config yet
const DEFAULT_FEEDS = [
  // ESPN (top sports)
  { id: "espn_top",   url: "https://www.espn.com/espn/rss/news",         source: "espn.com",           kind: "top" },
  { id: "espn_nba",   url: "https://www.espn.com/espn/rss/nba/news",     source: "espn.com",           kind: "top" },
  { id: "espn_nfl",   url: "https://www.espn.com/espn/rss/nfl/news",     source: "espn.com",           kind: "top" },
  { id: "espn_cfb",   url: "https://www.espn.com/espn/rss/ncf/news",     source: "espn.com",           kind: "important" },
  { id: "espn_cbk",   url: "https://www.espn.com/espn/rss/ncb/news",     source: "espn.com",           kind: "consistent" },
  { id: "espn_soccer",url: "https://www.espn.com/espn/rss/soccer/news",  source: "espn.com",           kind: "consistent" },
  { id: "espn_tennis",url: "https://www.espn.com/espn/rss/tennis/news",  source: "espn.com",           kind: "periodic" },

  // CBS Sports (top sports)
  { id: "cbs_top",    url: "https://www.cbssports.com/rss/headlines/",   source: "cbssports.com",      kind: "top" },

  // NYT / The Athletic (longform / general)
  { id: "nyt_home",   url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",               source: "nytimes.com",   kind: "top" },
  { id: "nyt_pro_basketball", url: "https://rss.nytimes.com/services/xml/rss/nyt/ProBasketball.xml", source: "nytimes.com",   kind: "important" },

  // AP / Associated Press (shorter / general)
  { id: "ap_top",     url: "http://hosted.ap.org/lineups/TOPHEADS.rss",  source: "apnews.com",         kind: "top" },
  
  // WSJ (longform / business / news)
  { id: "wsj_world",  url: "https://feeds.content.dowjones.io/public/rss/RSSWorldNews",               source: "wsj.com",       kind: "top" },
  { id: "wsj_us_business", url: "https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness",      source: "wsj.com",       kind: "important" },
  { id: "wsj_markets",url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain",             source: "wsj.com",       kind: "consistent" },
  { id: "wsj_tech",   url: "https://feeds.content.dowjones.io/public/rss/RSSWSJD",                    source: "wsj.com",       kind: "consistent" },
  { id: "wsj_politics", url: "https://feeds.content.dowjones.io/public/rss/socialpoliticsfeed",       source: "wsj.com",       kind: "consistent" },
  { id: "wsj_economy", url: "https://feeds.content.dowjones.io/public/rss/socialeconomyfeed",         source: "wsj.com",       kind: "consistent" },
  { id: "wsj_sports", url: "https://feeds.content.dowjones.io/public/rss/rsssportsfeed",              source: "wsj.com",       kind: "important" },

  // Morning Brew: daily schedule kind
  { id: "morning_brew", url: "https://www.morningbrew.com/feed.xml",     source: "morningbrew.com",    kind: "morning_daily" },
  
  // Israel / Euro sports sites
  { id: "one_main",   url: "https://www.one.co.il/rss/",                     source: "one.co.il",        kind: "top" },
  { id: "yahoo_sports", url: "https://sports.yahoo.com/general/news/rss/",   source: "sports.yahoo.com", kind: "top" },
  { id: "front_office_sports", url: "https://frontofficesports.com/feed/",   source: "frontofficesports.com", kind: "periodic" },
  { id: "eurohoops",  url: "https://www.eurohoops.net/en/feed/",             source: "eurohoops.net",    kind: "consistent" },

  // Israeli general news
  { id: "ynet_english_news", url: "https://www.ynet.co.il/3rdparty/mobile/rss/ynetnews/3082/", source: "ynet.co.il", kind: "important" },
  { id: "ynet_top",          url: "https://www.ynet.co.il/Integration/StoryRss2.xml",          source: "ynet.co.il", kind: "top" },
  { id: "ynet_consistent",   url: "https://www.ynet.co.il/Integration/StoryRss3.xml",          source: "ynet.co.il", kind: "consistent" },

  // Local Texas cities (Google News blend)
  { id: "local_tx_cities", url: "https://news.google.com/rss/search?q=%22Dallas+Texas%22+OR+%22Plano+Texas%22+OR+%22College+Station+Texas%22+OR+%22Bryan+Texas%22&hl=en-US&gl=US&ceid=US:en", source: "news.google.com", kind: "consistent" },

  // Sports analytics
  { id: "opta_analyst", url: "https://theanalyst.com/feed/",                source: "theanalyst.com",   kind: "periodic" },

  // Tech / startups
  { id: "techcrunch_main", url: "https://techcrunch.com/feed/",             source: "techcrunch.com",   kind: "consistent" },

  // Texas A&M / SEC news (Google News blends)
  { id: "tamu_news", url: "https://news.google.com/rss/search?q=%22Texas+A%26M%22+OR+%22Aggies%22&hl=en-US&gl=US&ceid=US:en", source: "news.google.com", kind: "consistent" },
  { id: "sec_news",  url: "https://news.google.com/rss/search?q=%22SEC%22+OR+%22Southeastern+Conference%22+college+football+OR+college+basketball&hl=en-US&gl=US&ceid=US:en", source: "news.google.com", kind: "consistent" },
];

function feedsConfigKey(userId) {
  return userId ? `feeds:config:${userId}` : "feeds:config";
}

function feedArticlesKey(feedId) {
  return `feed_articles:${feedId}`;
}

function feedMetaKey(feedId) {
  return `feed_meta:${feedId}`;
}

const GLOBAL_META_KEY = "meta:global";

// ---- LOAD FEEDS ----

async function loadFeeds(env, userId = null) {
  const stored = await env.SIMPLE_RSS_CACHE.get(feedsConfigKey(userId), { type: "json" });
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return DEFAULT_FEEDS;
  }

  const byId = new Map(DEFAULT_FEEDS.map(f => [f.id, f]));
  for (const f of stored) {
    byId.set(f.id, f);
  }
  return Array.from(byId.values());
}

async function getFeedByIdDynamic(env, id, userId = null) {
  const feeds = await loadFeeds(env, userId);
  return feeds.find(f => f.id === id) || null;
}

// ---- KIND-BASED SCHEDULES ----

const INTERVALS = {
  breaking:   { minutes: 1 },
  critical:   { minutes: 5 },
  top:        { minutes: 10 },
  important:  { minutes: 20 },
  consistent: { minutes: 30 },
  periodic:   { minutes: 60 },
  social:     { minutes: 10000000 },
  morning_daily: { timeUTC: "12:30" },
};

function getScheduleForFeed(feed) {
  if (feed.schedule) return feed.schedule;
  return INTERVALS[feed.kind] || {};
}

function isFeedDueByKind(feed, lastTimestamp, nowMs) {
  const schedule = getScheduleForFeed(feed);
  const now = new Date(nowMs);
  const last = lastTimestamp || 0;

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

  const minutes =
    typeof schedule.minutes === "number"
      ? schedule.minutes
      : 10;

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
  const itemRegex = /<item>([\s\\S]*?)<\\/item>/gi;
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

    const publishedAtRaw = extractTag(block, "pubDate");
    const publishedTs = publishedAtRaw ? Date.parse(publishedAtRaw) : Date.now();

    items.push({
      id: link ?? `${feed.id}-${items.length}`,
      title,
      url: link,
      description,
      publishedAt: publishedAtRaw,
      publishedTs,
      source: feed.source,
      category: null,
      imageURL,
      feedId: feed.id,
    });
  }

  return items;
}

// ---- GOOGLE NEWS KEYWORD SUPPORT ----

function buildGoogleNewsUrlFromKeywords(keywords) {
  if (!keywords || keywords.length === 0) return null;

  const query = keywords
    .map(k => `"${k}"`)
    .join(" OR ");

  const encoded = encodeURIComponent(query);

  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}

async function loadDynamicKeywordFeed(env) {
  const stored = await env.SIMPLE_RSS_CACHE.get("preferences:keywords");
  if (!stored) return null;

  let keywords;
  try {
    keywords = JSON.parse(stored);
  } catch {
    return null;
  }
  if (!Array.isArray(keywords) || keywords.length === 0) return null;

  const url = buildGoogleNewsUrlFromKeywords(keywords);
  if (!url) return null;

  return {
    id: "dynamic_keywords",
    url,
    source: "news.google.com",
    kind: "consistent",
  };
}

// ---- SAFE KV PUT / DELETE ----

async function safePut(env, key, value, options) {
  try {
    await env.SIMPLE_RSS_CACHE.put(key, value, options);
    return { ok: true };
  } catch (err) {
    console.log(
      JSON.stringify({
        type: "kv_put_error",
        key,
        error: String(err),
        ts: new Date().toISOString(),
      })
    );
    return { ok: false, error: String(err) };
  }
}

async function safeDelete(env, key) {
  try {
    await env.SIMPLE_RSS_CACHE.delete(key);
    return { ok: true };
  } catch (err) {
    console.log(
      JSON.stringify({
        type: "kv_delete_error",
        key,
        error: String(err),
        ts: new Date().toISOString(),
      })
    );
    return { ok: false, error: String(err) };
  }
}

async function updateGlobalMeta(env, updates) {
  const existingStr = await env.SIMPLE_RSS_CACHE.get(GLOBAL_META_KEY);
  let meta = {};
  if (existingStr) {
    try {
      meta = JSON.parse(existingStr) || {};
    } catch {
      meta = {};
    }
  }
  meta = { ...meta, ...updates };
  await safePut(env, GLOBAL_META_KEY, JSON.stringify(meta));
}

// ---- FETCHING WITH KIND-BASED SCHEDULES ----

async function fetchFeedIfDue(env, feed, options = {}) {
  const { force = false } = options;

  const nowMs = Date.now();
  const metaKey = feedMetaKey(feed.id);
  const metaStr = await env.SIMPLE_RSS_CACHE.get(metaKey);
  let last = 0;
  let lastSeen = null;
  if (metaStr) {
    try {
      const meta = JSON.parse(metaStr);
      if (typeof meta.last === "number") last = meta.last;
      if (typeof meta.lastSeen === "string") lastSeen = meta.lastSeen;
    } catch {}
  }

  if (!force && !isFeedDueByKind(feed, last, nowMs)) {
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

  const cutoff = nowMs - ARTICLE_TTL_MS;
  let items = parseItems(xml, feed);
  items = items.filter(it => {
    const ts =
      it.publishedTs ||
      (it.publishedAt ? Date.parse(it.publishedAt) : 0);
    return ts >= cutoff;
  });

  items.sort((a, b) => {
    const ta =
      a.publishedTs ||
      (a.publishedAt ? Date.parse(a.publishedAt) : 0);
    const tb =
      b.publishedTs ||
      (b.publishedAt ? Date.parse(b.publishedAt) : 0);
    return tb - ta;
  });

  const newestId = items.length > 0 ? items[0].id : null;
  const articlesKey = feedArticlesKey(feed.id);
  const newJson = JSON.stringify(items);

  const existingJson = await env.SIMPLE_RSS_CACHE.get(articlesKey);

  if (existingJson === newJson && !force) {
    const newMeta = {
      last: nowMs,
      lastSeen: newestId || null,
    };

    await safePut(env, metaKey, JSON.stringify(newMeta), {
      expirationTtl: ARTICLE_TTL_DAYS * 24 * 60 * 60,
    });

    console.log(
      JSON.stringify({
        type: "feed_articles_unchanged",
        ts: new Date().toISOString(),
        feedId: feed.id,
        source: feed.source,
      })
    );

    return { ok: true, feedId: feed.id, source: feed.source, unchanged: true };
  }

  const writeArticles = await safePut(
    env,
    articlesKey,
    newJson,
    {
      expirationTtl: ARTICLE_TTL_DAYS * 24 * 60 * 60,
    }
  );

  const newMeta = {
    last: nowMs,
    lastSeen: newestId || null,
  };

  const writeMeta = await safePut(
    env,
    metaKey,
    JSON.stringify(newMeta),
    {
      expirationTtl: ARTICLE_TTL_DAYS * 24 * 60 * 60,
    }
  );

  if (!writeArticles.ok || !writeMeta.ok) {
    return {
      ok: false,
      reason: "kv_write_failed",
      feedId: feed.id,
      source: feed.source,
      writeArticles,
      writeMeta,
    };
  }

  console.log(
    JSON.stringify({
      type: "feed_pulled_ok",
      ts: new Date().toISOString(),
      feedId: feed.id,
      source: feed.source,
      url: feed.url,
      kind: feed.kind,
      newestId,
      keptArticles: items.length,
    })
  );

  return { ok: true, feedId: feed.id, source: feed.source };
}

// ---- AGGREGATE ARTICLES FOR /api/news ----

async function aggregateArticlesFromKV(env, userId = null) {
  const feeds = await loadFeeds(env, userId);
  const now = Date.now();
  const cutoff = now - ARTICLE_TTL_MS;

  let all = [];

  for (const feed of feeds) {
    const key = feedArticlesKey(feed.id);
    const json = await env.SIMPLE_RSS_CACHE.get(key);
    if (!json) continue;

    let items;
    try {
      items = JSON.parse(json);
    } catch {
      continue;
    }
    if (!Array.isArray(items)) continue;

    for (const article of items) {
      const ts =
        article.publishedTs ||
        (article.publishedAt ? Date.parse(article.publishedAt) : 0);
      if (ts < cutoff) continue;

      all.push(article);
    }
  }

  all.sort((a, b) => {
    const ta =
      a.publishedTs ||
      (a.publishedAt ? Date.parse(a.publishedAt) : 0);
    const tb =
      b.publishedTs ||
      (b.publishedAt ? Date.parse(b.publishedAt) : 0);
    return tb - ta;
  });

  return all;
}

// ---- WORKER HANDLERS ----

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const userId =
      url.searchParams.get("userId") ||
      request.headers.get("X-SimpleNews-UserId") ||
      null;

    if (url.pathname === "/feeds") {
      if (request.method === "POST") {
        const body = await request.json();
        if (!Array.isArray(body.feeds)) {
          return new Response("Expected { feeds: [...] }", { status: 400 });
        }

        const cleaned = body.feeds.map(f => ({
          id: String(f.id),
          url: String(f.url),
          source: String(f.source),
          kind: String(f.kind),
          schedule: f.schedule || undefined,
        }));

        const configKey = feedsConfigKey(userId);

        const existingStr = await env.SIMPLE_RSS_CACHE.get(configKey);
        let existing = null;
        if (existingStr) {
          try {
            existing = JSON.parse(existingStr);
          } catch {
            existing = null;
          }
        }

        const normalizeFeeds = (feedsArr) =>
          Array.isArray(feedsArr)
            ? [...feedsArr]
                .map(f => ({
                  id: String(f.id),
                  url: String(f.url),
                  source: String(f.source),
                  kind: String(f.kind),
                  schedule: f.schedule || undefined,
                }))
                .sort((a, b) => a.id.localeCompare(b.id))
            : [];

        const newNorm = normalizeFeeds(cleaned);
        const oldNorm = normalizeFeeds(existing);

        const same =
          JSON.stringify(newNorm) === JSON.stringify(oldNorm);

        if (same) {
          return new Response(
            JSON.stringify({ ok: true, count: cleaned.length, changed: false }),
            { headers: { "Content-Type": "application/json" } }
          );
        }

        const putResult = await safePut(
          env,
          configKey,
          JSON.stringify(cleaned)
        );
        if (!putResult.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: putResult.error }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ ok: true, count: cleaned.length, changed: true }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      if (request.method === "GET") {
        const feeds = await loadFeeds(env, userId);
        return new Response(JSON.stringify({ feeds }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/keywords" && request.method === "POST") {
      const body = await request.json();
      const keywords = Array.isArray(body.keywords) ? body.keywords : [];

      const putResult = await safePut(
        env,
        "preferences:keywords",
        JSON.stringify(keywords)
      );
      if (!putResult.ok) {
        return new Response(
          JSON.stringify({ ok: false, error: putResult.error }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, count: keywords.length }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/fetch-all") {
      let feeds = await loadFeeds(env, null);
      const dynamicFeed = await loadDynamicKeywordFeed(env);
      if (dynamicFeed) {
        feeds = [...feeds, dynamicFeed];
      }

      const results = await Promise.all(feeds.map(feed => fetchFeedIfDue(env, feed)));
      const pulledFeeds = results
        .filter(r => r && r.ok)
        .map(r => ({ feedId: r.feedId, source: r.source }));

      if (pulledFeeds.length > 0) {
        await updateGlobalMeta(env, {
          last_snapshot_at: new Date().toISOString(),
        });
      }

      console.log(
        JSON.stringify({
          type: "manual_fetch_summary",
          ts: new Date().toISOString(),
          pulledFeeds,
        })
      );

      return new Response("Fetched due feeds");
    }

    if (url.pathname === "/test-feed") {
      const feedId = url.searchParams.get("feedId");
      const force = url.searchParams.get("force") === "true";

      if (!feedId) {
        return new Response("Missing feedId query param", { status: 400 });
      }

      const feed = await getFeedByIdDynamic(env, feedId, userId);
      if (!feed) {
        return new Response(`Unknown feedId: ${feedId}`, { status: 404 });
      }

      const fetchResult = await fetchFeedIfDue(env, feed, { force });

      const key = feedArticlesKey(feed.id);
      const json = await env.SIMPLE_RSS_CACHE.get(key);
      const items = json ? JSON.parse(json) : [];

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
      const articles = await aggregateArticlesFromKV(env, userId);
      const globalMetaStr = await env.SIMPLE_RSS_CACHE.get(GLOBAL_META_KEY);
      let lastSnapshotAt = null;
      if (globalMetaStr) {
        try {
          const meta = JSON.parse(globalMetaStr);
          lastSnapshotAt = meta.last_snapshot_at || null;
        } catch {}
      }
      return new Response(JSON.stringify({ articles, lastSnapshotAt }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/search-news" && request.method === "POST") {
      const body = await request.json();
      const keywords = Array.isArray(body.keywords) ? body.keywords : [];

      if (keywords.length === 0) {
        return new Response(JSON.stringify({ articles: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const gnewsUrl = buildGoogleNewsUrlFromKeywords(keywords);
      const resp = await fetch(gnewsUrl);
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ articles: [], error: `Google News HTTP ${resp.status}` }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }
      const xml = await resp.text();

      const tempFeed = { id: "search_dynamic", source: "news.google.com" };
      const items = parseItems(xml, tempFeed);

      return new Response(JSON.stringify({ articles: items }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("OK from rss-aggregator");
  },

  async scheduled(event, env, ctx) {
    let feeds = await loadFeeds(env, null);
    const dynamicFeed = await loadDynamicKeywordFeed(env);
    if (dynamicFeed) {
      feeds = [...feeds, dynamicFeed];
    }

    const results = await Promise.all(feeds.map(feed => fetchFeedIfDue(env, feed)));

    const pulledFeeds = results
      .filter(r => r && r.ok)
      .map(r => ({ feedId: r.feedId, source: r.source }));

    if (pulledFeeds.length > 0) {
      await updateGlobalMeta(env, {
        last_snapshot_at: new Date().toISOString(),
      });
    }

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
