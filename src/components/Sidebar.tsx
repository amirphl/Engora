import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../contexts/NavigationContext';
import { useCampaign } from '../hooks/useCampaign';
import LanguageSwitcher from './LanguageSwitcher';
import {
  LayoutDashboard,
  Send,
  BarChart3,
  Wallet,
  Ticket,
  UserCog,
  Settings,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  translationKey: string;
  href: string;
  exactMatch?: boolean;
  showForAgency?: boolean;
  onClick?: () => void;
}

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, languageSwitchEnabled } = useLanguage();
  // Sidebar open state (persist in localStorage)
  const [open, setOpen] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem('sidebar_open');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });

  const { user } = useAuth();
  const { navigate } = useNavigation();
  const { resetCampaign } = useCampaign();
  const [currentPath, setCurrentPath] = React.useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  React.useEffect(() => {
    const updatePath = (path?: string) => {
      if (path) {
        setCurrentPath(path);
        return;
      }
      setCurrentPath(
        typeof window !== 'undefined' ? window.location.pathname : ''
      );
    };

    const handleNavigation = (event: CustomEvent) =>
      updatePath(event.detail?.path);
    const handlePopState = () => updatePath();

    window.addEventListener('navigation', handleNavigation as EventListener);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener(
        'navigation',
        handleNavigation as EventListener
      );
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateToPage = (path: string) => navigate(path);

  const handleTargetedSend = () => {
    const existingData = localStorage.getItem('campaign_creation_data');
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        if (!parsed.segment && parsed.level) {
          const { level, ...currentData } = parsed;
          localStorage.setItem(
            'campaign_creation_data',
            JSON.stringify({ ...currentData, segment: level })
          );
        }
        navigate('/campaign-creation');
        return;
      } catch {
        // fallthrough
      }
    }
    resetCampaign();
    navigate('/campaign-creation');
  };

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard className='h-5 w-5' />,
      label: 'Dashboard',
      translationKey: 'dashboard.dashboard',
      href: '/dashboard',
      exactMatch: true,
      onClick: () => navigateToPage('/dashboard'),
    },
    {
      id: 'bundles',
      icon: <Package className='h-5 w-5' />,
      label: 'Bundles',
      translationKey: 'dashboard.bundles',
      href: '/dashboard/bundles',
      onClick: () => navigateToPage('/dashboard/bundles'),
    },
    {
      id: 'targeted-send',
      icon: <Send className='h-5 w-5' />,
      label: 'targeted send',
      translationKey: 'dashboard.targetedSend',
      href: '/campaign-creation',
      onClick: handleTargetedSend,
    },
    {
      id: 'reports',
      icon: <BarChart3 className='h-5 w-5' />,
      label: 'reports',
      translationKey: 'dashboard.reports',
      href: '/dashboard/reports',
      onClick: () => navigateToPage('/dashboard/reports'),
    },
    {
      id: 'wallet',
      icon: <Wallet className='h-5 w-5' />,
      label: 'Wallet and Charge',
      translationKey: 'dashboard.wallet',
      href: '/dashboard/wallet',
      onClick: () => navigateToPage('/dashboard/wallet'),
    },
    {
      id: 'support',
      icon: <Ticket className='h-5 w-5' />,
      label: 'Ticket and Support',
      translationKey: 'dashboard.support',
      href: '/dashboard/support',
      onClick: () => navigateToPage('/dashboard/support'),
    },
    {
      id: 'settings',
      icon: <Settings className='h-5 w-5' />,
      label: 'Settings',
      translationKey: 'dashboard.settings',
      href: '/dashboard/settings',
      onClick: () => navigateToPage('/dashboard/settings'),
    },
    {
      id: 'customer-discount-management',
      icon: <UserCog className='h-5 w-5' />,
      label: 'Customer & Discount Management',
      translationKey: 'dashboard.customerDiscountManagement',
      href: '/dashboard/customer-management',
      showForAgency: true,
      onClick: () => navigateToPage('/dashboard/customer-management'),
    },
  ];

  const isAgency = user?.account_type === 'marketing_agency';

  // Hide sidebar when user is not logged in
  if (!user) return null;

  // Hide sidebar for admin-like pages (e.g. satrap)
  if (currentPath.startsWith('/satrap') || currentPath.includes('/satrap'))
    return null;

  const toggle = () => {
    try {
      localStorage.setItem('sidebar_open', String(!open));
    } catch {}
    setOpen(o => !o);
  };

  return (
    <>
      <div
        className={`transform transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-0'} overflow-visible relative bg-white shadow-lg ${isRTL ? 'border-l' : 'border-r'} border-gray-200`}
      >
        {/* Toggle button placed on top of sidebar (inside its area) */}
        <button
          aria-label='Toggle sidebar'
          onClick={toggle}
          className={`absolute top-4 ${isRTL ? 'right-3' : 'left-3'} z-40 p-2 bg-white border rounded-md shadow-md hidden md:block`}
        >
          {open ? (
            isRTL ? (
              <ChevronRight className='h-4 w-4' />
            ) : (
              <ChevronLeft className='h-4 w-4' />
            )
          ) : isRTL ? (
            <ChevronLeft className='h-4 w-4' />
          ) : (
            <ChevronRight className='h-4 w-4' />
          )}
        </button>

        <div className='p-6'>
          <div
            className={`${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}
          >
            <nav className='space-y-2'>
              {sidebarItems.map(item => {
                if (item.showForAgency && !isAgency) return null;
                const isActive =
                  currentPath === item.href ||
                  (!item.exactMatch && currentPath.startsWith(`${item.href}/`));
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {item.icon}
                    <span>{t(item.translationKey)}</span>
                  </button>
                );
              })}
            </nav>

            {languageSwitchEnabled && (
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('dashboard.language')}
                  </span>
                </div>
                <LanguageSwitcher />
              </div>
            )}

            {/* Logout removed from sidebar per design */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
