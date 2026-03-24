import { AppDataSource } from '@biopropose/database';
import { CommentEntity } from '@biopropose/database';
import { AuditAction } from '@biopropose/shared-types';
import { v4 as uuid } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import type { CreateCommentDto, UpdateCommentDto } from '../validators/section.validators';

export class CommentService {
  private get repo() { return AppDataSource.getRepository(CommentEntity); }

  async getByProposal(proposalId: string, sectionKey?: string): Promise<CommentEntity[]> {
    const where: Record<string, string> = { proposalId };
    if (sectionKey) where['sectionKey'] = sectionKey;
    return this.repo.find({ where, order: { createdAt: 'ASC' } });
  }

  async create(proposalId: string, dto: CreateCommentDto): Promise<CommentEntity> {
    const comment = this.repo.create({
      id: uuid(),
      proposalId,
      sectionKey: dto.sectionKey,
      content: dto.content,
      userName: dto.userName,
      userEmail: dto.userEmail,
      userRole: dto.userRole,
    });
    await this.repo.save(comment);

    await auditService.log({
      proposalId,
      userEmail: dto.userEmail,
      userName: dto.userName,
      action: AuditAction.COMMENTED,
      details: `Comment added${dto.sectionKey ? ` on section "${dto.sectionKey}"` : ''}`,
    });

    return comment;
  }

  async update(
    proposalId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentEntity> {
    const comment = await this.repo.findOne({ where: { id: commentId, proposalId } });
    if (!comment) throw new AppError(404, 'Comment not found', 'NOT_FOUND');

    if (comment.userEmail !== dto.userEmail) {
      throw new AppError(403, 'You can only edit your own comments', 'FORBIDDEN');
    }

    comment.content = dto.content;
    await this.repo.save(comment);

    await auditService.log({
      proposalId,
      userEmail: dto.userEmail,
      userName: comment.userName,
      action: AuditAction.COMMENT_UPDATED,
      details: 'Comment updated',
    });

    return comment;
  }

  async delete(proposalId: string, commentId: string, userEmail: string): Promise<void> {
    const comment = await this.repo.findOne({ where: { id: commentId, proposalId } });
    if (!comment) throw new AppError(404, 'Comment not found', 'NOT_FOUND');

    await this.repo.remove(comment);

    await auditService.log({
      proposalId,
      userEmail,
      userName: userEmail,
      action: AuditAction.COMMENT_DELETED,
      details: 'Comment deleted',
    });
  }
}

export const commentService = new CommentService();
