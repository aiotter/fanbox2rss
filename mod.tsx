/** @jsx JsxXml.JSXXML */

import JsxXml from "https://esm.sh/jsx-xml@0.2.3";
import { formatRFC7231, parseISO } from "https://esm.sh/date-fns@2.28.0";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

function validateDate(date: string): string {
  return formatRFC7231(parseISO(date, {}));
}

async function getDataSize(url: string): Promise<number> {
  const request = await fetch(url, { method: "HEAD" });
  return Number(request.headers.get("Content-Length"));
}

export const RssFeed = async (
  { creator, posts }: { creator: FanboxCreator; posts: FanboxPost[] },
) => (
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      {/* <atom:link
        href={`https://${creator.creatorId}.fanbox.cc/`}
        rel="self"
        type="application/rss+xml"
      /> */}
      <title>{creator.user.name}</title>
      <link>{`https://${creator.creatorId}.fanbox.cc/`}</link>
      <description>{creator.description}</description>
      <lastBuildDate>{validateDate(posts[0].updatedDatetime)}</lastBuildDate>
      <image>
        <url>{creator.coverImageUrl}</url>
        <title>{creator.user.name}</title>
        <link>{`https://${creator.creatorId}.fanbox.cc/`}</link>
      </image>
      {await Promise.all(posts.map(async (post) => (
        <item>
          <title>{post.title}</title>
          <link>{`https://${creator.creatorId}.fanbox.cc/${post.id}/`}</link>
          <guid>{`https://${creator.creatorId}.fanbox.cc/${post.id}/`}</guid>
          <pubDate>{validateDate(post.publishedDatetime)}</pubDate>
          {post.coverImageUrl
            ? (
              <enclosure
                url={post.coverImageUrl}
                type={`image/${
                  new URL(post.coverImageUrl).pathname.split(".").slice(-1)[0]
                }`}
                length={await getDataSize(post.coverImageUrl)}
              />
            )
            : undefined}
          <source url={`https://${creator.creatorId}.fanbox.cc/`}>
            {creator.user.name}
          </source>
        </item>
      )))}
    </channel>
  </rss>
);

interface FanboxPost {
  coverImageUrl: string | null;
  creatorId: string;
  feeRequired: number;
  hasAdultContent: boolean;
  id: string;
  isRestricted: string;
  publishedDatetime: string;
  tags: string[];
  title: string;
  updatedDatetime: string;
  user: {
    iconUrl: string;
    name: string;
    userId: string;
  };
}

interface FanboxCreator {
  coverImageUrl: string;
  creatorId: string;
  description: string;
  hasAdultContent: boolean;
  hasBoothShop: boolean;
  isAcceptingRequest: boolean;
  isStopped: boolean;
  profileLinks: string[];
  user: {
    iconUrl: string;
    name: string;
    userId: string;
  };
}

function requestInit(username: string) {
  return {
    headers: { origin: `https://${username}.fanbox.cc` },
    referrer: `https://${username}.fanbox.cc/`,
  } as RequestInit;
}

export async function requestCreator(username: string) {
  const data = await fetch(
    `https://api.fanbox.cc/creator.get?creatorId=${username}`,
    requestInit(username),
  ).then((request) => request.json());
  return data.body as FanboxCreator;
}

export async function requestPosts(username: string) {
  const { body: [url] } = await fetch(
    `https://api.fanbox.cc/post.paginateCreator?creatorId=${username}`,
    requestInit(username),
  ).then((request) => request.json());

  const data = await fetch(url, requestInit(username))
    .then((request) => request.json());
  return data.body.items as FanboxPost[];
}
