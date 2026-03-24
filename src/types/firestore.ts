

export interface ThemePalette {
    primary?: string;
    'primary-foreground'?: string;
    secondary?: string;
    'secondary-foreground'?: string;
    muted?: string;
    'muted-foreground'?: string;
    accent?: string;
    'accent-foreground'?: string;
    destructive?: string;
    'destructive-foreground'?: string;
    background?: string;
    foreground?: string;
    card?: string;
    'card-foreground'?: string;
    popover?: string;
    'popover-foreground'?: string;
    border?: string;
    input?: string;
    ring?: string;
}
  
export interface ThemeColors {
    light?: Partial<ThemePalette>;
    dark?: Partial<ThemePalette>;
}

export interface GlobalWebSettings {
    themeColors?: ThemeColors;
    updatedAt?: any;
}

export interface SectionVantaConfig {
    enabled: boolean;
    effect: string;
    color1: string;
    color2: string;
}

export interface VantaSettings {
    globalEnable: boolean;
    sections: {
        [key: string]: SectionVantaConfig;
    };
}
