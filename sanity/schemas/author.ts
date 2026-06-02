import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g. Surf Writer, Editor',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'credentials',
      title: 'Credentials / Expertise',
      type: 'string',
      description: 'e.g. "20 years surfing, NSSIA Surf Instructor, surf writer since 2018" — used in structured data for E-E-A-T signals.',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description: 'Brief description of the person in the photo.',
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'avatar' },
  },
})
