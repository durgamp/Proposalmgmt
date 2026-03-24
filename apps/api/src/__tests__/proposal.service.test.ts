/**
 * ProposalService unit tests — TypeORM AppDataSource is fully mocked so these
 * run without a real database connection.
 */
import { ProposalStatus, ProposalStage, ProposalMethod } from '@biopropose/shared-types';
import type { ProposalEntity } from '@biopropose/database';

// ── Mock AppDataSource before importing the service ──────────────────────────

const mockFindOne     = jest.fn();
const mockFindAndCount = jest.fn();
const mockCreate      = jest.fn();
const mockSave        = jest.fn();
const mockDelete      = jest.fn();
const mockGetRepository = jest.fn().mockReturnValue({
  findOne: mockFindOne,
  findAndCount: mockFindAndCount,
  create: mockCreate,
  save: mockSave,
  delete: mockDelete,
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
});

jest.mock('@biopropose/database', () => ({
  AppDataSource: {
    getRepository: mockGetRepository,
    transaction: jest.fn(),
    isInitialized: true,
  },
  ProposalEntity: jest.fn(),
  ProposalSectionEntity: jest.fn(),
  TemplateEntity: jest.fn(),
}));

jest.mock('../services/audit.service', () => ({
  auditService: { log: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../utils/stageAdvancement', () => ({
  validateStageAdvancement: jest.fn().mockReturnValue({ allowed: true }),
  computeCompletionPercentage: jest.fn().mockReturnValue(50),
  getStageName: jest.fn().mockReturnValue('Draft Creation'),
}));

jest.mock('../utils/proposalDiff', () => ({
  detectChanges: jest.fn().mockReturnValue(['name updated']),
}));

// Import AFTER mocks are set up
import { ProposalService } from '../services/proposal.service';
import { AppError } from '../middleware/errorHandler';

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ProposalService', () => {
  let service: ProposalService;

  beforeEach(() => {
    service = new ProposalService();
    jest.clearAllMocks();
    // Re-apply the repository mock after clearAllMocks
    mockGetRepository.mockReturnValue({
      findOne: mockFindOne,
      findAndCount: mockFindAndCount,
      create: mockCreate,
      save: mockSave,
      delete: mockDelete,
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    });
  });

  // ── list ────────────────────────────────────────────────────────────────────

  describe('list()', () => {
    const baseQuery = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    test('returns paginated results without search', async () => {
      const mockItems = [{ id: '1', name: 'Proposal A' }];
      mockFindAndCount.mockResolvedValue([mockItems, 1]);

      const result = await service.list(baseQuery);

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);
      expect(mockFindAndCount).toHaveBeenCalledTimes(1);
    });

    test('uses QueryBuilder when search term is provided', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' }], 1]),
      };
      mockGetRepository.mockReturnValueOnce({
        ...mockGetRepository(),
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      });

      const result = await service.list({ ...baseQuery, search: 'acme' });

      expect(result.total).toBe(1);
      expect(qb.getManyAndCount).toHaveBeenCalled();
    });

    test('filters by status when provided', async () => {
      mockFindAndCount.mockResolvedValue([[], 0]);

      await service.list({ ...baseQuery, status: ProposalStatus.SENT });

      expect(mockFindAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ProposalStatus.SENT }) }),
      );
    });
  });

  // ── getById ──────────────────────────────────────────────────────────────────

  describe('getById()', () => {
    test('returns a proposal when it exists', async () => {
      const mockProposal = { id: 'abc-123', name: 'My Proposal' } as ProposalEntity;
      mockFindOne.mockResolvedValue(mockProposal);

      const result = await service.getById('abc-123');

      expect(result).toBe(mockProposal);
      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'abc-123' } }),
      );
    });

    test('throws AppError(404) when proposal does not exist', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.getById('missing-id')).rejects.toThrow(AppError);
      await expect(service.getById('missing-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const validDto = {
      name: 'New Proposal',
      client: 'Acme Corp',
      bdManager: 'bd@acme.com',
      proposalCode: 'BIO-2025-001',
      method: ProposalMethod.SCRATCH,
      createdBy: 'creator@acme.com',
      proposalManager: undefined,
      businessUnit: undefined,
      templateType: undefined,
      description: undefined,
      sfdcOpportunityCode: undefined,
      sourceProposalId: undefined,
      assignedStakeholders: [],
    };

    test('throws 409 when proposal code already exists', async () => {
      mockFindOne.mockResolvedValue({ id: 'existing', proposalCode: 'BIO-2025-001' });

      await expect(service.create(validDto)).rejects.toMatchObject({
        statusCode: 409,
        code: 'DUPLICATE_CODE',
      });
    });

    test('creates a proposal when code is unique', async () => {
      // First call: duplicate check (not found)
      // Subsequent calls: section saves etc.
      mockFindOne.mockResolvedValue(null);
      const savedProposal = { id: 'new-id', ...validDto };
      mockCreate.mockReturnValue(savedProposal);
      mockSave.mockResolvedValue(savedProposal);

      const result = await service.create(validDto);

      expect(mockSave).toHaveBeenCalled();
      expect(result).toMatchObject({ name: 'New Proposal' });
    });
  });

  // ── softDelete ────────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    test('throws 404 when proposal does not exist', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.softDelete('missing', 'user@test.com')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    test('deletes proposal when it exists', async () => {
      mockFindOne.mockResolvedValue({ id: 'exists' } as ProposalEntity);
      mockDelete.mockResolvedValue({ affected: 1 });

      await expect(service.softDelete('exists', 'user@test.com')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith('exists');
    });
  });
});
