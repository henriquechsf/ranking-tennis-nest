import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JogadoresModule } from './jogadores/jogadores.module';
import { CategoriasModule } from './categorias/categorias.module';
import { DesafiosModule } from './desafios/desafios.module';
@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://mongo:mongopass@cluster0.es145.mongodb.net/rankingtennis?retryWrites=true&w=majority',
    ),
    JogadoresModule,
    CategoriasModule,
    DesafiosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
