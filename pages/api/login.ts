import withHandler from '@/lib/withHandler';
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import AppResponseType from '@/types/appResponseType';
import client from '@/lib/prismaClient';

// 1. AccessToken으로 카카오 서버에서 회원 정보 가져오기
// 2. MySQL DB에서 회원 정보 확인 (카카오 아이디)
// 3. 존재하지 않는 회원이면 회원 생성
// 4. jwt 생성&반환

interface KakaoUserInfoResponse {
  id: bigint; // 회원번호
  kakao_account: {
    profile: {
      nickname: string;
    };
  };
}

async function getUserInfoFromKakao(accessToken: string): Promise<KakaoUserInfoResponse> {
  const response = await axios.get<KakaoUserInfoResponse>('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });
  return response.data;
}

async function getExistUserFromDB(kakaoId: string) {
  const user = await client.user.findUnique({
    where: {
      kakaoId,
    },
  });
  return user;
}

async function makeNewUserFromDB(kakaoId: string, nickname: string) {
  const newUser = await client.user.create({
    data: {
      nickname,
      kakaoId,
    },
  });
  return newUser;
}

function makeJwtToken(payload: string | object) {
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (typeof privateKey != 'string') {
    throw Error;
  }
  const jwtToken = jwt.sign(payload, privateKey, { expiresIn: '30d' });
  return jwtToken;
}

async function handler(req: NextApiRequest, res: NextApiResponse<AppResponseType>) {
  const { access_token } = req.headers;
  try {
    const {
      id: kakaoId,
      kakao_account: {
        profile: { nickname },
      },
    } = await getUserInfoFromKakao(access_token as string);
    let user = await getExistUserFromDB(String(kakaoId));
    if (!user) {
      user = await makeNewUserFromDB(String(kakaoId), nickname);
    }
    const jwtToken = makeJwtToken({ nickname });

    res.status(200).json({
      isSuccess: true,
      message: '성공적으로 로그인 되었습니다',
      result: { jwt: jwtToken, nickname: user.nickname },
    });
  } catch {
    res.status(401).json({
      isSuccess: false,
      message: '만료되었거나 잘못된 Access Token',
      result: {},
    });
  }
}

export default withHandler({ methods: ['POST'], handler });
