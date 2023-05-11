import axios, { AxiosError } from 'axios';
import Client from './client';

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}

export function isClient(value: unknown): value is Client {
  return (value as Client).serverURL !== undefined;
}

export { Client };
