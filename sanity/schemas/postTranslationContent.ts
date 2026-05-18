import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'postTranslationContent',
  title: 'Post Translation',
  type: 'object',
  fields: [
    defineField({ name: 'title',          title: 'Title',           type: 'string' }),
    defineField({ name: 'excerpt',        title: 'Excerpt',         type: 'text',   rows: 3 }),
    defineField({ name: 'body',           title: 'Body',            type: 'blockContent' }),
    defineField({ name: 'seoTitle',       title: 'SEO title',       type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text',   rows: 3 }),
  ],
})
