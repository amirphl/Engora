import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

const LandingPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [phone, setPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizePhone = (value: string) =>
    value.trim().replace(/\s+/g, '').replace(/-/g, '').replace(/^\+98/, '98');

  const isValidPhone = (value: string) => {
    const v = normalizePhone(value);
    if (!/^\d+$/.test(v)) return false;
    if (v.startsWith('09') && v.length === 11) return true;
    if (v.startsWith('989') && v.length === 12) return true;
    return false;
  };

  const mockSubmit = async (value: string) => {
    // Mocked API call; no auth required
    await new Promise(resolve => setTimeout(resolve, 600));
    if (value.endsWith('0')) {
      // lightweight way to simulate an error path
      throw new Error('Mock submit failed');
    }
    return { success: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    if (!isValidPhone(phone)) {
      setStatusMessage('شماره صحیح نیست.');
      return;
    }

    setSubmitting(true);
    try {
      await mockSubmit(normalizePhone(phone));
      setStatusMessage('ثبت شد ✓');
      showSuccess('درخواست شما ثبت شد');
      setPhone('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ارسال درخواست ناموفق بود';
      showError(message);
      setStatusMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir='rtl' className='landing-page min-h-screen'>
      <div className='min-h-screen flex items-center justify-center px-4 py-7'>
        <main className='landing-layout grid gap-5 w-full grid-cols-1 md:[grid-template-columns:1.15fr_.85fr]'>
          <section
            className='landing-panel landing-intro relative rounded-[18px] border border-white/5 shadow-2xl overflow-hidden'
            aria-label='معرفی جاذبه'
          >
            <div className='landing-decoration landing-decoration-intro-top absolute' />
            <div className='landing-decoration landing-decoration-intro-bottom absolute' />

            <div className='relative flex items-center justify-between gap-3 mb-4'>
              <div className='flex items-center gap-3'>
                <div
                  className='w-11 h-11 rounded-2xl bg-white/5 grid place-items-center border border-white/10 shadow-lg overflow-hidden'
                  aria-hidden='true'
                >
                  <img
                    src='/Jazebeh.png'
                    alt='لوگوی جاذبه'
                    className='w-9 h-9 object-contain'
                    loading='lazy'
                  />
                </div>
                <div>
                  <h1 className='m-0 text-lg'>جاذبه</h1>
                  <div className='text-[13px] text-slate-300/80 mt-0.5'>
                    سامانه ارسال پیامک هدفمند و قابل اندازه‌گیری
                  </div>
                </div>
              </div>
              <div className='text-[12px] text-indigo-100 bg-indigo-500/15 border border-indigo-500/35 px-3 py-2 rounded-full whitespace-nowrap'>
                هدف دقیق • گزارش شفاف • نتیجه واقعی
              </div>
            </div>

            <div className='relative z-10 mt-2 space-y-4'>
              <h2 className='text-[34px] leading-snug m-0'>
                پیامک را{' '}
                <span className='bg-gradient-to-r from-indigo-500/30 to-rose-500/20 px-2.5 py-1 rounded-[14px] border border-white/10 text-white'>
                  به هدف دقیق
                </span>{' '}
                برسانید، نه ارسال کور!
              </h2>
              <p className='m-0 text-[15px] leading-8 text-slate-100/90 max-w-[56ch]'>
                جاذبه یک پلتفرم SMS Marketing داده‌محور است که کمک می‌کند پیام
                درست را در زمان درست به مخاطب درست برسانید؛ با سگمنت‌بندی
                هوشمند، لینک قابل رهگیری و گزارش‌های روشن برای تصمیم‌گیری
                سریع‌تر و کمپین‌های پربازده‌تر.
              </p>

              <div className='landing-feature-grid grid'>
                {[
                  'ارسال هدفمند بر اساس سگمنت‌ها و سناریوهای واقعی.',
                  'رهگیری کلیک و تبدیل با لینک‌های کوتاه اختصاصی.',
                  'داشبورد ساده برای دیدن نرخ کلیک.',
                  'مناسب مدیران بازاریابی که به دنبال نتایج قابل اندازه گیری‌اند.',
                ].map(text => (
                  <div
                    key={text}
                    className='flex gap-3 items-start px-3 py-2.5 rounded-[14px] bg-white/5 border border-white/10 backdrop-blur-md'
                  >
                    <span className='landing-feature-dot mt-1 w-2.5 h-2.5 rounded-full' />
                    <p className='m-0 text-[13px] text-slate-100/90 leading-6'>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside
            className='landing-panel landing-form relative rounded-[18px] border border-white/5 shadow-2xl overflow-hidden flex flex-col gap-3'
            aria-label='ثبت شماره تماس'
          >
            <div className='landing-decoration landing-decoration-form absolute' />
            <h2 className='relative z-10 m-0 text-[20px]'>
              برای دریافت دمو، شماره خود را وارد کنید
            </h2>
            <p className='relative z-10 m-0 text-[13px] text-slate-400 leading-7'>
              تیم ما در سریع‌ترین زمان برای هماهنگی دمو با شما تماس می‌گیرد.
            </p>

            <form
              className='relative z-10 flex flex-wrap gap-2.5 mt-2'
              onSubmit={handleSubmit}
            >
              <div className='flex items-center flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-[14px] px-3 py-3 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-[rgba(11,103,255,.35)] transition'>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  inputMode='tel'
                  autoComplete='tel'
                  placeholder='مثال: 0912xxxxxxx یا 98912xxxxxxx'
                  aria-label='شماره تماس'
                  className='w-full bg-transparent border-0 outline-none text-[14px] text-slate-100 placeholder:text-slate-400'
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <button
                type='submit'
                disabled={submitting}
                className='px-4 py-3 rounded-[14px] text-white font-bold text-[14px] bg-gradient-to-r from-primary-600 to-primary-500 shadow-lg hover:brightness-105 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitting ? 'در حال ارسال...' : 'ثبت شماره'}
              </button>
            </form>

            <div className='relative z-10 flex items-center justify-between gap-3 text-[12px] text-slate-300/90 mt-1'>
              <span className='inline-flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_0_0_rgba(255,43,43,.35)] animate-ping' />
                پاسخ‌گویی سریع در ساعات کاری
              </span>
              <span className='text-emerald-400'>{statusMessage}</span>
            </div>

            <div className='relative z-10 mt-2 p-3 rounded-[14px] bg-white/5 border border-white/10 text-[12px] text-slate-100/90 leading-7'>
              <b className='text-white'>قول جاذبه:</b> اگر کمپین قابل
              اندازه‌گیری می‌خواهید، ما از روز اول گزارش شفاف و قابل تصمیم ارائه
              می‌دهیم.
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
