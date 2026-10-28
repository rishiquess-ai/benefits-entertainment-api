import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EmployeeDetailsDto } from './dto/employee-details.dto.js';
import { EmployeeDetailsService } from './employee-details.service.js';

@Controller('employee-details')
export class EmployeeDetailsController {
  constructor(
    private readonly employeeDetailsService: EmployeeDetailsService,
  ) {}

  // POST /employee-details   body: { "subdomain": "...", "token": "..." }
  @Post()
  @HttpCode(200) // Nest answers POST with 201 Created by default.
  getEmployeeDetails(@Body() body: EmployeeDetailsDto) {
    return this.employeeDetailsService.getEmployeeDetails(
      body.subdomain,
      body.token,
    );
  }
}
