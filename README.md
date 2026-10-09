# 🎨 Wall Paint Visualizer (MEAN Stack)

Preview wall paint colours and designs on your own room photos.

**Stack:** Angular 15 (standalone components, HTML5 Canvas, SCSS, TypeScript) · Node.js · Express · REST · JWT · MongoDB (Mongoose)

## Run locally
Requirements: Node 16/18+, MongoDB running on `localhost:27017` (or set `MONGO_URI`).

```bash
# 1. API
cd backend
npm install
cp .env.example .env      # edit secrets if needed
npm run seed              # creates admin + sample colours + designs
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd frontend
npm install
npm start                 # http://localhost:4200  (proxies /api and /uploads to :5000)
```
Admin login after seeding: **admin@paint.com / Admin@123** (change it!). New registrations are normal users.

## Features (per PRD)
- Register / login (JWT), user & admin roles, route guards
- Upload room photo (JPG/PNG, max 10 MB, server-validated)
- Manual wall selection: **Polygon** and **Brush** tools, **Edit** tool (select wall, drag polygon corners, delete)
- Solid colours, **dual-tone walls** (adjustable split), pattern/wallpaper designs
- Opacity + finish (matte/satin/glossy); realistic multiply blending keeps room shadows
- **Before / After** slider, undo, multiple **design trials** per image (add / duplicate / delete)
- Save projects (MongoDB + image files), reopen/edit later, download painted PNG
- Favourite colours, colour filters by room tag
- Admin: manage colours & designs (CRUD, image upload), view users & saved designs, system settings, KPI dashboard (images uploaded, designs saved, avg session time, satisfaction)
- Responsive for desktop & tablet (pointer events work with touch)

## Structure
```
backend/   server.js, models.js, seed.js, routes/{auth,projects,catalog,admin}.js, middleware/{auth,upload}.js, uploads/
frontend/  src/app/{core (api, auth, guards, interceptor), pages (auth, dashboard, editor, admin)}
```

## API summary
`POST /api/auth/register|login|logout|favourites|feedback` · `GET /api/auth/me`
`GET|POST|PUT|DELETE /api/projects[/:id]` (multipart: `original`, `preview`, `name`, `trials`)
`GET /api/catalog/colors|patterns` · `/api/admin/{colors,patterns,users,projects,stats,settings}` (admin only)

## Deployment
- Frontend: `npm run build` → deploy `dist/paint-visualizer` to Vercel/Netlify; set `src/environments/environment.ts` `apiUrl`/`serverUrl` to your API host first.
- Backend: AWS (EC2/Elastic Beanstalk) or any Node host + MongoDB Atlas; set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`. Use persistent storage (e.g. S3) for `uploads/` in production.

## Phase-1 limits (from PRD)
No automatic AI wall detection, AR/VR, mobile app, or payments.
