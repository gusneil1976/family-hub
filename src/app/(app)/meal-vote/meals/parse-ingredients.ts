export function parseIngredientRows(formData: FormData) {
  const names = formData.getAll("ingredient_name").map(String);
  const quantities = formData.getAll("ingredient_quantity").map(String);
  const units = formData.getAll("ingredient_unit").map(String);

  return names
    .map((name, i) => ({
      name: name.trim(),
      quantity: quantities[i]?.trim() || null,
      unit: units[i]?.trim() || null,
      sort_order: i,
    }))
    .filter((row) => row.name.length > 0);
}
