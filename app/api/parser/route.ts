import { NextRequest, NextResponse } from 'next/server';
import { parseZip, ZipParseError } from '@/lib/parser';

export async function POST(request: NextRequest) {
  console.log('[API Parser] 🚀 POST /api/parser called');
  
  // Capture parser logs for debugging (server logs visible in browser)
  const parserLogs: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  try {
    const contentType = request.headers.get('content-type');
    
    // Intercept console logs to capture parser output
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      parserLogs.push(`[LOG] ${message}`);
      originalConsoleLog(...args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      parserLogs.push(`[WARN] ${message}`);
      originalConsoleWarn(...args);
    };
    
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      parserLogs.push(`[ERROR] ${message}`);
      originalConsoleError(...args);
    };

    if (contentType?.includes('multipart/form-data')) {
      // Handle ZIP file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file provided');
      }

      // Convert file to buffer
      const buffer = await file.arrayBuffer();

      // Parse options
      const options = {
        maxSize: 50 * 1024 * 1024, // 50MB
        onProgress: (progress: any) => {
          console.log(`[API Parser] Progress: ${progress.percentage}%`);
        }
      };

      try {
        const result = await parseZip(buffer, options);
        
        const totalComponents = result.project.pages.reduce((sum, page) => sum + (page.components?.length || 0), 0);
        
        console.log('[API Parser] ✅ ZIP parsed successfully:', {
          pagesCount: result.project.pages.length,
          componentsCount: totalComponents,
          processingTime: result.metadata.processingTime
        });

        // Collect detailed debug info with parser logs
        const debugInfo = {
          totalComponentsExtracted: totalComponents,
          parserLogs: parserLogs.slice(-50), // Last 50 log entries
          pagesCount: result.project.pages.length,
          projectName: result.project.name,
          processingTime: result.metadata.processingTime,
          firstPageComponents: result.project.pages[0]?.components?.length || 0
        };

        return NextResponse.json({
          success: true,
          hasProject: true,
          projectPages: result.project.pages.length,
          componentsCount: totalComponents,
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
          
          return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            debug: {
              parserLogs: parserLogs.slice(-50)
            }
          }, { status: 400 });
        }

        throw error;
      }
      
    } else if (contentType?.includes('application/json')) {
      // Handle project JSON for building
      const body = await request.json();
      
      // Return success for JSON project data
      return NextResponse.json({
        success: true,
        message: 'Project data received'
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported content type'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('[API Parser] ❌ Fatal error:', error);
    console.error('[API Parser] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debug: {
        parserLogs: parserLogs.slice(-50)
      }
    }, { status: 500 });
    
  } finally {
    // Always restore original console functions
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  }
}
