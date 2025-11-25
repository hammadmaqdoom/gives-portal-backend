import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ClassConstructor } from 'class-transformer/types/interfaces';

function validateConfig<T extends object>(
  config: Record<string, unknown>,
  envVariablesClass: ClassConstructor<T>,
) {
  // Treat empty strings as undefined so @IsOptional works as expected
  const sanitizedConfig = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      value === '' ? undefined : value,
    ]),
  );

  const validatedConfig = plainToClass(envVariablesClass, sanitizedConfig, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

export default validateConfig;
