import withHandler from '@/lib/withHandler';
import { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/prismaClient';
import AppResponseType from '@/types/appResponseType';
import recipeData from '../../public/recipe.json';
import RecipeType from '@/types/recipeType';

interface RecipeResponseType extends RecipeType {
  matched: string[];
  unmatched: string[];
}

function findMatchingElements(soruce: string[], target: string[]) {
  const soruceSet = new Set(soruce);
  const matched: string[] = [];
  const unmatched: string[] = [];
  target.forEach((element) => {
    if (soruceSet.has(element)) {
      matched.push(element);
    } else {
      unmatched.push(element);
    }
  });
  return { matched, unmatched };
}

// matched가 많은 순으로 하면 필요한 재료가 많은 레시피가 뽑히고
// unmatched가 많은 순으로 하면 필요한 재료가 적은 레시피가 뽑힌다.

//

function getRecipeScore(recipe: RecipeResponseType) {
  return recipe.matched.length;
}

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { userId } = req.headers;
  const storedIngredients = (
    await client.storedIngredient.findMany({
      where: { userId: Number(userId) },
      select: { name: true },
    })
  ).map((ingredient) => ingredient.name);

  const recipes = recipeData as RecipeType[];

  const top5Recipes = recipes
    .map((recipe, i) => ({ ...recipe, ...findMatchingElements(storedIngredients, recipe.ingredients) }))
    .sort((a, b) => getRecipeScore(b) - getRecipeScore(a))
    .slice(0, 5);

  return res.json({
    isSuccess: true,
    message: '',
    result: {
      recipes: top5Recipes,
    },
  });
}

export default withHandler({ methods: ['GET'], privateMethods: ['GET'], handler });
