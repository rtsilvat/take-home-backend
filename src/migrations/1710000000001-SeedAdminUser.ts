import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdminUser1710000000001 implements MigrationInterface {
  name = 'SeedAdminUser1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (email, password, name, flag_active)
      VALUES ('admin@admin.com', 'admin', 'Admin', TRUE)
      ON CONFLICT (email) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM users WHERE email = 'admin@admin.com';
    `);
  }
}


