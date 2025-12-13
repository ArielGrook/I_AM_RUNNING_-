import { Component, Category, StyleVariant } from '@/lib/types/project';
import { v4 as uuidv4 } from 'uuid';

interface ComponentTemplate {
  id: string;
  name: string;
  category: Category;
  description: string;
  thumbnail?: string;
  variants: Record<StyleVariant, string>; // HTML for each style variant
  defaultProps?: Record<string, any>;
}

// Header Components
const headerTemplates: ComponentTemplate[] = [
  {
    id: 'header-minimal',
    name: 'Minimal Header',
    category: 'header',
    description: 'Clean header with logo and navigation',
    variants: {
      minimal: `
        <header class="w-full bg-white border-b border-gray-200">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div class="flex items-center">
                <span class="text-2xl font-bold">Logo</span>
              </div>
              <nav class="hidden md:flex space-x-8">
                <a href="#" class="text-gray-700 hover:text-gray-900">Home</a>
                <a href="#" class="text-gray-700 hover:text-gray-900">About</a>
                <a href="#" class="text-gray-700 hover:text-gray-900">Services</a>
                <a href="#" class="text-gray-700 hover:text-gray-900">Contact</a>
              </nav>
              <button class="md:hidden">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </header>`,
      modern: `
        <header class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div class="flex items-center space-x-2">
                <div class="w-10 h-10 bg-white rounded-full"></div>
                <span class="text-2xl font-bold">Brand</span>
              </div>
              <nav class="hidden md:flex space-x-8">
                <a href="#" class="text-white/90 hover:text-white transition">Home</a>
                <a href="#" class="text-white/90 hover:text-white transition">About</a>
                <a href="#" class="text-white/90 hover:text-white transition">Services</a>
                <a href="#" class="text-white/90 hover:text-white transition">Contact</a>
              </nav>
              <button class="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                Get Started
              </button>
            </div>
          </div>
        </header>`,
      classic: `
        <header class="w-full bg-gray-900 text-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <div class="flex items-center">
                <h1 class="text-xl font-serif">Company Name</h1>
              </div>
              <nav class="flex space-x-6">
                <a href="#" class="text-gray-300 hover:text-white">Home</a>
                <a href="#" class="text-gray-300 hover:text-white">About</a>
                <a href="#" class="text-gray-300 hover:text-white">Services</a>
                <a href="#" class="text-gray-300 hover:text-white">Portfolio</a>
                <a href="#" class="text-gray-300 hover:text-white">Contact</a>
              </nav>
            </div>
          </div>
        </header>`,
      bold: `
        <header class="w-full bg-black text-white relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20"></div>
          <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-8">
              <div class="text-3xl font-black tracking-tighter">BRAND</div>
              <nav class="flex space-x-8 text-lg font-bold">
                <a href="#" class="hover:text-red-400 transition">HOME</a>
                <a href="#" class="hover:text-red-400 transition">ABOUT</a>
                <a href="#" class="hover:text-red-400 transition">WORK</a>
                <a href="#" class="hover:text-red-400 transition">CONTACT</a>
              </nav>
            </div>
          </div>
        </header>`,
      elegant: `
        <header class="w-full bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-8">
              <div class="text-2xl font-light tracking-widest text-gray-800">ELEGANCE</div>
              <nav class="flex space-x-12 text-sm tracking-wider text-gray-600">
                <a href="#" class="hover:text-gray-900 transition">HOME</a>
                <a href="#" class="hover:text-gray-900 transition">COLLECTION</a>
                <a href="#" class="hover:text-gray-900 transition">ABOUT</a>
                <a href="#" class="hover:text-gray-900 transition">CONTACT</a>
              </nav>
            </div>
          </div>
        </header>`,
      playful: `
        <header class="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span class="text-2xl">🎨</span>
                </div>
                <span class="text-2xl font-bold">Creative</span>
              </div>
              <nav class="hidden md:flex space-x-8">
                <a href="#" class="text-white/90 hover:text-white transition">Home</a>
                <a href="#" class="text-white/90 hover:text-white transition">Gallery</a>
                <a href="#" class="text-white/90 hover:text-white transition">About</a>
                <a href="#" class="text-white/90 hover:text-white transition">Contact</a>
              </nav>
            </div>
          </div>
        </header>`
    }
  }
];

