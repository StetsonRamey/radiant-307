# AGENT.md

## Build/Test Commands
- `pnpm start` - Start development server with hot reload
- `pnpm run build` - Build for production
- `wrangler pages dev _site` - Test with Cloudflare Pages locally
- `tsc --noEmit` - Type check functions (in functions/ directory)

## Architecture
- Eleventy 3 static site generator with WebC components
- Cloudflare Pages deployment with Functions API
- `src/` - Site source files (.webc templates, components, assets)
- `functions/api/` - Cloudflare Functions (submit-form.ts)
- `_site/` - Built output directory
- Uses ESM modules, Node 22+

## Code Style
- WebC components with frontmatter (---js/---)
- Camelcase for JS variables, kebab-case for CSS classes
- TypeScript for functions with strict mode
- Semantic HTML with mobile-first responsive design
- Import plugins using ES modules syntax
- Use :href for dynamic attributes, @text for text content
- Component naming: kebab-case files, PascalCase imports
