import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import html2canvas from 'html2canvas'

// BLOCK 1: Database connection setup
const supabase = createClient(
  'https://qlbvfbkvlpqlujhsjglb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsYnZmYmt2bHBxbHVqaHNqZ2xiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk2MjAyNiwiZXhwIjoyMDcxNTM4MDI2fQ.y_fi8x5J0dk_Gkx6BhCDuFdIDnHOQhA_jeBZETPIpmA'
)

export default function Editor() {
  // BLOCK 2: State initialization - ENHANCED with scripts storage
  const [customBlocks, setCustomBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState('blocks')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [pages, setPages] = useState([{ 
    id: 'main', 
    name: 'Main', 
    html: '', 
    css: '', 
    js: '',
    scripts: { vendor: [], custom: [], fonts: [] }, // NEW: Store all scripts
    backgroundImg: null
  }])
  const [currentPage, setCurrentPage] = useState('main')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [componentName, setComponentName] = useState('')
  const [componentCategory, setComponentCategory] = useState('header')
  const [componentPreview, setComponentPreview] = useState(null)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [projects, setProjects] = useState([])
  const [images, setImages] = useState([])
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [showBackgroundModal, setShowBackgroundModal] = useState(false)
  const [currentProject, setCurrentProject] = useState(null) // NEW: Track current project
  const [lastSaveTime, setLastSaveTime] = useState(null) // NEW: Track save time
  const editorRef = useRef(null)
  const pagesRef = useRef(pages)
  const autoSaveInterval = useRef(null) // NEW: Auto-save timer

  // BLOCK 3: Pages synchronization with ref
  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  // BLOCK 4: Load components and images from database
  useEffect(() => {
    async function loadData() {
      try {
        // Check for last project in localStorage
        const lastProjectId = localStorage.getItem('lego_last_project')
        if (lastProjectId) {
          const { data: projectData } = await supabase
            .from('site_projects')
            .select('*')
            .eq('id', lastProjectId)
            .single()
          
          if (projectData) {
            setCurrentProject(projectData)
            // Parse project data if it's JSON
            try {
              const parsedData = JSON.parse(projectData.html)
              if (parsedData.pages) {
                setPages(parsedData.pages)
              }
            } catch (e) {
              // Old format compatibility
            }
          }
        }

        // Load components
        const { data: componentsData, error: componentsError } = await supabase
          .from('site_components')
          .select('*')
          .order('category')

        if (componentsError) {
          console.error('Error loading components:', componentsError)
        } else if (componentsData) {
          setCustomBlocks(componentsData)
        }

        // Load images
        const { data: imagesData, error: imagesError } = await supabase
          .from('site_images')
          .select('*')
          .order('created_at', { ascending: false })

        if (imagesError) {
          console.error('Error loading images:', imagesError)
        } else if (imagesData) {
          setImages(imagesData)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // BLOCK 5: Auto-save functionality - NEW
  useEffect(() => {
    // Set up auto-save every 30 seconds
    autoSaveInterval.current = setInterval(() => {
      if (editorRef.current && currentProject) {
        autoSaveProject()
      }
    }, 30000) // 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current)
      }
    }
  }, [currentProject])

  // Auto-save function - NEW
  const autoSaveProject = async () => {
    if (!editorRef.current || !currentProject) return

    const editor = editorRef.current
    const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
    
    if (currentPageObj) {
      currentPageObj.html = editor.getHtml()
      currentPageObj.css = editor.getCss()
      currentPageObj.js = editor.getJs ? editor.getJs() : ''
    }

    try {
      const projectData = {
        pages: pagesRef.current,
        lastModified: new Date().toISOString()
      }

      const { error } = await supabase
        .from('site_projects')
        .update({
          html: JSON.stringify(projectData),
          css: pagesRef.current[0].css || '',
          js: pagesRef.current.map(p => p.js).join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProject.id)

      if (!error) {
        setLastSaveTime(new Date())
        console.log('✅ Auto-saved at', new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.error('Auto-save error:', err)
    }
  }

  // BLOCK 6: Main editor initialization effect
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const loadEditor = async () => {
        const grapesjs = (await import('grapesjs')).default

        // Database blocks preparation
        const dbBlocks = customBlocks.map(block => ({
          id: `db-${block.id}`,
          label: block.name,
          content: block.html || '<div>Empty component</div>',
          category: block.category || 'From Database',
          media: block.preview_img || undefined,
          // NEW: Execute JS dependencies when block is added
          activate: true,
          script: function() {
            if (block.js) {
              setTimeout(() => {
                try {
                  // Create and inject script
                  const script = document.createElement('script')
                  script.innerHTML = block.js
                  document.body.appendChild(script)
                } catch(err) {
                  console.error('Script execution error:', err)
                }
              }, 100)
            }
          }
        }))

        // GrapesJS editor configuration
        const editor = grapesjs.init({
          container: '#gjs',
          height: '100%',
          width: 'auto',
          storageManager: false,
          allowScripts: 1,

          // Better drag settings
          dragMode: 'translate',
          dragAutoScroll: 1,
          dragMultipleComponent: 1,
          showOffsets: true,

          canvas: {
            styles: [],
            scripts: [],
            frameStyle: `
              body {
                min-height: 5000px;
                position: relative;
                background-color: #ffffff;
                margin: 0;
                padding: 0;
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
              }
              * {
                box-sizing: border-box;
              }
            `
          },

          deviceManager: {
            devices: [
              { id: 'desktop', name: 'Desktop', width: '' },
              { id: 'tablet', name: 'Tablet', width: '768px' },
              { id: 'mobile', name: 'Mobile', width: '375px' }
            ]
          },

          panels: { defaults: [] },

          blockManager: {
            appendTo: '#blocks-container',
            blocks: [
              {
                id: 'section-100',
                label: 'Section 100%',
                content: '<section style="width: 100%; min-height: 300px; padding: 20px; background: #f0f0f0;">Full width section</section>',
                category: 'Basic'
              },
              {
                id: 'text',
                label: 'Text',
                content: '<div style="padding: 20px;"><p>Enter text...</p></div>',
                category: 'Basic'
              },
              {
                id: 'heading',
                label: 'Heading',
                content: '<h2 style="padding: 10px;">Heading</h2>',
                category: 'Basic'
              },
              {
                id: 'image',
                label: 'Image',
                content: '<img src="https://via.placeholder.com/350x150" style="width: 100%;"/>',
                category: 'Basic'
              },
              {
                id: 'button',
                label: 'Button',
                content: '<button style="padding: 12px 24px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Button</button>',
                category: 'Basic'
              },
              {
                id: 'container',
                label: 'Container',
                content: '<div style="padding: 20px; background: #f9fafb; min-height: 100px; border-radius: 8px;"></div>',
                category: 'Basic'
              },
              ...dbBlocks
            ]
          },

          styleManager: {
            appendTo: '#styles-container',
            sectors: [
              {
                name: 'Dimensions',
                open: true,
                properties: [
                  'width', 'min-width', 'max-width',
                  'height', 'min-height', 'max-height'
                ]
              },
              {
                name: 'Position',
                properties: [
                  'position', 'left', 'top', 'right', 'bottom', 'z-index'
                ]
              },
              {
                name: 'Colors & Background',
                properties: [
                  'background-color', 'color', 'opacity'
                ]
              },
              {
                name: 'Spacing',
                properties: [
                  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'
                ]
              },
              {
                name: 'Text',
                properties: [
                  'font-size', 'font-weight', 'font-family', 'line-height',
                  'text-align', 'text-decoration'
                ]
              }
            ]
          },

          layerManager: {
            appendTo: '#layers-container'
          },

          traitManager: {
            appendTo: '#traits-container'
          }
        })

        // Save editor reference
        window.editor = editor
        editorRef.current = editor

        // Component selection handler
        editor.on('component:selected', (component) => {
          component.set({
            resizable: true,
            draggable: true
          })
        })

        // Component add handler with auto-width
        editor.on('component:add', (component) => {
          const category = component.get('category')
          const tagName = component.get('tagName')

          if (category === 'Hero' || category === 'Headers' || category === 'Footers' ||
              tagName === 'header' || tagName === 'footer' || tagName === 'section') {
            component.setStyle({
              width: '100%',
              'max-width': '100%',
              'box-sizing': 'border-box'
            })
          }
        })

        // Enable drop anywhere on canvas
        editor.on('load', () => {
          const wrapper = editor.DomComponents.getWrapper()
          if (wrapper) {
            wrapper.set({
              droppable: true,
              highlightable: false
            })
          }

          // Load current page scripts if any
          const currentPageData = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageData && currentPageData.scripts) {
            injectPageScripts(currentPageData.scripts)
          }
        })

        // BLOCK 5.5: Page switching - FIXED to prevent content loss
        window.switchPage = (pageId) => {
          // Save current page directly to ref without setState
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj && editor) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getJs ? editor.getJs() : ''
          }

          // Load new page
          const newPage = pagesRef.current.find(p => p.id === pageId)
          if (newPage && editor) {
            editor.DomComponents.clear()
            editor.CssComposer.clear()

            // Load content or show placeholder
            if (newPage.html && newPage.html.trim() !== '') {
              editor.setComponents(newPage.html)
            } else {
              editor.setComponents(`<div style="padding: 40px; text-align: center;">
                <h1>${newPage.name}</h1>
                <p>Empty page - add elements from left panel</p>
              </div>`)
            }

            if (newPage.css) {
              editor.setStyle(newPage.css)
            }

            if (newPage.js) {
              editor.setJs ? editor.setJs(newPage.js) : null
            }

            // Apply background if exists
            if (newPage.backgroundImg) {
              window.updateCanvasBackground(newPage.backgroundImg)
            }

            // Inject page scripts
            if (newPage.scripts) {
              injectPageScripts(newPage.scripts)
            }

            setCurrentPage(pageId)
            
            // Force state update for UI
            setPages([...pagesRef.current])
          }
        }

        // NEW: Function to inject scripts in correct order
        window.injectPageScripts = (scripts) => {
          if (!scripts) return

          const frame = editor.Canvas.getFrameEl()
          if (!frame || !frame.contentDocument) return

          const doc = frame.contentDocument
          
          // Clear old scripts
          doc.querySelectorAll('script.injected-script').forEach(s => s.remove())

          // Inject in order: fonts → vendor → custom
          const injectScript = (content, type) => {
            const script = doc.createElement('script')
            script.className = 'injected-script'
            script.innerHTML = content
            doc.body.appendChild(script)
          }

          // Inject fonts
          if (scripts.fonts) {
            scripts.fonts.forEach(font => injectScript(font, 'font'))
          }

          // Inject vendor scripts (jQuery, owl-carousel, etc)
          if (scripts.vendor) {
            scripts.vendor.forEach(vendor => {
              setTimeout(() => injectScript(vendor, 'vendor'), 100)
            })
          }

          // Inject custom scripts with delay
          if (scripts.custom) {
            setTimeout(() => {
              scripts.custom.forEach(custom => injectScript(custom, 'custom'))
            }, 500)
          }
        }

        // Add new page function
        window.addNewPage = () => {
          const pageName = prompt('New page name:')
          if (pageName) {
            const newPage = {
              id: `page-${Date.now()}`,
              name: pageName,
              html: '',
              css: '',
              js: '',
              scripts: { vendor: [], custom: [], fonts: [] },
              backgroundImg: null
            }
            pagesRef.current.push(newPage)
            setPages([...pagesRef.current])

            setTimeout(() => {
              window.switchPage(newPage.id)
            }, 100)
          }
        }

        // Save component to DB function
        window.saveComponentToDB = async () => {
          const selected = editor.getSelected()
          if (!selected) {
            alert('Select a component to save')
            return
          }

          setShowSaveModal(true)
        }

        // Confirm save component - ENHANCED with JS extraction
        window.confirmSaveComponent = async () => {
          const selected = editor.getSelected()
          if (!selected) {
            alert('Select a component to save')
            return
          }

          const actualComponentName = componentName.trim()
          if (!actualComponentName) {
            alert('Please enter component name')
            return
          }

          const html = selected.toHTML()
          const css = editor.getCss()
          
          // Extract JS from component
          let componentJs = ''
          const el = selected.getEl()
          if (el) {
            // Get all scripts inside component
            const scripts = el.querySelectorAll('script')
            scripts.forEach(script => {
              componentJs += script.innerHTML + '\n'
            })
            
            // Get inline event handlers
            const handlers = ['onclick', 'onchange', 'onmouseover', 'onload']
            handlers.forEach(handler => {
              const elements = el.querySelectorAll(`[${handler}]`)
              elements.forEach(elem => {
                const code = elem.getAttribute(handler)
                if (code) componentJs += `// ${handler}: ${code}\n`
              })
            })
          }

          const fullHtml = `${html}<style>${css}</style>`

          // Generate preview
          let previewImg = componentPreview
          if (!previewImg) {
            // Use default icon based on category
            const categoryIcons = {
              header: '🔝',
              footer: '🔻',
              hero: '🚀',
              gallery: '🖼️',
              form: '📝',
              button: '🔘'
            }
            const icon = categoryIcons[componentCategory] || '📦'
            previewImg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" font-size="40" text-anchor="middle" dy=".3em">${icon}</text></svg>`
          }

          try {
            const actualCategory = componentCategory || 'Other'
            
            const { data, error } = await supabase.from('site_components').insert([{
              name: actualComponentName,
              category: actualCategory,
              type: selected.get('type') || 'div',
              html: fullHtml,
              css: css,
              js: componentJs || '',
              preview_img: previewImg,
              tags: [actualCategory]
            }])

            if (error) throw error

            alert('✅ Component saved!')
            setShowSaveModal(false)
            setComponentName('')
            setComponentCategory('header')
            setComponentPreview(null)

            // Reload components
            const { data: newComponents } = await supabase
              .from('site_components')
              .select('*')
              .order('category')

            if (newComponents) {
              setCustomBlocks(newComponents)
              location.reload()
            }
          } catch (err) {
            console.error('Save error:', err)
            alert('❌ Error: ' + err.message)
          }
        }

        // Image gallery functions
        window.openImageGallery = () => {
          setShowImageGallery(true)
        }

        window.insertImageFromGallery = (imageData) => {
          const selected = editor.getSelected()
          if (selected && selected.get('tagName') === 'img') {
            selected.set('src', imageData)
          } else {
            editor.addComponents(`<img src="${imageData}" style="width: 100%; max-width: 500px;" />`)
          }
          setShowImageGallery(false)
        }

        // BLOCK 5.10: Import template - ENHANCED to collect ALL JS files
        window.importTemplate = async (file) => {
          setImportProgress('Starting import...')

          try {
            if (file.name.endsWith('.zip')) {
              const zip = new JSZip()
              const zipContent = await zip.loadAsync(file)

              const htmlFiles = []
              let globalCss = ''
              const assets = []
              
              // NEW: Collect scripts by type
              const scripts = {
                vendor: [],
                custom: [],
                fonts: []
              }

              for (const [filename, file] of Object.entries(zipContent.files)) {
                if (file.dir) continue

                if (filename.endsWith('.html')) {
                  const content = await file.async('string')
                  const pageName = filename.replace(/\.html$/, '').replace(/^.*\//, '')
                  
                  // Extract inline scripts from HTML
                  let pageJs = ''
                  const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi)
                  if (scriptMatches) {
                    scriptMatches.forEach(scriptTag => {
                      if (!scriptTag.includes('src=')) {
                        const scriptContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '')
                        pageJs += scriptContent + '\n'
                      }
                    })
                  }
                  
                  htmlFiles.push({ filename, content, pageName, js: pageJs })
                  
                } else if (filename.endsWith('.css')) {
                  const content = await file.async('string')
                  globalCss += `\n/* From ${filename} */\n${content}\n`
                  
                } else if (filename.endsWith('.js')) {
                  // NEW: Categorize JS files
                  const content = await file.async('string')
                  const name = filename.toLowerCase()
                  
                  if (name.includes('jquery') || name.includes('bootstrap') || 
                      name.includes('owl') || name.includes('carousel') || 
                      name.includes('isotope') || name.includes('tabs')) {
                    scripts.vendor.push(`// ${filename}\n${content}`)
                  } else if (name.includes('custom') || name.includes('main') || 
                             name.includes('script')) {
                    scripts.custom.push(`// ${filename}\n${content}`)
                  } else {
                    scripts.custom.push(`// ${filename}\n${content}`)
                  }
                  
                } else if (filename.match(/\.(woff|woff2|ttf|eot)$/i)) {
                  // Handle fonts
                  const base64 = await file.async('base64')
                  const ext = filename.split('.').pop().toLowerCase()
                  scripts.fonts.push(`/* Font: ${filename} */`)
                  
                } else if (filename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
                  const base64 = await file.async('base64')
                  const ext = filename.split('.').pop().toLowerCase()
                  const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
                  assets.push({
                    original: filename,
                    data: `data:${mimeType};base64,${base64}`
                  })

                  // Save image to DB
                  try {
                    await supabase.from('site_images').insert([{
                      name: filename.split('/').pop(),
                      data: `data:${mimeType};base64,${base64}`,
                      category: 'Imported',
                      preview: `data:${mimeType};base64,${base64}`
                    }])
                  } catch (err) {
                    console.log('Could not save image:', err)
                  }
                }
              }

              // Create pages with scripts
              const newPages = []
              htmlFiles.sort((a, b) => a.filename.includes('index') ? -1 : 1)

              for (let i = 0; i < htmlFiles.length; i++) {
                const htmlFile = htmlFiles[i]
                setImportProgress(`Processing ${htmlFile.pageName}...`)

                let pageHtml = ''
                const bodyMatch = htmlFile.content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
                if (bodyMatch) {
                  pageHtml = bodyMatch[1]
                    // Remove script tags as we extract them separately
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                }

                // Replace resource paths
                assets.forEach(resource => {
                  const fileName = resource.original.split('/').pop()
                  const patterns = [
                    new RegExp(`src=["'].*?${fileName}["']`, 'gi'),
                    new RegExp(`href=["'].*?${fileName}["']`, 'gi'),
                    new RegExp(`url\\(["']?.*?${fileName}["']?\\)`, 'gi')
                  ]

                  patterns.forEach(pattern => {
                    pageHtml = pageHtml.replace(pattern, (match) => {
                      if (match.includes('url(')) {
                        return `url("${resource.data}")`
                      } else if (match.includes('src=')) {
                        return `src="${resource.data}"`
                      } else {
                        return `href="${resource.data}"`
                      }
                    })
                    globalCss = globalCss.replace(pattern, `url("${resource.data}")`)
                  })
                })

                newPages.push({
                  id: i === 0 ? 'main' : `page-${i}`,
                  name: htmlFile.pageName,
                  html: pageHtml,
                  css: globalCss,
                  js: htmlFile.js || '',
                  scripts: scripts, // NEW: Store all scripts
                  backgroundImg: null
                })
              }

              if (newPages.length > 0) {
                setPages(newPages)
                setCurrentPage(newPages[0].id)

                editor.DomComponents.clear()
                editor.CssComposer.clear()
                editor.setComponents(newPages[0].html)
                editor.setStyle(newPages[0].css)
                
                // NEW: Inject all scripts
                setTimeout(() => {
                  window.injectPageScripts(newPages[0].scripts)
                }, 1000)

                setImportProgress(`✅ Imported ${newPages.length} pages, ${assets.length} images, ${scripts.vendor.length + scripts.custom.length} scripts!`)

                // Create/update project
                const projectName = file.name.replace('.zip', '')
                const projectData = {
                  pages: newPages,
                  importedAt: new Date().toISOString()
                }

                const { data: project, error } = await supabase
                  .from('site_projects')
                  .insert([{
                    name: projectName,
                    html: JSON.stringify(projectData),
                    css: globalCss,
                    js: '',
                    created_at: new Date().toISOString()
                  }])
                  .select()
                  .single()

                if (project) {
                  setCurrentProject(project)
                  localStorage.setItem('lego_last_project', project.id)
                }

                // Reload images
                const { data: newImages } = await supabase
                  .from('site_images')
                  .select('*')
                  .order('created_at', { ascending: false })

                if (newImages) {
                  setImages(newImages)
                }
              }

              setTimeout(() => {
                setShowImportModal(false)
                setImportProgress('')
              }, 3000)
            }
          } catch (error) {
            setImportProgress(`❌ Error: ${error.message}`)
            console.error('Import error:', error)
          }
        }

        // Load project function
        window.loadProject = async () => {
          try {
            const { data, error } = await supabase
              .from('site_projects')
              .select('*')
              .order('created_at', { ascending: false })

            if (error) throw error

            if (data && data.length > 0) {
              setProjects(data)
              setShowLoadModal(true)
            } else {
              alert('No saved projects found')
            }
          } catch (err) {
            console.error('Load error:', err)
            alert('❌ Error: ' + err.message)
          }
        }

        // Preview site function
        window.previewSite = () => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getJs ? editor.getJs() : ''
          }

          // Combine all scripts
          let allScripts = ''
          pagesRef.current.forEach(page => {
            if (page.scripts) {
              if (page.scripts.vendor) {
                page.scripts.vendor.forEach(v => allScripts += v + '\n')
              }
              if (page.scripts.custom) {
                page.scripts.custom.forEach(c => allScripts += c + '\n')
              }
            }
            if (page.js) {
              allScripts += page.js + '\n'
            }
          })

          const win = window.open('', '_blank')
          if (win) {
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${currentPageObj.css || ''}</style>
</head>
<body>
${currentPageObj.html || ''}
<script>${allScripts}</script>
</body>
</html>`
            
            win.document.write(htmlContent)
            win.document.close()
          }
        }

        // Save project function - ENHANCED with auto-save support
        window.saveProject = async () => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getJs ? editor.getJs() : ''
          }

          if (currentProject) {
            // Update existing project
            await autoSaveProject()
            alert('✅ Project saved!')
          } else {
            // Create new project
            const name = prompt('Project name:')
            if (name) {
              try {
                const projectData = {
                  pages: pagesRef.current,
                  createdAt: new Date().toISOString()
                }

                const { data, error } = await supabase.from('site_projects').insert([{
                  name,
                  html: JSON.stringify(projectData),
                  css: pagesRef.current[0].css || '',
                  js: '',
                  created_at: new Date().toISOString()
                }])
                .select()
                .single()

                if (error) throw error
                
                setCurrentProject(data)
                localStorage.setItem('lego_last_project', data.id)
                alert('✅ Project created and saved!')
              } catch (err) {
                console.error('Error:', err)
                alert('❌ Error: ' + err.message)
              }
            }
          }
        }

        // Export HTML function
        window.exportHTML = () => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getJs ? editor.getJs() : ''
          }

          // Combine all scripts
          let allScripts = ''
          if (currentPageObj.scripts) {
            if (currentPageObj.scripts.vendor) {
              currentPageObj.scripts.vendor.forEach(v => allScripts += v + '\n')
            }
            if (currentPageObj.scripts.custom) {
              currentPageObj.scripts.custom.forEach(c => allScripts += c + '\n')
            }
          }
          if (currentPageObj.js) {
            allScripts += currentPageObj.js + '\n'
          }

          const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LEGO Export</title>
  <style>${currentPageObj.css || ''}</style>
</head>
<body>
${currentPageObj.html || ''}
<script>${allScripts}</script>
</body>
</html>`

          const blob = new Blob([template], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'lego-site.html'
          a.click()
          URL.revokeObjectURL(url)
        }

        // Utility functions
        window.clearCanvas = () => {
          editor.DomComponents.clear()
          editor.CssComposer.clear()
        }

        window.undoAction = () => editor.UndoManager.undo()
        window.redoAction = () => editor.UndoManager.redo()
        window.setDevice = (device) => editor.setDevice(device)

        // Background functions
        window.setBackgroundImage = () => {
          setShowBackgroundModal(true)
        }

        window.selectBackgroundImage = (imageData) => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.backgroundImg = imageData
            setPages([...pagesRef.current])
            window.updateCanvasBackground(imageData)
          }
          setShowBackgroundModal(false)
        }

        window.updateCanvasBackground = (imageData) => {
          if (editor) {
            const frame = editor.Canvas.getFrameEl()
            if (frame && frame.contentDocument) {
              const body = frame.contentDocument.body
              if (imageData) {
                body.style.backgroundImage = `url(${imageData})`
                body.style.backgroundSize = 'cover'
                body.style.backgroundPosition = 'center'
                body.style.backgroundAttachment = 'fixed'
              } else {
                body.style.backgroundImage = 'none'
              }
            }
          }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
              case 's':
                e.preventDefault()
                window.saveProject()
                break
              case 'z':
                e.preventDefault()
                window.undoAction()
                break
              case 'y':
                e.preventDefault()
                window.redoAction()
                break
            }
          }
        })

        // Initialize editor
        editor.Commands.run('sw-visibility')
        
        setTimeout(() => {
          editor.trigger('load')
          editor.refresh()
        }, 100)
        
        console.log('✅ Editor loaded')
      }

      loadEditor()
    }
  }, [loading, customBlocks, currentProject])

  // Loading screen
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#4F46E5', marginBottom: '10px' }}>🚀 Loading editor...</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {currentProject ? `Loading project: ${currentProject.name}` : 'Initializing...'}
          </div>
        </div>
      </div>
    )
  }

  // Main JSX render
  return (
    <>
      <link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>

      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .editor-header { height: 50px; background: #1f2937; display: flex; align-items: center; padding: 0 15px; gap: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .logo { font-size: 18px; font-weight: bold; color: white; }
        .project-info { font-size: 12px; color: #9ca3af; margin-left: 10px; }
        .pages-nav { display: flex; gap: 5px; margin-left: 20px; padding: 0 10px; border-left: 1px solid #4b5563; }
        .page-tab { padding: 6px 12px; background: #374151; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s; }
        .page-tab:hover { background: #4b5563; }
        .page-tab.active { background: #4F46E5; }
        .btn-group { display: flex; gap: 5px; margin-left: auto; }
        .btn { padding: 6px 12px; background: #374151; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 5px; transition: background 0.2s; white-space: nowrap; }
        .btn:hover { background: #4b5563; }
        .btn-primary { background: #4F46E5; }
        .btn-primary:hover { background: #4338CA; }
        .btn-success { background: #10b981; }
        .btn-success:hover { background: #059669; }
        .btn-warning { background: #f59e0b; }
        .btn-warning:hover { background: #d97706; }
        .btn-danger { background: #ef4444; }
        .btn-danger:hover { background: #dc2626; }
        .btn-icon { padding: 6px 10px; font-size: 18px; }
        .divider { width: 1px; height: 24px; background: #4b5563; }
        .main-container { display: flex; height: calc(100vh - 50px); }
        .sidebar { width: 280px; background: #f9fafb; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
        .sidebar-tabs { display: flex; border-bottom: 1px solid #e5e7eb; }
        .sidebar-tab { flex: 1; padding: 10px; background: transparent; border: none; cursor: pointer; font-size: 13px; color: #6b7280; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .sidebar-tab.active { color: #4F46E5; border-bottom-color: #4F46E5; background: white; }
        .sidebar-content { flex: 1; overflow-y: auto; padding: 15px; }
        #blocks-container, #styles-container, #layers-container, #traits-container { display: none; }
        #blocks-container.active, #styles-container.active, #layers-container.active, #traits-container.active { display: block; }
        .canvas-container { flex: 1; background: #e5e7eb; position: relative; overflow: auto; }
        #gjs { height: 100%; }
        .import-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; }
        .import-modal-content { background: white; border-radius: 8px; padding: 30px; width: 500px; max-width: 90%; max-height: 80vh; overflow-y: auto; }
        .import-modal h2 { margin-bottom: 20px; color: #1f2937; }
        .file-input-wrapper { border: 2px dashed #e5e7eb; border-radius: 8px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; }
        .file-input-wrapper:hover { border-color: #4F46E5; background: #f9fafb; }
        .file-input-wrapper input { display: none; }
        .import-progress { margin-top: 20px; padding: 10px; background: #f3f4f6; border-radius: 4px; color: #4F46E5; text-align: center; }
        .modal-buttons { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
        .gjs-block { width: auto !important; min-width: 100px; padding: 10px; margin: 5px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; cursor: grab; transition: all 0.2s; font-size: 13px; text-align: center; }
        .gjs-block:hover { border-color: #4F46E5; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15); }
        .gjs-block-category { font-weight: bold; margin: 15px 0 5px; color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .image-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; padding: 20px; max-height: 400px; overflow-y: auto; }
        .gallery-image { cursor: pointer; border: 2px solid transparent; border-radius: 4px; overflow: hidden; transition: all 0.2s; }
        .gallery-image:hover { border-color: #4F46E5; transform: scale(1.05); }
        .gallery-image img { width: 100%; height: 100px; object-fit: cover; }
        .upload-section { margin-bottom: 20px; padding: 20px; border: 2px dashed #e5e7eb; border-radius: 8px; text-align: center; }
        .auto-save-indicator { font-size: 11px; color: #10b981; margin-left: 10px; }
      `}</style>

      {/* Header with navigation */}
      <div className="editor-header">
        <div className="logo">
          🚀 LEGO Editor
          {currentProject && (
            <span className="project-info">
              Project: {currentProject.name}
            </span>
          )}
          {lastSaveTime && (
            <span className="auto-save-indicator">
              ✓ Saved {lastSaveTime.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="pages-nav">
          {pages.map(page => (
            <button
              key={page.id}
              className={`page-tab ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => window.switchPage(page.id)}
            >
              {page.name}
            </button>
          ))}
          <button className="page-tab btn-success" onClick={window.addNewPage}>
            + Page
          </button>
        </div>

        <div className="btn-group">
          <button className="btn btn-icon" onClick={window.undoAction} title="Undo">↶</button>
          <button className="btn btn-icon" onClick={window.redoAction} title="Redo">↷</button>
        </div>

        <div className="divider"></div>

        <button className="btn" onClick={window.setBackgroundImage}>
          🎨 Background
        </button>

        <button className="btn" onClick={window.openImageGallery}>
          🖼️ Gallery
        </button>

        <button className="btn btn-success" onClick={() => setShowImportModal(true)}>
          📦 Import
        </button>

        <button className="btn btn-warning" onClick={window.loadProject}>
          📂 Load
        </button>

        <button className="btn" onClick={window.saveComponentToDB}>
          💾 To DB
        </button>

        <div className="divider"></div>

        <div className="btn-group">
          <button className="btn" onClick={() => window.setDevice('desktop')}>💻</button>
          <button className="btn" onClick={() => window.setDevice('tablet')}>📱</button>
          <button className="btn" onClick={() => window.setDevice('mobile')}>📱</button>
        </div>

        <div className="divider"></div>

        <button className="btn" onClick={window.previewSite}>👀 Preview</button>
        <button className="btn" onClick={window.clearCanvas}>🗑</button>
        <button className="btn" onClick={window.exportHTML}>💾 Export</button>
        <button className="btn btn-primary" onClick={window.saveProject}>
          {currentProject ? '💾 Save' : '☁️ Create Project'}
        </button>
      </div>

      {/* Main container with sidebar and canvas */}
      <div className="main-container">
        <div className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activePanel === 'blocks' ? 'active' : ''}`}
              onClick={() => {
                setActivePanel('blocks')
                document.querySelectorAll('.sidebar-content > div').forEach(el => el.classList.remove('active'))
                document.getElementById('blocks-container')?.classList.add('active')
              }}
            >
              Blocks
            </button>
            <button
              className={`sidebar-tab ${activePanel === 'layers' ? 'active' : ''}`}
              onClick={() => {
                setActivePanel('layers')
                document.querySelectorAll('.sidebar-content > div').forEach(el => el.classList.remove('active'))
                document.getElementById('layers-container')?.classList.add('active')
              }}
            >
              Layers
            </button>
            <button
              className={`sidebar-tab ${activePanel === 'styles' ? 'active' : ''}`}
              onClick={() => {
                setActivePanel('styles')
                document.querySelectorAll('.sidebar-content > div').forEach(el => el.classList.remove('active'))
                document.getElementById('styles-container')?.classList.add('active')
              }}
            >
              Styles
            </button>
            <button
              className={`sidebar-tab ${activePanel === 'traits' ? 'active' : ''}`}
              onClick={() => {
                setActivePanel('traits')
                document.querySelectorAll('.sidebar-content > div').forEach(el => el.classList.remove('active'))
                document.getElementById('traits-container')?.classList.add('active')
              }}
            >
              Settings
            </button>
          </div>
          <div className="sidebar-content">
            <div id="blocks-container" className="active"></div>
            <div id="layers-container"></div>
            <div id="styles-container"></div>
            <div id="traits-container"></div>
          </div>
        </div>

        <div className="canvas-container">
          <div id="gjs"></div>
        </div>
      </div>

      {/* All modals remain the same */}
      {showImportModal && (
        <div className="import-modal">
          <div className="import-modal-content">
            <h2>📦 Import Template</h2>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="templateFile"
                accept=".html,.htm,.zip"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) window.importTemplate(file)
                }}
              />
              <label htmlFor="templateFile">
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                <div style={{ fontSize: '16px', color: '#374151', marginBottom: '10px' }}>
                  Drag file here or click to select
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Supported: .html, .htm, .zip
                </div>
              </label>
            </div>
            {importProgress && (
              <div className="import-progress">{importProgress}</div>
            )}
            <div className="modal-buttons">
              <button className="btn" onClick={() => {
                setShowImportModal(false)
                setImportProgress('')
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="import-modal">
          <div className="import-modal-content">
            <h2>💾 Save Component to Database</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontSize: '14px' }}>
                Component Name:
              </label>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="e.g. Modern Header"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#ffffff'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontSize: '14px' }}>
                Category:
              </label>
              <select
                value={componentCategory}
                onChange={(e) => setComponentCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="hero">Hero Section</option>
                <option value="gallery">Gallery</option>
                <option value="form">Forms</option>
                <option value="card">Cards</option>
                <option value="button">Buttons</option>
                <option value="pricing">Pricing</option>
                <option value="contact">Contact</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="modal-buttons">
              <button className="btn" onClick={() => {
                setShowSaveModal(false)
                setComponentName('')
                setComponentPreview(null)
              }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={window.confirmSaveComponent}>
                Save Component
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="import-modal">
          <div className="import-modal-content">
            <h2>📂 Load Project</h2>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {projects.map(project => (
                <div
                  key={project.id}
                  style={{
                    padding: '15px',
                    margin: '10px 0',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4F46E5'
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onClick={() => {
                    try {
                      const projectData = JSON.parse(project.html)
                      if (projectData.pages) {
                        setPages(projectData.pages)
                        setCurrentPage(projectData.pages[0].id)
                        
                        editorRef.current.DomComponents.clear()
                        editorRef.current.CssComposer.clear()
                        editorRef.current.setComponents(projectData.pages[0].html)
                        editorRef.current.setStyle(projectData.pages[0].css)
                        
                        // Inject scripts if any
                        if (projectData.pages[0].scripts) {
                          setTimeout(() => {
                            window.injectPageScripts(projectData.pages[0].scripts)
                          }, 500)
                        }
                        
                        setCurrentProject(project)
                        localStorage.setItem('lego_last_project', project.id)
                      }
                    } catch (e) {
                      // Old format
                      editorRef.current.DomComponents.clear()
                      editorRef.current.CssComposer.clear()
                      editorRef.current.setComponents(project.html)
                      editorRef.current.setStyle(project.css)
                    }
                    
                    setShowLoadModal(false)
                    alert(`✅ Project "${project.name}" loaded!`)
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {project.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(project.created_at).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-buttons">
              <button className="btn" onClick={() => setShowLoadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageGallery && (
        <div className="import-modal">
          <div className="import-modal-content">
            <h2>🖼️ Image Gallery</h2>
            <div className="image-gallery">
              {images.map(img => (
                <div
                  key={img.id}
                  className="gallery-image"
                  onClick={() => window.insertImageFromGallery(img.data)}
                  title={img.name}
                >
                  <img src={img.preview || img.data} alt={img.name} />
                </div>
              ))}
              {images.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af' }}>
                  No images uploaded. Import a template with images.
                </p>
              )}
            </div>
            <div className="modal-buttons">
              <button className="btn" onClick={() => setShowImageGallery(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackgroundModal && (
        <div className="import-modal">
          <div className="import-modal-content">
            <h2>🎨 Set Page Background</h2>
            
            <div className="upload-section">
              <input
                type="file"
                id="bgImageFile"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      window.selectBackgroundImage(e.target.result)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                style={{ display: 'none' }}
              />
              <label htmlFor="bgImageFile" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⬆️</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  Upload new background image
                </div>
              </label>
            </div>

            <h3 style={{ marginBottom: '10px', fontSize: '16px', color: '#374151' }}>
              Or choose from gallery:
            </h3>
            
            <div className="image-gallery">
              {images.map(img => (
                <div
                  key={img.id}
                  className="gallery-image"
                  onClick={() => window.selectBackgroundImage(img.data)}
                  title={img.name}
                >
                  <img src={img.preview || img.data} alt={img.name} />
                </div>
              ))}
            </div>

            <div className="modal-buttons">
              <button className="btn btn-danger" onClick={() => {
                window.selectBackgroundImage(null)
              }}>
                Remove Background
              </button>
              <button className="btn" onClick={() => setShowBackgroundModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}