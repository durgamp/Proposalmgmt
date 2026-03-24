import { Router } from 'express';
import { templateController, upload } from '../controllers/template.controller';

const router = Router();

router.get('/', templateController.list);
router.get('/:id', templateController.getById);
router.post('/', templateController.create);
router.put('/:id', templateController.update);
router.delete('/:id', templateController.delete);
router.post('/upload', upload.single('file'), templateController.uploadAndParse);

export default router;
