# PROJECT_STRUCTURE

---

## .continue/rules/context-core.md
Role: [EMPTY - to be filled]

## .continuerc.json
Role: [EMPTY - to be filled]

## .ftpconfig
Role: [EMPTY - to be filled]

## .gitignore
Role: [EMPTY - to be filled]

## .idea/.gitignore
Role: [EMPTY - to be filled]

## .idea/i-am-running.iml
Role: [EMPTY - to be filled]

## .idea/inspectionProfiles/profiles_settings.xml
Role: [EMPTY - to be filled]

## .idea/material_theme_project_new.xml
Role: [EMPTY - to be filled]

## .idea/misc.xml
Role: [EMPTY - to be filled]

## .idea/modules.xml
Role: [EMPTY - to be filled]

## .idea/vcs.xml
Role: [EMPTY - to be filled]

## .idea/workspace.xml
Role: [EMPTY - to be filled]

---

## __tests__/admin/realtime.test.ts
Role: [EMPTY - to be filled]

## __tests__/chat/stream.test.ts
Role: [EMPTY - to be filled]

## __tests__/components/supabase-catalog.test.ts
Role: [EMPTY - to be filled]

## __tests__/demo/demo-mode.test.ts
Role: [EMPTY - to be filled]

## __tests__/parser/builder.test.ts
Role: [EMPTY - to be filled]

## __tests__/parser/parseZip.test.ts
Role: [EMPTY - to be filled]

## __tests__/utils/watermark.test.ts
Role: [EMPTY - to be filled]

---

## app/[locale]/admin/dev-console/page.tsx
Role: Admin UI for dev agent with prompt input, provider/model selection, live log streaming, and rollback button.
Key: DevAgentResponse, PROVIDERS, handleSubmit, handleRollback

## app/[locale]/admin/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/admin/seo/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/auth/callback/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/auth/login/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/auth/signup/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/dashboard/page.tsx
Role: User dashboard displaying project list with metadata, tags, visibility settings, and quick actions.
Key: DashboardPage, Project, setProjects, editingProject

## app/[locale]/editor/page.tsx
Role: Main Craft.js editor page with toolbar, toolbox, viewport, multi-page management, and Supabase sync.
Key: handleSaveFromEditor, applyColorPresetToAllPages, setPages, activePageId

## app/[locale]/layout.tsx
Role: [EMPTY - to be filled]

## app/[locale]/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/privacy/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/profile/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/settings/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/subscription/page.tsx
Role: [EMPTY - to be filled]

## app/[locale]/terms/page.tsx
Role: [EMPTY - to be filled]

## app/api/admin/get-users/route.ts
Role: Admin API endpoint that returns current users and roles from Supabase Auth as the source of truth, protected by admin cookie auth.
Key: GET, createClient, auth.admin.listUsers, checkAdminAuth

## app/api/admin/update-user-role/route.ts
Role: Admin API endpoint for changing user roles in Auth metadata and synced profile fields, protected by admin cookie auth.
Key: POST, createClient, checkAdminAuth, updateUserRole

## app/api/chat/route.ts
Role: [EMPTY - to be filled]

## app/api/chat/stream/route.ts
Role: [EMPTY - to be filled]

## app/api/dev-agent/config/route.ts
Role: GET/POST endpoints for loading and saving dev agent config (API keys, GitHub token) with auth check.
Key: GET, POST, loadConfig, saveConfig, maskConfig

## app/api/dev-agent/deploy/route.ts
Role: Protected dev-agent endpoint that deploys the project by running the server-side build/restart pipeline for the developer operator.
Key: POST, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/files/route.ts
Role: Protected file-tree endpoint for Dev Console that lists project directories/files for browser IDE navigation.
Key: GET, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/files/read/route.ts
Role: Protected file-read endpoint for Dev Console with path validation and size/security checks.
Key: GET, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/files/write/route.ts
Role: Protected file-write endpoint for Dev Console that saves edited project files to disk without auto-commit.
Key: POST, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/files/delete/route.ts
Role: Protected endpoint for deleting files or empty folders from the project tree in Dev Console.
Key: DELETE, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/files/mkdir/route.ts
Role: Protected endpoint for creating directories in the project tree from Dev Console.
Key: POST, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/git-log/route.ts
Role: Protected endpoint that exposes recent git history to Dev Console for inspection and rollback decisions.
Key: GET, createClient, DEVELOPER_USER_ID

