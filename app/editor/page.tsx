'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Download, Upload } from 'lucide-react';
import Link from 'next/link';

export default function EditorPage() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="font-semibold text-lg">New Project</h1>
          <span className="text-sm text-gray-500">● Unsaved</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </header>
      
      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Components */}
        <div className={`transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <div className="h-full bg-white border-r">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg mb-3">Components</h3>
              <div className="flex flex-wrap gap-1">
                <button className="px-3 py-1 text-xs rounded-full bg-primary text-white">
                  Header
                </button>
                <button className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200">
                  Hero
                </button>
                <button className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200">
                  Footer
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                <div className="border rounded-lg p-3 hover:border-primary cursor-move transition group">
                  <div className="aspect-video bg-gray-50 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400">Header</span>
                  </div>
                  <h4 className="font-medium text-sm">Minimal Header</h4>
                  <p className="text-xs text-gray-500 mt-1">Clean header with logo and navigation</p>
                </div>
                
                <div className="border rounded-lg p-3 hover:border-primary cursor-move transition group">
                  <div className="aspect-video bg-gray-50 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400">Hero</span>
                  </div>
                  <h4 className="font-medium text-sm">Hero Section</h4>
                  <p className="text-xs text-gray-500 mt-1">Eye-catching hero with call-to-action</p>
                </div>
                
                <div className="border rounded-lg p-3 hover:border-primary cursor-move transition group">
                  <div className="aspect-video bg-gray-50 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400">Footer</span>
                  </div>
                  <h4 className="font-medium text-sm">Minimal Footer</h4>
                  <p className="text-xs text-gray-500 mt-1">Clean footer with links and copyright</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toggle Left Panel */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="w-6 bg-white border-y border-r hover:bg-gray-50 flex items-center justify-center"
        >
          {leftPanelOpen ? '←' : '→'}
        </button>
        
        {/* Center - Canvas */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building</h3>
              <p className="text-gray-600 mb-4">Drag components from the left panel to start building your website</p>
              <Button>Create New Project</Button>
            </div>
          </div>
        </div>
        
        {/* Toggle Right Panel */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="w-6 bg-white border-y border-l hover:bg-gray-50 flex items-center justify-center"
        >
          {rightPanelOpen ? '→' : '←'}
        </button>
        
        {/* Right Panel - Properties */}
        <div className={`transition-all duration-300 ${rightPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <div className="h-full bg-white border-l">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Properties</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Background</label>
                <input type="color" className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className="text-sm font-medium">Text Color</label>
                <input type="color" className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className="text-sm font-medium">Padding</label>
                <input type="range" className="w-full" min="0" max="100" />
              </div>
              <div>
                <label className="text-sm font-medium">Margin</label>
                <input type="range" className="w-full" min="0" max="100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










