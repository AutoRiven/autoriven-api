import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexUser(user: User) {
    try {
      await this.elasticsearchService.index({
        index: 'users',
        id: user.id,
        body: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          city: user.city,
          country: user.country,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error indexing user:', error);
    }
  }

  async searchUsers(query: string, filters?: {
    role?: string;
    isActive?: boolean;
    city?: string;
    country?: string;
  }) {
    const searchBody: any = {
      query: {
        bool: {
          must: [],
          filter: [],
        },
      },
    };

    // Add text search
    if (query && query.trim() !== '') {
      searchBody.query.bool.must.push({
        multi_match: {
          query,
          fields: [
            'firstName^2',
            'lastName^2',
            'email^1.5',
            'fullName^2',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      searchBody.query.bool.must.push({
        match_all: {},
      });
    }

    // Add filters
    if (filters) {
      if (filters.role) {
        searchBody.query.bool.filter.push({
          term: { role: filters.role },
        });
      }

      if (filters.isActive !== undefined) {
        searchBody.query.bool.filter.push({
          term: { isActive: filters.isActive },
        });
      }

      if (filters.city) {
        searchBody.query.bool.filter.push({
          term: { 'city.keyword': filters.city },
        });
      }

      if (filters.country) {
        searchBody.query.bool.filter.push({
          term: { 'country.keyword': filters.country },
        });
      }
    }

    try {
      const response = await this.elasticsearchService.search({
        index: 'users',
        body: searchBody,
        size: 20,
      });

      return {
        total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0,
        users: response.hits.hits.map((hit: any) => hit._source),
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return { total: 0, users: [] };
    }
  }

  async deleteUser(userId: string) {
    try {
      await this.elasticsearchService.delete({
        index: 'users',
        id: userId,
      });
    } catch (error) {
      console.error('Error deleting user from search index:', error);
    }
  }

  async updateUser(user: User) {
    try {
      await this.elasticsearchService.update({
        index: 'users',
        id: user.id,
        body: {
          doc: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            city: user.city,
            country: user.country,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error updating user in search index:', error);
    }
  }

  async createUserMapping() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: 'users',
      });

      if (!indexExists) {
        await this.elasticsearchService.indices.create({
          index: 'users',
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                email: { type: 'text', analyzer: 'standard' },
                firstName: { 
                  type: 'text', 
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                lastName: { 
                  type: 'text', 
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                fullName: { 
                  type: 'text', 
                  analyzer: 'standard' 
                },
                role: { type: 'keyword' },
                city: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                country: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                isActive: { type: 'boolean' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
          },
        });
        console.log('Created users index with mapping');
      }
    } catch (error) {
      console.error('Error creating user mapping:', error);
    }
  }
}
