import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Keys whose values must never reach the logs: credentials, OTPs, and any
// bearer/refresh/access tokens. Compared case-insensitively.
const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'confirmnewpassword',
  'currentpassword',
  'oldpassword',
  'otp',
  'otpcode',
  'token',
  'accesstoken',
  'refreshtoken',
  'webhooksecret',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
]);

// Return a copy with sensitive fields masked. Never mutates the input, so the
// real request/response is untouched — only what we log changes.
function redact(value: unknown, depth = 0): unknown {
  if (value == null || depth > 5) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase())
        ? '[REDACTED]'
        : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

// Response bodies are usually already-serialized JSON strings; parse so token
// fields inside them get masked too, and fall back to the raw value otherwise.
function redactBody(body: unknown): unknown {
  if (typeof body === 'string') {
    try {
      return redact(JSON.parse(body));
    } catch {
      return body;
    }
  }
  return redact(body);
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('=============Request Start=============');
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.originalUrl);
    console.log('Request Headers:', redact(req.headers));
    console.log('Request Body:', redact(req.body));
    console.log('==============Request END==============');

    const originalSend = res.send;

    res.send = function (body) {
      console.log('=============Response Start=============');
      console.log('Response Status Code:', res.statusCode);
      console.log('Response Headers:', redact(res.getHeaders()));
      console.log('Response Body:', redactBody(body));
      console.log('==============Response END==============');

      // Send the ORIGINAL, unredacted body — redaction is for logs only.
      return originalSend.call(this, body);
    };

    next();
  }
}
