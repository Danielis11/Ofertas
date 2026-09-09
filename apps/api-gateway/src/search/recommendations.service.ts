import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../offers/entities/offer.entity';
import { DealsService } from '../deals/deals.service';
import { DealScoreDto } from '../deals/dto/deal-score.dto';

export interface RecommendationResponse {
  intent: string;
  title: string;
  subtitle: string;
  brand?: string;
  deals: DealScoreDto[];
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    private readonly dealsService: DealsService,
  ) {}

  /**
   * Generates highly tailored recommendations based on the user's recent search intent.
   * Strictly enforces category boundaries (e.g., RUNNING shoes only, excluding casual & basketball).
   */
  async getPersonalizedRecommendations(
    intent: string,
    brand?: string,
    limit = 8,
  ): Promise<RecommendationResponse> {
    const normIntent = (intent || 'RUNNING').toUpperCase();
    this.logger.log(`🎯 Generating personalized recommendations for intent: ${normIntent}, brand: ${brand || 'Any'}`);

    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .innerJoinAndSelect('offer.product', 'product')
      .innerJoinAndSelect('offer.store', 'store')
      .where('offer.availability = :avail', { avail: true });

    let title = 'Recomendado para ti: Ofertas Destacadas';
    let subtitle = 'Seleccionadas por nuestro motor inteligente de precios';

    if (normIntent === 'RUNNING') {
      title = '🏃 Recomendado para ti: Tenis de Running';
      subtitle = brand
        ? `Basado en tu búsqueda de ${brand} y calzado para correr`
        : 'Los mejores descuentos en calzado técnico para correr (excluye casual y básquetbol)';

      // 1. MUST MATCH running keywords
      qb.andWhere(
        '(' +
          'product.name ILIKE :correr OR ' +
          'product.name ILIKE :running OR ' +
          'product.name ILIKE :run OR ' +
          'COALESCE(product.model, \'\') ILIKE :correr OR ' +
          'COALESCE(product.model, \'\') ILIKE :running' +
        ')',
        { correr: '%correr%', running: '%running%', run: '% run %' },
      );

      // 2. STRICTLY EXCLUDE non-running disciplines (basketball, casual sneakers, platforms)
      qb.andWhere(
        'NOT (' +
          'product.name ILIKE :basquet OR ' +
          'product.name ILIKE :basketball OR ' +
          'product.name ILIKE :jordan OR ' +
          'product.name ILIKE :casual OR ' +
          'product.name ILIKE :plataforma OR ' +
          'product.name ILIKE :chuckTaylor OR ' +
          'product.name ILIKE :courtVision OR ' +
          'product.name ILIKE :dunk' +
        ')',
        {
          basquet: '%basquet%',
          basketball: '%basketball%',
          jordan: '%jordan%',
          casual: '%casual%',
          plataforma: '%plataforma%',
          chuckTaylor: '%chuck taylor%',
          courtVision: '%court vision%',
          dunk: '%dunk%',
        },
      );
    } else if (normIntent === 'BASKETBALL') {
      title = '🏀 Recomendado para ti: Tenis de Básquetbol';
      subtitle = brand
        ? `Basado en tu búsqueda reciente de ${brand}`
        : 'Calzado oficial de alta amortiguación y soporte en cancha';

      qb.andWhere(
        '(' +
          'product.name ILIKE :basquet OR ' +
          'product.name ILIKE :basketball OR ' +
          'product.name ILIKE :jordan OR ' +
          'product.name ILIKE :immortality' +
        ')',
        { basquet: '%basquet%', basketball: '%basketball%', jordan: '%jordan%', immortality: '%immortality%' },
      );
    } else if (normIntent === 'CASUAL_SNEAKERS') {
      title = '👟 Recomendado para ti: Sneakers y Calzado Urbano';
      subtitle = 'Estilo casual de tus marcas favoritas';

      qb.andWhere(
        '(' +
          'product.name ILIKE :casual OR ' +
          'product.name ILIKE :chuckTaylor OR ' +
          'product.name ILIKE :courtVision OR ' +
          'product.name ILIKE :suede OR ' +
          'product.name ILIKE :classic' +
        ')',
        {
          casual: '%casual%',
          chuckTaylor: '%chuck taylor%',
          courtVision: '%court vision%',
          suede: '%suede%',
          classic: '%classic%',
        },
      );
    } else if (normIntent === 'SMARTPHONES') {
      title = '📱 Recomendado para ti: Smartphones y Telefonía';
      subtitle = brand
        ? `Ofertas destacadas en teléfonos ${brand} y gama alta`
        : 'Las mejores ofertas en celulares con precio verificado';

      qb.andWhere(
        '(' +
          'product.name ILIKE :celular OR ' +
          'product.name ILIKE :smartphone OR ' +
          'product.name ILIKE :edge OR ' +
          'product.name ILIKE :galaxy OR ' +
          'product.name ILIKE :redmi OR ' +
          'product.name ILIKE :iphone' +
        ')',
        {
          celular: '%celular%',
          smartphone: '%smartphone%',
          edge: '%edge%',
          galaxy: '%galaxy%',
          redmi: '%redmi%',
          iphone: '%iphone%',
        },
      );
    }

    // Optional brand affinity weighting
    if (brand && brand.trim().length > 0) {
      qb.orderBy(
        `CASE WHEN LOWER(product.brand) = LOWER('${brand.trim().replace(/'/g, "''")}') THEN 0 ELSE 1 END`,
        'ASC',
      );
    }

    const matchedOffers = await qb.limit(25).getMany();

    const scoredDeals: DealScoreDto[] = [];
    for (const offer of matchedOffers) {
      try {
        const evaluation = await this.dealsService.evaluateOffer(offer.id);
        scoredDeals.push(evaluation);
      } catch {
        continue;
      }
    }

    // Sort by best score
    scoredDeals.sort((a, b) => b.score - a.score);

    return {
      intent: normIntent,
      title,
      subtitle,
      brand,
      deals: scoredDeals.slice(0, limit),
    };
  }
}
