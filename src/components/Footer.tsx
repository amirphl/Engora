import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../contexts/NavigationContext';
import { ROUTES } from '../config/routes';
import DynamicBrand from './DynamicBrand';
import { footerI18n } from '../locales/footer';
import { headerI18n } from '../locales/header';
import { contactI18n } from '../locales/contact';

const Footer: React.FC = () => {
  const { isRTL } = useLanguage();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const footerT =
    footerI18n[language as keyof typeof footerI18n] || footerI18n.en;
  const headerT =
    headerI18n[language as keyof typeof headerI18n] || headerI18n.en;
  const contactT =
    contactI18n[language as keyof typeof contactI18n] || contactI18n.en;
  const { isAuthenticated } = useAuth();

  const getPrimaryPhoneHref = (raw: string) => {
    if (!raw) return '';
    const parts = raw.split(/[:：]/);
    const numbersPart = parts.length > 1 ? parts.slice(1).join(':') : raw;
    const rawTokens = numbersPart
      .split(/[,;\\/|\u2022\u00B7–—-]+/)
      .map(token => token.trim())
      .filter(Boolean);
    if (rawTokens.length === 0) return '';

    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const toEnglishDigits = (input: string) => {
      if (!input) return input;
      return input
        .replace(/[۰-۹]/g, d => String(persianDigits.indexOf(d)))
        .replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)));
    };

    let s = toEnglishDigits(rawTokens[0]);
    s = s.replace(/[^+\d]/g, '');
    if (s.startsWith('+')) return s;
    if (s.startsWith('00')) return '+' + s.slice(2);
    if (s.startsWith('0')) return '+98' + s.slice(1);
    if (s.startsWith('98')) return '+' + s;
    if (s.startsWith('9')) return '+98' + s;
    return s;
  };

  const phoneHref = getPrimaryPhoneHref(contactT.phone || '');
  return (
    <footer className='bg-gray-900 text-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Company Info */}
          <div className='col-span-1 md:col-span-2'>
            <div className='mb-4'>
              <DynamicBrand showSubtitle={true} />
            </div>
            <p className='text-gray-400 mb-4 max-w-md'>{footerT.description}</p>
            <div
              className={`flex ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}
            >
              {contactT.email ? (
                <a
                  className='text-gray-400 hover:text-white transition-colors duration-200'
                  href={`mailto:${contactT.email}`}
                  aria-label={`Email ${contactT.email}`}
                >
                  <Mail className='w-5 h-5' />
                </a>
              ) : (
                <span className='text-gray-400'>
                  <Mail className='w-5 h-5' />
                </span>
              )}
              {phoneHref ? (
                <a
                  className='text-gray-400 hover:text-white transition-colors duration-200'
                  href={`tel:${phoneHref}`}
                  aria-label='Call phone number'
                >
                  <Phone className='w-5 h-5' />
                </a>
              ) : (
                <span className='text-gray-400'>
                  <Phone className='w-5 h-5' />
                </span>
              )}
              <a
                className='text-gray-400 hover:text-white transition-colors duration-200'
                href='https://maps.app.goo.gl/bBYyE9iGcJ7PB65BA'
                target='_blank'
                rel='noreferrer'
                aria-label='Open company location in Google Maps'
              >
                <MapPin className='w-5 h-5' />
              </a>
            </div>
          </div>

          {/* Quick Links - hide when user is logged in */}
          {!isAuthenticated && (
            <div>
              <h4 className='text-lg font-semibold mb-4'>
                {footerT.quickLinks}
              </h4>
              <ul className='space-y-2'>
                <li>
                  <button className='text-gray-400 hover:text-white transition-colors duration-200'>
                    {headerT.dashboard}
                  </button>
                </li>
                <li>
                  <button className='text-gray-400 hover:text-white transition-colors duration-200'>
                    {headerT.campaigns}
                  </button>
                </li>
                <li>
                  <button className='text-gray-400 hover:text-white transition-colors duration-200'>
                    {headerT.analytics}
                  </button>
                </li>
                <li>
                  <button className='text-gray-400 hover:text-white transition-colors duration-200'>
                    {headerT.support}
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Support */}
          <div>
            <h4 className='text-lg font-semibold mb-4'>{footerT.support}</h4>
            <ul className='space-y-2'>
              {/* If user is authenticated, only show contact, privacy and terms. Otherwise show full support list */}
              {!isAuthenticated && (
                <li>
                  <button className='text-gray-400 hover:text-white transition-colors duration-200'>
                    {footerT.helpCenter}
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => navigate(ROUTES.CONTACT_US.path)}
                  className='text-gray-400 hover:text-white transition-colors duration-200'
                >
                  {footerT.contactUs}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate(ROUTES.TERMS.path)}
                  className='text-gray-400 hover:text-white transition-colors duration-200'
                >
                  {footerT.termsOfService}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={`border-t border-gray-800 mt-8 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center ${
            isRTL ? 'sm:flex-row-reverse' : 'sm:flex-row'
          } sm:justify-between`}
        >
          <a
            href='https://trustseal.enamad.ir/?id=661883&Code=FIH4Yi6KwGkuPSeweo3M7XGoegrAOrTP'
            target='_blank'
            rel='noreferrer'
            referrerPolicy='origin'
            aria-label='Verify eNamad trust seal'
          >
            <img
              className='cursor-pointer'
              referrerPolicy='origin'
              src='https://trustseal.enamad.ir/logo.aspx?id=661883&Code=FIH4Yi6KwGkuPSeweo3M7XGoegrAOrTP'
              alt='eNamad trust seal'
            />
          </a>
          <p className='text-gray-400'>{footerT.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
