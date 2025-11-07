import type { ValidationOptions } from 'class-validator';
import { registerDecorator, ValidateIf } from 'class-validator';
import * as _ from 'lodash';

export function IsTime(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  // @ts-ignore
  return (object, propertyName: string) => {
    registerDecorator({
      propertyName,
      name: 'time',
      target: object.constructor,
      options: validationOptions,
      validator: {
        validate(value: string): boolean {
          return _.isString(value) && /^(0\d|1\d|2[0-3]):[0-5]\d$/.test(value);
        },
        defaultMessage(): string {
          return 'error.invalidTime';
        },
      },
    });
  };
}

export function IsUndefinable(options?: ValidationOptions): PropertyDecorator {
  return ValidateIf((_obj, value) => value !== undefined, options);
}

export function IsNullable(options?: ValidationOptions): PropertyDecorator {
  return ValidateIf((_obj, value) => value !== null, options);
}

export function IsPassword(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'isPassword',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(password: string): boolean {
          const regex = /^.{8,}$/;

          return regex.test(password);
        },
        defaultMessage(): string {
          return 'Use 8 characters or more for your password.';
        },
      },
    });
  };
}
