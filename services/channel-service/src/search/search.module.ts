import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SearchIndex, SearchIndexSchema } from "./schemas/search-index.schema";
import { CacheModule } from "../common/cache/cache.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SearchIndex.name, schema: SearchIndexSchema },
    ]),
    CacheModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
