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
    console.log('🗄️  [RealmService] Creating/updating realm in database');
    console.log('📊 [RealmService] Realm data:', {
      realm_id: realm.id,
      parent_id: realm.parent_id,
      policies: realm.policies
    });

    try {
      const policiesJson = JSON.stringify(realm.policies || []);
      console.log('🔧 [RealmService] Policies JSON:', policiesJson);

      const result = await this.pool.query(
        `INSERT INTO realms (id, realm_id, parent_id, policies)
         VALUES (gen_random_uuid(), $1, $2, $3)
         ON CONFLICT (realm_id)
         DO UPDATE SET
           parent_id = EXCLUDED.parent_id,
           policies = EXCLUDED.policies,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [realm.id, realm.parent_id, policiesJson]
      );

      console.log('✅ [RealmService] Upsert successful, returned:', result.rows[0]);
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

  async getRealmConnections(realmId: string) {
    // Get realm UUID from realm_id
    const realmResult = await this.pool.query(
      'SELECT id FROM realms WHERE realm_id = $1',
      [realmId]
    );

    if (realmResult.rows.length === 0) {
      return { services: [], clients: [], connections: [] };
    }

    const realmUuid = realmResult.rows[0].id;

    // Get connected services
    const servicesResult = await this.pool.query(
      `SELECT service_name, status, last_heartbeat
       FROM services
       WHERE realm_id = $1 AND status != 'offline'`,
      [realmUuid]
    );

    // Get connected clients
    const clientsResult = await this.pool.query(
      `SELECT id, name, status, last_connected
       FROM clients
       WHERE realm_id = $1 AND status = 'connected'`,
      [realmUuid]
    );

    // Get active connections
    const connectionsResult = await this.pool.query(
      `SELECT id, connection_type, connected_at, last_activity
       FROM connections
       WHERE realm_id = $1`,
      [realmUuid]
    );

    return {
      services: servicesResult.rows,
      clients: clientsResult.rows,
      connections: connectionsResult.rows
    };
  }

  async deleteRealm(realmId: string) {
    console.log('🗑️  [RealmService] Deleting realm:', realmId);

    const result = await this.pool.query(
      'DELETE FROM realms WHERE realm_id = $1 RETURNING *',
      [realmId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Realm ${realmId} not found`);
    }

    console.log('✅ [RealmService] Realm deleted:', realmId);
    return result.rows[0];
  }
}