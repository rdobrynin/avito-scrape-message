import { StringField } from '../../../common/decorators/field.decorators';

export class LoginDto {
  @StringField()
  username: string;

  @StringField()
  password: string;
}
