import React from 'react';
import { useConfig } from '../hooks/useConfig';
import { isProduction } from '../config/environment';

const EnvironmentBanner: React.FC = () => {
  const config = useConfig();

  // Don't show banner on production
  if (isProduction()) {
    return null;
  }

  return (
    <div className='w-full bg-amber-500 py-2 text-center text-sm font-medium text-white'>
      Local Environment - {config.domain}
    </div>
  );
};

export default EnvironmentBanner;