// Hero Components
const heroTemplates: ComponentTemplate[] = [
  {
    id: 'hero-minimal',
    name: 'Minimal Hero',
    category: 'hero',
    description: 'Clean hero section with call-to-action',
    variants: {
      minimal: `
        <section class="py-20 bg-white">
          <div class="max-w-4xl mx-auto text-center px-4">
            <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Build Something Amazing
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create beautiful websites with our AI-powered builder. No coding required.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button class="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition">
                Get Started
              </button>
              <button class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition">
                Learn More
              </button>
            </div>
          </div>
        </section>`,
      modern: `
        <section class="py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div class="max-w-6xl mx-auto px-4">
            <div class="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                  The Future of
                  <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Web Design
                  </span>
                </h1>
                <p class="text-xl text-gray-600 mb-8">
                  Create stunning websites in minutes with our AI-powered design system.
                </p>
                <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition">
                  Start Building
                </button>
              </div>
              <div class="relative">
                <div class="w-full h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-2xl"></div>
              </div>
            </div>
          </div>
        </section>`,
      classic: `
        <section class="py-20 bg-gray-50">
          <div class="max-w-4xl mx-auto text-center px-4">
            <h1 class="text-4xl md:text-5xl font-serif text-gray-900 mb-6">
              Welcome to Excellence
            </h1>
            <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We deliver premium solutions with attention to detail and timeless design.
            </p>
            <button class="bg-gray-900 text-white px-10 py-4 text-lg font-medium hover:bg-gray-800 transition">
              Discover More
            </button>
          </div>
        </section>`,
      bold: `
        <section class="py-32 bg-black text-white relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-red-600/30 to-orange-600/30"></div>
          <div class="relative max-w-6xl mx-auto px-4 text-center">
            <h1 class="text-6xl md:text-8xl font-black mb-8 tracking-tighter">
              BREAK THE
              <span class="text-red-500">RULES</span>
            </h1>
            <p class="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Create websites that stand out from the crowd with bold, innovative design.
            </p>
            <button class="bg-red-600 text-white px-12 py-6 text-xl font-bold hover:bg-red-700 transition">
              START NOW
            </button>
          </div>
        </section>`,
      elegant: `
        <section class="py-32 bg-white">
          <div class="max-w-5xl mx-auto px-4 text-center">
            <h1 class="text-5xl md:text-6xl font-light text-gray-900 mb-8 tracking-wide">
              Sophisticated Design
            </h1>
            <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the perfect blend of elegance and functionality in every pixel.
            </p>
            <button class="border-2 border-gray-900 text-gray-900 px-12 py-4 text-lg font-light tracking-wider hover:bg-gray-900 hover:text-white transition">
              EXPLORE COLLECTION
            </button>
          </div>
        </section>`,
      playful: `
        <section class="py-24 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
          <div class="max-w-5xl mx-auto px-4 text-center">
            <div class="text-6xl mb-6">🎉</div>
            <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Let's Create Something
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                Amazing!
              </span>
            </h1>
            <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Turn your wildest ideas into beautiful, functional websites with our creative tools.
            </p>
            <button class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition">
              Start Creating 🚀
            </button>
          </div>
        </section>`
    }
  }
];

