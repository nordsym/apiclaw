const DEFAULT_BLOCKED_IPS = [
  "2607:5300:205:300::/64",
  "51.79.89.20",
  "45.14.111.126",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_RE = /^[a-z0-9.!#%&'*+/=?^_`|~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f-\u009f]/;
const HTML_TAG_RE = /<\/?[a-z][^>]*>/i;
const TEMPLATE_RE = /\{\{|\}\}|\$\{|<%|=\s*\{\{/;
const URL_RE = /(?:https?:\/\/|www\.|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?=\b|[/:?]))/i;

export const BOOKING_SOURCES = {
  enterprise: "apiclaw-enterprise",
  publicBook: "apiclaw-public-book",
} as const;

export type BookingSource = (typeof BOOKING_SOURCES)[keyof typeof BOOKING_SOURCES];

export type ValidatedBooking = {
  source: BookingSource;
  email: string;
  webhookPayload: Record<string, string>;
};

export type BookingValidationResult =
  | { ok: true; value: ValidatedBooking }
  | { ok: false; error: string };

function normalizeIpv4(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const normalized: string[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const number = Number(part);
    if (number > 255) return null;
    normalized.push(String(number));
  }
  return normalized.join(".");
}

function normalizeIpv6(value: string): string | null {
  const input = value.toLowerCase();
  if (!input.includes(":") || input.includes("%") || input.includes(".")) return null;
  if ((input.match(/::/g) || []).length > 1) return null;

  const hasCompression = input.includes("::");
  const [leftText, rightText = ""] = hasCompression ? input.split("::") : [input, ""];
  const left = leftText ? leftText.split(":") : [];
  const right = rightText ? rightText.split(":") : [];
  const groups = [...left, ...right];
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;

  const missing = 8 - groups.length;
  if ((!hasCompression && missing !== 0) || (hasCompression && missing < 1)) return null;
  const expanded = hasCompression
    ? [...left, ...Array(missing).fill("0"), ...right]
    : left;
  return expanded.map((group) => group.padStart(4, "0")).join(":");
}

/** Returns a canonical IPv4 address or a fully expanded, lower-case IPv6 address. */
export function normalizeIp(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const unbracketed = trimmed.startsWith("[") && trimmed.endsWith("]")
    ? trimmed.slice(1, -1)
    : trimmed;
  return normalizeIpv4(unbracketed) ?? normalizeIpv6(unbracketed);
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const realIp = headers.get("x-real-ip");
  const forwardedIp = headers.get("x-forwarded-for")?.split(",", 1)[0];
  return normalizeIp(realIp || forwardedIp || "");
}

function blockedEntries(extraEntries?: string): string[] {
  return [
    ...DEFAULT_BLOCKED_IPS,
    ...(extraEntries || "").split(","),
  ].map((entry) => entry.trim()).filter(Boolean);
}

export function isBlockedIp(ip: string, extraEntries?: string): boolean {
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) return false;
  for (const entry of blockedEntries(extraEntries)) {
    if (entry.endsWith("/64")) {
      const prefix = normalizeIp(entry.slice(0, -3));
      if (prefix?.includes(":") && normalizedIp.includes(":")) {
        const prefixGroups = prefix.split(":").slice(0, 4).join(":");
        if (normalizedIp.split(":").slice(0, 4).join(":") === prefixGroups) return true;
      }
      continue;
    }
    if (normalizeIp(entry) === normalizedIp) return true;
  }
  return false;
}

function stringField(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  return typeof value === "string" ? value.trim() : null;
}

function unsafeFreeText(value: string): boolean {
  return CONTROL_CHARS_RE.test(value) || HTML_TAG_RE.test(value) ||
    TEMPLATE_RE.test(value) || URL_RE.test(value);
}

function reservedEmailDomain(email: string): boolean {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (["example.com", "example.net", "example.org", "webhook.site"].some(
    (reserved) => domain === reserved || domain.endsWith(`.${reserved}`),
  )) return true;
  return ["example", "test", "invalid", "localhost"].some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`),
  );
}

function dateFromBody(body: Record<string, unknown>, source: BookingSource): string | null {
  if (source === BOOKING_SOURCES.enterprise) return stringField(body, "date");
  const day = stringField(body, "day");
  const match = day?.match(/^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)-(\d{4}-\d{2}-\d{2})$/i);
  return match?.[1] ?? null;
}

function validDate(date: string, now: Date): boolean {
  if (!DATE_RE.test(date)) return false;
  const instant = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(instant.getTime()) || instant.toISOString().slice(0, 10) !== date) return false;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastDay = new Date(today);
  lastDay.setUTCDate(lastDay.getUTCDate() + 90);
  return instant >= today && instant <= lastDay;
}

export function validateBooking(
  input: unknown,
  now = new Date(),
): BookingValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid_booking" };
  }
  const body = input as Record<string, unknown>;
  const rawGuardedFields = ["name", "email", "company", "notes", "message"]
    .map((field) => typeof body[field] === "string" ? body[field] as string : "");
  if (rawGuardedFields.some((value) => CONTROL_CHARS_RE.test(value))) {
    return { ok: false, error: "unsafe_text" };
  }
  const source = stringField(body, "source");
  if (source !== BOOKING_SOURCES.enterprise && source !== BOOKING_SOURCES.publicBook) {
    return { ok: false, error: "invalid_source" };
  }

  const name = stringField(body, "name") || "";
  const email = (stringField(body, "email") || "").toLowerCase();
  const company = stringField(body, "company") || "";
  const submittedNotes = stringField(body, "notes") || "";
  const submittedMessage = stringField(body, "message") || "";
  const notes = submittedNotes || submittedMessage;
  const date = dateFromBody(body, source);
  const time = stringField(body, "time") || "";

  if (!name || !email || !date || !time) return { ok: false, error: "missing_required_fields" };
  if (name.length > 100 || company.length > 100 || email.length > 254 ||
      submittedNotes.length > 1000 || submittedMessage.length > 1000) {
    return { ok: false, error: "field_too_long" };
  }
  if (!EMAIL_RE.test(email) || reservedEmailDomain(email)) return { ok: false, error: "invalid_email" };
  if (!validDate(date, now)) return { ok: false, error: "invalid_date" };
  if (!TIME_RE.test(time)) return { ok: false, error: "invalid_time" };
  if ([name, company, submittedNotes, submittedMessage].some(unsafeFreeText)) {
    return { ok: false, error: "unsafe_text" };
  }

  if (source === BOOKING_SOURCES.enterprise) {
    const timezone = stringField(body, "timezone") || "UTC";
    if (timezone.length > 100 || !/^[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(timezone)) {
      return { ok: false, error: "invalid_timezone" };
    }
    const meetingTitle = `APIClaw Enterprise${company ? ` — ${company}` : ""}`;
    if (meetingTitle.length > 150) return { ok: false, error: "field_too_long" };
    return {
      ok: true,
      value: {
        source,
        email,
        webhookPayload: {
          name, email, company, notes, message: notes, date, time,
          requestedDate: date, requestedTime: time, timezone, source,
          bookedVia: "APIClaw Enterprise", meetingTitle,
          timestamp: now.toISOString(),
        },
      },
    };
  }

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00.000Z`)).toLowerCase();
  return {
    ok: true,
    value: {
      source,
      email,
      webhookPayload: { name, email, company, day: `${weekday}-${date}`, time, notes },
    },
  };
}
