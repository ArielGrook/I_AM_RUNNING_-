import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import html2canvas from 'html2canvas'

// BLOCK 1: Database connection setup (lines 6-10)
const supabase = createClient(
  'https://qlbvfbkvlpqlujhsjglb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsYnZmYmt2bHBxbHVqaHNqZ2xiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk2MjAyNiwiZXhwIjoyMDcxNTM4MDI2fQ.y_fi8x5J0dk_Gkx6BhCDuFdIDnHOQhA_jeBZETPIpmA'
)

export default function Editor() {
  // BLOCK 2: State initialization (lines 13-30)
  const [customBlocks, setCustomBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState('blocks')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [pages, setPages] = useState([{ id: 'main', name: 'Main', html: '', css: '', js: '' }])
  const [currentPage, setCurrentPage] = useState('main')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [componentName, setComponentName] = useState('')
  const [componentCategory, setComponentCategory] = useState('header')
  const [componentPreview, setComponentPreview] = useState(null) // FIX: Added for preview upload
  const [showLoadModal, setShowLoadModal] = useState(false) // FIX: Added for load project modal
  const [projects, setProjects] = useState([]) // FIX: Added for projects list
  const [images, setImages] = useState([])
  const [showImageGallery, setShowImageGallery] = useState(false)
  const editorRef = useRef(null)
  const pagesRef = useRef(pages)

  // BLOCK 3: Pages synchronization with ref (lines 32-35)
  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  // BLOCK 4: Load components and images from database (lines 37-68)
  useEffect(() => {
    async function loadData() {
      try {
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

  // BLOCK 5: Main editor initialization effect (lines 70-800+)
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const loadEditor = async () => {
        const grapesjs = (await import('grapesjs')).default

        // BLOCK 5.1: Database blocks preparation (lines 75-82)
        const dbBlocks = customBlocks.map(block => ({
  id: `db-${block.id}`,
  label: block.name,
  content: block.html || '<div>Empty component</div>',
  category: block.category || 'From Database',
  media: block.preview_img ? block.preview_img : null, // Убираем { src: }
  attributes: { class: 'fa fa-image' } // Добавляем иконку если нет превью
}))

        // BLOCK 5.2: GrapesJS editor configuration (lines 84-220)
        const editor = grapesjs.init({
          container: '#gjs',
          height: '100%',
          width: 'auto',
          storageManager: false,
          allowScripts: 1,

          // FIX 1: Optimized drag & drop settings
          dragMode: 'absolute',
          dragAutoScroll: 1,
          dragMultipleComponent: 1,

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
                id: 'section-bg',
                label: 'Section with BG',
                content: '<section style="width: 100%; min-height: 500px; padding: 40px; background-image: url(https://via.placeholder.com/1920x1080); background-size: cover; background-position: center; position: relative;"><div style="background: rgba(0,0,0,0.5); color: white; padding: 20px; border-radius: 8px;"><h2>Section with background</h2><p>Add your content here</p></div></section>',
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
              {
                id: 'link-trigger',
                label: 'Link Trigger',
                content: `<a href="#" data-page-trigger="true" style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 4px;">Go to page</a>`,
                category: 'Navigation'
              },
              {
                id: 'button-trigger',
                label: 'Button Trigger',
                content: `<button data-page-trigger="true" style="padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">Navigate</button>`,
                category: 'Navigation'
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

        // BLOCK 5.3: Component selection handler (lines 224-245)
        editor.on('component:selected', (component) => {
          requestAnimationFrame(() => {
            component.set({
              resizable: true,
              draggable: true
            })

            // Check if navigation trigger
            if (component.getAttributes()['data-page-trigger']) {
              const traits = component.get('traits')
              if (!traits.where({ name: 'data-target-page' }).length) {
                traits.add([{
                  type: 'select',
                  label: 'Target page',
                  name: 'data-target-page',
                  options: pagesRef.current.map(p => ({ value: p.id, name: p.name }))
                }])
              }
            }
          })
        })

        // BLOCK 5.4: Component add handler with auto-width (lines 247-260)
        // REMOVED STICKY FOOTER FUNCTIONALITY
        editor.on('component:add', (component) => {
          requestAnimationFrame(() => {
            const category = component.get('category')
            const tagName = component.get('tagName')

            // Auto-width for specific elements (WITHOUT STICKY)
            if (category === 'Hero' || category === 'Headers' || category === 'Footers' ||
                tagName === 'header' || tagName === 'footer' || tagName === 'section') {
              component.setStyle({
                width: '100%',
                'max-width': '100%',
                'box-sizing': 'border-box'
              })
            }
          })
        })

        // BLOCK 5.5: Page switching function (lines 262-297)
        window.switchPage = (pageId) => {
          // Save current page
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj && editor) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getModel().get('customScripts') || ''

            // Update state
            setPages([...pagesRef.current])
          }

          // Load new page
          const newPage = pagesRef.current.find(p => p.id === pageId)
          if (newPage && editor) {
            editor.DomComponents.clear()
            editor.CssComposer.clear()

            setTimeout(() => {
              if (newPage.html) {
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
                editor.getModel().set('customScripts', newPage.js)
              }

              setCurrentPage(pageId)
            }, 50)
          }
        }

        // BLOCK 5.6: Add new page function (lines 299-314)
        window.addNewPage = () => {
          const pageName = prompt('New page name:')
          if (pageName) {
            const newPage = {
              id: `page-${Date.now()}`,
              name: pageName,
              html: '',
              css: '',
              js: ''
            }
            const updatedPages = [...pagesRef.current, newPage]
            setPages(updatedPages)

            setTimeout(() => {
              window.switchPage(newPage.id)
            }, 100)
          }
        }

        // BLOCK 5.7: Save component to DB function (lines 316-324)
        window.saveComponentToDB = async () => {
          const selected = editor.getSelected()
          if (!selected) {
            alert('Select a component to save')
            return
          }

          setShowSaveModal(true)
        }

        // BLOCK 5.8: Confirm save component function with preview (lines 326-374)
window.confirmSaveComponent = async () => {
  const selected = editor.getSelected()
  if (!selected) {
    alert('Select a component to save')
    return
  }

  // Получаем значение прямо из input поля
  const nameInput = document.querySelector('input[placeholder*="Modern Header"]')
  const actualComponentName = nameInput ? nameInput.value : componentName

  if (!actualComponentName || actualComponentName.trim() === '') {
    if (nameInput) nameInput.style.borderColor = 'red'
    return
  }

  const html = selected.toHTML()
  // ВАЖНО: Получаем ВСЕ стили, не только для компонента
  const css = editor.getCss()

  // Комбинируем HTML и CSS в один блок
  const fullHtml = `${html}<style>${css}</style>`

  let previewImg = componentPreview
  if (!previewImg) {
    try {
      const el = selected.getEl()
      if (el && window.html2canvas) {
        const canvas = await html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: 0.5,
          width: 300,
          height: 200
        })
        previewImg = canvas.toDataURL('image/png')
      }
    } catch (err) {
      console.log('Could not create preview:', err)
    }
  }

  try {
    const { data, error } = await supabase.from('site_components').insert([{
      name: actualComponentName,
      category: componentCategory,
      type: selected.get('type') || 'div',
      html: fullHtml, // Сохраняем HTML со стилями
      css: css, // Также сохраняем CSS отдельно
      js: '',
      preview_img: previewImg,
      tags: [componentCategory]
    }])

    if (error) throw error

    alert('✅ Component saved!')
    setShowSaveModal(false)
    setComponentName('')
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

        // BLOCK 5.9: Image gallery functions (lines 376-391)
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

        // BLOCK 5.10: Import template function (lines 393-491)
        window.importTemplate = async (file) => {
          setImportProgress('Starting import...')

          try {
            if (file.name.endsWith('.zip')) {
              const zip = new JSZip()
              const zipContent = await zip.loadAsync(file)

              const htmlFiles = []
              let globalCss = ''
              let globalJs = ''
              const assets = []

              for (const [filename, file] of Object.entries(zipContent.files)) {
                if (file.dir) continue

                if (filename.endsWith('.html')) {
                  const content = await file.async('string')
                  const pageName = filename.replace(/\.html$/, '').replace(/^.*\//, '')
                  htmlFiles.push({ filename, content, pageName })
                } else if (filename.endsWith('.css')) {
                  const content = await file.async('string')
                  globalCss += `\n/* From ${filename} */\n${content}\n`
                } else if (filename.endsWith('.js') && !filename.includes('min.js')) {
                  const content = await file.async('string')
                  globalJs += `\n// From ${filename}\n${content}\n`
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

              // Create pages
              const newPages = []
              htmlFiles.sort((a, b) => a.filename.includes('index') ? -1 : 1)

              for (let i = 0; i < htmlFiles.length; i++) {
                const htmlFile = htmlFiles[i]
                setImportProgress(`Processing ${htmlFile.pageName}...`)

                let pageHtml = ''
                const bodyMatch = htmlFile.content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
                if (bodyMatch) {
                  pageHtml = bodyMatch[1]
                }

                // Replace resource paths
                assets.forEach(resource => {
                  const patterns = [
                    new RegExp(`src=["'].*?${resource.original.split('/').pop()}["']`, 'gi'),
                    new RegExp(`url\\(["']?.*?${resource.original.split('/').pop()}["']?\\)`, 'gi')
                  ]

                  patterns.forEach(pattern => {
                    pageHtml = pageHtml.replace(pattern, (match) => {
                      if (match.includes('url(')) {
                        return `url("${resource.data}")`
                      } else {
                        return `src="${resource.data}"`
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
                  js: globalJs
                })
              }

              if (newPages.length > 0) {
                setPages(newPages)
                setCurrentPage(newPages[0].id)

                editor.DomComponents.clear()
                editor.CssComposer.clear()
                editor.setComponents(newPages[0].html)
                editor.setStyle(newPages[0].css)

                setImportProgress(`✅ Imported ${newPages.length} pages, ${assets.length} images!`)

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

        // BLOCK 5.11: Load project function - FIX ADDED (lines 493-511)
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

        // BLOCK 5.12: Preview site function - FIX ADDED (lines 513-561)
        window.previewSite = () => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getModel().get('customScripts') || ''
          }

          let navScript = `<script>
function showPage(pageId) {
  document.querySelectorAll('[data-page]').forEach(p => p.style.display = 'none');
  const page = document.querySelector('[data-page="' + pageId + '"]');
  if (page) page.style.display = 'block';
}
document.addEventListener('click', function(e) {
  if (e.target.hasAttribute('data-target-page')) {
    e.preventDefault();
    showPage(e.target.getAttribute('data-target-page'));
  }
});
</script>`

          let fullHtml = ''
          pagesRef.current.forEach((page, index) => {
            if (index === 0) {
              fullHtml = `<div data-page="${page.id}">${page.html}</div>`
            } else {
              fullHtml += `\n<div data-page="${page.id}" style="display:none;">${page.html}</div>`
            }
          })

          const win = window.open('', '_blank')
          if (win) {
            win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${pagesRef.current[0].css || ''}</style>
</head>
<body style="margin: 0; padding: 0;">
${fullHtml}
${pagesRef.current[0].js ? `<script>${pagesRef.current[0].js}</script>` : ''}
${navScript}
</body>
</html>`)
            win.document.close()
          }
        }

        // BLOCK 5.13: Save project function (lines 563-599)
        window.saveProject = async () => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getModel().get('customScripts') || ''
          }

          const name = prompt('Project name:')
          if (name) {
            try {
              let fullHtml = ''
              let fullCss = ''
              let fullJs = ''

              pagesRef.current.forEach((page, index) => {
                if (index === 0) {
                  fullHtml = page.html
                  fullCss = page.css
                  fullJs = page.js
                } else {
                  fullHtml += `\n<div data-page="${page.id}" style="display:none;">${page.html}</div>`
                }
              })

              const { data, error } = await supabase.from('site_projects').insert([{
                name,
                html: fullHtml,
                css: fullCss,
                js: fullJs,
                created_at: new Date().toISOString()
              }])

              if (error) throw error
              alert('✅ Project saved!')
            } catch (err) {
              console.error('Error:', err)
              alert('❌ Error: ' + err.message)
            }
          }
        }

        // BLOCK 5.14: Export HTML function (lines 601-649)
        window.exportHTML = () => {
          const currentPageObj = pagesRef.current.find(p => p.id === currentPage)
          if (currentPageObj) {
            currentPageObj.html = editor.getHtml()
            currentPageObj.css = editor.getCss()
            currentPageObj.js = editor.getModel().get('customScripts') || ''
          }

          let navScript = `<script>
function showPage(pageId) {
  document.querySelectorAll('[data-page]').forEach(p => p.style.display = 'none');
  const page = document.querySelector('[data-page="' + pageId + '"]');
  if (page) page.style.display = 'block';
}
document.addEventListener('click', function(e) {
  if (e.target.hasAttribute('data-target-page')) {
    e.preventDefault();
    showPage(e.target.getAttribute('data-target-page'));
  }
});
</script>`

          let fullHtml = ''
          pagesRef.current.forEach((page, index) => {
            if (index === 0) {
              fullHtml = `<div data-page="${page.id}">${page.html}</div>`
            } else {
              fullHtml += `\n<div data-page="${page.id}" style="display:none;">${page.html}</div>`
            }
          })

          const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LEGO Export</title>
  <style>${pagesRef.current[0].css || ''}</style>
</head>
<body>
${fullHtml}
${pagesRef.current[0].js ? `<script>${pagesRef.current[0].js}</script>` : ''}
${navScript}
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

        // BLOCK 5.15: Utility functions (lines 651-661)
        window.clearCanvas = () => {
          if(confirm('Clear all content?')) {
            editor.DomComponents.clear()
            editor.CssComposer.clear()
          }
        }

        window.undoAction = () => editor.UndoManager.undo()
        window.redoAction = () => editor.UndoManager.redo()
        window.setDevice = (device) => editor.setDevice(device)

        // BLOCK 5.16: Keyboard shortcuts (lines 663-678)
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

        editor.Commands.run('sw-visibility')
        console.log('✅ Editor loaded')
      }

      loadEditor()
    }
  }, [loading, customBlocks])

  // BLOCK 6: Loading screen component (lines 686-694)
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#4F46E5', marginBottom: '10px' }}>🚀 Loading editor...</div>
        </div>
      </div>
    )
  }

  // BLOCK 7: Main JSX render (lines 696-1200+)
  return (
    <>
      <link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>

      {/* BLOCK 7.1: CSS styles (lines 700-770) */}
      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .editor-header { height: 50px; background: #1f2937; display: flex; align-items: center; padding: 0 15px; gap: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .logo { font-size: 18px; font-weight: bold; color: white; }
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
      `}</style>

      {/* BLOCK 7.2: Header with navigation (lines 772-840) */}
      <div className="editor-header">
        <div className="logo">🚀 LEGO Editor</div>

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
        <button className="btn btn-primary" onClick={window.saveProject}>☁️ Save</button>
      </div>

      {/* BLOCK 7.3: Main container with sidebar and canvas (lines 842-890) */}
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

      {/* BLOCK 7.4: Import modal (lines 892-930) */}
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

      {/* BLOCK 7.5: Save component modal - FIXED (lines 932-1040) */}
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
                <option value="navigation">Navigation</option>
                <option value="button">Buttons</option>
                <option value="form">Forms</option>
                <option value="card">Cards</option>
                <option value="gallery">Gallery</option>
                <option value="pricing">Pricing</option>
                <option value="testimonial">Testimonials</option>
                <option value="cta">Call to Action</option>
                <option value="feature">Features</option>
                <option value="team">Team</option>
                <option value="blog">Blog</option>
                <option value="contact">Contact</option>
                <option value="ecommerce">E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontSize: '14px' }}>
                Preview Image (optional):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      setComponentPreview(e.target.result)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#ffffff'
                }}
              />
              {componentPreview && (
                <img
                  src={componentPreview}
                  alt="Preview"
                  style={{
                    marginTop: '10px',
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              )}
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

      {/* BLOCK 7.6: Load project modal - NEW (lines 1042-1100) */}
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
                    editorRef.current.DomComponents.clear()
                    editorRef.current.CssComposer.clear()
                    editorRef.current.setComponents(project.html)
                    editorRef.current.setStyle(project.css)
                    if (project.js) {
                      editorRef.current.getModel().set('customScripts', project.js)
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

      {/* BLOCK 7.7: Image gallery modal (lines 1102-1135) */}
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
    </>
  )
}