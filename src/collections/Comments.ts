import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'status', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true, // Allow public creation for now (guests)
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Comment content',
      },
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: ['posts', 'projects'],
      required: true,
      hasMany: false,
      admin: {
        description: 'The post or project this comment belongs to',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      hasMany: false,
      filterOptions: ({ data }) => {
        // Only apply filter when we have document context
        if (data?.doc) {
          return {
            'doc.relationTo': {
              equals: data.doc.relationTo,
            },
            'doc.value': {
              equals: data.doc.value,
            },
          }
        }
        return true
      },
      admin: {
        description: 'Parent comment for threaded replies',
      },
    },
    {
      name: 'author',
      type: 'group',
      label: 'Author Info',
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          hasMany: false,
          admin: {
            description: 'Linked registered user (optional)',
          },
        },
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'Guest name (if not logged in)',
          },
        },
        {
          name: 'email',
          type: 'email',
          admin: {
            description: 'Guest email (private, for notifications/gravatar)',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Pending', value: 'pending' },
        { label: 'Spam', value: 'spam' },
      ],
      defaultValue: 'published',
      required: true,
    },
  ],
}
