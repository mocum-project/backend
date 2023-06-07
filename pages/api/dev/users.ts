import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import withHandler from '@/lib/withHandler';
import client from '@/lib/prismaClient';
import { randomUUID } from 'crypto';

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  if (req.method === 'GET') {
    const allUsers = await client.user.findMany({ select: { id: true, nickname: true } });
    return res.status(200).json({ isSuccess: true, message: '모든 유저 조회', result: { users: allUsers } });
  }
  if (req.method === 'POST') {
    const { nickname } = req.body;
    const user = await client.user.create({
      data: {
        nickname,
        kakaoId: randomUUID(),
      },
    });
    return res.status(200).json({ isSuccess: true, message: '유저 생성 성공', result: { user } });
  }
  if (req.method === 'DELETE') {
    const { id } = req.headers;
    if (id === '3') {
      return res.status(400).json({ isSuccess: false, message: '보호된 id', result: {} });
    }
    await client.user.delete({ where: { id: Number(id) } });
    return res.status(200).json({ isSuccess: true, message: '유저 삭제 성공', result: {} });
  }
}

export default withHandler({ methods: ['GET', 'POST', 'DELETE'], handler });
