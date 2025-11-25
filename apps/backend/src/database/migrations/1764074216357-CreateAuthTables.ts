import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthTables1764074216357 implements MigrationInterface {
    name = 'CreateAuthTables1764074216357'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session" ("id" character varying(255) NOT NULL, "token" character varying(500) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "ip_address" character varying(100), "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying(255), CONSTRAINT "UQ_232f8e85d7633bd6ddfad421696" UNIQUE ("token"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account" ("id" character varying(255) NOT NULL, "account_id" character varying(255) NOT NULL, "provider_id" character varying(100) NOT NULL, "access_token" text, "refresh_token" text, "access_token_expires_at" TIMESTAMP, "refresh_token_expires_at" TIMESTAMP, "scope" character varying(500), "id_token" text, "password" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying(255), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" character varying(255) NOT NULL, "name" character varying(255), "email" character varying(255) NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "image" character varying(500), "tenant_id" character varying(255), "role" character varying(50) NOT NULL DEFAULT 'user', "phone_number" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "verification" ("id" character varying(255) NOT NULL, "identifier" character varying(255) NOT NULL, "value" character varying(500) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f7e3a90ca384e71d6e2e93bb340" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_60328bf27019ff5498c4b977421" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_60328bf27019ff5498c4b977421"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`);
        await queryRunner.query(`DROP TABLE "verification"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "session"`);
    }

}
