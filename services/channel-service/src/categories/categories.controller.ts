import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("categories")
@Controller("categories")
@UseGuards(ThrottlerGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new category (Admin only)" })
  @ApiResponse({ status: 201, description: "Category created successfully" })
  @ApiResponse({ status: 409, description: "Category already exists" })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all categories" })
  @ApiQuery({
    name: "includeInactive",
    required: false,
    description: "Include inactive categories",
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: "Categories retrieved successfully",
  })
  async getAllCategories(
    @Query("includeInactive") includeInactive: string = "false"
  ) {
    return this.categoriesService.findAll(includeInactive === "true");
  }

  @Get("popular")
  @ApiOperation({ summary: "Get popular categories" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of categories to return",
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "Popular categories retrieved successfully",
  })
  async getPopularCategories(@Query("limit") limit: string = "10") {
    return this.categoriesService.findPopular(parseInt(limit));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get category by ID" })
  @ApiParam({ name: "id", description: "Category ID" })
  @ApiResponse({ status: 200, description: "Category found" })
  @ApiResponse({ status: 404, description: "Category not found" })
  async getCategoryById(@Param("id") id: string) {
    return this.categoriesService.findById(id);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Get category by slug" })
  @ApiParam({ name: "slug", description: "Category slug" })
  @ApiResponse({ status: 200, description: "Category found" })
  @ApiResponse({ status: 404, description: "Category not found" })
  async getCategoryBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update category (Admin only)" })
  @ApiParam({ name: "id", description: "Category ID" })
  @ApiResponse({ status: 200, description: "Category updated successfully" })
  @ApiResponse({ status: 404, description: "Category not found" })
  @ApiResponse({ status: 409, description: "Category name conflict" })
  async updateCategory(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete category (Admin only)" })
  @ApiParam({ name: "id", description: "Category ID" })
  @ApiResponse({ status: 200, description: "Category deleted successfully" })
  @ApiResponse({ status: 404, description: "Category not found" })
  @ApiResponse({ status: 409, description: "Category has active channels" })
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param("id") id: string) {
    await this.categoriesService.delete(id);
    return { message: "Category deleted successfully" };
  }
}
