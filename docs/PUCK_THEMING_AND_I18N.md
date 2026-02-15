# Puck editor: theming and i18n

## Theming

Puck uses CSS variables from `@puckeditor/core/puck.css` (e.g. `--puck-color-grey-01`, `--puck-color-azure-04` for primary actions). We override them for dark mode and accent in the editor.

- **Dark mode:** Background `#1a1a1a`, panels `#2d2d2d`, borders `#4a4a4a` (see `--puck-color-grey-*` overrides in [app/[locale]/editor/editor-dark-mode.css](app/[locale]/editor/editor-dark-mode.css)).
- **Accent:** `#FF6B35` for primary buttons and focus (we override `--puck-color-azure-*` in the same file).

Scoping: overrides apply under `.dark [data-puck-entry]` so only the Puck editor area is themed when the app is in dark mode.

To change theme colours, edit the variable overrides at the bottom of `editor-dark-mode.css`. Puck does not document a formal theming API; overriding these variables is the supported approach.

## i18n

Puck has **no built-in i18n**. To show the editor UI in multiple languages (en, ru, he):

1. **Field and section labels**  
   Use the **overrides** API in [components/editor/PuckEditor.tsx](components/editor/PuckEditor.tsx):
   - `overrides.fieldLabel` – wrap or replace the label component and pass translated strings (e.g. from `useTranslations()`).
   - Component config `fields.*.label` – build the config (or a part of it) inside a component that has access to `useTranslations()` and set each field’s `label` to the translated string.

2. **Drawer / component list**  
   - `overrides.drawerItem` – receive `name` (component type or display name) and render a translated label.
   - Category titles come from `puckConfig.categories[].title`; these can be translated by building the config with `useTranslations()` or by overriding the drawer and rendering your own list with translated titles.

3. **Custom sections**  
   Our right-panel sections (“Animations”, “Advanced styles”) are in [components/editor/RightPanelSections.tsx](components/editor/RightPanelSections.tsx). Use `useTranslations('EditorPage')` (or your namespace) there for section headings and any labels.

4. **Puck’s internal strings**  
   Buttons and labels that come from Puck’s default UI (e.g. “Drop component”) are not exposed as overridable keys. To translate them you would need to override the components that render them (e.g. via `overrides.fields`, `overrides.drawer`) and inject translated text. Check [Puck overrides docs](https://puckeditor.com/docs/api-reference/overrides) for available override points.

Summary: theme via CSS variable overrides; i18n via overrides + translated config (and building config or overrides inside components that use `useTranslations()`).
