import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import withHandler from '@/lib/withHandler';

import client from '@/lib/prismaClient';
import { StorageArea } from '@prisma/client';

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { userId } = req.headers;
  if (req.method === 'GET') {
    const ingredients = await client.storedIngredient.findMany({
      where: {
        userId: Number(userId),
      },
      select: {
        id: true,
        name: true,
        category: true,
        storageArea: true,
        count: true,
        expirationDate: true,
      },
    });

    const ingredientsResponse = ingredients.map((ingredient) => {
      const { id, name, category, storageArea, count, expirationDate } = ingredient;
      return { id, name, category, storageArea, count, expirationDate };
    });

    const categories: string[] = [];
    ingredientsResponse.forEach((ingredient) => {
      if (!categories.includes(ingredient.category)) {
        categories.push(ingredient.category);
      }
    });

    res.status(200).json({
      isSuccess: true,
      message: '성공적으로 조회되었습니다.',
      result: {
        categories,
        ingredients: ingredientsResponse,
      },
    });
  } else if (req.method === 'POST') {
    const { name, category, storageArea, count, expirationDate } = req.body;

    if (
      typeof name !== 'string' ||
      typeof category !== 'string' ||
      !Object.keys(StorageArea).includes(storageArea) ||
      typeof count !== 'number' ||
      typeof expirationDate !== 'string'
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: '데이터 형식이 올바르지 않습니다.',
        result: {},
      });
    }
    await client.storedIngredient.create({
      data: {
        userId: Number(userId),
        name,
        category,
        storageArea,
        count,
        expirationDate,
      },
    });
    return res.status(200).json({ isSuccess: true, message: '성공적으로 추가되었습니다.', result: {} });
  } else if (req.method === 'PUT') {
    const { id, name, category, storageArea, count, expirationDate } = req.body;
    if (
      typeof id !== 'number' ||
      typeof name !== 'string' ||
      typeof category !== 'string' ||
      !Object.keys(StorageArea).includes(storageArea) ||
      typeof count !== 'number' ||
      typeof expirationDate !== 'string'
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: '데이터 형식이 올바르지 않습니다.',
        result: {},
      });
    }
    await client.storedIngredient.update({
      data: {
        name,
        category,
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
        message: '식재료 ID를 전달받지 못함',
        result: {},
      });
    }

    await client.storedIngredient.delete({ where: { id: Number(id) } });
    return res.status(200).json({ isSuccess: true, message: '성공적으로 삭제되었습니다.', result: {} });
  }
}

export default withHandler({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  privateMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  handler,
});
