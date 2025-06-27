import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { Category, CategorySchema } from "./schemas/category.schema";
import { CacheModule } from "../common/cache/cache.module";
import { SecurityModule } from "../common/security/security.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET", "secret-key"),
        signOptions: { expiresIn: configService.get("JWT_EXPIRATION", "7d") },
      }),
      inject: [ConfigService],
    }),
    CacheModule,
    SecurityModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
