import {
  BooleanField,
  StringField,
} from '../../../common/decorators/field.decorators';
import { IsArray, IsObject, IsOptional } from 'class-validator';

export class MessageDto {
  @BooleanField()
  success: boolean;

  @StringField()
  message: string;

  @IsObject()
  @IsArray()
  @IsOptional()
  cookies?: any[];
}