## app/api/dev-agent/rollback/route.ts
Role: Rollback endpoint that reverts last git commit, rebuilds project, and restarts PM2 process.
Key: POST, git reset --hard HEAD~1

## app/api/dev-agent/route.ts
Role: AI agent API endpoint with tool calling loop, context-core loading, git snapshot, build, and auto-deploy.
Key: POST, executeTool, getProvider, loadContextCore, MAX_TOOL_ITERATIONS

## app/api/mcp/route.ts
Role: Main MCP protocol endpoint with Bearer-token auth, Streamable HTTP support, and server creation via `createMcpServer()`.
Key: GET, POST, checkAuth, createMcpServer

## app/api/mcp/authorize/route.ts
Role: OAuth-style authorization endpoint for MCP clients that issues short-lived auth codes through the auto-approve flow.
Key: GET

## app/api/mcp/token/route.ts
Role: OAuth-style token endpoint that exchanges auth codes for the configured MCP bearer token (`mcpAuthToken`).
Key: POST, loadConfig, mcpAuthToken

## app/api/mcp/setup/route.ts
Role: Setup/status endpoint that creates or returns MCP auth configuration and human-readable connection instructions.
Key: GET, loadConfig, saveConfig, mcpAuthToken

## app/api/mcp-gpt/route.ts
Role: Alternate MCP protocol endpoint intended for GPT-facing connector compatibility and separated safety handling.
Key: GET, POST

## app/api/mcp-gpt/authorize/route.ts
Role: Authorization endpoint for the GPT-specific MCP connector flow.
Key: GET

## app/api/mcp-gpt/token/route.ts
Role: Token exchange endpoint for the GPT-specific MCP connector flow.
Key: POST

## app/api/health/route.ts
Role: [EMPTY - to be filled]

## app/api/parser/route.ts
Role: [EMPTY - to be filled]

## app/api/paypal/capture-order/route.ts
Role: [EMPTY - to be filled]

## app/api/paypal/create-order/route.ts
Role: [EMPTY - to be filled]

## app/api/paypal/webhook/route.ts
Role: [EMPTY - to be filled]

## app/api/preview/route.ts
Role: [EMPTY - to be filled]

## app/api/projects/[id]/backend-auth/route.ts
Role: [EMPTY - to be filled]

## app/api/projects/[id]/deploy/route.ts
Role: [EMPTY - to be filled]

## app/api/projects/[id]/export/route.ts
Role: [EMPTY - to be filled]

## app/api/projects/[id]/route.ts
Role: [EMPTY - to be filled]

## app/editor/page.tsx
Role: [EMPTY - to be filled]

## app/globals.css
Role: [EMPTY - to be filled]

## app/layout.tsx
Role: [EMPTY - to be filled]

## app/page.tsx
Role: [EMPTY - to be filled]

## app/robots.ts
Role: [EMPTY - to be filled]

## app/sitemap.ts
Role: [EMPTY - to be filled]

## app/sites/[slug]/[page]/page.tsx
Role: [EMPTY - to be filled]

## app/sites/[slug]/page.tsx
Role: [EMPTY - to be filled]

## app/sites/[slug]/SiteRenderer.tsx
Role: Renders deployed sites by deserializing Craft.js JSON with theme context and SiteContext for navigation.
Key: SiteRenderer, resolver, ThemeProvider, SiteContext

---

## CODEBASE_ANALYSIS_REPORT.md
Role: [EMPTY - to be filled]

## COMPONENT_EXTRACTION_DEBUG.md
Role: [EMPTY - to be filled]

## CREATE_COMPONENTS_TABLE.sql
Role: [EMPTY - to be filled]

## LOCALSTORAGE_QUOTA_FIX.md
Role: [EMPTY - to be filled]

## PRODUCTION_FIX.md
Role: [EMPTY - to be filled]

## README.md
Role: [EMPTY - to be filled]

## SUPABASE_TABLE_SETUP.md
Role: [EMPTY - to be filled]

---

## components/auth/RegistrationForm.tsx
Role: [EMPTY - to be filled]

## components/CookieConsent.tsx
Role: [EMPTY - to be filled]

## components/CookieConsentWrapper.tsx
Role: [EMPTY - to be filled]

## components/DarkModeInit.tsx
Role: [EMPTY - to be filled]

## components/ErrorBoundary.tsx
Role: [EMPTY - to be filled]

