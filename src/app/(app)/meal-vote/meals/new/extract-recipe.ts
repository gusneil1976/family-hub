"use server";

import { requireAdmin } from "@/lib/auth";
import {
  parseIngredientLine,
  type ParsedIngredient,
} from "../parse-bulk-ingredient-line";

export type ExtractedRecipe = {
  title: string;
  servings: number | null;
  recipe_body: string | null;
  notes: string | null;
  image_url: string | null;
  source_url: string;
  ingredients: ParsedIngredient[];
};

export type ExtractRecipeResult = { data: ExtractedRecipe } | { error: string };

// Recipe sites overwhelmingly mark up their content with schema.org's
// Recipe type (as JSON-LD) specifically so Google can show recipe rich
// results — that structured data is far more reliable to parse than trying
// to guess a site's HTML layout. Sites that don't have it get a clear
// "couldn't extract" error rather than garbage data.
export async function extractRecipeFromUrl(
  url: string,
): Promise<ExtractRecipeResult> {
  await requireAdmin();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: "Only http/https URLs are supported." };
  }

  let html: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { error: `Couldn't fetch that page (HTTP ${res.status}).` };
    }
    html = await res.text();
  } catch {
    return { error: "Couldn't fetch that page. Check the URL and try again." };
  }

  const recipe = findRecipeJsonLd(html);
  if (!recipe) {
    return {
      error:
        "Couldn't find structured recipe data on that page. Some sites don't include it — you'll need to add this one manually.",
    };
  }

  return {
    data: {
      title: firstString(recipe.name) ?? "Imported recipe",
      servings: parseServings(recipe.recipeYield),
      recipe_body: parseInstructions(recipe.recipeInstructions),
      notes: buildNotes(recipe),
      image_url: parseImage(recipe.image),
      source_url: parsedUrl.toString(),
      ingredients: parseIngredients(
        recipe.recipeIngredient ?? recipe.ingredients,
      ),
    },
  };
}

type JsonLdNode = Record<string, unknown>;

function findRecipeJsonLd(html: string): JsonLdNode | null {
  const scriptRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const candidates: JsonLdNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRe.exec(html))) {
    try {
      collectCandidates(JSON.parse(match[1].trim()), candidates);
    } catch {
      // Malformed JSON-LD block — skip it and keep looking.
    }
  }

  return candidates.find(isRecipe) ?? null;
}

function collectCandidates(node: unknown, out: JsonLdNode[]) {
  if (Array.isArray(node)) {
    for (const item of node) collectCandidates(item, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as JsonLdNode;
    out.push(obj);
    if (Array.isArray(obj["@graph"])) {
      collectCandidates(obj["@graph"], out);
    }
  }
}

function isRecipe(node: JsonLdNode): boolean {
  const type = node["@type"];
  return Array.isArray(type) ? type.includes("Recipe") : type === "Recipe";
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) return firstString(value[0]);
  return null;
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, "").trim();
}

function parseServings(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "number") return Math.round(raw);
  if (typeof raw === "string") {
    const match = raw.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
  return null;
}

function parseImage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return parseImage(value[0]);
  if (value && typeof value === "object") {
    const url = (value as JsonLdNode).url;
    if (typeof url === "string") return url;
  }
  return null;
}

function flattenInstructions(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map(stripHtml)
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenInstructions);
  }
  if (value && typeof value === "object") {
    const obj = value as JsonLdNode;
    if (Array.isArray(obj.itemListElement)) {
      return flattenInstructions(obj.itemListElement);
    }
    if (typeof obj.text === "string") {
      return [stripHtml(obj.text)];
    }
  }
  return [];
}

function parseInstructions(value: unknown): string | null {
  const steps = flattenInstructions(value).filter(Boolean);
  if (steps.length === 0) return null;
  return steps.map((step, i) => `${i + 1}. ${step}`).join("\n\n");
}

function parseDuration(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (!hours && !minutes) return null;
  return [hours && `${hours}h`, minutes && `${minutes}m`]
    .filter(Boolean)
    .join(" ");
}

function buildNotes(recipe: JsonLdNode): string | null {
  const parts: string[] = [];

  const description = firstString(recipe.description);
  if (description) parts.push(stripHtml(description));

  const prep = parseDuration(recipe.prepTime);
  const cook = parseDuration(recipe.cookTime);
  const timing = [prep && `Prep: ${prep}`, cook && `Cook: ${cook}`]
    .filter(Boolean)
    .join(" · ");
  if (timing) parts.push(timing);

  return parts.length ? parts.join("\n\n") : null;
}

function parseIngredients(value: unknown): ParsedIngredient[] {
  const lines = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : typeof value === "string"
      ? [value]
      : [];

  return lines
    .map(stripHtml)
    .filter(Boolean)
    .map((line) => parseIngredientLine(line));
}
