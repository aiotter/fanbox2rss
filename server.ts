import * as xml from "https://deno.land/x/jsx4xml@v0.1.2/mod.ts";
import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
import { requestCreator, requestPosts, RssFeed } from "./mod.tsx";

async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const pathNames = requestUrl.pathname.split("/").slice(1);

  // GET /@{username}/posts
  if (request.method === "GET" && pathNames[1] === "posts") {
    return await getFanboxFeed(pathNames[0].replace(/^@/, ""));
  }

  if (["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  } else {
    return new Response(null, { status: 501, statusText: "Not Implemented" });
  }
}

async function getFanboxFeed(username: string) {
  // Get cookie
  await fetch(`https://${username}.fanbox.cc/posts`, { method: "HEAD" });

  const [creator, posts] = await Promise.all(
    [
      requestCreator(username),
      requestPosts(username),
    ],
  );
  const body = xml.renderWithDeclaration(await RssFeed({ creator, posts }));
  return new Response(body, {
    status: 200,
    headers: { "Content-type": "text/xml; charset=utf-8" },
  });
}

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
await serve(handler, { port: 8080 });
