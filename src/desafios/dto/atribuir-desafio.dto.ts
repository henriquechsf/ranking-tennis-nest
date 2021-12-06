import { IsNotEmpty } from 'class-validator';
import { Jogador } from 'src/jogadores/interface/jogador.interface';
import { Resultado } from '../interface/desafio.interface';

export class AtribuirDesafioDto {
  @IsNotEmpty()
  def: Jogador;

  @IsNotEmpty()
  resultado: Array<Resultado>;
}
