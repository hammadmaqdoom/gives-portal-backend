import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSeedModule } from './user/user-seed.module';
import { RoleSeedModule } from './role/role-seed.module';
import { StatusSeedModule } from './status/status-seed.module';
// import { SubjectSeedModule } from './subject/subject-seed.module';
// import { TeacherSeedModule } from './teacher/teacher-seed.module';
// import { ClassSeedModule } from './class/class-seed.module';
// import { ParentSeedModule } from './parent/parent-seed.module';
// import { StudentSeedModule } from './student/student-seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || 'root',
      password: process.env.DATABASE_PASSWORD || 'secret',
      database: process.env.DATABASE_NAME || 'api',
      entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: false,
    }),
    UserSeedModule,
    RoleSeedModule,
    StatusSeedModule,
    // SubjectSeedModule,
    // TeacherSeedModule,
    // ClassSeedModule,
    // ParentSeedModule,
    // StudentSeedModule,
  ],
})
export class SeedModule {}
