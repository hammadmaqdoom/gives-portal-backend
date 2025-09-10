# 🌱 School Management Portal - Seed Data Documentation

## 📋 Overview

This document describes the seed data implemented for the School Management Portal. The seed data provides realistic sample data for testing and development purposes.

## 🚀 Running Seeds

### Prerequisites
1. Database migration must be executed first
2. PostgreSQL database must be running
3. Environment variables must be configured

### Commands
```bash
# Run all seeds
npm run seed:run:relational

# Or run manually
ts-node -r tsconfig-paths/register ./src/database/seeds/relational/run-seed.ts
```

## 📊 Seed Data Structure

### 1. **Subjects** (8 subjects)
- Mathematics - $150.00
- Physics - $140.00
- Chemistry - $130.00
- Biology - $125.00
- English Literature - $120.00
- Computer Science - $160.00
- History - $110.00
- Geography - $105.00

### 2. **Teachers** (5 teachers)
- Dr. Sarah Johnson (Mathematics, Physics)
- Prof. Michael Chen (Chemistry, Biology)
- Ms. Emily Davis (English Literature, History)
- Mr. David Wilson (Computer Science)
- Dr. Lisa Brown (Geography, History)

### 3. **Classes** (6 classes)
- Advanced Mathematics 101 (Tue/Thu, 8:00PM–10:00PM)
- Physics Fundamentals (Mon/Wed, 6:00PM–8:00PM)
- Chemistry Lab (Fri, 4:00PM–7:00PM)
- Biology Essentials (Tue/Fri, 5:00PM–7:00PM)
- English Literature Classics (Mon/Thu, 7:00PM–9:00PM)
- Programming Fundamentals (Wed/Sat, 10:00AM–12:00PM)

### 4. **Parents** (8 parents)
- John Smith (john.smith@email.com)
- Sarah Johnson (sarah.johnson@email.com)
- Michael Chen (michael.chen@email.com)
- Emily Davis (emily.davis@email.com)
- David Wilson (david.wilson@email.com)
- Lisa Brown (lisa.brown@email.com)
- Robert Taylor (robert.taylor@email.com)
- Jennifer Garcia (jennifer.garcia@email.com)

**Default Passcode**: `123456` (hashed with bcrypt)

### 5. **Students** (10 students)
- Alex Smith (STD-0001) - Advanced Mathematics 101
- Emma Johnson (STD-0002) - Physics Fundamentals
- Lucas Chen (STD-0003) - Chemistry Lab
- Sophia Davis (STD-0004) - Biology Essentials
- Noah Wilson (STD-0005) - English Literature Classics
- Olivia Brown (STD-0006) - Programming Fundamentals
- William Taylor (STD-0007) - Advanced Mathematics 101
- Ava Garcia (STD-0008) - Physics Fundamentals
- James Rodriguez (STD-0009) - Chemistry Lab
- Isabella Martinez (STD-0010) - Biology Essentials

## 🔗 Relationships

### Parent-Student Relationships
- **John Smith** has 2 children: Alex Smith, James Rodriguez
- **Sarah Johnson** has 2 children: Emma Johnson, Isabella Martinez
- Other parents have 1 child each

### Class-Teacher Relationships
- **Dr. Sarah Johnson** teaches: Advanced Mathematics 101, Physics Fundamentals
- **Prof. Michael Chen** teaches: Chemistry Lab, Biology Essentials
- **Ms. Emily Davis** teaches: English Literature Classics
- **Mr. David Wilson** teaches: Programming Fundamentals

### Class-Subject Relationships
- Advanced Mathematics 101 → Mathematics
- Physics Fundamentals → Physics
- Chemistry Lab → Chemistry
- Biology Essentials → Biology
- English Literature Classics → English Literature
- Programming Fundamentals → Computer Science

## 🧪 Testing Data

### Admin User
- **Email**: admin@example.com
- **Password**: secret
- **Role**: Admin

### Regular User
- **Email**: john.doe@example.com
- **Password**: secret
- **Role**: User

## 📝 Sample API Calls

### Create a Student
```bash
curl -X POST http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Student",
    "address": "123 Test Street",
    "contact": "+1234567890",
    "class": {"id": 1},
    "parent": {"id": 1}
  }'
```

### List Students
```bash
curl -X GET "http://localhost:3000/api/v1/students?page=1&limit=10" \
  -H "Authorization: Bearer <jwt-token>"
```

### Create a Parent
```bash
curl -X POST http://localhost:3000/api/v1/parents \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Parent",
    "email": "newparent@email.com",
    "phone": "+1234567890",
    "passcode": "123456"
  }'
```

## 🔄 Seed Execution Order

The seeds are executed in the following order to maintain referential integrity:

1. **Roles** (admin, user)
2. **Statuses** (active, inactive)
3. **Users** (admin, regular user)
4. **Subjects** (8 subjects)
5. **Teachers** (5 teachers)
6. **Classes** (6 classes with subject/teacher relationships)
7. **Parents** (8 parents)
8. **Students** (10 students with class/parent relationships)

## 🛠️ Customization

### Adding New Subjects
Edit `src/database/seeds/relational/subject/subject-seed.service.ts`:
```typescript
const subjects = [
  // ... existing subjects
  {
    name: 'New Subject',
    description: 'Description of new subject',
    defaultFee: 135.00,
  },
];
```

### Adding New Teachers
Edit `src/database/seeds/relational/teacher/teacher-seed.service.ts`:
```typescript
const teachers = [
  // ... existing teachers
  {
    name: 'New Teacher',
    email: 'newteacher@school.com',
    phone: '+1234567899',
    commissionPercentage: 14.5,
    subjectsAllowed: ['Mathematics'],
  },
];
```

### Adding New Classes
Edit `src/database/seeds/relational/class/class-seed.service.ts`:
```typescript
const classes = [
  // ... existing classes
  {
    name: 'New Class',
    batchTerm: 'Aug 2025 – April 2026',
    weekdays: ['Monday', 'Wednesday'],
    timing: '6:00PM–8:00PM',
    courseOutline: 'Course description',
    subject: { id: 1 },
    teacher: { id: 1 },
  },
];
```

## 📊 Database State After Seeding

After running the seeds, the database will contain:

- **2 Roles** (admin, user)
- **2 Statuses** (active, inactive)
- **2 Users** (admin, regular user)
- **8 Subjects** with different default fees
- **5 Teachers** with commission percentages
- **6 Classes** with full schedules
- **8 Parents** with hashed passcodes
- **10 Students** with auto-generated IDs

## 🔍 Verification

To verify the seed data was created correctly:

1. **Check Students**: `GET /api/v1/students`
2. **Check Parents**: `GET /api/v1/parents`
3. **Check Relationships**: Verify students are linked to classes and parents
4. **Check Auto-generated IDs**: Verify student IDs follow STD-0001, STD-0002 pattern

## 🚨 Important Notes

1. **Passcodes**: All parent passcodes are hashed using bcrypt
2. **Student IDs**: Auto-generated in sequential order
3. **Relationships**: Maintained through foreign keys
4. **Duplicates**: Seeds check for existing data to avoid duplicates
5. **Order**: Seeds must be run in the correct order due to dependencies

## 🔄 Resetting Data

To reset and reseed the database:

```bash
# Drop and recreate database
npm run schema:drop
npm run migration:run
npm run seed:run:relational
```

This will provide a fresh start with all sample data. 