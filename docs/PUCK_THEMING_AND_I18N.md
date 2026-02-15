# Puck editor: theming and i18n

## Theming

Puck uses CSS variables from `@puckeditor/core/puck.css`. We override them for dark mode and accent in the editor.

- **Dark mode:** Background `#1a1a1a`, panels `#2d2d2d`, borders `#4a4a4a` (see `--puck-color-grey-*` overrides in `app/[locale]/editor/editor-dark-mode.css`).
- **Accent:** `#FF6B35` for primary buttons and focus (we override `--puck-color-azure-*` in the same file).

Scoping: overrides apply under `.dark [data-puck-entry]` so only the Puck editor area is themed when the app is in dark mode.

To change theme colours, edit the variable overrides at the bottom of `editor-dark-mode.css`.

## i18n

Puck has **no built-in i18n**. To show the editor UI in multiple languages (en, ru, he):

1. **Field and section labels** — Use the **overrides** API in `components/editor/PuckEditor.tsx`: `overrides.fieldLabel`, or build the config (or part of it) inside a component that uses `useTranslations()` and set each field's `label` to the translated string.

2. **Drawer / component list** — `overrides.drawerItem` to receive `name` and render a translated label. Category titles come from `puckConfig.categories[].title`; build the config with `useTranslations()` or override the drawer.

3. **Custom sections** — Our right-panel sections ("Animations", "Advanced styles") are in `components/editor/RightPanelSections.tsx`. Use `useTranslations('EditorPage')` there for section headings and labels.

4. **Puck's internal strings** — Buttons and labels from Puck's default UI are not exposed as keys. Override the components that render them (e.g. via `overrides.fields`, `overrides.drawer`) and inject translated text.

Summary: theme via CSS variable overrides; i18n via overrides + translated config (and building config or overrides inside components that use `useTranslations()`).
