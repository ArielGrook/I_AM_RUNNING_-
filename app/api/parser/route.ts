import { NextRequest, NextResponse } from 'next/server';
import { parseZip, validateProject, ZipParseError } from '@/lib/parser';
import { buildZip, exportProjectJson } from '@/lib/parser/builder';
import { ProjectSchema } from '@/lib/types/project';

// Parse ZIP file endpoint
export async function POST(request: NextRequest) {
  console.log('[API Parser] 🚀 POST /api/parser called');
  
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log('[API Parser] 📋 Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('[API Parser] ✅ Processing multipart/form-data...');
      
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      console.log('[API Parser] 📦 File extracted:', {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type
      });
      
      if (!file) {
        console.error('[API Parser] ❌ No file provided');
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      // Check file type
      if (!file.name.endsWith('.zip')) {
        console.error('[API Parser] ❌ Invalid file type:', file.name);
        return NextResponse.json(
          { error: 'File must be a ZIP archive' },
          { status: 400 }
        );
      }
      
      // Check file size (max 50MB - Stage 2 Module 4 enhancement)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        console.error('[API Parser] ❌ File size exceeded:', file.size);
        return NextResponse.json(
          { 
            error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
            code: 'SIZE_EXCEEDED'
          },
          { status: 400 }
        );
      }
      
      console.log('[API Parser] ✅ File validation passed, converting to ArrayBuffer...');
      // Parse the ZIP file with enhanced error handling
      const buffer = await file.arrayBuffer();
      console.log('[API Parser] 📦 Buffer size:', buffer.byteLength);
      
      // Capture parser logs for debugging (server logs visible in browser)
      const parserLogs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;
      
      // Intercept console logs to capture parser output
      const interceptedLog = (...args: any[]) => {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        parserLogs.push(`[LOG] ${message}`);
        originalConsoleLog.apply(console, args);
      };
      
      const interceptedWarn = (...args: any[]) => {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        parserLogs.push(`[WARN] ${message}`);
        originalConsoleWarn.apply(console, args);
      };
      
      const interceptedError = (...args: any[]) => {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        parserLogs.push(`[ERROR] ${message}`);
        originalConsoleError.apply(console, args);
      };
      
      // Replace console functions during parsing
      console.log = interceptedLog;
      console.warn = interceptedWarn;
      console.error = interceptedError;
      
      let result;
      try {
        console.log('[API Parser] 🔄 Calling parseZip()...');
        result = await parseZip(buffer, {
          maxSize,
          // Progress callback not used in API route (would need WebSockets/SSE)
          // Client-side parsing would provide better UX
        });
        
        const totalComponents = result.project.pages.reduce((sum, page) => sum + (page.components?.length || 0), 0);
        
        console.log('[API Parser] ✅ ZIP parsed successfully:', {
          pagesCount: result.project.pages.length,
          componentsCount: totalComponents,
          processingTime: result.metadata.processingTime,
          pagesDetails: result.project.pages.map((page, idx) => ({
            index: idx,
            name: page.name,
            componentsCount: page.components?.length || 0
          }))
        });
        
        // Update metadata with original filename
        result.metadata.originalFileName = file.name;
        
        // Collect detailed debug info with parser logs
        const debugInfo = {
          htmlFilesProcessed: result.project.pages.length,
          totalComponentsExtracted: totalComponents,
          parserLogs: parserLogs.slice(-50), // Last 50 parser logs (visible in browser!)
          parserLogsCount: parserLogs.length,
          componentsPerPage: result.project.pages.map(page => ({
            pageName: page.name,
            componentsCount: page.components?.length || 0,
            componentsPreview: page.components?.slice(0, 3).map(c => ({
              type: c.type,
              category: c.category,
              hasHtml: !!c.props?.html,
              htmlLength: c.props?.html?.length || 0,
              htmlPreview: c.props?.html?.substring(0, 150) || 'EMPTY'
            })) || []
          })),
          projectStructure: {
            pages: result.project.pages.map((page, idx) => ({
              index: idx,
              name: page.name,
              slug: page.slug,
              componentsCount: page.components?.length || 0,
              hasStyles: !!page.styles && page.styles.length > 0,
              stylesLength: page.styles?.length || 0
            }))
          }
        };
        
        console.log('[API Parser] 📊 Debug info:', JSON.stringify(debugInfo, null, 2));
        console.log('[API Parser] ✅ Returning project to client...');
        
        return NextResponse.json({
          success: true,
          project: result.project,
          metadata: result.metadata,
          debug: debugInfo // Include debug info with parser logs for client-side debugging
        });
      } catch (error) {
        console.error('[API Parser] ❌ parseZip() error:', error);
        
        // Handle ZipParseError with specific error codes
        if (error instanceof ZipParseError) {
          console.error('[API Parser] ❌ ZipParseError:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
          
          const errorMessages: Record<string, string> = {
            SIZE_EXCEEDED: 'File size exceeds maximum allowed size',
            INVALID_FORMAT: 'Invalid or corrupted ZIP file format',
            CORRUPTED: 'Failed to load ZIP file',
            UNSUPPORTED: 'Unsupported file format',
            UNKNOWN: 'Failed to process file',
          };
          
          return NextResponse.json(
            {
              error: errorMessages[error.code] || error.message,
              code: error.code,
              details: error.details,
              debug: {
                parserLogs: parserLogs.slice(-50),
                parserLogsCount: parserLogs.length
              }
            },
            { status: 400 }
          );
        }
        
        // Re-throw for generic error handling below
        throw error;
      } finally {
        // Always restore original console functions
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
      }
      
    } else if (contentType?.includes('application/json')) {
      // Handle project JSON for building
      const body = await request.json();
      
      // Validate project structure
      const project = ProjectSchema.parse(body.project);
      
      // Build ZIP file
      const zipBuffer = await buildZip(project);
      
      // Return ZIP file as response
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}.zip"`
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid content type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[API Parser] ❌ Fatal error:', error);
    console.error('[API Parser] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export project as JSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const format = searchParams.get('format') || 'json';
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, fetch project from database
    // For now, return a sample response
    return NextResponse.json({
      error: 'Project fetching not yet implemented',
      tip: 'Use POST with project data to build ZIP'
    }, { status: 501 });
    
  } catch (error) {
    console.error('Export API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

