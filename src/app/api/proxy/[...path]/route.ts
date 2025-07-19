/**
 * Universal API Proxy - Vercel Edge Function
 *
 * USAGE:
 * Place this file at: app/api/proxy/[...path]/route.ts
 *
 * Example requests:
 * - Bybit: /api/proxy/api.bybit.com/v5/market/tickers
 * - Binance: /api/proxy/api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
 * - Any API: /api/proxy/your-domain.com/your/endpoint
 *
 * Authenticated requests (include your headers as normal):
 * fetch('/api/proxy/api.bybit.com/v5/account/wallet-balance', {
 *   headers: {
 *     'X-BAPI-API-KEY': 'your-key',
 *     'X-BAPI-SIGN': 'your-signature',
 *     'X-BAPI-TIMESTAMP': timestamp
 *   }
 * })
 *
 * Deploys to non-US regions (Frankfurt, Hong Kong, Singapore) and mimics
 * legitimate browser traffic to avoid detection.
 */

import { NextRequest, NextResponse } from "next/server";

// Configure edge runtime and regions
export const runtime = "edge";
export const config = {
  regions: ["fra1", "hkg1", "sin1"], // Frankfurt, Hong Kong, Singapore
};

// Common browser user agents for better stealth
const USER_AGENTS: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
];

interface RouteParams {
  params: {
    path: string[];
  };
}

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params.path, "GET");
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params.path, "POST");
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params.path, "PUT");
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params.path, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  try {
    const url = new URL(request.url);

    // Extract target host from first path segment
    const [targetHost, ...apiPath] = path;

    if (!targetHost || !targetHost.includes(".")) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Build target URL - support both http and https
    const protocol =
      targetHost.startsWith("localhost") || targetHost.includes(":")
        ? "http"
        : "https";
    const targetUrl = `${protocol}://${targetHost}/${apiPath.join("/")}`;
    const targetUrlWithParams = new URL(targetUrl);

    // Copy query parameters (exclude Next.js auto-generated 'path' params)
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {  // Skip Next.js generated path parameters
        targetUrlWithParams.searchParams.set(key, value);
      }
    });


    // Prepare headers to mimic a real browser
    const headers = new Headers();

    // Copy most headers from original request but filter problematic ones
    const skipHeaders = [
      "host",
      "connection",
      "transfer-encoding",
      "content-length",
      "cf-ray",
      "cf-visitor",
      "cf-connecting-ip",
      "x-forwarded-for",
      "x-forwarded-proto",
      "x-vercel-forwarded-for",
      "x-vercel-ip-country",
    ];

    request.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Set realistic browser headers
    headers.set("User-Agent", getRandomUserAgent());
    headers.set(
      "Accept",
      request.headers.get("accept") || "application/json, text/plain, */*"
    );
    headers.set("Accept-Language", "en-US,en;q=0.9");
    headers.set("Accept-Encoding", "gzip, deflate, br");
    headers.set("Cache-Control", "no-cache");
    headers.set("Pragma", "no-cache");
    headers.set(
      "Sec-Ch-Ua",
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"'
    );
    headers.set("Sec-Ch-Ua-Mobile", "?0");
    headers.set("Sec-Ch-Ua-Platform", '"Windows"');
    headers.set("Sec-Fetch-Dest", "empty");
    headers.set("Sec-Fetch-Mode", "cors");
    headers.set("Sec-Fetch-Site", "cross-site");

    // Set origin and referer to look like a legitimate web app
    const targetOrigin = `${protocol}://${targetHost}`;
    headers.set("Origin", targetOrigin);
    headers.set("Referer", `${targetOrigin}/`);

    // Prepare request options
    const requestOptions: RequestInit = {
      method: method,
      headers: headers,
    };

    // Add body for POST/PUT requests
    if (method === "POST" || method === "PUT") {
      const body = await request.text();
      if (body) {
        requestOptions.body = body;
      }
    }

    // Make the request
    const response = await fetch(
      targetUrlWithParams.toString(),
      requestOptions
    );

    // Create response headers
    const responseHeaders = new Headers();

    // Copy most headers from target response
    const skipResponseHeaders = [
      "content-encoding",
      "transfer-encoding",
      "connection",
      "server",
      "x-powered-by",
      "via",
      "x-cache",
    ];

    response.headers.forEach((value, key) => {
      if (!skipResponseHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Add CORS headers for browser compatibility
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    responseHeaders.set("Access-Control-Allow-Headers", "*");
    responseHeaders.set("Access-Control-Expose-Headers", "*");

    // Get response body
    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Request failed:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}
