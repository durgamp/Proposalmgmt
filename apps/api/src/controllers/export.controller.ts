import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { exportService } from '../services/export.service';
import type { ExportDto } from '../validators/cost.validators';

export const exportController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exports = await exportService.getExports(req.params.proposalId);
      res.json(exports);
    } catch (err) { next(err); }
  },

  pdf: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filePath, fileName } = await exportService.exportPdf(
        req.params.proposalId,
        req.body as ExportDto,
      );
      res.download(filePath, fileName, (err) => {
        if (err) next(err);
        // Clean up file after download
        fs.unlink(filePath, () => { /* ignore */ });
      });
    } catch (err) { next(err); }
  },

  word: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filePath, fileName } = await exportService.exportWord(
        req.params.proposalId,
        req.body as ExportDto,
      );
      res.download(filePath, fileName, (err) => {
        if (err) next(err);
        fs.unlink(filePath, () => { /* ignore */ });
      });
    } catch (err) { next(err); }
  },
};
