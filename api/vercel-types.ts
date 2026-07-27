export type VercelQueryValue = string | string[] | undefined;

export interface VercelRequestLike {
  method?: string;
  query: Record<string, VercelQueryValue>;
}

export interface VercelResponseLike {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponseLike;
  json(body: unknown): VercelResponseLike;
  end(): VercelResponseLike;
}
