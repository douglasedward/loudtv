import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  SearchIndex,
  SearchIndexDocument,
} from "./schemas/search-index.schema";
import {
  SearchQueryDto,
  SearchSuggestionDto,
  IndexEntityDto,
} from "./dto/search.dto";
import { CacheService } from "../common/cache/cache.service";

export interface SearchResult {
  results: any[];
  total: number;
  page: {
    limit: number;
    offset: number;
  };
  facets?: {
    categories: { id: string; name: string; count: number }[];
    tags: { name: string; count: number }[];
  };
}

export interface SearchSuggestion {
  text: string;
  type: string;
  popularity: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(SearchIndex.name)
    private searchIndexModel: Model<SearchIndexDocument>,
    private cacheService: CacheService
  ) {}

  async search(searchQuery: SearchQueryDto): Promise<SearchResult> {
    try {
      const cacheKey = `search:${JSON.stringify(searchQuery)}`;
      const cached = await this.cacheService.get<SearchResult>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit for search query: ${searchQuery.query}`);
        return cached;
      }

      // Build the search pipeline
      const pipeline = this.buildSearchPipeline(searchQuery);

      // Execute search
      const [results, totalResult] = await Promise.all([
        this.searchIndexModel.aggregate(pipeline),
        this.searchIndexModel.aggregate([
          ...pipeline.slice(0, -2), // Remove limit and skip
          { $count: "total" },
        ]),
      ]);

      const total = totalResult[0]?.total || 0;

      // Build facets if needed
      const facets = await this.buildFacets(searchQuery);

      const searchResult: SearchResult = {
        results,
        total,
        page: {
          limit: searchQuery.limit || 20,
          offset: searchQuery.offset || 0,
        },
        facets,
      };

      // Cache results for 5 minutes
      await this.cacheService.set(cacheKey, searchResult, 300);

      this.logger.log(
        `Search completed: query="${searchQuery.query}", results=${total}`
      );
      return searchResult;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSuggestions(
    suggestionQuery: SearchSuggestionDto
  ): Promise<SearchSuggestion[]> {
    try {
      const cacheKey = `suggestions:${JSON.stringify(suggestionQuery)}`;
      const cached = await this.cacheService.get<SearchSuggestion[]>(cacheKey);

      if (cached) {
        return cached;
      }

      const pipeline = [
        {
          $match: {
            $and: [
              { isActive: true },
              {
                $or: [
                  { title: { $regex: suggestionQuery.query, $options: "i" } },
                  { tags: { $regex: suggestionQuery.query, $options: "i" } },
                ],
              },
              ...(suggestionQuery.type
                ? [{ entityType: suggestionQuery.type }]
                : []),
            ],
          },
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$title",
                        regex: `^${suggestionQuery.query}`,
                        options: "i",
                      },
                    },
                    10,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$title",
                        regex: suggestionQuery.query,
                        options: "i",
                      },
                    },
                    5,
                    0,
                  ],
                },
                "$popularity",
              ],
            },
          },
        },
        { $sort: { relevanceScore: -1, popularity: -1 } },
        { $limit: suggestionQuery.limit || 10 },
        {
          $project: {
            text: "$title",
            type: "$entityType",
            popularity: 1,
          },
        },
      ];

      // const suggestions = await this.searchIndexModel.aggregate(pipeline);
      const suggestions = [];

      // Cache for 10 minutes
      await this.cacheService.set(cacheKey, suggestions, 600);

      return suggestions;
    } catch (error) {
      this.logger.error(`Suggestions failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async indexEntity(indexData: IndexEntityDto): Promise<void> {
    try {
      await this.searchIndexModel.findOneAndUpdate(
        { entityId: indexData.entityId, entityType: indexData.entityType },
        {
          ...indexData,
          lastIndexed: new Date(),
          isActive: true,
        },
        { upsert: true, new: true }
      );

      // Clear related caches
      await this.clearSearchCaches(indexData.entityType);

      this.logger.log(
        `Entity indexed: ${indexData.entityType}:${indexData.entityId}`
      );
    } catch (error) {
      this.logger.error(`Index entity failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeFromIndex(entityId: string, entityType: string): Promise<void> {
    try {
      await this.searchIndexModel.findOneAndUpdate(
        { entityId, entityType },
        { isActive: false },
        { new: true }
      );

      // Clear related caches
      await this.clearSearchCaches(entityType);

      this.logger.log(`Entity removed from index: ${entityType}:${entityId}`);
    } catch (error) {
      this.logger.error(
        `Remove from index failed: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async updatePopularity(
    entityId: string,
    entityType: string,
    popularity: number
  ): Promise<void> {
    try {
      await this.searchIndexModel.findOneAndUpdate(
        { entityId, entityType },
        { popularity, lastIndexed: new Date() },
        { new: true }
      );

      // Clear related caches
      await this.clearSearchCaches(entityType);
    } catch (error) {
      this.logger.error(
        `Update popularity failed: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private buildSearchPipeline(searchQuery: SearchQueryDto): any[] {
    const pipeline = [];

    // Match stage
    const matchConditions: any[] = [{ isActive: true }];

    // Text search
    if (searchQuery.query) {
      matchConditions.push({
        $or: [
          { title: { $regex: searchQuery.query, $options: "i" } },
          { description: { $regex: searchQuery.query, $options: "i" } },
          {
            tags: { $elemMatch: { $regex: searchQuery.query, $options: "i" } },
          },
        ],
      });
    }

    // Filter by type
    if (searchQuery.type) {
      matchConditions.push({ entityType: searchQuery.type });
    }

    // Filter by category
    if (searchQuery.categoryId) {
      matchConditions.push({ categoryId: searchQuery.categoryId });
    }

    // Filter by tags
    if (searchQuery.tags && searchQuery.tags.length > 0) {
      matchConditions.push({ tags: { $in: searchQuery.tags } });
    }

    pipeline.push({ $match: { $and: matchConditions } });

    // Add relevance scoring
    if (searchQuery.query) {
      pipeline.push({
        $addFields: {
          relevanceScore: {
            $add: [
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$title",
                      regex: `^${searchQuery.query}`,
                      options: "i",
                    },
                  },
                  20,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$title",
                      regex: searchQuery.query,
                      options: "i",
                    },
                  },
                  10,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$description",
                      regex: searchQuery.query,
                      options: "i",
                    },
                  },
                  5,
                  0,
                ],
              },
              "$popularity",
            ],
          },
        },
      });
    }

    // Sort stage
    const sortStage: any = {};

    switch (searchQuery.sortBy) {
      case "popularity":
        sortStage.popularity = searchQuery.sortOrder === "asc" ? 1 : -1;
        break;
      case "created":
        sortStage.createdAt = searchQuery.sortOrder === "asc" ? 1 : -1;
        break;
      case "updated":
        sortStage.updatedAt = searchQuery.sortOrder === "asc" ? 1 : -1;
        break;
      default: // relevance
        if (searchQuery.query) {
          sortStage.relevanceScore = -1;
        }
        sortStage.popularity = -1;
    }

    pipeline.push({ $sort: sortStage });

    // Pagination
    if (searchQuery.offset && searchQuery.offset > 0) {
      pipeline.push({ $skip: searchQuery.offset });
    }

    pipeline.push({ $limit: searchQuery.limit || 20 });

    return pipeline;
  }

  private async buildFacets(searchQuery: SearchQueryDto): Promise<any> {
    // Build category facets
    const categoryFacets = await this.searchIndexModel.aggregate([
      { $match: { isActive: true, categoryId: { $exists: true } } },
      {
        $group: {
          _id: { id: "$categoryId", name: "$categoryName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { id: "$_id.id", name: "$_id.name", count: 1, _id: 0 } },
    ]);

    // Build tag facets
    const tagFacets = await this.searchIndexModel.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);

    return {
      categories: categoryFacets,
      tags: tagFacets,
    };
  }

  private async clearSearchCaches(entityType?: string): Promise<void> {
    try {
      if (entityType) {
        await this.cacheService.delPattern(`search:*"type":"${entityType}"*`);
        await this.cacheService.delPattern(
          `suggestions:*"type":"${entityType}"*`
        );
      } else {
        await this.cacheService.delPattern("search:*");
        await this.cacheService.delPattern("suggestions:*");
      }
    } catch (error) {
      this.logger.error(
        `Clear search caches failed: ${error.message}`,
        error.stack
      );
    }
  }
}
