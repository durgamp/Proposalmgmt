export declare class TemplateEntity {
    id: string;
    name: string;
    businessUnit: string;
    category: string;
    description?: string;
    sectionsJson: string;
    get sections(): object[];
    set sections(val: object[]);
    isSystem: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Template.entity.d.ts.map