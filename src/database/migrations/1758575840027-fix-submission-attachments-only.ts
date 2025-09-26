import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSubmissionAttachmentsOnly1758575840027 implements MigrationInterface {
    name = 'FixSubmissionAttachmentsOnly1758575840027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change submission attachments column from text array to text
        await queryRunner.query(`ALTER TABLE "submission" DROP COLUMN "attachments"`);
        await queryRunner.query(`ALTER TABLE "submission" ADD "attachments" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to text array
        await queryRunner.query(`ALTER TABLE "submission" DROP COLUMN "attachments"`);
        await queryRunner.query(`ALTER TABLE "submission" ADD "attachments" text array`);
    }
}
