import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import withHandler from '@/lib/withHandler';

function makeJwtToken(payload: string | object, privateKey: string) {
  const jwtToken = jwt.sign(payload, privateKey, { expiresIn: '30d' });
  return jwtToken;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res
    .status(200)
    .json({ jwt: makeJwtToken({ userId: '3', nickname: '박지수' }, process.env.JWT_PRIVATE_KEY as string) });
}

export default withHandler({ methods: ['GET'], handler });
