import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import withHandler from '@/lib/withHandler';
import JwtPayloadType from '@/types/jwtPayloadType';

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { jwt } = req.headers;

  try {
    // jwt 인증
    // 유효하지 않거나 만료된 토큰이면 에러 발생
    const decode = verify(jwt as string, process.env.JWT_PRIVATE_KEY as string);
    const { nickname } = decode as JwtPayloadType;

    return res.status(200).json({
      isSuccess: true,
      message: '성공적으로 로그인 되었습니다',
      result: {
        nickname,
      },
    });
  } catch (error) {
    return res.status(401).json({
      isSuccess: false,
      message: '유효하지 않거나 만료된 jwt 토큰입니다',
      result: {},
    });
  }
}

export default withHandler({ methods: ['POST'], privateMethods: ['POST'], handler });