## components/LanguageSwitcher.tsx
Role: [EMPTY - to be filled]

## components/craft/BackendCanvas.tsx
Role: [EMPTY - to be filled]

## components/craft/EditorThemeContext.tsx
Role: [EMPTY - to be filled]

## components/craft/KeyboardShortcuts.tsx
Role: [EMPTY - to be filled]

## components/craft/LayersPanel.tsx
Role: [EMPTY - to be filled]

## components/craft/MediaLibrary.tsx
Role: [EMPTY - to be filled]

## components/craft/PreviewModal.tsx
Role: [EMPTY - to be filled]

## components/craft/RenderNode.tsx
Role: [EMPTY - to be filled]

## components/craft/SettingsPanel.tsx
Role: [EMPTY - to be filled]

## components/craft/Toolbar.tsx
Role: [EMPTY - to be filled]

## components/craft/Toolbox.tsx
Role: [EMPTY - to be filled]

## components/craft/Viewport.tsx
Role: [EMPTY - to be filled]

## components/landing/ComponentShowcase.tsx
Role: [EMPTY - to be filled]

## components/landing/Evolution.tsx
Role: [EMPTY - to be filled]

## components/landing/Footer.tsx
Role: [EMPTY - to be filled]

## components/landing/HeroSection.tsx
Role: [EMPTY - to be filled]

## components/landing/HowItWorks.tsx
Role: [EMPTY - to be filled]

## components/landing/OriginStory.tsx
Role: [EMPTY - to be filled]

## components/landing/PricingComparison.tsx
Role: [EMPTY - to be filled]

## components/landing/PricingSection.tsx
Role: [EMPTY - to be filled]

## components/landing/ServicesSection.tsx
Role: [EMPTY - to be filled]

## components/landing/ShowcaseSection.tsx
Role: [EMPTY - to be filled]

## components/landing/SpeedSection.tsx
Role: [EMPTY - to be filled]

## components/landing/TechnologySection.tsx
Role: [EMPTY - to be filled]

## components/landing/WhyRunToUs.tsx
Role: [EMPTY - to be filled]

## components/library/carts/Cart1.tsx
Role: [EMPTY - to be filled]

## components/library/carts/index.ts
Role: [EMPTY - to be filled]

## components/library/ctas/cta-01.ts
Role: [EMPTY - to be filled]

## components/library/ctas/cta-02.ts
Role: [EMPTY - to be filled]

## components/library/ctas/cta-03.ts
Role: [EMPTY - to be filled]

## components/library/footers/Footer1.tsx
Role: [EMPTY - to be filled]

## components/library/footers/index.ts
Role: [EMPTY - to be filled]

## components/library/headers/header-01.ts
Role: [EMPTY - to be filled]

## components/library/headers/header-02.ts
Role: [EMPTY - to be filled]

## components/library/headers/header-03.ts
Role: [EMPTY - to be filled]

## components/library/headers/Header1.tsx
Role: [EMPTY - to be filled]

## components/library/headers/index.ts
Role: [EMPTY - to be filled]

## components/library/heroes/hero-01.ts
Role: [EMPTY - to be filled]

## components/library/heroes/hero-02.ts
Role: [EMPTY - to be filled]

## components/library/heroes/hero-03.ts
Role: [EMPTY - to be filled]

## components/library/heroes/Hero1.tsx
Role: [EMPTY - to be filled]

## components/library/heroes/index.ts
Role: [EMPTY - to be filled]

## components/library/index.ts
Role: [EMPTY - to be filled]

## components/library/premium-catalog.ts
Role: [EMPTY - to be filled]

## components/library/products/index.ts
Role: [EMPTY - to be filled]

## components/library/products/ProductCard1.tsx
Role: [EMPTY - to be filled]

## components/motion/AnimatedCounter.tsx
Role: [EMPTY - to be filled]

## components/motion/ComponentAssembly.tsx
Role: [EMPTY - to be filled]

## components/motion/DevFpsCounter.tsx
Role: [EMPTY - to be filled]

## components/motion/Floating.tsx
Role: [EMPTY - to be filled]

## components/motion/ParallaxWrapper.tsx
Role: [EMPTY - to be filled]

## components/motion/Particles.tsx
Role: [EMPTY - to be filled]

## components/motion/Reveal.tsx
Role: [EMPTY - to be filled]

## components/motion/TypewriterText.tsx
Role: [EMPTY - to be filled]

