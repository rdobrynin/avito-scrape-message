import { StringField } from '../../../common/decorators/field.decorators';

export class EventPayloadDto {
  @StringField()
  username: string;

  @StringField()
  message: string;
}
