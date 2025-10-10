import { Pool } from 'pg';
import { RealmRecord } from '../types';

export class RealmService {
  constructor(private pool: Pool) {}

  async getAllRealms() {
    const result = await this.pool.query(`
      SELECT id, realm_id, parent_id, policies, display_name, realm_type, metadata, created_at, updated_at
      FROM realms
      ORDER BY realm_id
    `);
    return result.rows;
  }

  async createRealm(realm: { id: string; parent_id?: string; policies?: string[] }) {
    console.log('🗄️  [RealmService] Creating realm in database');
    console.log('📊 [RealmService] Realm data:', {
      realm_id: realm.id,
      parent_id: realm.parent_id,
      policies: realm.policies
    });

    try {
      const policiesJson = JSON.stringify(realm.policies || []);
      console.log('🔧 [RealmService] Policies JSON:', policiesJson);

      const result = await this.pool.query(
        'INSERT INTO realms (id, realm_id, parent_id, policies) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *',
        [realm.id, realm.parent_id, policiesJson]
      );

      console.log('✅ [RealmService] Insert successful, returned:', result.rows[0]);
    } catch (error) {
      console.error('❌ [RealmService] Database error:', error);
      console.error('🔍 [RealmService] Query params:', {
        realm_id: realm.id,
        parent_id: realm.parent_id,
        policies: JSON.stringify(realm.policies || [])
      });
      throw error;
    }
  }

  async updateRealmPolicies(realmId: string, policies: string[]) {
    await this.pool.query(
      'UPDATE realms SET policies = $1 WHERE realm_id = $2',
      [JSON.stringify(policies), realmId]
    );
  }

  async getRealmById(realmId: string): Promise<RealmRecord | null> {
    const result = await this.pool.query(
      'SELECT id, realm_id, parent_id, policies FROM realms WHERE realm_id = $1',
      [realmId]
    );
    return result.rows[0] || null;
  }

  async loadRealmPolicies(realmId: string): Promise<string[]> {
    const result = await this.pool.query(`
      WITH RECURSIVE realm_tree AS (
        SELECT id, realm_id, parent_id, policies
        FROM realms
        WHERE realm_id = $1
        UNION ALL
        SELECT r.id, r.realm_id, r.parent_id, r.policies
        FROM realms r
        INNER JOIN realm_tree rt ON r.parent_id = rt.id
      )
      SELECT array_agg(DISTINCT policy ORDER BY policy) as all_policies
      FROM realm_tree, jsonb_array_elements_text(policies) as policy
    `, [realmId]);

    return result.rows[0]?.all_policies || [];
  }
}