## components/payment/PackageSelector.tsx
Role: [EMPTY - to be filled]

## components/payment/PaymentButton.tsx
Role: [EMPTY - to be filled]

## components/providers/loading-provider.tsx
Role: [EMPTY - to be filled]

## components/providers/theme-provider.tsx
Role: [EMPTY - to be filled]

## components/ui/avatar.tsx
Role: [EMPTY - to be filled]

## components/ui/button.tsx
Role: [EMPTY - to be filled]

## components/ui/card.tsx
Role: [EMPTY - to be filled]

## components/ui/checkbox.tsx
Role: [EMPTY - to be filled]

## components/ui/custom-icons.tsx
Role: [EMPTY - to be filled]

## components/ui/dialog.tsx
Role: [EMPTY - to be filled]

## components/ui/dropdown-menu.tsx
Role: [EMPTY - to be filled]

## components/ui/input.tsx
Role: [EMPTY - to be filled]

## components/ui/label.tsx
Role: [EMPTY - to be filled]

## components/ui/LanguageSwitcher.tsx
Role: [EMPTY - to be filled]

## components/ui/loading-screen.tsx
Role: [EMPTY - to be filled]

## components/ui/progress-bar.tsx
Role: [EMPTY - to be filled]

## components/ui/scroll-area.tsx
Role: [EMPTY - to be filled]

## components/ui/search-input.tsx
Role: [EMPTY - to be filled]

## components/ui/select.tsx
Role: [EMPTY - to be filled]

## components/ui/slider.tsx
Role: [EMPTY - to be filled]

## components/ui/textarea.tsx
Role: [EMPTY - to be filled]

## components/ui/ThemeToggle.tsx
Role: [EMPTY - to be filled]

## components/ui/Toast.tsx
Role: [EMPTY - to be filled]

## components/ui/UserAvatar.tsx
Role: [EMPTY - to be filled]

## components/ui/use-toast.tsx
Role: [EMPTY - to be filled]

---

## docs/ARCHITECTURE_RECOMMENDATIONS.md
Role: [EMPTY - to be filled]

## docs/COMPONENT_JSON_COMPLETE_FIX.md
Role: [EMPTY - to be filled]

## docs/COMPONENT_JSON_FIX.md
Role: [EMPTY - to be filled]

## docs/COMPONENT_SAVING_AUDIT.md
Role: [EMPTY - to be filled]

## docs/COMPONENT_SAVING_CLEANUP.md
Role: [EMPTY - to be filled]

## docs/CONTAINER_IN_CONTAINER_ARCHITECTURE.md
Role: [EMPTY - to be filled]

## docs/CSS_SAVING_FIX.md
Role: [EMPTY - to be filled]

## docs/HTML_ATTRIBUTE_CORRUPTION_FIX.md
Role: [EMPTY - to be filled]

## docs/HTML_CORRUPTION_ROOT_CAUSE_FIX.md
Role: [EMPTY - to be filled]

## docs/HTML_EXTRACTION_FIX.md
Role: [EMPTY - to be filled]

## docs/IMPLEMENTATION_PLAN_MODULE5.md
Role: [EMPTY - to be filled]

## docs/NGINX_SITES_CONFIG.md
Role: [EMPTY - to be filled]

## docs/PHASE1_IMPLEMENTATION_COMPLETE.md
Role: [EMPTY - to be filled]

## docs/PUCK_THEMING_AND_I18N.md
Role: [EMPTY - to be filled]

## docs/SCHEMA_ARCHITECTURE_SUMMARY.md
Role: [EMPTY - to be filled]

## docs/SITE_SETTINGS_SETUP.md
Role: [EMPTY - to be filled]

## docs/ZIP_PARSER_ARCHITECTURE_FOR_CLAUDE.md
Role: [EMPTY - to be filled]

---

## ecosystem.config.js
Role: [EMPTY - to be filled]

## env
Role: [EMPTY - to be filled]

## i18n.ts
Role: [EMPTY - to be filled]

## jest.config.js
Role: [EMPTY - to be filled]

## jest.setup.js
Role: [EMPTY - to be filled]

## middleware.ts
Role: Next.js middleware for i18n routing, admin route shielding, and exclusion of API, deployed-site, and OAuth discovery paths such as `/.well-known`.
Key: middleware, intlMiddleware, locales, defaultLocale, recordAdminProbe

## next.config.js
Role: [EMPTY - to be filled]

