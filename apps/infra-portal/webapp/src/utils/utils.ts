// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import * as yup from "yup";

import {
  ALLOWED_URL_PROTOCOLS,
  GITHUB_DESCRIPTION_MAX,
  GITHUB_REPO_NAME_MAX,
  GITHUB_TOPIC_MAX_COUNT,
  GITHUB_TOPIC_MAX_LENGTH,
} from "@config/config";

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export const formatDateTime = (dateTimeStr: string | null | undefined): string => {
  if (!dateTimeStr) return "N/A";
  const utcDate = new Date(dateTimeStr + " UTC");
  if (isNaN(utcDate.getTime())) return "N/A";
  const day = String(utcDate.getDate()).padStart(2, "0");
  const month = String(utcDate.getMonth() + 1).padStart(2, "0");
  const year = utcDate.getFullYear();
  const hours = String(utcDate.getHours()).padStart(2, "0");
  const minutes = String(utcDate.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}, ${hours}:${minutes}`;
};

// Validation patterns for the repository creation request form
export const TOPIC_PATTERN = /^[a-z0-9-]+$/;
export const REPO_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
export const REPO_NAME_SINGLE_CHAR_PATTERN = /[A-Za-z0-9._-]/;
export const URL_SCHEMA_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
export const DATA_URL_SCHEME_PATTERN = /^\s*(javascript|data):/i;
// Strip ASCII control characters (0x00-0x1F and 0x7F) without embedding literal control chars.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_PATTERN = new RegExp("[\\u0000-\\u001F\\u007F]+", "g");

export const emailListValidation = yup
  .string()
  .trim()
  .required("At least one email is required.")
  .test(
    "valid-emails",
    "All emails must be valid.",
    (value) =>
      !value ||
      value
        .split(",")
        .map((e) => e.trim())
        .every((email) => yup.string().email().isValidSync(email)),
  );

export const repoNameValidation = yup
  .string()
  .trim()
  .required("Repository name is required.")
  .transform((v) => (typeof v === "string" ? v.trim() : ""))
  .test(
    "length-max",
    `Repository name must be at most ${GITHUB_REPO_NAME_MAX} characters.`,
    (value) => (value || "").length <= GITHUB_REPO_NAME_MAX,
  )
  .test("not-reserved", 'Repository name cannot be "." or "..".', (value) => {
    const v = (value || "").trim();
    return v !== "." && v !== "..";
  })
  .test(
    "no-dot-git",
    'Repository name must not end with ".git".',
    (value) => !/(?:^|.)\.git$/i.test((value || "").trim()),
  )
  .test("allowed-chars", "Invalid repository name.", function (value) {
    const { createError, path } = this;
    const v = (value || "").trim();

    if (!v) return true;

    if (!REPO_NAME_PATTERN.test(v)) {
      for (let i = 0; i < v.length; i++) {
        const ch = v[i];
        if (!REPO_NAME_SINGLE_CHAR_PATTERN.test(ch)) {
          return createError({
            path,
            message: `Invalid character at position ${i + 1}: "${ch}". Use only letters, numbers, hyphens (-), underscores (_), and periods (.).`,
          });
        }
      }
      return createError({
        path,
        message:
          "Invalid repository name. Use only letters, numbers, hyphens (-), underscores (_), and periods (.).",
      });
    }
    return true;
  });

export const descriptionValidation = yup
  .string()
  .trim()
  .required("Description is required.")
  .max(GITHUB_DESCRIPTION_MAX, `Description cannot exceed ${GITHUB_DESCRIPTION_MAX} characters.`);

export const topicsValidation = yup
  .string()
  .trim()
  .required("Topics are required.")
  .transform((v) => (typeof v === "string" ? v : ""))
  .test("count-max", `Add no more than ${GITHUB_TOPIC_MAX_COUNT} topics.`, (value) => {
    const arr = (value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.length <= GITHUB_TOPIC_MAX_COUNT;
  })
  .test("no-duplicates", "Topics must be unique (case-insensitive).", (value) => {
    const arr = (value || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return arr.length === new Set(arr).size;
  })
  .test("validate-each", "Invalid topics.", function (value) {
    const { createError, path } = this;
    const raw = (value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (let i = 0; i < raw.length; i++) {
      const shown = raw[i];
      const t = shown.toLowerCase();

      if (t.length > GITHUB_TOPIC_MAX_LENGTH) {
        return createError({
          path,
          message: `Topic #${i + 1} ("${shown}") is too long (max ${GITHUB_TOPIC_MAX_LENGTH}).`,
        });
      }

      if (!TOPIC_PATTERN.test(t)) {
        return createError({
          path,
          message: `Topic #${i + 1} ("${shown}") is invalid. Use only lowercase letters, numbers, and hyphens.`,
        });
      }
    }
    return true;
  });

export const urlValidation = yup
  .string()
  .trim()
  // Normalize bare domains (e.g. "example.com") to "https://example.com" so the
  // allowlist test and the subsequent .url() check both accept them, matching sanitizeUrl().
  .transform((v) => {
    if (!v) return undefined;
    return URL_SCHEMA_PATTERN.test(v) ? v : `https://${v}`;
  })
  .test("protocol-allowlist", "Website URL must start with http:// or https://", (value) => {
    if (!value) return true;
    try {
      return ALLOWED_URL_PROTOCOLS.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  })
  .url("Website URL must be a valid URL.")
  .notRequired();

export const sanitizeDescription = (description: string): string =>
  description
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

export const sanitizeTopics = (rawTopicsString: string[] | string): string => {
  const arr = Array.isArray(rawTopicsString) ? rawTopicsString : rawTopicsString.split(",");
  const cleaned = arr
    .flatMap((v) => v.split(","))
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return unique.join(",");
};

export const sanitizeEmails = (emails: string): string => {
  return emails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .join(",");
};

export const sanitizeRepoName = (name: string): string => {
  return name.trim();
};

export const sanitizeUrl = (input: string | undefined | null): string => {
  if (!input) return "";
  let cleaned = String(input).trim().replace(CONTROL_CHARS_PATTERN, "");
  if (!cleaned) return "";

  // Reject javascript: and data: schemes
  if (DATA_URL_SCHEME_PATTERN.test(cleaned)) return "";

  // Default to https:// if no scheme
  if (!URL_SCHEMA_PATTERN.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }

  try {
    const u = new URL(cleaned);
    if (!ALLOWED_URL_PROTOCOLS.includes(u.protocol)) return "";
    return u.toString();
  } catch {
    return "";
  }
};
