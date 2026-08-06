const UNIT_WORDS = [
  "tbsp",
  "tbsps",
  "tablespoon",
  "tablespoons",
  "tsp",
  "tsps",
  "teaspoon",
  "teaspoons",
  "g",
  "gram",
  "grams",
  "kg",
  "kilogram",
  "kilograms",
  "mg",
  "ml",
  "l",
  "litre",
  "litres",
  "liter",
  "liters",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "cup",
  "cups",
  "clove",
  "cloves",
  "pinch",
  "pinches",
  "dash",
  "dashes",
  "sprig",
  "sprigs",
  "stick",
  "sticks",
  "bunch",
  "bunches",
  "can",
  "cans",
  "tin",
  "tins",
  "packet",
  "packets",
  "pack",
  "packs",
  "slice",
  "slices",
  "piece",
  "pieces",
  "handful",
  "handfuls",
  "sheet",
  "sheets",
  "stalk",
  "stalks",
];
const UNIT_SET = new Set(UNIT_WORDS);

// Units implied to mean "1" when they appear with no leading number,
// e.g. "pinch chilli flakes".
const IMPLIED_ONE_UNITS = new Set([
  "pinch",
  "dash",
  "handful",
  "splash",
  "squeeze",
]);

const FRACTIONS = "¼½¾⅓⅔⅛⅜⅝⅞";
const QTY_RE = new RegExp(
  `^(\\d+(?:[.,]\\d+)?(?:\\s?[${FRACTIONS}])?(?:\\s*[-–]\\s*\\d+(?:[.,]\\d+)?)?|[${FRACTIONS}])`,
);

export type ParsedIngredient = {
  name: string;
  quantity: string;
  unit: string;
};

// Best-effort split of a freeform recipe line into quantity/unit/name, e.g.
// "2 tbsp runny honey" -> { quantity: "2", unit: "tbsp", name: "runny honey" }
// "1 lime, zest and juice" -> { quantity: "1", unit: "each", name: "lime, zest and juice" }
// Not guaranteed to be exact for every phrasing — fields stay editable after.
export function parseIngredientLine(raw: string): ParsedIngredient {
  const line = raw.trim();
  const qtyMatch = line.match(QTY_RE);

  if (!qtyMatch) {
    const firstWord = line.match(/^([a-zA-Z]+)\b/);
    if (firstWord && IMPLIED_ONE_UNITS.has(firstWord[1].toLowerCase())) {
      const name = line.slice(firstWord[0].length).trim().replace(/^,\s*/, "");
      return { name: name || line, quantity: "1", unit: firstWord[1].toLowerCase() };
    }
    return { name: line, quantity: "", unit: "" };
  }

  const quantity = qtyMatch[1].trim();
  let rest = line.slice(qtyMatch[0].length);
  let unit = "";

  // Unit glued directly to the number, e.g. "20g", "1½oz".
  const glued = rest.match(/^([a-zA-Z]+)\b/);
  if (glued && UNIT_SET.has(glued[1].toLowerCase())) {
    unit = glued[1].toLowerCase();
    rest = rest.slice(glued[0].length);
  } else {
    // Unit separated by a space, e.g. "2 tbsp".
    const spaced = rest.match(/^\s+([a-zA-Z]+)\b/);
    if (spaced && UNIT_SET.has(spaced[1].toLowerCase())) {
      unit = spaced[1].toLowerCase();
      rest = rest.slice(spaced[0].length);
    }
  }

  // Drop an alternate measurement that follows, e.g. the "/⅔oz" in "20g/⅔oz".
  rest = rest.replace(/^\s*\/\S+/, "");
  rest = rest.trim().replace(/^,\s*/, "");

  return {
    name: rest || line,
    quantity,
    unit: unit || (quantity ? "each" : ""),
  };
}
