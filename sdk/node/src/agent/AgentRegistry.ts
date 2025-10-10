import { Realm } from '../realm/Realm';
import { AgentMetadata, getAgentMetadata } from '../decorators/Agent';
import { RecruitmentContext, ExecutionContext } from './LoopParticipant';

interface RegisteredAgent {
  metadata: AgentMetadata;
  constructor: any;
  instance?: any;
}

export class AgentRegistry {
  private static agentClasses: Map<any, AgentMetadata> = new Map();
  private agents: Map<string, RegisteredAgent> = new Map();

  constructor(private realm: Realm) {}

  static registerAgentClass(constructor: any, metadata: AgentMetadata): void {
    this.agentClasses.set(constructor, metadata);
  }

  async registerAll(): Promise<void> {
    for (const [constructor, metadata] of AgentRegistry.agentClasses) {
      await this.register(constructor, metadata);
    }
  }

  private async register(constructor: any, metadata: AgentMetadata): Promise<void> {
    const key = this.getAgentKey(metadata);

    if (this.agents.has(key)) {
      console.warn(`Agent ${key} already registered`);
      return;
    }

    const instance = new constructor();

    this.agents.set(key, {
      metadata,
      constructor,
      instance
    });

    // Register with bridge manager for loop participation
    this.realm.getBridgeManager().registerAgentHandler(
      metadata,
      {
        onRecruitment: async (context: RecruitmentContext) => {
          return await instance.onRecruitment(context);
        },
        execute: async (input: any, context: ExecutionContext) => {
          return await instance.execute(input, context);
        },
        onComplete: async (result: any, context: ExecutionContext) => {
          if (instance.onComplete) {
            await instance.onComplete(result, context);
          }
        }
      }
    );

    console.log(`Registered agent: ${key}`);
  }

  private getAgentKey(metadata: AgentMetadata): string {
    return `${metadata.capability}.${metadata.name}`;
  }

  findAgentsForLoop(loopName: string): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.metadata.participatesIn?.includes(loopName)
    );
  }

  getAgents(): Map<string, RegisteredAgent> {
    return this.agents;
  }
}