import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { GetEmployeeDetailsDto } from './dto/get-employee-details.dto.js';
import { EmployeeService } from './employee.service.js';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('details')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Employee details fetched successfully')
  getEmployeeDetails(@Body() dto: GetEmployeeDetailsDto) {
    return this.employeeService.getEmployeeDetails(dto);
  }
}
