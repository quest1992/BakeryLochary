export type ProductionRecipeLine = {
  ingredientId: number;
  quantity: number;
  stock: number;
};

export function calculateProductionUsage(
  recipes: ProductionRecipeLine[],
  productQuantity: number,
) {
  return recipes.map((recipe) => {
    const used = recipe.quantity * productQuantity;
    return {
      ingredientId: recipe.ingredientId,
      used,
      resultingStock: recipe.stock - used,
    };
  });
}
