// ============================================
// Loop Type Definitions
// ============================================

export interface LoopInitiator<TInput = any, TOutput = any> {
  /**
   * Initiate a loop
   */
  initiate(input: TInput): Promise<TOutput>;

  /**
   * Initiate with custom options
   */
  initiateWithOptions(input: TInput, options: LoopOptions): Promise<TOutput>;
}

export interface LoopOptions {
  recruitmentTimeout?: number;
  executionTimeout?: number;
  minParticipants?: number;
  maxParticipants?: number;
  filters?: Record<string, any>;
  allowSubLoops?: boolean;
  maxDepth?: number;
}

export interface LoopPhase {
  phase: 'recruitment' | 'execution' | 'aggregation' | 'completion';
  timestamp: Date;
  participants?: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  error?: string;
}

export interface LoopResult<T = any> {
  loopId: string;
  loopName: string;
  initiator: string;
  participants: string[];
  aggregatedResult: T;
  individualResults?: Map<string, any>;
  phases: LoopPhase[];
  startTime: Date;
  endTime: Date;
  metadata?: Record<string, any>;
}