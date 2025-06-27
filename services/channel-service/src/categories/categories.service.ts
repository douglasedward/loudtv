import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Category, CategoryDocument } from "./schemas/category.schema";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { CacheService } from "../common/cache/cache.service";
import { SecurityService } from "../common/security/security.service";

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly cacheService: CacheService,
    private readonly securityService: SecurityService
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Check if category with same name or slug exists
      const existingCategory = await this.categoryModel.findOne({
        $or: [
          { name: createCategoryDto.name },
          { slug: createCategoryDto.slug },
        ],
      });

      if (existingCategory) {
        throw new ConflictException(
          "Category with this name or slug already exists"
        );
      }

      // Sanitize input
      const sanitizedData = {
        ...createCategoryDto,
        name: this.securityService.sanitizeInput(createCategoryDto.name),
        slug: this.securityService
          .sanitizeInput(createCategoryDto.slug)
          .toLowerCase(),
        description: createCategoryDto.description
          ? this.securityService.sanitizeInput(createCategoryDto.description)
          : undefined,
      };

      const category = new this.categoryModel(sanitizedData);
      const savedCategory = await category.save();

      // Clear categories cache
      await this.cacheService.del(
        this.cacheService.generateKey("categories", "all")
      );

      this.logger.log(`Category created: ${savedCategory.id}`);
      return savedCategory;
    } catch (error) {
      this.logger.error(`Failed to create category:`, error);
      throw error;
    }
  }

  async findAll(includeInactive: boolean = false): Promise<Category[]> {
    try {
      const cacheKey = this.cacheService.generateKey(
        "categories",
        includeInactive ? "all" : "active"
      );
      const cachedCategories =
        await this.cacheService.get<Category[]>(cacheKey);

      if (cachedCategories) {
        return cachedCategories;
      }

      const filter = includeInactive ? {} : { isActive: true };
      const categories = await this.categoryModel
        .find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .exec();

      await this.cacheService.set(cacheKey, categories, 3600);

      return categories;
    } catch (error) {
      this.logger.error("Failed to get categories:", error);
      throw error;
    }
  }

  async findById(categoryId: string): Promise<Category> {
    try {
      const cacheKey = this.cacheService.generateKey("category", categoryId);
      const cachedCategory = await this.cacheService.get<Category>(cacheKey);

      if (cachedCategory) {
        return cachedCategory;
      }

      const category = await this.categoryModel.findById(categoryId);
      if (!category) {
        throw new NotFoundException("Category not found");
      }

      await this.cacheService.set(cacheKey, category.toJSON(), 3600);

      return category;
    } catch (error) {
      this.logger.error(`Failed to get category ${categoryId}:`, error);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Category> {
    try {
      const cacheKey = this.cacheService.generateKey("category-slug", slug);
      const cachedCategory = await this.cacheService.get<Category>(cacheKey);

      if (cachedCategory) {
        return cachedCategory;
      }

      const category = await this.categoryModel.findOne({
        slug,
        isActive: true,
      });
      if (!category) {
        throw new NotFoundException("Category not found");
      }

      await this.cacheService.set(cacheKey, category.toJSON(), 3600);

      return category;
    } catch (error) {
      this.logger.error(`Failed to get category by slug ${slug}:`, error);
      throw error;
    }
  }

  async update(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto
  ): Promise<Category> {
    try {
      const category = await this.findById(categoryId);

      // Check for conflicts if name is being updated
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const existingCategory = await this.categoryModel.findOne({
          name: updateCategoryDto.name,
          _id: { $ne: categoryId },
        });

        if (existingCategory) {
          throw new ConflictException("Category with this name already exists");
        }
      }

      // Sanitize input
      const sanitizedData: any = {
        ...updateCategoryDto,
        updatedAt: new Date(),
      };

      if (updateCategoryDto.name) {
        sanitizedData.name = this.securityService.sanitizeInput(
          updateCategoryDto.name
        );
      }
      if (updateCategoryDto.description) {
        sanitizedData.description = this.securityService.sanitizeInput(
          updateCategoryDto.description
        );
      }

      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        categoryId,
        sanitizedData,
        { new: true }
      );

      await this.clearCache(categoryId, category.slug);

      this.logger.log(`Category updated: ${categoryId}`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Failed to update category ${categoryId}:`, error);
      throw error;
    }
  }

  async delete(categoryId: string): Promise<void> {
    try {
      const category = await this.findById(categoryId);

      if (category.channelCount > 0) {
        throw new ConflictException(
          "Cannot delete category with active channels"
        );
      }

      await this.categoryModel.findByIdAndDelete(categoryId);

      await this.clearCache(categoryId, category.slug);

      this.logger.log(`Category deleted: ${categoryId}`);
    } catch (error) {
      this.logger.error(`Failed to delete category ${categoryId}:`, error);
      throw error;
    }
  }

  async incrementChannelCount(categoryName: string): Promise<void> {
    try {
      await this.categoryModel.findOneAndUpdate(
        { name: categoryName },
        { $inc: { channelCount: 1 } }
      );

      // Clear categories cache
      await this.cacheService.delPattern(
        this.cacheService.generateKey("categories", "*")
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment channel count for category ${categoryName}:`,
        error
      );
    }
  }

  async decrementChannelCount(categoryName: string): Promise<void> {
    try {
      await this.categoryModel.findOneAndUpdate(
        { name: categoryName },
        { $inc: { channelCount: -1 } }
      );

      // Clear categories cache
      await this.cacheService.delPattern(
        this.cacheService.generateKey("categories", "*")
      );
    } catch (error) {
      this.logger.error(
        `Failed to decrement channel count for category ${categoryName}:`,
        error
      );
    }
  }

  async findPopular(limit: number = 10): Promise<Category[]> {
    try {
      const cacheKey = this.cacheService.generateKey(
        "categories",
        "popular",
        limit.toString()
      );
      const cachedCategories =
        await this.cacheService.get<Category[]>(cacheKey);

      if (cachedCategories) {
        return cachedCategories;
      }

      const categories = await this.categoryModel
        .find({ isActive: true, channelCount: { $gt: 0 } })
        .sort({ channelCount: -1 })
        .limit(limit)
        .exec();

      // Cache for 30 minutes
      await this.cacheService.set(cacheKey, categories, 1800);

      return categories;
    } catch (error) {
      this.logger.error("Failed to get popular categories:", error);
      throw error;
    }
  }

  private async clearCache(categoryId: string, slug: string): Promise<void> {
    await Promise.all([
      this.cacheService.del(
        this.cacheService.generateKey("category", categoryId)
      ),
      this.cacheService.del(
        this.cacheService.generateKey("category-slug", slug)
      ),
      this.cacheService.delPattern(
        this.cacheService.generateKey("categories", "*")
      ),
    ]);
  }
}
