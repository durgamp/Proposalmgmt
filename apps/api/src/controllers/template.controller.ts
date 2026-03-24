import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from '@biopropose/database';
import { TemplateEntity } from '@biopropose/database';
import { AppError } from '../middleware/errorHandler';
import { parseTemplateFile } from '../services/templateUpload.service';

// ── Multer config ────────────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'templates');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(docx|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx and .pdf files are accepted'));
    }
  },
});

// ── Controller ───────────────────────────────────────────────────────────────
export const templateController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = AppDataSource.getRepository(TemplateEntity);
      const templates = await repo.find({ order: { name: 'ASC' } });
      res.json(templates);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = AppDataSource.getRepository(TemplateEntity);
      const template = await repo.findOne({ where: { id: req.params.id } });
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      res.json(template);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = AppDataSource.getRepository(TemplateEntity);
      const { name, businessUnit, category, description, sections, createdBy } = req.body;
      const t = repo.create({
        name,
        businessUnit,
        category: category ?? businessUnit,
        description,
        sectionsJson: JSON.stringify(sections ?? []),
        isSystem: false,
        createdBy,
      });
      const saved = await repo.save(t);
      res.status(201).json(saved);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = AppDataSource.getRepository(TemplateEntity);
      const template = await repo.findOne({ where: { id: req.params.id } });
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');

      const { name, businessUnit, category, description, sections } = req.body;
      if (name !== undefined) template.name = name;
      if (businessUnit !== undefined) template.businessUnit = businessUnit;
      if (category !== undefined) template.category = category;
      if (description !== undefined) template.description = description;
      if (sections !== undefined) template.sectionsJson = JSON.stringify(sections);

      const saved = await repo.save(template);
      res.json(saved);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = AppDataSource.getRepository(TemplateEntity);
      const template = await repo.findOne({ where: { id: req.params.id } });
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      if (template.isSystem) throw new AppError(403, 'System templates cannot be deleted', 'FORBIDDEN');
      await repo.remove(template);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  /**
   * POST /api/templates/upload
   * Accepts a .docx or .pdf file, parses it, and returns detected sections.
   * Does NOT save to DB — the frontend calls PUT/POST after user confirms.
   */
  uploadAndParse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'No file uploaded', 'BAD_REQUEST');

      const sections = await parseTemplateFile(req.file.path, req.file.mimetype);

      // Clean up temp file
      fs.unlink(req.file.path, () => {});

      res.json({
        originalName: req.file.originalname,
        detectedSections: sections,
        sectionCount: sections.filter((s) => {
          const content = s.defaultContent as any;
          return content?.content?.some((c: any) =>
            c?.content?.some((t: any) => t?.text?.trim()),
          );
        }).length,
      });
    } catch (err) { next(err); }
  },
};
