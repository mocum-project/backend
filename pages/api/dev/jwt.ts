import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import withHandler from '@/lib/withHandler';
import client from '@/lib/prismaClient';
import AppResponseType from '@/types/appResponseType';

function makeJwtToken(payload: string | object, privateKey: string) {
  const jwtToken = jwt.sign(payload, privateKey, { expiresIn: '30d' });
  return jwtToken;
}

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { id } = req.query;
  const user = await client.user.findFirst({ where: { id: Number(id) } });
  if (!user) {
    return res.status(400).json({ isSuccess: false, message: '존재하지 않는 ID', result: {} });
  }
  return res.status(200).json({
    isSuccess: true,
    message: 'jwt 생성 성공',
    result: {
      userId: user.id,
      jwt: makeJwtToken({ userId: id, nickname: 'test' }, process.env.JWT_PRIVATE_KEY as string),
    },
  });
}

export default withHandler({ methods: ['GET'], handler });
