import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { normalizeText } from '../common/utils/normalizers';
import { DiamondsService } from './diamonds.service';
import { DiamondFilters } from './dto/diamond-filter.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type ShapeResolution = { shape: string } | { error: string } | null;

@Controller('products')
export class DiamondsController {
  constructor(private readonly diamondsService: DiamondsService) {}

  @Get('diamonds/:shape')
  async getDiamondsByShape(@Param('shape') shapeParam: string, @Query() query: Record<string, string>) {
    return this.handleDiamondRequest(shapeParam, undefined, {}, query);
  }

  @Post('diamonds/:shape')
  @HttpCode(HttpStatus.OK)
  async filterDiamondsByShape(
    @Param('shape') shapeParam: string,
    @Body() body: (DiamondFilters & { shape?: unknown }) | undefined,
    @Query() query: Record<string, string>,
  ) {
    return this.handleDiamondRequest(shapeParam, body?.shape, body || {}, query);
  }

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  clearDiamondCache() {
    this.diamondsService.clearCache();
    return { status: 'success', message: 'Diamond cache cleared' };
  }

  private resolveRequiredDiamondShape(shapeParam: string, bodyShapeRaw: unknown): ShapeResolution {
    const shape = normalizeText(shapeParam);
    const bodyShape = normalizeText(bodyShapeRaw);

    if (!shape || shape === 'ALL' || shape === 'ANY' || shape === '*') {
      return null;
    }

    if (bodyShape) {
      return { error: 'Do not send shape in body. Shape must be provided in URL path only.' };
    }

    return { shape };
  }

  private parsePositiveInt(value: unknown, fallback: number): number {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private resolvePagination(query: Record<string, string> = {}) {
    const page = this.parsePositiveInt(query.page, DEFAULT_PAGE);
    const requestedLimit = this.parsePositiveInt(query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  private async handleDiamondRequest(
    shapeParam: string,
    bodyShapeRaw: unknown,
    filters: DiamondFilters,
    query: Record<string, string>,
  ) {
    const shapeState = this.resolveRequiredDiamondShape(shapeParam, bodyShapeRaw);
    if (!shapeState) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Shape is required in URL path. Example: /api/products/diamonds/ROUND',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if ('error' in shapeState) {
      throw new HttpException({ status: 'error', message: shapeState.error }, HttpStatus.BAD_REQUEST);
    }

    const { page, limit, offset } = this.resolvePagination(query);

    try {
      const filtered = await this.diamondsService.getFilteredDiamonds(shapeState.shape, filters);
      const total = filtered.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
      const pageData = filtered.slice(offset, offset + limit);

      return {
        status: 'success',
        count: pageData.length,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        data: pageData.map((row) => this.diamondsService.formatRow(row)),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const googleErrorMessage = err.response?.data?.error?.message;
      // eslint-disable-next-line no-console
      console.error('Error reading diamond products:', googleErrorMessage || err.message);

      throw new HttpException(
        { status: 'error', message: 'Unable to load diamond data from Google Sheet' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
