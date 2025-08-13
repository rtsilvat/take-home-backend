import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1710000000000 implements MigrationInterface {
  name = 'CreateUsersTable1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        flag_active BOOLEAN NOT NULL DEFAULT TRUE,
        expiration_at TIMESTAMPTZ NULL,
        insert_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        update_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
      CREATE OR REPLACE FUNCTION set_update_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.update_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      DROP TRIGGER IF EXISTS trg_set_update_at ON users;
      CREATE TRIGGER trg_set_update_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_update_at_timestamp();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_set_update_at ON users;
      DROP FUNCTION IF EXISTS set_update_at_timestamp;
      DROP TABLE IF EXISTS users;
    `);
  }
}
