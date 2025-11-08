import type { Type as Class } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import type { ApiPropertyOptions } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
  ValidateNested,
} from 'class-validator';

import {
  ToArray,
  ToBoolean,
  ToLowerCase,
  ToUpperCase,
  Trim,
} from './transforms.decorator';
import { IsNullable, IsUndefinable } from './validators.decorators';
import { UUIDProperty } from './property.decorators';

interface INumberFieldDecorator {
  each?: boolean;
  min?: number;
  max?: number;
  int?: boolean;
  isPositive?: boolean;
  swagger?: boolean;
  maxSize?: number;
  minSize?: number;
}

interface IStringFieldDecorator {
  minLength?: number;
  maxLength?: number;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  swagger?: boolean;
  maxSize?: number;
  minSize?: number;
  each?: boolean;
}

interface IPropertyTypeFieldDecorator {
  swagger?: boolean;
  each?: boolean;
}

export function NumberField(
  options: Omit<ApiPropertyOptions, 'type'> & INumberFieldDecorator = {},
): PropertyDecorator {
  const decorators = [Type(() => Number)];

  if (options?.nullable) {
    decorators.push(IsNullable({ each: options.each }));
  } else {
    decorators.push(NotEquals(null, { each: options.each }));
  }

  if (options?.swagger !== false) {
    decorators.push(
      // @ts-ignore
      ApiProperty({
        type: Number,
        ...options,
        isArray: options.each || options.isArray,
      }),
    );
  }

  if (options?.each) {
    decorators.push(ToArray());
  }

  if (options?.int) {
    decorators.push(IsInt({ each: options.each }));
  } else {
    decorators.push(IsNumber({}, { each: options.each }));
  }

  if (options?.min) {
    decorators.push(Min(options?.min, { each: options.each }));
  }

  if (options?.max) {
    decorators.push(Max(options?.max, { each: options.each }));
  }

  if (options?.isPositive) {
    decorators.push(IsPositive({ each: options.each }));
  }

  if (options?.maxSize && options?.each) {
    decorators.push(ArrayMaxSize(options.maxSize));
  }

  if (options?.minSize && options?.each) {
    decorators.push(ArrayMinSize(options.minSize));
  }

  return applyDecorators(...decorators);
}

export function NumberFieldOptional(
  options: Omit<ApiPropertyOptions, 'type' | 'required'> &
    INumberFieldDecorator = {},
): PropertyDecorator {
  return applyDecorators(
    IsUndefinable(),
    NumberField({ required: false, ...options }),
  );
}

export function UUIDField(
  options: Omit<ApiPropertyOptions, 'type' | 'format'> &
    Partial<{ each: boolean; swagger: boolean }> = {},
): PropertyDecorator {
  const decorators = [IsUUID('4', { each: options?.each })];

  if (options?.nullable) {
    decorators.push(IsNullable());
  } else {
    decorators.push(NotEquals(null));
  }

  if (options?.swagger !== false) {
    decorators.push(UUIDProperty(options));
  }

  if (options?.each) {
    decorators.push(ToArray());
  }

  return applyDecorators(...decorators);
}

export function StringField(
  options: Omit<ApiPropertyOptions, 'type'> & IStringFieldDecorator = {},
): PropertyDecorator {
  const decorators = [IsString({ each: options?.each }), Trim()];

  if (options?.nullable) {
    decorators.push(IsNullable({ each: options?.each }));
  } else {
    decorators.push(NotEquals(null, { each: options?.each }));
  }

  if (options?.swagger !== false) {
    decorators.push(
      // @ts-ignore
      ApiProperty({ type: String, ...options, isArray: options?.each }),
    );
  }

  if (options?.minLength) {
    decorators.push(MinLength(options.minLength, { each: options?.each }));
  }

  if (options?.maxLength) {
    decorators.push(MaxLength(options.maxLength, { each: options?.each }));
  }

  if (options?.toLowerCase) {
    decorators.push(ToLowerCase());
  }

  if (options?.toUpperCase) {
    decorators.push(ToUpperCase());
  }

  if (options?.maxSize && options?.each) {
    decorators.push(ArrayMaxSize(options?.maxSize));
  }

  if (options?.minSize && options?.each) {
    decorators.push(ArrayMinSize(options?.minSize));
  }

  return applyDecorators(...decorators);
}

export function StringFieldOptional(
  options: Omit<ApiPropertyOptions, 'type' | 'required'> &
    IStringFieldDecorator & { nullable?: boolean } = {},
): PropertyDecorator {
  return applyDecorators(
    IsUndefinable(),
    StringField({ required: false, ...options }),
  );
}

export function DateField(
  options: Omit<ApiPropertyOptions, 'type'> & Partial<{ swagger: false }> = {},
): PropertyDecorator {
  const decorators = [Type(() => Date), IsDate()];

  if (options?.nullable) {
    decorators.push(IsNullable());
  } else {
    decorators.push(NotEquals(null));
  }

  if (options?.swagger !== false) {
    // @ts-ignore
    decorators.push(ApiProperty({ type: Date, ...options }));
  }

  return applyDecorators(...decorators);
}

export function ObjectField<T>(
  getType: () => Class<T>,
  options: Omit<ApiPropertyOptions, 'type'> &
    Partial<{
      each: boolean;
      swagger: boolean;
    }> = {},
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [];

  decorators.push(Type(getType), ValidateNested({ each: options.each }));

  if (options?.nullable) {
    decorators.push(IsNullable());
  } else {
    decorators.push(NotEquals(null));
  }

  if (options.each) {
    decorators.push(ToArray());
  }

  return applyDecorators(...decorators);
}

export function ObjectFieldOptional<T>(
  getType: () => Class<T>,
  options: Omit<ApiPropertyOptions, 'type' | 'required'> &
    Partial<{
      each: boolean;
      swagger: boolean;
    }> = {},
): PropertyDecorator {
  return applyDecorators(
    IsUndefinable(),
    ObjectField(getType, { ...options, required: false }),
  );
}

export function PropertyTypeField(
  options: Omit<ApiPropertyOptions, 'type'> & IPropertyTypeFieldDecorator = {},
): PropertyDecorator {
  const decorators = [];

  if (options?.minLength) {
    // @ts-ignore
    decorators.push(MinLength(options.minLength, { each: options?.each }));
  }

  if (options?.maxLength) {
    // @ts-ignore
    decorators.push(MaxLength(options.maxLength, { each: options?.each }));
  }

  return applyDecorators(...decorators);
}

interface IFieldOptions {
  each?: boolean;
  swagger?: boolean;
  nullable?: boolean;
  groups?: string[];
}

type IBooleanFieldOptions = IFieldOptions;

export function BooleanField(
  options: Omit<ApiPropertyOptions, 'type'> & IBooleanFieldOptions = {},
): PropertyDecorator {
  const decorators = [ToBoolean(), IsBoolean()];

  if (options.nullable) {
    decorators.push(IsNullable());
  } else {
    decorators.push(NotEquals(null));
  }

  if (options.swagger !== false) {
    decorators.push(
      ApiProperty({ type: Boolean, ...(options as ApiPropertyOptions) }),
    );
  }

  return applyDecorators(...decorators);
}