// Footer Components
const footerTemplates: ComponentTemplate[] = [
  {
    id: 'footer-minimal',
    name: 'Minimal Footer',
    category: 'footer',
    description: 'Clean footer with links and copyright',
    variants: {
      minimal: `
        <footer class="bg-white border-t border-gray-200">
          <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid md:grid-cols-4 gap-8">
              <div>
                <h3 class="text-lg font-semibold mb-4">Company</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">About</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Contact</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Product</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Features</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Pricing</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Support</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Legal</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Privacy</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Terms</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Cookies</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Connect</h3>
                <div class="flex space-x-4">
                  <a href="#" class="text-gray-600 hover:text-gray-900">Twitter</a>
                  <a href="#" class="text-gray-600 hover:text-gray-900">LinkedIn</a>
                  <a href="#" class="text-gray-600 hover:text-gray-900">GitHub</a>
                </div>
              </div>
            </div>
            <div class="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
            </div>
          </div>
        </footer>`,
      modern: `
        <footer class="bg-gray-900 text-white">
          <div class="max-w-7xl mx-auto px-4 py-12">
            <div class="grid md:grid-cols-4 gap-8">
              <div>
                <h3 class="text-xl font-bold mb-4">Brand</h3>
                <p class="text-gray-400 mb-4">Building the future of web design.</p>
                <div class="flex space-x-4">
                  <a href="#" class="text-gray-400 hover:text-white">Twitter</a>
                  <a href="#" class="text-gray-400 hover:text-white">LinkedIn</a>
                  <a href="#" class="text-gray-400 hover:text-white">GitHub</a>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Product</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">Features</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">Pricing</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">API</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Company</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">About</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">Blog</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Support</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">Help Center</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">Contact</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">Status</a></li>
                </ul>
              </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Brand. All rights reserved.</p>
            </div>
          </div>
        </footer>`,
      classic: `
        <footer class="bg-gray-100">
          <div class="max-w-6xl mx-auto px-4 py-12">
            <div class="grid md:grid-cols-3 gap-8">
              <div>
                <h3 class="text-lg font-serif mb-4">Company Name</h3>
                <p class="text-gray-600 mb-4">Established 2024</p>
                <p class="text-gray-600">Delivering excellence in every project.</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Home</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Services</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Portfolio</a></li>
                  <li><a href="#" class="text-gray-600 hover:text-gray-900">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Contact Info</h3>
                <p class="text-gray-600">Email: info@company.com</p>
                <p class="text-gray-600">Phone: (555) 123-4567</p>
              </div>
            </div>
            <div class="border-t border-gray-300 mt-8 pt-8 text-center text-gray-600">
              <p>&copy; 2024 Company Name. All rights reserved.</p>
            </div>
          </div>
        </footer>`,
      bold: `
        <footer class="bg-black text-white">
          <div class="max-w-7xl mx-auto px-4 py-16">
            <div class="text-center mb-12">
              <h2 class="text-4xl font-black mb-4">BRAND</h2>
              <p class="text-gray-400 text-lg">MAKING THE IMPOSSIBLE POSSIBLE</p>
            </div>
            <div class="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <h3 class="text-lg font-bold mb-4 text-red-500">PRODUCT</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">FEATURES</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">PRICING</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">API</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-bold mb-4 text-red-500">COMPANY</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">ABOUT</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">BLOG</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">CAREERS</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-bold mb-4 text-red-500">SUPPORT</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">HELP</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">CONTACT</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">STATUS</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-bold mb-4 text-red-500">CONNECT</h3>
                <div class="flex justify-center space-x-4">
                  <a href="#" class="text-gray-400 hover:text-white">TWITTER</a>
                  <a href="#" class="text-gray-400 hover:text-white">LINKEDIN</a>
                  <a href="#" class="text-gray-400 hover:text-white">GITHUB</a>
                </div>
              </div>
            </div>
            <div class="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; 2024 BRAND. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </footer>`,
      elegant: `
        <footer class="bg-white border-t border-gray-200">
          <div class="max-w-6xl mx-auto px-4 py-16">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-light tracking-widest text-gray-800 mb-4">ELEGANCE</h2>
              <p class="text-gray-600">Sophisticated design for discerning clients</p>
            </div>
            <div class="grid md:grid-cols-3 gap-12 text-center">
              <div>
                <h3 class="text-sm font-semibold tracking-wider text-gray-800 mb-6">COLLECTION</h3>
                <ul class="space-y-3 text-sm text-gray-600">
                  <li><a href="#" class="hover:text-gray-900 transition">Portfolio</a></li>
                  <li><a href="#" class="hover:text-gray-900 transition">Gallery</a></li>
                  <li><a href="#" class="hover:text-gray-900 transition">Exhibitions</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-sm font-semibold tracking-wider text-gray-800 mb-6">SERVICES</h3>
                <ul class="space-y-3 text-sm text-gray-600">
                  <li><a href="#" class="hover:text-gray-900 transition">Consultation</a></li>
                  <li><a href="#" class="hover:text-gray-900 transition">Design</a></li>
                  <li><a href="#" class="hover:text-gray-900 transition">Implementation</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-sm font-semibold tracking-wider text-gray-800 mb-6">CONNECT</h3>
                <ul class="space-y-3 text-sm text-gray-600">
                  <li><a href="#" class="hover:text-gray-900 transition">Instagram</a></li>
                  <li><a href="#" class="hover:text-gray-900 transition">Pinterest</a></li>
                  <li><a href="#" class="hover:text-gray-900 transition">Contact</a></li>
                </ul>
              </div>
            </div>
            <div class="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-500">
              <p>&copy; 2024 ELEGANCE. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </footer>`,
      playful: `
        <footer class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
          <div class="max-w-6xl mx-auto px-4 py-16">
            <div class="text-center mb-12">
              <div class="text-4xl mb-4">🎨</div>
              <h2 class="text-3xl font-bold mb-4">Creative Studio</h2>
              <p class="text-pink-100">Where imagination meets innovation</p>
            </div>
            <div class="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <h3 class="text-lg font-semibold mb-4">🎯 Services</h3>
                <ul class="space-y-2 text-pink-100">
                  <li><a href="#" class="hover:text-white transition">Design</a></li>
                  <li><a href="#" class="hover:text-white transition">Development</a></li>
                  <li><a href="#" class="hover:text-white transition">Branding</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">🚀 Projects</h3>
                <ul class="space-y-2 text-pink-100">
                  <li><a href="#" class="hover:text-white transition">Portfolio</a></li>
                  <li><a href="#" class="hover:text-white transition">Case Studies</a></li>
                  <li><a href="#" class="hover:text-white transition">Testimonials</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">💡 Resources</h3>
                <ul class="space-y-2 text-pink-100">
                  <li><a href="#" class="hover:text-white transition">Blog</a></li>
                  <li><a href="#" class="hover:text-white transition">Tutorials</a></li>
                  <li><a href="#" class="hover:text-white transition">Freebies</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">🌟 Connect</h3>
                <div class="flex justify-center space-x-4">
                  <a href="#" class="text-pink-100 hover:text-white transition">Twitter</a>
                  <a href="#" class="text-pink-100 hover:text-white transition">Instagram</a>
                  <a href="#" class="text-pink-100 hover:text-white transition">Dribbble</a>
                </div>
              </div>
            </div>
            <div class="border-t border-pink-300 mt-12 pt-8 text-center text-pink-100">
              <p>&copy; 2024 Creative Studio. Made with ❤️ and lots of ☕</p>
            </div>
          </div>
        </footer>`
    }
  }
];

// Combine all templates
export const componentCatalog: ComponentTemplate[] = [
  ...headerTemplates,
  ...heroTemplates,
  ...footerTemplates
];

// Get all available categories
export function getAllCategories(): Category[] {
  return Array.from(new Set(componentCatalog.map(template => template.category)));
}

// Get components by category
export function getComponentsByCategory(category: Category): ComponentTemplate[] {
  return componentCatalog.filter(template => template.category === category);
}

// Create component from template
export function createComponentFromTemplate(templateId: string, style: StyleVariant): Component | null {
  const template = componentCatalog.find(t => t.id === templateId);
  if (!template) return null;

  return {
    id: uuidv4(),
    type: template.category,
    category: template.category,
    props: {
      html: template.variants[style] || template.variants.minimal,
      templateId,
      variant: style
    }
  };
}

// Get component template by ID
export function getComponentTemplate(templateId: string): ComponentTemplate | null {
  return componentCatalog.find(t => t.id === templateId) || null;
}



