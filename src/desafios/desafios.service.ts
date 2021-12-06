import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriasService } from 'src/categorias/categorias.service';
import { JogadoresService } from 'src/jogadores/jogadores.service';
import { AtribuirDesafioDto } from './dto/atribuir-desafio.dto';
import { AtualizarDesafioDto } from './dto/atualizar-desafio.dto';
import { CriarDesafioDto } from './dto/criar-desafio.dto';
import { DesafioStatus } from './interface/desafio-status.enum';
import { Desafio, Partida } from './interface/desafio.interface';

@Injectable()
export class DesafiosService {
  private readonly logger = new Logger(DesafiosService.name);

  constructor(
    @InjectModel('Desafio') private readonly desafioModel: Model<Desafio>,
    @InjectModel('Partida') private readonly partidaModel: Model<Partida>,
    private readonly categoriasService: CategoriasService,
    private readonly jogadoresService: JogadoresService,
  ) {}

  async criarDesafio(criarDesafioDto: CriarDesafioDto): Promise<Desafio> {
    /**
     * verificar se os jogadores estão cadastrados
     */
    const jogadores = await this.jogadoresService.consultarTodosJogadores();

    criarDesafioDto.jogadores.map((jogadoresDto) => {
      const jogadorFilter = jogadores.filter(
        (jogador) => jogador._id == jogadoresDto._id,
      );

      if (jogadorFilter.length == 0) {
        throw new BadRequestException(
          `O ID ${jogadoresDto._id} não é um jogador!`,
        );
      }
    });

    /**
     * Verificar se o solicitante é um dos jogadores da partida
     */
    const solicitanteEhJogadorDaPartida =
      await criarDesafioDto.jogadores.filter(
        (jogador) => jogador._id == criarDesafioDto.solicitante,
      );

    this.logger.log(
      `solicitanteEhJogadorDaPartida: ${solicitanteEhJogadorDaPartida}`,
    );

    if (solicitanteEhJogadorDaPartida.length == 0) {
      throw new BadRequestException(
        `O solicitante deve ser um jogador da partida!`,
      );
    }

    /**
     * Descobrimos a categoria com base no ID do jogador solicitante
     */
    const categoriaDoJogador =
      await this.categoriasService.consultarCategoriaPeloJogador(
        criarDesafioDto.solicitante,
      );

    /**
     * Para prosseguir o solicitante deve fazer parte de uma categoria
     */
    if (!categoriaDoJogador) {
      throw new BadRequestException(
        `O solicitante precisa estar cadastrado em uma categoria`,
      );
    }

    const desafioCriado = new this.desafioModel(criarDesafioDto);
    desafioCriado.categoria = categoriaDoJogador.categoria;
    desafioCriado.dataHoraSolicitacao = new Date();

    /**
     * Quando um desafio for criado definimos o status como PENDENTE
     */
    desafioCriado.status = DesafioStatus.PENDENTE;

    this.logger.log(`desafioCriado: ${JSON.stringify(desafioCriado)}`);
    return await desafioCriado.save();
  }

  async consultarTodosDesafios(): Promise<Array<Desafio>> {
    return await this.desafioModel
      .find()
      .populate('solicitante')
      .populate('jogadores')
      .populate('partida')
      .exec();
  }

  async consultarDesafiosDeUmJogador(_id: any): Promise<Array<Desafio>> {
    const jogadores = await this.jogadoresService.consultarTodosJogadores();

    const jogadorFilter = jogadores.filter((jogador) => jogador._id == _id);

    if (jogadorFilter.length == 0) {
      throw new BadRequestException(`O ID ${_id} não é um jogador`);
    }

    return await this.desafioModel
      .find()
      .where('jogadores')
      .in(_id)
      .populate('solicitante')
      .populate('jogadores')
      .populate('partida')
      .exec();
  }

  async atualizarDesafio(
    _id: string,
    atualizarDesafioDto: AtualizarDesafioDto,
  ): Promise<void> {
    const desafioEncontrado = await this.desafioModel.findById(_id).exec();

    if (!desafioEncontrado) {
      throw new NotFoundException(`Desafio ${_id} não cadastrado`);
    }

    /**
     * Atualizamos a data da resposta quando o status vier preenchido
     */
    if (atualizarDesafioDto.status) {
      desafioEncontrado.dataHoraResposta = new Date();
    }
    desafioEncontrado.status = atualizarDesafioDto.status;
    desafioEncontrado.dataHoraDesafio = atualizarDesafioDto.dataHoraDesafio;

    await this.desafioModel
      .findOneAndUpdate({ _id }, { $set: desafioEncontrado })
      .exec();
  }

  async atribuirDesafioPartida(
    _id: string,
    atribuirDesafioPartidaDto: AtribuirDesafioDto,
  ): Promise<void> {
    const desafioEncontrado = await this.desafioModel.findById(_id).exec();

    if (!desafioEncontrado) {
      throw new NotFoundException(`Desafio ${_id} não cadastrado`);
    }

    /**
     * Verificar se o jogador vencedor faz parte do desafio
     */
    const jogadorFilter = desafioEncontrado.jogadores.filter(
      (jogador) => jogador._id == atribuirDesafioPartidaDto.def,
    );

    this.logger.log(`desafioEncontrado: ${desafioEncontrado}`);
    this.logger.log(`jogadorFilter: ${jogadorFilter}`);

    if (jogadorFilter.length == 0) {
      throw new BadRequestException(
        `O jogador vencedor não faz parte do desafio!`,
      );
    }

    /**
     * Primeiro vamos criar e persistir o objeto da partida
     */
    const partidaCriada = new this.partidaModel(atribuirDesafioPartidaDto);

    /**
     * Atribuir ao objeto partida a categoria recuperada no desafio
     */
    partidaCriada.categoria = desafioEncontrado.categoria;

    /**
     * Atribuir ao objeto partida os jogadores que fizeram parte do desafio
     */
    partidaCriada.jogadores = desafioEncontrado.jogadores;

    const resultado = await partidaCriada.save();

    /**
     * Quando uma partida for registrada por um usuário
     * mudaremos o status para Realizado
     */
    desafioEncontrado.status = DesafioStatus.REALIZADO;

    /**
     * Recuperamos o ID da partida e atribuimos ao desafio
     */
    desafioEncontrado.partida = resultado._id;

    try {
      await this.desafioModel
        .findOneAndUpdate({ _id }, { $set: desafioEncontrado })
        .exec();
    } catch (error) {
      /**
       * Se a atualização do desafio falhar excluímos a partida gravada anteriormente
       */
      await this.partidaModel.deleteOne({ _id: resultado._id }).exec();
      throw new InternalServerErrorException();
    }
  }

  async deletarDesafio(_id: string): Promise<void> {
    const desafioEncontrado = await this.desafioModel.findById(_id).exec();

    if (!desafioEncontrado) {
      throw new BadRequestException(`Desafio ${_id} não cadastrado!`);
    }

    /**
     * Realizamos a deleção lógica do desafio, modificando o status para CANCELADO
     */
    desafioEncontrado.status = DesafioStatus.CANCELADO;

    await this.desafioModel
      .findOneAndUpdate({ _id }, { $set: desafioEncontrado })
      .exec();
  }
}
