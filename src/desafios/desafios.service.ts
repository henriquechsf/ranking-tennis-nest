import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriasService } from 'src/categorias/categorias.service';
import { JogadoresService } from 'src/jogadores/jogadores.service';
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
}
