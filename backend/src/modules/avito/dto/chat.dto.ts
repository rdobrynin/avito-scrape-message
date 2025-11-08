import {
  NumberField,
  ObjectField,
  StringField,
} from '../../../common/decorators/field.decorators';
import { AvitoMessageDto } from './avito-message.dto';

export class ChatDto {
  @StringField()
  username: string;

  @ObjectField(() => AvitoMessageDto, { isArray: true })
  messages: AvitoMessageDto[];

  @NumberField()
  totalMessages: number;
}
