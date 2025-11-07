import { StringField } from '../../../common/decorators/field.decorators';

export class CreateLoginDto {
  @StringField()
  username: string;

  @StringField()
  password: string;
}
