import { Transform } from 'class-transformer';
import type { Many } from 'lodash';
import { castArray, isNil, trim } from 'lodash';

import type { Optional } from '../boilerplate.polyfill';

/**
 * @description trim spaces from start and end, replace multiple spaces with one.
 * @example
 * @ApiProperty()
 * @IsString()
 * @Trim()
 * name: string;
 * @returns PropertyDecorator
 * @constructor
 */
export function Trim(): PropertyDecorator {
  return Transform((params): Many<string> => {
    const value = params.value;

    if (value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v) => trim(v).replace(/\s\s+/g, ' '));
    }

    return trim(value).replace(/\s\s+/g, ' ');
  });
}

export function ToBoolean(): PropertyDecorator {
  return Transform(
    (params): boolean => {
      switch (params.value) {
        case 'true':
          return true;
        case 'false':
          return false;
        default:
          return params.value;
      }
    },
    { toClassOnly: true },
  );
}

/**
 * @description convert string or number to integer
 * @example
 * @IsNumber()
 * @ToInt()
 * name: number;
 * @returns PropertyDecorator
 * @constructor
 */
export function ToInt(): PropertyDecorator {
  return Transform(
    (params): number => {
      const value = params.value;

      return Number.parseInt(value, 10);
    },
    { toClassOnly: true },
  );
}

/**
 * @description transforms to array, specially for query params
 * @example
 * @IsNumber()
 * @ToArray()
 * name: number;
 * @constructor
 */
export function ToArray(): PropertyDecorator {
  return Transform(
    (params): unknown[] => {
      const value = params.value;

      if (isNil(value)) {
        return [];
      }

      return castArray(value);
    },
    { toClassOnly: true },
  );
}

export function ToLowerCase(): PropertyDecorator {
  return Transform(
    (params): Optional<Many<string>> => {
      const value = params.value;

      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        return value.map((v) => v.toLowerCase());
      }

      return value.toLowerCase();
    },
    {
      toClassOnly: true,
    },
  );
}

export function ToUpperCase(): PropertyDecorator {
  return Transform(
    (params): Many<string> | undefined => {
      const value = params.value;

      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        return value.map((v) => v.toUpperCase());
      }

      return value.toUpperCase();
    },
    {
      toClassOnly: true,
    },
  );
}
