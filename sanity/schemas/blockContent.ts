import { defineArrayMember, defineType } from 'sanity'

export default defineType({
  name: 'blockContent',
  title: 'Block Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Blockquote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href', type: 'url', title: 'URL' },
              {
                name: 'blank',
                type: 'boolean',
                title: 'Open in new tab',
                initialValue: true,
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description: 'Describe the image for screen readers and SEO.',
          validation: (Rule) => Rule.required().warning('Alt text is required for accessibility.'),
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption (optional)',
        },
      ],
    }),
    defineArrayMember({
      name: 'codeBlock',
      type: 'object',
      title: 'Code block',
      fields: [
        {
          name: 'language',
          type: 'string',
          title: 'Language',
          options: {
            list: [
              { title: 'JavaScript', value: 'javascript' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'HTML', value: 'html' },
              { title: 'CSS', value: 'css' },
              { title: 'Bash / Shell', value: 'bash' },
              { title: 'Plain text', value: 'text' },
            ],
          },
          initialValue: 'text',
        },
        {
          name: 'filename',
          type: 'string',
          title: 'Filename (optional)',
          description: 'e.g. next.config.mjs',
        },
        {
          name: 'code',
          type: 'text',
          title: 'Code',
        },
      ],
      preview: {
        select: { language: 'language', filename: 'filename', code: 'code' },
        prepare({ language, filename, code }) {
          return {
            title: filename ?? `Code block (${language ?? 'text'})`,
            subtitle: code?.slice(0, 60),
          }
        },
      },
    }),
    defineArrayMember({
      name: 'callout',
      type: 'object',
      title: 'Callout',
      fields: [
        {
          name: 'type',
          type: 'string',
          title: 'Type',
          options: {
            list: [
              { title: 'Info', value: 'info' },
              { title: 'Tip', value: 'tip' },
              { title: 'Warning', value: 'warning' },
              { title: 'Important', value: 'important' },
            ],
            layout: 'radio',
          },
          initialValue: 'info',
        },
        {
          name: 'content',
          type: 'text',
          title: 'Content',
        },
      ],
      preview: {
        select: { type: 'type', content: 'content' },
        prepare({ type, content }) {
          const icons: Record<string, string> = { info: 'ℹ️', tip: '💡', warning: '⚠️', important: '🔴' }
          return { title: `${icons[type] ?? ''} ${type ?? 'Callout'}`, subtitle: content?.slice(0, 60) }
        },
      },
    }),
  ],
})
