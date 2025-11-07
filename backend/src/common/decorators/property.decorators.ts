import type { ApiPropertyOptions } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import type { Type as Class } from '@nestjs/common';

export function UUIDProperty(
  options: Omit<ApiPropertyOptions, 'type' | 'format'> &
    Partial<{ each: boolean }> = {},
): PropertyDecorator {
  // @ts-ignore
  return ApiProperty({
    type: options?.each ? [String] : String,
    format: 'uuid',
    isArray: options?.each,
    ...options,
  });
}

export function ObjectProperty<T>(
  getType: () => Class<T>,
  options: Omit<ApiPropertyOptions, 'type'> & { each?: boolean } = {},
): PropertyDecorator {
  const { each, ...restOptions } = options;

  // @ts-ignore
  return ApiProperty({
    type: () => getType(),
    isArray: each,
    ...restOptions,
  });
}

export function ObjectPropertyOptional<T>(
  getType: () => Class<T>,
  options: Omit<ApiPropertyOptions, 'type' | 'required'> & {
    each?: boolean;
  } = {},
): PropertyDecorator {
  return ObjectProperty(getType, { ...options, required: false });
}
