import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { UserSeedService } from './user/user-seed.service';
import { RoleSeedService } from './role/role-seed.service';
import { StatusSeedService } from './status/status-seed.service';
// import { SubjectSeedService } from './subject/subject-seed.service';
// import { TeacherSeedService } from './teacher/teacher-seed.service';
// import { ClassSeedService } from './class/class-seed.service';
// import { ParentSeedService } from './parent/parent-seed.service';
// import { StudentSeedService } from './student/student-seed.service';

async function bootstrap() {
  const app = await NestFactory.create(SeedModule);

  const userSeedService = app.get(UserSeedService);
  const roleSeedService = app.get(RoleSeedService);
  const statusSeedService = app.get(StatusSeedService);
  // const subjectSeedService = app.get(SubjectSeedService);
  // const teacherSeedService = app.get(TeacherSeedService);
  // const classSeedService = app.get(ClassSeedService);
  // const parentSeedService = app.get(ParentSeedService);
  // const studentSeedService = app.get(StudentSeedService);

  // Run seeds in order
  await roleSeedService.run();
  await statusSeedService.run();
  await userSeedService.run();
  // await subjectSeedService.run();
  // await teacherSeedService.run();
  // await classSeedService.run();
  // await parentSeedService.run();
  // await studentSeedService.run();

  console.log('Seeds completed successfully!');
  await app.close();
}

bootstrap();
