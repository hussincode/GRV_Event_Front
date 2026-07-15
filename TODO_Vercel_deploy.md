# Vercel Deploy - GRV_Event

## Steps
1. تحديث `vite.config.js` بحيث يطلع build في مجلد `dist` (تم).
2. التأكد محلياً:
   - تشغيل: `npm ci`
   - تشغيل: `npm run build`
   - التأكد أن المخرجات في: `dist/`.
3. رفع المشروع على GitHub (Repo جديد).
4. إنشاء Project جديد على Vercel:
   - Project name/alias: **GRV_Event**
   - Framework Preset: Vite/React (Static).
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. ضبط Environment Variables إن وجدت (لو التطبيق بياخد API من متغيرات).

