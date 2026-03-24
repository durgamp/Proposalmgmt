"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const data_source_1 = require("./data-source");
const Template_entity_1 = require("./entities/Template.entity");
const DEFAULT_TEMPLATES = [
    {
        name: 'Biologics Drug Substance (DS)',
        description: 'Standard proposal template for mAb/recombinant protein drug substance manufacturing',
        businessUnit: 'Biologics',
        category: 'Biologics DS',
        sections: [
            {
                sectionKey: 'ceo_letter',
                title: 'CEO Letter',
                sortOrder: 0,
                defaultContent: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Dear [Client Name],' }],
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'We are pleased to present this proposal for [Project Name]...' }],
                        },
                    ],
                },
            },
            {
                sectionKey: 'executive_summary',
                title: 'Executive Summary',
                sortOrder: 1,
                defaultContent: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'This proposal outlines our approach to [Project Name]...' }],
                        },
                    ],
                },
            },
            { sectionKey: 'scope_of_work', title: 'Scope of Work', sortOrder: 2, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'project_details', title: 'Project Details', sortOrder: 3, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'terms_conditions', title: 'Terms & Conditions', sortOrder: 4, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
        ],
    },
    {
        name: 'Biologics Drug Product (DP)',
        description: 'Template for fill-finish and drug product manufacturing proposals',
        businessUnit: 'Biologics',
        category: 'Biologics DP',
        sections: [
            { sectionKey: 'ceo_letter', title: 'CEO Letter', sortOrder: 0, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'executive_summary', title: 'Executive Summary', sortOrder: 1, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'scope_of_work', title: 'Scope of Work', sortOrder: 2, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'project_details', title: 'Project Details', sortOrder: 3, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'terms_conditions', title: 'Terms & Conditions', sortOrder: 4, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
        ],
    },
    {
        name: 'Analytical Services',
        description: 'Template for analytical testing and characterization proposals',
        businessUnit: 'Analytical',
        category: 'Analytical Only',
        sections: [
            { sectionKey: 'ceo_letter', title: 'CEO Letter', sortOrder: 0, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'executive_summary', title: 'Executive Summary', sortOrder: 1, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'scope_of_work', title: 'Scope of Work', sortOrder: 2, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
            { sectionKey: 'terms_conditions', title: 'Terms & Conditions', sortOrder: 4, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
        ],
    },
];
async function runSeed() {
    const templateRepo = data_source_1.AppDataSource.getRepository(Template_entity_1.TemplateEntity);
    const count = await templateRepo.count();
    if (count > 0) {
        // Already seeded
        return;
    }
    for (const tmpl of DEFAULT_TEMPLATES) {
        const entity = templateRepo.create({
            name: tmpl.name,
            description: tmpl.description,
            businessUnit: tmpl.businessUnit,
            category: tmpl.category,
            isSystem: true,
            createdBy: 'system',
        });
        entity.sections = tmpl.sections;
        await templateRepo.save(entity);
    }
    console.log('[Seed] Templates seeded successfully');
}
//# sourceMappingURL=seed.js.map