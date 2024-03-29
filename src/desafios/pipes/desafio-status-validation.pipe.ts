import { BadRequestException, PipeTransform } from '@nestjs/common';
import { DesafioStatus } from '../interface/desafio-status.enum';

export class DesafioStatusValidationPipe implements PipeTransform {
  readonly statusPermitidos = [
    DesafioStatus.ACEITO,
    DesafioStatus.NEGADO,
    DesafioStatus.CANCELADO,
  ];

  transform(value: any) {
    const status = value.status.toUpperCase();

    if (!this.ehStatusValido(status)) {
      throw new BadRequestException(`${status} é um status inválido`);
    }

    return value;
  }

  private ehStatusValido(status: any) {
    const idx = this.statusPermitidos.indexOf(status);

    // -1 se elemento não for encontrado
    return idx !== -1;
  }
}
