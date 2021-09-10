import { open, close, visible, PromptParams } from './state';

interface PromptService {
  open(params: PromptParams): Promise<boolean>;
  close(): void;
  visible(): boolean;
}

export const prompt: PromptService = { open, close, visible };
