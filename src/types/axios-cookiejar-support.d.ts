declare module 'axios-cookiejar-support' {
  import { AxiosInstance } from 'axios';
  import { CookieJar } from 'tough-cookie';

  export interface AxiosCookieJarSupportOptions {
    jar?: CookieJar;
  }

  export function wrapper<T extends AxiosInstance>(axiosInstance: T): T;
}
