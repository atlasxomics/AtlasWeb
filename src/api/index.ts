import axios, { AxiosError } from 'axios';
import Client from './client';

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}

export function isClient(value: unknown): value is Client {
  return (value as Client).serverURL !== undefined;
}

export async function login(
  serverURL: string, username: string, password: string,
): Promise<Client | string> {
  try {
    const { data: { access_token: rawAccessToken } } = await axios.post(`${serverURL}/api/v1/auth/login`, { username, password });
    const accessToken = `JWT ${rawAccessToken}`;

    return Client.Create(serverURL, accessToken);
  } catch (error) {
    if (isAxiosError(error)) {
      return 'Invalid username or password';
    }

    return error.message;
  }
}

export { Client };
