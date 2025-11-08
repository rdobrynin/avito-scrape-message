import { StringField } from '../../../common/decorators/field.decorators';

export class LoginDto {
  @StringField()
  email: string;

  @StringField()
  password: string;
}
