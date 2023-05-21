import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import withHandler from '@/lib/withHandler';

import client from '@/lib/prismaClient';

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { userId } = req.headers;
  const foods = await client.storedFood.findMany({
    where: {
      userId: Number(userId),
    },
    select: {
      id: true,
      foodName: true,
      storageArea: true,
      count: true,
      expirationDate: true,
      FoodCategory: { select: { category: true } },
    },
  });

  const foodsResponse = foods.map((food) => {
    const {
      id,
      foodName,
      storageArea,
      count,
      expirationDate,
      FoodCategory: { category },
    } = food;
    return { id, foodName, storageArea, count, expirationDate, category };
  });

  const categories: string[] = [];
  foodsResponse.forEach((food) => {
    if (!categories.includes(food.category)) {
      categories.push(food.category);
    }
  });

  res.status(200).json({
    isSuccess: true,
    message: '성공적으로 조회되었습니다.',
    result: {
      categories,
      foods: foodsResponse,
    },
  });
}

export default withHandler({ methods: ['GET'], privateMethods: ['GET'], handler });
