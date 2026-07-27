import { twMerge } from 'tailwind-merge';
import { dynamicTextStyle } from '@/lib/dynamicStyle';

interface ParagraphProps {
    children: React.ReactNode;
    as?: 'p' | 'span' | 'div' | 'h2' | 'h1';
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    weight?: 'normal' | 'medium' | 'bold';
    variant?: 'default' | 'muted' | 'error';
    align?: 'left' | 'center' | 'right';
    className?: string;
    skeleton?: boolean;
    colorClassName?: string;
}

const Paragraph = ({
    children,
    as = 'p',
    size = 'md',
    weight = 'normal',
    variant = 'default',
    align = 'left',
    className = '',
    skeleton = false,
    colorClassName = "",
}: ParagraphProps) => {
    const sizeMap = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl',
        '6xl': 'text-6xl',
    };

    const weightMap = {
        normal: 'font-normal',
        medium: 'font-medium',
        bold: 'font-bold',
    };

    const variantMap = {
        default: 'text-current',
        muted: 'opacity-60',
        error: 'text-red-600',
    };

    const alignMap = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };



    // colorClassName arriva dal color picker granulare admin come stringa
    // Tailwind dinamica ("text-X/NN dark:text-Y/NN") composta da dati nel DB:
    // Tailwind non la vede mai in fase di build e non genera la CSS
    // corrispondente. Quando è presente, saltiamo del tutto variantMap
    // (che altrimenti applicherebbe comunque un text-* statico) e applichiamo
    // il colore risolto via CSS var + classe .dyn-text (vedi globals.css).
    const hasDynamicColor = Boolean(colorClassName);
    const baseStyles = `${sizeMap[size]} ${weightMap[weight]} ${hasDynamicColor ? '' : variantMap[variant]} ${alignMap[align]}`;

    if (skeleton) {
        return <div className={`bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded h-4 w-full ${className}`} />;
    }

    const Component = as;

    return (
        <div className={twMerge("relative w-full")}>
            <Component
                style={dynamicTextStyle(colorClassName)}
                className={twMerge(baseStyles, hasDynamicColor && "dyn-text", className)}
            >
                {children}
            </Component>
        </div>
    );
};

export default Paragraph;