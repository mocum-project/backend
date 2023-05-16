import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';

type method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ConfigType {
  methods: method[];
  handler: (req: NextApiRequest, res: NextApiResponse) => void;
}
/**
 * 올바른 method인지 확인하고, try,catch 같은 진부한 코드를 처리한다.
 * @param methods 'GET' | 'POST' | 'PUT' | 'DELETE'
 * @param handler (req: NextApiRequest, res: NextApiResponse) => void
 */
function withHandler({ methods, handler }: ConfigType) {
  return async function (req: NextApiRequest, res: NextApiResponse<AppResponseType>): Promise<any> {
    // 잘못된 타입의 요청이 들어오면 종료
    if (req.method && !methods.includes(req.method as any)) {
      return res.status(405).end();
    }

    try {
      await handler(req, res);
    } catch (error) {
      console.log(error);

      return res.status(500).json({ isSuccess: false, message: '서버 작동 오류', result: {} });
    }
  };
}

export default withHandler;
