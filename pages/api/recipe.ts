import withHandler from '@/lib/withHandler';
import { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/prismaClient';
import AppResponseType from '@/types/appResponseType';
import recipeData from '../../public/recipe.json';
import RecipeType from '@/types/recipeType';
import axios from 'axios';
import { isNumeric } from '@/lib/utils';

interface RecipeResponseType extends RecipeType {
  availableIngredients: string[];
  missingIngredients: string[];
}

interface YoutubeApiResponseType {
  items: {
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
    };
  }[];
}

// source -> 보유한 모든 식재료들
// target -> 특정 레시피에 필요한 식재료들

// 레시피의 식재료와 보유한 식재료를 비교해서 매칭되거나 매칭되지 않는 식재료를 골라내는 함수
function findMatchingIngredients(soruce: string[], target: string[]) {
  const soruceSet = new Set(soruce);
  const availableIngredients: string[] = []; // 보유한 식재료
  const missingIngredients: string[] = []; // 없는 식재료
  target.forEach((element) => {
    if (soruceSet.has(element)) {
      availableIngredients.push(element);
    } else {
      missingIngredients.push(element);
    }
  });
  return { availableIngredients, missingIngredients };
}

// 필수 식재료를 모두 보유하고 있는지 판별하는 함수
// 1. 보유한 식재료 중에 음식 이름이랑 겹치는 것이 하나도 없다면 필수 식재료가 없는 것
// 2. 보유하지 않은 식재료 중에 음식 이름이랑 겹치는 것이 하나라도 있다면 필수 식재료가 없는 것
// 둘 다 해당하지 않으면 모든 필수 식재료를 보유했다고 판별함

function hasAllRequiredIngredients(foodName: string, availableIngredients: string[], missingIngredients: string[]) {
  let hasRequiredInAvailable = false;
  let hasRequiredInMissing = false;
  availableIngredients.forEach((ingredient) => {
    if (foodName.includes(ingredient)) {
      hasRequiredInAvailable = true;
    }
  });
  missingIngredients.forEach((ingredient) => {
    if (foodName.includes(ingredient)) {
      hasRequiredInMissing = true;
    }
  });
  return hasRequiredInAvailable && !hasRequiredInMissing;
}

// 각각의 레시피에 점수를 매기는 함수
// 점수가 높을수록 더 좋은 레시피 추천

function getRecipeScore(recipe: RecipeResponseType) {
  let score = 0;

  // 보유한 식재료만큼 +
  score += recipe.availableIngredients.length;

  // 보유하지 않은 식재료만큼 -
  score -= recipe.missingIngredients.length;

  // 보유한 식재료가 3개 미만일 경우 -10점
  if (recipe.availableIngredients.length < 3) {
    score -= 10;
  }
  // if (recipe.missingIngredients.length > 5) {
  //   score -= 10;
  // }

  // 보유하지 않은 필수 식재료가 하나라도 있다면 -10점
  if (!hasAllRequiredIngredients(recipe.name, recipe.availableIngredients, recipe.missingIngredients)) {
    score -= 10;
  }

  return score;
}

// 유튜브 API 요청
async function getRecipeFromYoutube(foodName: string) {
  const params = {
    key: process.env.YOUTUBE_API_KEY,
    part: 'snippet',
    q: `${foodName} 만들기`,
  };
  const {
    data: { items },
  } = await axios.get<YoutubeApiResponseType>('https://www.googleapis.com/youtube/v3/search', { params });
  return {
    videoUrl: `https://youtube.com/video/${items[0].id.videoId}`,
    title: items[0].snippet.title,
    thumbnailUrl: items[0].snippet.thumbnails.medium.url,
  };
}

// n개의 레시피를 한꺼번에 검색 요청
async function fetchRecipes(foodNames: string[]) {
  const promises = foodNames.map((foodName) => getRecipeFromYoutube(foodName));
  const recipes = await Promise.all(promises);
  return recipes;
}

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { userId } = req.headers;
  const { startIndex } = req.query;

  if (typeof startIndex !== 'string' || !isNumeric(startIndex)) {
    return res.status(400).json({
      isSuccess: false,
      message: '데이터 형식이 올바르지 않습니다.',
      result: {},
    });
  }

  // 보유한 모든 식재료
  const storedIngredients = (
    await client.storedIngredient.findMany({
      where: { userId: Number(userId) },
      select: { name: true },
    })
  ).map((ingredient) => ingredient.name);

  const recipes = recipeData as RecipeType[];

  // startIndex로부터 5개의 상위 레시피를 필터링
  const nextTop5Recipes = recipes
    .map((recipe) => ({ ...recipe, ...findMatchingIngredients(storedIngredients, recipe.ingredients) }))
    .sort((a, b) => getRecipeScore(b) - getRecipeScore(a))
    .slice(Number(startIndex), Number(startIndex) + 5);

  // 레시피 5개 유튜브 검색 결과
  const youtubeResults = await fetchRecipes(nextTop5Recipes.map((recipes) => recipes.name));

  // 최종 응답 객체
  const recipeResponse = nextTop5Recipes.map((recipe, i) => {
    const { name, category, availableIngredients, missingIngredients } = recipe;
    return {
      name,
      category,
      availableIngredients,
      missingIngredients,
      youtube: youtubeResults[i],
    };
  });

  return res.json({
    isSuccess: true,
    message: '',
    result: {
      recipes: recipeResponse,
    },
  });
}

export default withHandler({ methods: ['GET'], privateMethods: ['GET'], handler });
