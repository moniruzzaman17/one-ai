import "server-only";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { safeFetch } from "./network";

export type CrawledPage = { url: string; title: string; text: string; hash: string };

const MAX_RESPONSE_BYTES = 5_000_000;
const MAX_DISCOVERY_SCRIPTS = 16;

function cleanText(value: string) {
  const text = /<[^>]+>/.test(value) ? cheerio.load(value).text() : value;
  return text.replace(/\s+/g, " ").trim();
}

function label(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
}

function flattenJson(value: unknown, key = "", depth = 0): string[] {
  if (depth > 8 || value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenJson(item, key, depth + 1));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([childKey, child]) => {
      if (/^(image|gallery|video|createdAt|updatedAt)/i.test(childKey)) return [];
      return flattenJson(child, childKey, depth + 1);
    });
  }
  if (!["string", "number", "boolean"].includes(typeof value)) return [];
  const text = cleanText(String(value));
  if (!text) return [];
  return [`${key ? `${label(key)}: ` : ""}${text}`];
}

export function extractJsonText(value: unknown) {
  return flattenJson(value).join("\n");
}

export function discoverApiPaths(source: string) {
  const paths = new Set<string>();
  const pattern = /(["'`])(\/api\/[A-Za-z0-9_~!$&()*+,;=:@%/?#.-]+)\1/g;
  for (const match of source.matchAll(pattern)) paths.add(match[2]);
  return [...paths];
}

export async function crawlWebsite(start: string, maxDepth = 3, maxPages = 100) {
  const root = new URL(start);
  const origin = root.origin;
  const robotsUrl = new URL("/robots.txt", origin);
  let robots = robotsParser(robotsUrl.toString(), "");
  try {
    const response = await safeFetch(robotsUrl);
    if (response.ok) robots = robotsParser(robotsUrl.toString(), await response.text());
  } catch {}

  const queue = [{ url: root.toString(), depth: 0 }];
  const seen = new Set<string>();
  const seenScripts = new Set<string>();
  const hashes = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length && pages.length < maxPages) {
    const item = queue.shift()!;
    const canonical = new URL(item.url);
    canonical.hash = "";
    canonical.searchParams.sort();
    const href = canonical.toString();
    if (seen.has(href) || canonical.origin !== origin || !robots.isAllowed(href, "OneAI-KnowledgeBot")) continue;
    seen.add(href);

    let response: Response;
    try { response = await safeFetch(canonical); } catch { continue; }
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    const size = Number(response.headers.get("content-length") ?? 0);
    if (!response.ok || size > MAX_RESPONSE_BYTES) continue;

    const raw = await response.text();
    let normalized = "";
    let title = canonical.pathname || canonical.hostname;

    if (type === "application/json" || type.endsWith("+json")) {
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        normalized = extractJsonText(data);
        title = `Catalog data: ${canonical.pathname}`;
        const pagination = data.pagination as Record<string, unknown> | undefined;
        if (item.depth < maxDepth && pagination?.has_next === true) {
          const next = new URL(canonical);
          next.searchParams.set("page", String(Number(pagination.page ?? 1) + 1));
          queue.push({ url: next.toString(), depth: item.depth + 1 });
        }
      } catch { continue; }
    } else if (type === "text/html" || type === "text/plain" || !type) {
      const $ = cheerio.load(raw);
      title = $("title").text().trim() || title;

      if (type !== "text/plain" && item.depth < maxDepth) {
        for (const element of $("script[src]").toArray()) {
          if (seenScripts.size >= MAX_DISCOVERY_SCRIPTS) break;
          try {
            const scriptUrl = new URL($(element).attr("src")!, canonical);
            if (scriptUrl.origin !== origin || seenScripts.has(scriptUrl.toString())) continue;
            seenScripts.add(scriptUrl.toString());
            const scriptResponse = await safeFetch(scriptUrl, { headers: { Accept: "application/javascript,text/javascript" } });
            const scriptSize = Number(scriptResponse.headers.get("content-length") ?? 0);
            if (!scriptResponse.ok || scriptSize > 2_000_000) continue;
            const script = await scriptResponse.text();
            for (const path of discoverApiPaths(script)) {
              const apiUrl = new URL(path, canonical);
              for (const [key,value] of [...apiUrl.searchParams]) if (!value) apiUrl.searchParams.delete(key);
              if (apiUrl.origin === origin) queue.push({ url: apiUrl.toString(), depth: item.depth + 1 });
            }
          } catch {}
        }
      }

      $("script,style,noscript,svg,nav,footer,form").remove();
      normalized = cleanText($("main,article").first().text().trim() || $("body").text().trim());
      if (item.depth < maxDepth) {
        $("a[href]").each((_, element) => {
          try {
            const next = new URL($(element).attr("href")!, canonical);
            next.hash = "";
            if (next.origin === origin && !["mailto:", "tel:"].includes(next.protocol) && !seen.has(next.toString())) {
              queue.push({ url: next.toString(), depth: item.depth + 1 });
            }
          } catch {}
        });
      }
    } else continue;

    const hash = createHash("sha256").update(normalized).digest("hex");
    if (normalized.length > 80 && !hashes.has(hash)) {
      hashes.add(hash);
      pages.push({ url: href, title, text: normalized, hash });
    }
  }
  return pages;
}
