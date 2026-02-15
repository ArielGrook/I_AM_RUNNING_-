/**
 * Puck config - components and categories.
 * Basic + sections + header. Custom fields (gradient, etc.) can be added later.
 */

'use client';

import React from 'react';
import type { Config } from '@puckeditor/core';

const bgColorOptions = [
  { label: 'Оранжевый', value: 'bg-gradient-to-r from-[#FF6B35] to-[#ff8555]' },
  { label: 'Фиолетовый', value: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' },
  { label: 'Синий', value: 'bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8]' },
  { label: 'Зеленый', value: 'bg-gradient-to-r from-[#10b981] to-[#059669]' },
];

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
      defaultProps: { text: 'Heading', level: 'h1' },
      render: (props: Record<string, unknown>) => {
        const text = (props.text as string) ?? 'Heading';
        const level = (props.level as string) ?? 'h1';
        const Tag = level === 'h2' ? 'h2' : level === 'h3' ? 'h3' : 'h1';
        return React.createElement(Tag, { className: 'text-4xl font-bold' }, text);
      },
    },
    TextBlock: {
      fields: {
        content: { type: 'textarea', label: 'Текст' },
        fontSize: {
          type: 'select',
          label: 'Размер',
          options: [
            { label: 'Маленький', value: 'text-sm' },
            { label: 'Обычный', value: 'text-base' },
            { label: 'Большой', value: 'text-lg' },
            { label: 'XL', value: 'text-xl' },
          ],
        },
        textAlign: {
          type: 'select',
          label: 'Выравнивание',
          options: [
            { label: 'Слева', value: 'text-left' },
            { label: 'Центр', value: 'text-center' },
            { label: 'Справа', value: 'text-right' },
          ],
        },
      },
      defaultProps: { content: 'Ваш текст здесь', fontSize: 'text-base', textAlign: 'text-left' },
      render: (props: Record<string, unknown>) => {
        const content = (props.content as string) ?? '';
        const fontSize = (props.fontSize as string) ?? 'text-base';
        const textAlign = (props.textAlign as string) ?? 'text-left';
        return (
          <div className={`py-4 ${fontSize} ${textAlign}`}>
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        );
      },
    },
    ImageBlock: {
      fields: {
        src: { type: 'text', label: 'URL картинки' },
        alt: { type: 'text', label: 'Alt текст' },
        width: {
          type: 'select',
          label: 'Ширина',
          options: [
            { label: 'Полная', value: 'w-full' },
            { label: '3/4', value: 'w-3/4' },
            { label: 'Половина', value: 'w-1/2' },
            { label: '1/3', value: 'w-1/3' },
          ],
        },
      },
      defaultProps: {
        src: 'https://via.placeholder.com/800x400',
        alt: 'Image',
        width: 'w-full',
      },
      render: (props: Record<string, unknown>) => {
        const src = (props.src as string) ?? '';
        const alt = (props.alt as string) ?? 'Image';
        const width = (props.width as string) ?? 'w-full';
        return (
          <div className="py-4">
            <img src={src} alt={alt} className={`${width} mx-auto rounded-lg block`} />
          </div>
        );
      },
    },
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        bgColor: {
          type: 'select',
          label: 'Background',
          options: bgColorOptions,
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
    Hero01: {
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Подзаголовок' },
        ctaText: { type: 'text', label: 'Текст кнопки' },
        bgColor: {
          type: 'select',
          label: 'Фон',
          options: bgColorOptions,
        },
      },
      defaultProps: {
        title: 'Создавайте сайты без кода',
        subtitle: 'Профессиональные сайты за минуты',
        ctaText: 'Начать бесплатно',
        bgColor: 'bg-gradient-to-r from-[#FF6B35] to-[#ff8555]',
      },
      render: (props: Record<string, unknown>) => {
        const title = (props.title as string) ?? '';
        const subtitle = (props.subtitle as string) ?? '';
        const ctaText = (props.ctaText as string) ?? '';
        const bgColor = (props.bgColor as string) ?? '';
        return (
          <section className={`${bgColor} py-24 md:py-32 text-center text-white`}>
            <div className="container mx-auto px-4">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">{title}</h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">{subtitle}</p>
              <button
                type="button"
                className="px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:shadow-xl transition"
              >
                {ctaText}
              </button>
            </div>
          </section>
        );
      },
    },
    Hero02: {
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Подзаголовок' },
        ctaText: { type: 'text', label: 'Текст кнопки' },
        imageUrl: { type: 'text', label: 'URL картинки' },
        bgColor: {
          type: 'select',
          label: 'Фон',
          options: bgColorOptions,
        },
      },
      defaultProps: {
        title: 'Ваш продукт — ваши правила',
        subtitle: 'Гибкие решения для любого бизнеса',
        ctaText: 'Узнать больше',
        imageUrl: 'https://via.placeholder.com/600x400',
        bgColor: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]',
      },
      render: (props: Record<string, unknown>) => {
        const title = (props.title as string) ?? '';
        const subtitle = (props.subtitle as string) ?? '';
        const ctaText = (props.ctaText as string) ?? '';
        const imageUrl = (props.imageUrl as string) ?? '';
        const bgColor = (props.bgColor as string) ?? '';
        return (
          <section className={`${bgColor} py-16 md:py-24 text-white`}>
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
                <p className="text-lg md:text-xl mb-6 opacity-90">{subtitle}</p>
                <button
                  type="button"
                  className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:shadow-xl transition"
                >
                  {ctaText}
                </button>
              </div>
              <div className="flex-1">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full max-w-md mx-auto rounded-lg shadow-xl"
                />
              </div>
            </div>
          </section>
        );
      },
    },
    Header01: {
      fields: {
        logo: { type: 'text', label: 'Лого (текст)' },
        navItems: {
          type: 'text',
          label: 'Навигация (через запятую)',
        },
      },
      defaultProps: {
        logo: 'Brand',
        navItems: 'Home, Features, Pricing, About, Contact',
      },
      render: (props: Record<string, unknown>) => {
        const logo = (props.logo as string) ?? 'Brand';
        const navItemsStr = (props.navItems as string) ?? '';
        const items = navItemsStr.split(',').map((s) => s.trim()).filter(Boolean);
        return (
          <header className="bg-gray-900 text-white py-4 sticky top-0 z-50">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-[#FF6B35]">{logo}</div>
              <nav className="flex gap-6">
                {items.map((item, i) => (
                  <a key={i} href="#" className="hover:text-[#FF6B35] transition">
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </header>
        );
      },
    },
    CTA01: {
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Подзаголовок' },
        buttonText: { type: 'text', label: 'Текст кнопки' },
        bgColor: {
          type: 'select',
          label: 'Фон',
          options: bgColorOptions,
        },
      },
      defaultProps: {
        title: 'Готовы начать?',
        subtitle: 'Присоединяйтесь к тысячам команд.',
        buttonText: 'Начать бесплатно',
        bgColor: 'bg-gradient-to-r from-[#FF6B35] to-[#ff8555]',
      },
      render: (props: Record<string, unknown>) => {
        const title = (props.title as string) ?? '';
        const subtitle = (props.subtitle as string) ?? '';
        const buttonText = (props.buttonText as string) ?? '';
        const bgColor = (props.bgColor as string) ?? '';
        return (
          <section className={`${bgColor} py-16 text-center text-white`}>
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
              <p className="text-lg mb-8 opacity-90">{subtitle}</p>
              <button
                type="button"
                className="px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:shadow-xl transition"
              >
                {buttonText}
              </button>
            </div>
          </section>
        );
      },
    },
  },
  categories: {
    basic: {
      title: 'Базовые',
      components: ['HeadingBlock', 'TextBlock', 'ImageBlock'],
    },
    sections: {
      title: 'Секции',
      components: ['Hero', 'Hero01', 'Hero02', 'CTA01'],
    },
    header: {
      title: 'Хедер',
      components: ['Header01'],
    },
  },
};

export default config;
