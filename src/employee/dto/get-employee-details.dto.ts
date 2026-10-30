import { IsNotEmpty, IsString } from 'class-validator';

export class GetEmployeeDetailsDto {
  @IsString()
  @IsNotEmpty()
  subDomain: string;

  @IsString()
  @IsNotEmpty()
  ssoToken: string;
}
