# بَريق للإكسسوارات — الكويت (Bareeq Kuwait Store)

متجر إلكتروني متكامل للإكسسوارات مهيأ للكويت (الأسعار والشحن بالدينار الكويتي `د.ك` بثلاث خانات عشرية، مع محافظات ومناطق الكويت، ونظام دخول موحد، ولوحة مشرف كاملة).

## إعداد المتغيرات على Vercel (مهم)

لا توجد كلمة سر للمشرف مكتوبة داخل الكود؛ يتم التحقق منها عبر نقطة النهاية `/api/verify-admin` باستخدام متغير البيئة على Vercel:

1. افتح مشروعك على **Vercel** ثم اذهب إلى:
   **Settings → Environment Variables**
2. أضف المتغيرات التالية:
   - `ADMIN_PASSWORD`: ضع هنا كلمة سر المشرف التي تريدها.
   - `GOOGLE_CLIENT_ID`: ضع هنا معرف عميل جوجل (`Web Client ID`) من Google Cloud Console.
   - `ADMIN_SESSION_SECRET` *(اختياري)*: نص عشوائي قوي لتوقيع جلسة المشرف.
3. بعد حفظ المتغيرات، نفّذ **Redeploy** من تبويب **Deployments** حتى تُطبّق المتغيرات الجديدة.

### إعداد Google Sign-In (اختياري)
- من **Google Cloud Console → APIs & Services → Credentials** أنشئ **OAuth 2.0 Client ID** من نوع **Web application**.
- أضف رابط موقعك على Vercel ضمن **Authorized JavaScript origins** (مثال: `https://your-project.vercel.app`).
- انسخ الـ **Client ID** وضعه في متغير البيئة `GOOGLE_CLIENT_ID` على Vercel.
- إذا لم تضع `GOOGLE_CLIENT_ID` بعد، سيعمل زر جوجل في وضع معاينة تجريبي محلي ويُظهر تنبيهاً بإضافة المفتاح على Vercel.
