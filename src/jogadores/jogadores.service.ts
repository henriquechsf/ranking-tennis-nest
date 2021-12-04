import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CriarJogadorDto } from './dto/criar-jogador.dto';
import { Jogador } from './interface/jogador.interface';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class JogadoresService {
  private readonly logger = new Logger(JogadoresService.name);
  // private jogadores: Jogador[] = [];

  constructor(
    @InjectModel('Jogador') private readonly jogadorModel: Model<Jogador>,
  ) {}

  async criarAtualizarJogador(criaJogadorDto: CriarJogadorDto): Promise<void> {
    const { email } = criaJogadorDto;

    // const jogadorEncontrado = this.jogadores.find(
    //   (jogador) => jogador.email === email,
    // );

    const jogadorEncontrado = await this.jogadorModel.findOne({ email }).exec();

    if (jogadorEncontrado) {
      this.atualizar(criaJogadorDto);
    } else {
      this.criar(criaJogadorDto);
    }
  }

  async consultarTodosJogadores(): Promise<Jogador[]> {
    return this.jogadorModel.find().exec();
    // return this.jogadores;
  }

  async consultarJogadorPeloEmail(email: string): Promise<Jogador> {
    /*
    const jogadorEncontrado = this.jogadores.find(
      (jogador) => jogador.email === email,
      );
    */

    const jogadorEncontrado = await this.jogadorModel.findOne({ email }).exec();

    if (!jogadorEncontrado) {
      throw new NotFoundException(`Jogador com email ${email} não encontrado.`);
    }

    return jogadorEncontrado;
  }

  async deletarJogador(email: string): Promise<any> {
    return await this.jogadorModel.remove({ email }).exec();

    /*const jogadorEncontrado = this.jogadores.find(
      (jogador) => jogador.email === email,
    );

    if (!jogadorEncontrado) {
      throw new NotFoundException(`Jogador com email ${email} não encontrado.`);
    }

    this.jogadores = this.jogadores.filter(
      (jogador) => jogador.email !== jogadorEncontrado.email,
    );*/
  }

  private async criar(criaJogadorDto: CriarJogadorDto): Promise<Jogador> {
    const jogadorCriado = new this.jogadorModel(criaJogadorDto);
    return await jogadorCriado.save();

    /*
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
    */
  }

  private async atualizar(criarJogadorDto: CriarJogadorDto): Promise<Jogador> {
    return await this.jogadorModel
      .findOneAndUpdate(
        { email: criarJogadorDto.email },
        { $set: criarJogadorDto },
      )
      .exec();
    /*
    const { nome } = criarJogadorDto;
    jogadorEncontrado.nome = nome;
    */
  }
}