## next-env.d.ts
Role: [EMPTY - to be filled]

## nginx.conf
Role: [EMPTY - to be filled]

## package.json
Role: [EMPTY - to be filled]

## postcss.config.js
Role: [EMPTY - to be filled]

## tailwind.config.js
Role: [EMPTY - to be filled]

## tsconfig.json
Role: [EMPTY - to be filled]

---

## hooks/useCounterAnimation.ts
Role: [EMPTY - to be filled]

## hooks/useTypewriter.ts
Role: [EMPTY - to be filled]

---

## lib/auth/clientAuthService.ts
Role: Client-side auth for deployed sites using dynamic Supabase credentials with localStorage session storage.
Key: signUp, signIn, signOut, saveSession, getStoredSession

## lib/admin/checkAdminAuth.ts
Role: Server-side guard for admin routes that validates the httpOnly admin session cookie and enforces admin API protection.
Key: checkAdminAuth, setAdminSessionCookie, clearAdminSessionCookie

## lib/components/catalog.ts
Role: [EMPTY - to be filled]

## lib/components/supabase-catalog.ts
Role: [EMPTY - to be filled]

## lib/constants/styles.ts
Role: [EMPTY - to be filled]

## lib/constants/tags.ts
Role: [EMPTY - to be filled]

## lib/craft/components/blocks/CardBlock.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/blocks/index.ts
Role: [EMPTY - to be filled]

## lib/craft/components/blocks/LayoutBlock.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/blocks/PricingCardBlock.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/blocks/SectionBlock.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Button.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Container.tsx
Role: Flexible layout container with configurable padding, margin, flexbox properties, borders, and shadows.
Key: Container, ContainerSettings

## lib/craft/components/CTA.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Divider.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/FAQ.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Features.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Footer.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Header.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/HeaderTron.tsx
Role: Navigation header with logo, menu links, theme toggle, language switcher, and authenticated user dropdown.
Key: HeaderTron, HeaderTronSettings

## lib/craft/components/Hero.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/HeroDefault.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/HeroTron.tsx
Role: Full-screen hero section with animated headline, subheadline, CTAs, badge, and optional social proof.
Key: HeroTron, HeroTronHeading, HeroTronSubheading, HeroTronButton

## lib/craft/components/HtmlBlock.tsx
Role: Raw HTML/CSS block for embedding custom code from parsed ZIP templates into the editor canvas.
Key: HtmlBlock, HtmlBlockSettings

## lib/craft/components/Image.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/index.ts
Role: Central export hub for all Craft.js Tron components used in the editor and deployed sites.
Key: Container, HeroTron, HeaderTron, TronFeatures, HtmlBlock

## lib/craft/components/Pricing.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Testimonials.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/Text.tsx
Role: [EMPTY - to be filled]

## lib/craft/components/TronContact.tsx
Role: Contact form with name, email, message fields, submit button, and contact info display.
Key: TronContact, TronContactSettings

## lib/craft/components/TronFAQ.tsx
Role: Accordion-style FAQ section with expandable question/answer pairs and optional CTA.
Key: TronFAQ, FAQItem, TronFAQSettings

## lib/craft/components/TronFeatures.tsx
Role: Features grid section displaying icon-based feature cards with title and description.
Key: TronFeatures, FeatureCard, TronFeaturesSettings

## lib/craft/components/TronFooter.tsx
Role: Site footer with brand info, multi-column link groups, social icons, and copyright text.
Key: TronFooter, FooterColumn, TronFooterSettings

## lib/craft/components/TronHub.tsx
Role: User dashboard hub with profile card, quick actions, theme toggle, and authenticated menu items.
Key: TronHub, TronHubSettings

## lib/craft/components/TronLogin.tsx
Role: Login form with email/password fields, Google OAuth button, and Supabase authentication integration.
Key: TronLogin, TronLoginSettings

## lib/craft/components/TronPortfolio.tsx
Role: Portfolio carousel showcasing project cards with images, category tags, title, and description.
Key: TronPortfolio, TronPortfolioSettings

## lib/craft/components/TronPricing.tsx
Role: Pricing table with plan cards, feature lists, billing toggle (monthly/annual), and CTA buttons.
Key: TronPricing, PricingCard, TronPricingSettings

## lib/craft/components/TronRegister.tsx
Role: Registration form with first name, last name, email, password fields, and Supabase signup integration.
Key: TronRegister, TronRegisterSettings

