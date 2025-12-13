'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Globe, Code, Palette, Rocket, MousePointerClick } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Orange/Red Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-red-600">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Website Builder
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
              Build Stunning Websites
              <br />
              <span className="bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                with AI
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-orange-50 mb-10 max-w-3xl mx-auto font-light animate-slide-up-delay">
              No code required. Just describe what you want and watch your website come to life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay">
              <Button 
                asChild 
                size="lg" 
                className="text-lg px-10 py-6 bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Link href="/editor">
                  Start Building Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-10 py-6 bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Build
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features that make website creation effortless
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: AI-Powered */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                Describe your vision and watch AI create beautiful, responsive websites instantly.
              </p>
            </div>
            
            {/* Feature 2: Drag & Drop */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <MousePointerClick className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Drag & Drop Editor</h3>
              <p className="text-gray-600 leading-relaxed">
                Intuitive visual editor with professional components ready to use.
              </p>
            </div>
            
            {/* Feature 3: Responsive */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fully Responsive</h3>
              <p className="text-gray-600 leading-relaxed">
                Your websites look perfect on desktop, tablet, and mobile devices automatically.
              </p>
            </div>
            
            {/* Feature 4: Export & Deploy */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center mb-6">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Export & Deploy</h3>
              <p className="text-gray-600 leading-relaxed">
                Export clean code or deploy directly. Your project, your way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Build your website in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Describe</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Tell our AI what you want to build. Be as detailed or as simple as you like.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Generate</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Watch as AI creates your website structure with beautiful components.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customize</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Fine-tune every detail with our intuitive drag-and-drop editor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-500 via-red-500 to-red-600 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your Website?
          </h2>
          <p className="text-xl md:text-2xl text-orange-50 mb-10 max-w-2xl mx-auto font-light">
            Join thousands of creators building amazing websites with AI. Start free, no credit card required.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="text-lg px-12 py-7 bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
          >
            <Link href="/editor">
              Start Building Free
              <ArrowRight className="ml-2 w-6 h-6" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              I AM RUNNING
            </h3>
            <p className="text-gray-400 mb-8 text-lg">
              The future of web design is here. Build with AI.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors duration-200">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors duration-200">Terms</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors duration-200">Support</a>
            </div>
            <p className="text-gray-500">
              &copy; 2024 I AM RUNNING. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}










