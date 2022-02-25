/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
import { requestCreator, requestPosts, RssFeed } from "./mod.tsx";
import * as Nano from "https://deno.land/x/nano_jsx@v0.0.29/mod.ts";

async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const pathNames = requestUrl.pathname.split("/").slice(1);

  if (request.method === "GET" && pathNames[0] === "posts") {
    return await getFanboxFeed(pathNames[1]);
  }

  if (["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  } else {
    return new Response(null, { status: 501, statusText: "Not Implemented" });
  }
}

// GET /posts/{username}
async function getFanboxFeed(username: string) {
  // Get cookie
  await fetch(`https://${username}.fanbox.cc/posts`, { method: "HEAD" });

  const [creator, posts] = await Promise.all(
    [
      requestCreator(username),
      requestPosts(username),
    ],
  );
  const body = '<?xml version="1.0" encoding="UTF-8"?>' +
    Nano.renderSSR(() => Nano.h(RssFeed, { creator, posts }));
  return new Response(body, {
    status: 200,
    headers: { "Content-type": "text/xml; charset=utf-8" },
  });
}

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
await serve(handler, { port: 8080 });
