/**
 * Minimal Puck config - clean slate.
 * Basic components only. Custom fields (gradient, etc.) can be added later.
 */

'use client';

import React from 'react';
import type { Config } from '@puckeditor/core';

const config: Config = {
  components: {
    HeadingBlock: {
      fields: {
        text: { type: 'text', label: 'Text' },
        level: {
          type: 'select',
          label: 'Level',
          options: [
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
          ],
        },
      },
      defaultProps: {
        text: 'Heading',
        level: 'h1',
      },
      render: (props: Record<string, unknown>) => {
        const text = (props.text as string) ?? 'Heading';
        const level = (props.level as string) ?? 'h1';
        const Tag = level === 'h2' ? 'h2' : level === 'h3' ? 'h3' : 'h1';
        return React.createElement(Tag, { className: 'text-4xl font-bold' }, text);
      },
    },
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        bgColor: {
          type: 'select',
          label: 'Background',
          options: [
            { label: 'Orange', value: 'bg-gradient-to-r from-[#FF6B35] to-[#ff8555]' },
            { label: 'Purple', value: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' },
          ],
        },
      },
      defaultProps: {
        title: 'Welcome',
        subtitle: 'Build beautiful websites',
        bgColor: 'bg-gradient-to-r from-[#FF6B35] to-[#ff8555]',
      },
      render: (props: Record<string, unknown>) => {
        const title = (props.title as string) ?? 'Welcome';
        const subtitle = (props.subtitle as string) ?? '';
        const bgColor = (props.bgColor as string) ?? '';
        return (
          <section className={`${bgColor} py-24 text-center text-white`}>
            <h1 className="text-6xl font-bold mb-4">{title}</h1>
            <p className="text-xl">{subtitle}</p>
          </section>
        );
      },
    },
  },
  categories: {
    basic: { title: 'Basic', components: ['HeadingBlock'] },
    sections: { title: 'Sections', components: ['Hero'] },
  },
};

export default config;
