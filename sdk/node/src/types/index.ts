export interface CallOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ServiceClient<TInput = any, TOutput = any> {
  call(input: TInput): Promise<TOutput>;
  callWithOptions(input: TInput, options: CallOptions): Promise<TOutput>;
}

export interface EventPublisher<TPayload = any> {
  publish(payload: TPayload): Promise<void>;
  publishWithHeaders(payload: TPayload, headers: Record<string, string>): Promise<void>;
}

