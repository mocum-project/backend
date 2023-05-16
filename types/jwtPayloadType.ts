import { JwtPayload } from 'jsonwebtoken';

export default interface JwtPayloadType extends JwtPayload {
  nickname: string;
}
