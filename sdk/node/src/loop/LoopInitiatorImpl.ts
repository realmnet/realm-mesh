import { Realm } from '../realm/Realm';
import { LoopInitiator, LoopOptions } from './LoopTypes';

export class LoopInitiatorImpl<TInput, TOutput> implements LoopInitiator<TInput, TOutput> {
  constructor(
    private realm: Realm,
    private capability: string,
    private loopName: string
  ) {}

  async initiate(input: TInput): Promise<TOutput> {
    return this.initiateWithOptions(input, {});
  }

  async initiateWithOptions(input: TInput, options: LoopOptions): Promise<TOutput> {
    return await this.realm.getBridgeManager().initiateLoop(
      this.capability,
      this.loopName,
      input,
      options
    );
  }
}