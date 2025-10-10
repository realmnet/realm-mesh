export interface LoopParticipant<TInput = any, TOutput = any> {
  /**
   * Called when recruited for a loop
   * Return true to accept, false to decline
   */
  onRecruitment(context: RecruitmentContext): Promise<boolean>;

  /**
   * Execute the agent's contribution to the loop
   */
  execute(input: TInput, context: ExecutionContext): Promise<TOutput>;

  /**
   * Optional: Called when loop completes
   */
  onComplete?(result: any, context: ExecutionContext): Promise<void>;
}

export interface RecruitmentContext {
  loopId: string;
  loopName: string;
  initiator: string;
  recruitmentMessage: any;
  deadline: Date;
}

export interface ExecutionContext {
  loopId: string;
  loopName: string;
  participantId: string;
  otherParticipants: string[];
}