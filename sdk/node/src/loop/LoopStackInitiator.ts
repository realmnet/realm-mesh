// ============================================
// Loop Stack Initiator - Sequential Loop Execution
// ============================================

import { Realm } from '../realm/Realm';

export interface LoopStackInitiator<TInput = any, TOutput = any> {
  /**
   * Initiate a loop stack (sequential loop execution)
   */
  initiate(input: TInput): Promise<TOutput>;

  /**
   * Initiate with custom options
   */
  initiateWithOptions(input: TInput, options: LoopStackOptions): Promise<TOutput>;
}

export interface LoopStackOptions {
  timeout?: number;
  errorStrategy?: 'abort' | 'continue' | 'rollback';
  allowNestedStacks?: boolean;
  maxDepth?: number;
  metadata?: Record<string, any>;
}

export class LoopStackInitiatorImpl<TInput, TOutput> implements LoopStackInitiator<TInput, TOutput> {
  constructor(
    private realm: Realm,
    private capability: string,
    private stackName: string
  ) {}

  async initiate(input: TInput): Promise<TOutput> {
    return this.initiateWithOptions(input, {});
  }

  async initiateWithOptions(input: TInput, options: LoopStackOptions): Promise<TOutput> {
    return await this.realm.getBridgeManager().initiateLoopStack(
      this.capability,
      this.stackName,
      input,
      options
    );
  }
}