import AppResponseType from '@/types/appResponseType';
import { NextApiRequest, NextApiResponse } from 'next';
import withHandler from '@/lib/withHandler';
import axios from 'axios';
import NextCors from 'nextjs-cors';

interface OpenAiChatResponseType {
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

type PrevChats = { role: string; content: string }[];

async function fetchOpenAi(prevChats: PrevChats) {
  const response = await axios.post<OpenAiChatResponseType>(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo-16k-0613',
      messages: prevChats,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );
  return response.data;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { origin } = req.headers;
  const { prevChats } = JSON.parse(req.body);

  // const response = await fetchOpenAi(prevChats as PrevChats);

  return res.status(200).json({
    isSuccess: true,
    message: '성공',
    result: {
      // content: response.choices[0].message.content,
      ok: true,
    },
  });
}

export default withHandler({ methods: ['POST'], handler });