## lib/craft/components/TronShowcase.tsx
Role: Tabbed showcase section displaying features with images, videos, bullet points, and descriptions.
Key: TronShowcase, TronShowcaseSettings

## lib/craft/components/TronStats.tsx
Role: Animated statistics counter section displaying key metrics with count-up animation on scroll.
Key: TronStats, StatItem, TronStatsSettings

## lib/craft/components/TronTestimonials.tsx
Role: Infinite scrolling testimonial carousel with avatar, name, role, company, rating, and quote.
Key: TronTestimonials, TestimonialCard, TronTestimonialsSettings

## lib/craft/components/Video.tsx
Role: [EMPTY - to be filled]

## lib/craft/context/PagesContext.tsx
Role: Manages multi-page navigation in editor, serializes current page before switching to another.
Key: PagesProvider, PagesContext, navigateTo, PageInfo

## lib/craft/context/SiteContext.tsx
Role: Context for deployed sites providing theme toggle, language switching, and page navigation via CustomEvent.
Key: useSiteContext, SiteContext, navigateToPage, toggleTheme

## lib/craft/context/ThemeContext.tsx
Role: Provides theme state (accentColor, colorScheme, gradient) for editor canvas components.
Key: ThemeProvider, useTheme, ThemeState, setAccentColor, setColorScheme

## lib/craft/icons.tsx
Role: [EMPTY - to be filled]

## lib/craft/injectSupabaseCredentials.ts
Role: Injects supabaseUrl and supabaseAnonKey into TronLogin/TronRegister/HeaderTron nodes after backend-auth connection.
Key: injectSupabaseCredentialsIntoCraftJson

## lib/craft/presets/colors.ts
Role: Defines color and gradient presets (orange, sunset, ocean, etc.) for theme picker in editor.
Key: COLOR_PRESETS, ColorPreset, ColorPresetId

## lib/craft/presets/index.ts
Role: [EMPTY - to be filled]

## lib/craft/settingsStyles.ts
Role: Unified CSS class strings for all component Settings panels (labels, inputs, sliders, pills, toggles).
Key: labelCls, inputCls, pillActiveCls, pillInactiveCls

## lib/craft/shared/EditableText.tsx
Role: Double-click inline text editor for canvas components with hover hint and contentEditable support.
Key: EditableText

## lib/craft/shared/LinkPicker.tsx
Role: Settings UI for selecting link type (section/page/external) and handling navigation with smooth scroll or CustomEvent.
Key: LinkPicker, handleLinkClick, hrefToLinkValue, LinkValue

## lib/craft/tokens.ts
Role: Builds theme tokens (bg, text, border, cardBg, gridColor, inputBg) for dark/light modes in Tron components.
Key: buildBaseTokens, buildGridTokens, buildInputTokens, ThemeTokens

## lib/dev-agent/ai-provider.ts
Role: Unified AI provider adapters for Claude, OpenAI, and DeepSeek with tool calling support.
Key: getProvider, createClaudeProvider, createOpenAIProvider, AIResponse, AIMessage

## lib/dev-agent/config.ts
Role: Loads and saves dev agent configuration (API keys, GitHub token) from .dev-agent-config.json with masking for UI.
Key: loadConfig, saveConfig, maskConfig, DevAgentConfig

## lib/dev-agent/tool-executor.ts
Role: Executes AI agent tools (read_file, write_file, patch_file, search_files, git_snapshot) with path security validation.
Key: executeTool, TOOL_DEFINITIONS, resolveSafePath, ToolResult

## lib/mcp-gpt-oauth-codes.ts
Role: In-memory store/manager for short-lived OAuth-style authorization codes used by the GPT-specific MCP connector flow.
Key: auth code TTL, issue/redeem helpers

## lib/mcp-oauth-codes.ts
Role: In-memory store/manager for short-lived OAuth-style authorization codes used by the main MCP connector flow.
Key: auth code TTL, issue/redeem helpers

## lib/mcp-server/gpt-safe.ts
Role: Safety adapter layer for the GPT-facing MCP stack, used to expose a constrained/safe connector surface.
Key: GPT-safe MCP helpers

## lib/mcp-server/index.ts
Role: Core MCP server implementation that defines the tools exposed over the `/api/mcp` protocol surface.
Key: createMcpServer

## lib/export/craft-json-to-html.ts
Role: [EMPTY - to be filled]

