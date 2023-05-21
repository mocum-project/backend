import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import withHandler from '@/lib/withHandler';

import client from '@/lib/prismaClient';
import { FoodStorageArea } from '@prisma/client';

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { userId } = req.headers;
  if (req.method === 'GET') {
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
  } else if (req.method === 'POST') {
    const { foodName, storageArea, count, expirationDate } = req.body;
    if (
      typeof foodName !== 'string' ||
      !Object.keys(FoodStorageArea).includes(storageArea) ||
      typeof count !== 'number' ||
      typeof expirationDate !== 'string'
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: '데이터 형식이 올바르지 않습니다.',
        result: {},
      });
    }
    await client.storedFood.create({
      data: {
        userId: Number(userId),
        foodName,
        storageArea,
        count,
        expirationDate,
      },
    });
    return res.status(200).json({ isSuccess: true, message: '성공적으로 추가되었습니다.', result: {} });
  } else if (req.method === 'PUT') {
    const { id, foodName, storageArea, count, expirationDate } = req.body;
    if (
      typeof id !== 'number' ||
      typeof foodName !== 'string' ||
      !Object.keys(FoodStorageArea).includes(storageArea) ||
      typeof count !== 'number' ||
      typeof expirationDate !== 'string'
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: '데이터 형식이 올바르지 않습니다.',
        result: {},
      });
    }
    await client.storedFood.update({
      data: {
        foodName,
        storageArea,
        count,
        expirationDate,
      },
      where: { id },
    });
    return res.status(200).json({ isSuccess: true, message: '성공적으로 수정되었습니다.', result: {} });
  } else if (req.method === 'DELETE') {
    const { id } = req.headers;
    if (!id) {
      return res.status(400).json({
        isSuccess: false,
        message: '아이디를 전달받지 못함',
        result: {},
      });
    }

    await client.storedFood.delete({ where: { id: Number(id) } });
    return res.status(200).json({ isSuccess: true, message: '성공적으로 삭제되었습니다.', result: {} });
  }
}

export default withHandler({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  privateMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  handler,
});
