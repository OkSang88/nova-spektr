import cn from 'classnames';
import { ChangeEvent, PropsWithChildren } from 'react';

import './styles.css';
import { FootnoteText } from '@renderer/components/ui-redesign';
import { FocusControl } from '@renderer/components/ui-redesign/Dropdowns/common/types';

interface Props extends FocusControl {
  defaultChecked?: boolean;
  position?: 'right' | 'left';
  checked?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  value?: any;
  className?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = ({
  checked,
  defaultChecked,
  position = 'right',
  disabled,
  readOnly,
  value,
  className,
  children,
  onChange,
  tabIndex,
}: PropsWithChildren<Props>) => {
  const content = typeof children === 'string' ? <FootnoteText>{children}</FootnoteText> : children;

  return (
    <label className={cn('flex items-center gap-x-2', !disabled && 'hover:cursor-pointer', className)}>
      {children && position === 'left' && content}
      <input
        type="checkbox"
        name="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        readOnly={readOnly}
        checked={checked}
        value={value}
        className={cn(
          'relative appearance-none w-4 h-4 text-button-text',
          'rounded border border-filter-border bg-button-text',
          'checked:bg-icon-accent checked:border-0 checked:focus:border checked:border-icon-accent-default',
          'hover:shadow-card-shadow hover:checked:bg-icon-accent-default',
          'disabled:text-filter-border disabled:bg-main-app-background disabled:checked:bg-main-app-background',
          !disabled && 'hover:cursor-pointer',
        )}
        tabIndex={tabIndex}
        onChange={onChange}
      />
      {children && position === 'right' && content}
    </label>
  );
};

export default Checkbox;
