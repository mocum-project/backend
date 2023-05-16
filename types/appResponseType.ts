export default interface AppResponseType {
  isSuccess: boolean;
  message: string;
  result: {
    [key: string]: any;
  };
}
