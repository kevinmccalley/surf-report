import { defineField, defineType } from 'sanity'
import { getAllSpots, slugify } from '@/app/lib/surf-spots'

const SPOT_OPTIONS = getAllSpots()
  .map(s => ({ title: `${s.name} — ${s.country}`, value: slugify(s.name) }))
  .sort((a, b) => a.title.localeCompare(b.title))

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO & Meta' },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    // ── Content ───────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 3,
      description: 'Short summary shown in the blog index and as the meta description fallback.',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description: 'Describe the image. Required for accessibility.',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption (optional)',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'content',
      to: [{ type: 'author' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
    }),

    // ── SEO ───────────────────────────────────────────────────
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'seo',
      description: 'Overrides the post title in search results. Max 60 characters.',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      group: 'seo',
      rows: 3,
      description: 'Overrides the excerpt as the meta description. Max 160 characters.',
      validation: (Rule) => Rule.max(160),
    }),

    // ── Settings ──────────────────────────────────────────────
    defineField({
      name: 'surfSpots',
      title: 'Featured Surf Spots',
      type: 'array',
      group: 'settings',
      of: [{ type: 'string' }],
      options: { list: SPOT_OPTIONS },
      description: 'Tag the breaks featured in this post. Powers automatic links to/from climatology pages.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'settings',
      description: 'Set a future date to schedule the post. Leave blank to keep as draft.',
    }),
    defineField({
      name: 'translations',
      title: 'Translations',
      type: 'object',
      group: 'settings',
      description: 'Auto-generated. Use the "Translate to all languages" action — do not edit manually.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'es',   title: 'Español',           type: 'postTranslationContent' }),
        defineField({ name: 'fr',   title: 'Français',          type: 'postTranslationContent' }),
        defineField({ name: 'ptBR', title: 'Português (Brasil)', type: 'postTranslationContent' }),
        defineField({ name: 'ptPT', title: 'Português (PT)',     type: 'postTranslationContent' }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured post',
      type: 'boolean',
      group: 'settings',
      description: 'Featured posts appear as the hero card on the blog index.',
      initialValue: false,
    }),
  ],

  orderings: [
    {
      name: 'publishedAtDesc',
      title: 'Published date (newest first)',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      name: 'publishedAtAsc',
      title: 'Published date (oldest first)',
      by: [{ field: 'publishedAt', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      title: 'title',
      authorName: 'author.name',
      publishedAt: 'publishedAt',
      media: 'coverImage',
    },
    prepare({ title, authorName, publishedAt, media }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Unpublished'
      return { title, subtitle: `${authorName ?? 'No author'} · ${date}`, media }
    },
  },
})
