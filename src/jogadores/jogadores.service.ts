import { Injectable, Logger } from '@nestjs/common';
import { CriarJogadorDto } from './dto/criar-jogador.dto';
import { Jogador } from './interface/jogador.interface';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class JogadoresService {
  private readonly logger = new Logger(JogadoresService.name);
  private jogadores: Jogador[] = [];

  async criarAtualizarJogador(criaJogadorDto: CriarJogadorDto): Promise<void> {
    this.criar(criaJogadorDto);
  }

  private criar(criaJogadorDto: CriarJogadorDto): void {
    const { email, nome, telefoneCelular } = criaJogadorDto;

    const jogador: Jogador = {
      _id: uuidv4(),
      nome,
      telefoneCelular,
      email,
      ranking: 'A',
      posicaoRanking: 1,
      urlFotoJogador: 'www.google.com.br/foto123.jpg',
    };

    this.logger.log(`Jogador: ${JSON.stringify(jogador)}`);
    this.jogadores.push(jogador);
  }
}
