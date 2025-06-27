import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { SearchService } from "./search.service";
import {
  SearchQueryDto,
  SearchSuggestionDto,
  IndexEntityDto,
} from "./dto/search.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: "Search for entities" })
  @ApiResponse({
    status: 200,
    description: "Search results retrieved successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async search(@Query() searchQuery: SearchQueryDto) {
    return this.searchService.search(searchQuery);
  }

  @Get("suggestions")
  @ApiOperation({ summary: "Get search suggestions" })
  @ApiResponse({
    status: 200,
    description: "Suggestions retrieved successfully",
  })
  async getSuggestions(@Query() suggestionQuery: SearchSuggestionDto) {
    return this.searchService.getSuggestions(suggestionQuery);
  }

  @Post("index")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Index an entity for search" })
  @ApiResponse({ status: 201, description: "Entity indexed successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @HttpCode(HttpStatus.CREATED)
  async indexEntity(@Body() indexData: IndexEntityDto) {
    await this.searchService.indexEntity(indexData);
    return { message: "Entity indexed successfully" };
  }

  @Delete("index/:entityType/:entityId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Remove entity from search index" })
  @ApiResponse({
    status: 204,
    description: "Entity removed from index successfully",
  })
  @ApiResponse({ status: 404, description: "Entity not found in index" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromIndex(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string
  ) {
    await this.searchService.removeFromIndex(entityId, entityType);
  }

  @Put("index/:entityType/:entityId/popularity")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update entity popularity score" })
  @ApiResponse({ status: 200, description: "Popularity updated successfully" })
  @ApiResponse({ status: 404, description: "Entity not found in index" })
  async updatePopularity(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
    @Body("popularity") popularity: number
  ) {
    await this.searchService.updatePopularity(entityId, entityType, popularity);
    return { message: "Popularity updated successfully" };
  }
}
