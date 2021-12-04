import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DesafiosService } from './desafios.service';
import { CriarDesafioDto } from './dto/criar-desafio.dto';
import { Desafio } from './interface/desafio.interface';

@Controller('api/v1/desafios')
export class DesafiosController {
  private readonly logger = new Logger(DesafiosController.name);

  constructor(private readonly desafiosService: DesafiosService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async criarDesafio(
    @Body() criarDesafioDto: CriarDesafioDto,
  ): Promise<Desafio> {
    return await this.desafiosService.criarDesafio(criarDesafioDto);
  }

  @Get()
  async consultarDesafios(): Promise<Array<Desafio>> {
    return await this.desafiosService.consultarTodosDesafios();
  }
}
