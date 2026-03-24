
'use client';

import * as icons from 'lucide-react';
import { type LucideProps } from 'lucide-react';
import { useMemo } from 'react';

// A type guard to check if the icon name is a valid key in the icons object
function isLucideIcon(name: string): name is keyof typeof icons {
  return name in icons;
}

// Function to convert a string to PascalCase (e.g., "briefcase" -> "Briefcase")
function toPascalCase(str: string): string {
    if (!str) return '';
    return str.replace(/(^\w|-\w)/g, (c) => c.replace('-', '').toUpperCase());
}

interface DynamicIconProps extends Omit<LucideProps, 'name'> {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const LucideIcon = useMemo(() => {
    const pascalCaseName = toPascalCase(name);
    if (isLucideIcon(pascalCaseName)) {
      return icons[pascalCaseName];
    }
    
    // Log a warning for developers if the icon is not found
    if (name && typeof window !== 'undefined') {
        console.warn(
            `[DynamicIcon] Icon "${name}" (converted to "${pascalCaseName}") not found in lucide-react. Falling back to AlertCircle. Visit https://lucide.dev/icons/ for a list of valid icon names.`
        );
    }
    
    // Return a default icon if the name is not valid
    return icons.AlertCircle;
  }, [name]);

  return <LucideIcon {...props} />;
};

export default DynamicIcon;
