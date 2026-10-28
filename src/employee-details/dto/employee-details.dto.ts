import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * The request body of POST /employee-details.
 *
 * The ValidationPipe in main.ts checks every request against these rules
 * and answers 400 Bad Request if one fails.
 */
export class EmployeeDetailsDto {
  // Lowercase letters, numbers and hyphens only, e.g. "benefits-entertainment".
  @IsString()
  @Matches(/^[a-z0-9-]{1,63}$/, { message: 'subdomain is invalid' })
  subdomain: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
