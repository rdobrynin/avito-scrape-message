import {
  BooleanField,
  DateField,
  StringField,
} from '../../../common/decorators/field.decorators';

export class AvitoMessageDto {
  @StringField()
  id: string;

  @StringField()
  username: string;

  @StringField()
  text: string;

  @DateField()
  timestamp: Date;

  @BooleanField()
  isUnread: boolean;
}
