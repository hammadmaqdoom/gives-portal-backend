import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnnotationDocumentOnly1758577300000
  implements MigrationInterface
{
  name = 'CreateAnnotationDocumentOnly1758577300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "annotation_document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submissionId" character varying(255) NOT NULL, "fileId" character varying(255) NOT NULL, "layers" jsonb NOT NULL, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_bbbe727d2246136231cae78f4a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ce96f2c5a6fd0fb4783359b3c" ON "annotation_document" ("submissionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55e484873a05dbc4b20330aec8" ON "annotation_document" ("fileId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55e484873a05dbc4b20330aec8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ce96f2c5a6fd0fb4783359b3c"`,
    );
    await queryRunner.query(`DROP TABLE "annotation_document"`);
  }
}
