import type { CollectionConfig } from 'payload'

export const ResumeEntries: CollectionConfig = {
  slug: 'resumeEntries',
  labels: {
    singular: 'Resume Entry',
    plural: 'Resume Entries',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'sectionType', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'sectionType',
      type: 'select',
      options: [
        { label: 'Experience', value: 'experience' },
        { label: 'Education', value: 'education' },
        { label: 'Project', value: 'project' },
        { label: 'Skill', value: 'skill' },
      ],
      defaultValue: 'experience',
      required: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'url',
      type: 'text',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Lower values render before higher values.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'published',
      required: true,
    },
  ],
}