## lib/export/types.ts
Role: [EMPTY - to be filled]

## lib/hooks/useAuth.tsx
Role: Auth context hook with 5-tier role system, session management, and feature access flags (editor, projects, AI).
Key: useAuth, AuthProvider, buildProfileFromUser, refreshAuth, canAccessEditor, role

## lib/hooks/useAutoSave.ts
Role: [EMPTY - to be filled]

## lib/hooks/useMediaLibrary.ts
Role: Hook for managing Supabase media storage with upload, fetch, delete, and image compression.
Key: useMediaLibrary, fetchFiles, uploadFile, deleteFile, compressImage

## lib/parser/builder.ts
Role: [EMPTY - to be filled]

## lib/parser/index.ts
Role: [EMPTY - to be filled]

## lib/parser/simple-parser.ts
Role: [EMPTY - to be filled]

## lib/parser/simple-parser.ts.backup
Role: [EMPTY - to be filled]

## lib/parser/types.ts
Role: [EMPTY - to be filled]

## lib/parser/upload-images.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/asset-converter.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/css-processor.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/html-processor.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/index.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/page-builder.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/progress-tracker.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/root-detector.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/storage-manager.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/types.ts
Role: [EMPTY - to be filled]

## lib/parser/v2/zip-extractor.ts
Role: [EMPTY - to be filled]

## lib/parser/zip-to-craft-blocks.ts
Role: [EMPTY - to be filled]

## lib/redis/client.ts
Role: [EMPTY - to be filled]

## lib/schemas/validation.ts
Role: [EMPTY - to be filled]

## lib/store/project-store.ts
Role: [EMPTY - to be filled]

## lib/store/projects-crud.ts
Role: [EMPTY - to be filled]

## lib/store/supabase-sync.ts
Role: [EMPTY - to be filled]

## lib/supabase/auth.ts
Role: [EMPTY - to be filled]

## lib/supabase/client.ts
Role: Singleton Supabase client factory for browser with cookie consent-based session persistence.
Key: getSupabaseClient, createSupabaseClient, supabase

## lib/supabase/complete-schema.sql
Role: [EMPTY - to be filled]

## lib/supabase/functions.sql
Role: [EMPTY - to be filled]

## lib/supabase/realtime.ts
Role: [EMPTY - to be filled]

## lib/supabase/schema.sql
Role: [EMPTY - to be filled]

## lib/supabase/server.ts
Role: Server-side Supabase client factory using Next.js cookies for API routes and Server Components.
Key: createClient

## lib/supabase/updateUserRole.ts
Role: Shared server-side helper that applies role changes consistently across Auth metadata and profile-level business fields.
Key: updateUserRole

## lib/types/chat.ts
Role: [EMPTY - to be filled]

## lib/types/contracts.ts
Role: [EMPTY - to be filled]

## lib/types/database.types.ts
Role: [EMPTY - to be filled]

## lib/types/payment.ts
Role: [EMPTY - to be filled]

## lib/types/project.ts
Role: [EMPTY - to be filled]

## lib/utils.ts
Role: [EMPTY - to be filled]

## lib/utils/demo-mode.ts
Role: [EMPTY - to be filled]

## lib/utils/preview.ts
Role: [EMPTY - to be filled]

## lib/utils/sanitize.ts
Role: [EMPTY - to be filled]

## lib/utils/screenshot.ts
Role: [EMPTY - to be filled]

## lib/utils/smart-navigation.ts
Role: [EMPTY - to be filled]

## lib/utils/user-package.ts
Role: [EMPTY - to be filled]

## lib/utils/watermark.ts
Role: [EMPTY - to be filled]

---

## messages/en.json
Role: [EMPTY - to be filled]

## messages/he.json
Role: [EMPTY - to be filled]

## messages/ru.json
Role: [EMPTY - to be filled]

---

## PROJECT_CONTEXT/COMPONENT_WRITING_RULES_v2.md
Role: [EMPTY - to be filled]

---

## scripts/sync-components.ts
Role: [EMPTY - to be filled]

---

## supabase/migrations/20250220_site_settings.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20251227_users.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20260211_add_project_metadata.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20260213_components_library.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20260219_create_images_bucket.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20260227_add_deploy_fields.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20260227_add_slug_to_projects.sql
Role: [EMPTY - to be filled]

## supabase/migrations/20260227_media_storage.sql
Role: [EMPTY - to be filled]