import { useForm } from 'effector-forms';
import { FormEvent, ClipboardEvent } from 'react';
import { useUnit } from 'effector-react';
import { Trans } from 'react-i18next';

import { Button, Checkbox, FootnoteText, Input } from '@shared/ui';
import { useI18n } from '@app/providers';
import { warningModel } from '../model/warning-model';

type Props = {
  onGoBack: () => void;
};
export const Warning = ({ onGoBack }: Props) => {
  const { t } = useI18n();

  const {
    submit,
    fields: { passphrase, isCorrectProxy, isInaccessible, isIrreversible, lossOfFunds },
  } = useForm(warningModel.$warningForm);

  const revokeAuthority = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
  };

  return (
    <div className="pb-4 px-5">
      <form id="remove-pure-proxy-warning-form" className="flex flex-col gap-y-4 mt-4" onSubmit={revokeAuthority}>
        <FootnoteText as="p"> {t('pureProxyRemove.warning.warningMessage')}</FootnoteText>
        <Input
          className="w-full"
          placeholder={t('general.input.descriptionPlaceholder')}
          value={passphrase.value}
          onChange={passphrase.onChange}
          onPaste={handlePaste}
        />
        <FootnoteText as="p" className="text-text-tertiary">
          <Trans t={t} i18nKey="pureProxyRemove.warning.inputHint" />
        </FootnoteText>
        <div>
          <Checkbox value={isCorrectProxy.value} onChange={({ target }) => isCorrectProxy.onChange(target.checked)}>
            <FootnoteText>
              <Trans t={t} i18nKey="pureProxyRemove.warning.isCorrectProxyCheckbox" />
            </FootnoteText>
          </Checkbox>
        </div>
        <div>
          <Checkbox value={isIrreversible.value} onChange={({ target }) => isIrreversible.onChange(target.checked)}>
            <FootnoteText>
              <Trans t={t} i18nKey="pureProxyRemove.warning.isIrreversibleCheckbox" />
            </FootnoteText>
          </Checkbox>
        </div>
        <div>
          <Checkbox value={isInaccessible.value} onChange={({ target }) => isInaccessible.onChange(target.checked)}>
            <FootnoteText>
              <Trans t={t} i18nKey="pureProxyRemove.warning.isInaccessibleCheckbox" />
            </FootnoteText>
          </Checkbox>
        </div>
        <div>
          <Checkbox value={lossOfFunds.value} onChange={({ target }) => lossOfFunds.onChange(target.checked)}>
            <FootnoteText>
              <Trans t={t} i18nKey="pureProxyRemove.warning.lossOfFundsCheckbox" />
            </FootnoteText>
          </Checkbox>
        </div>
      </form>

      <ActionSection onGoBack={onGoBack} />
    </div>
  );
};

const ActionSection = ({ onGoBack }: Props) => {
  const { t } = useI18n();

  const canSubmit = useUnit(warningModel.$canSubmit);
  const { isDirty } = useForm(warningModel.$warningForm);

  return (
    <div className="flex justify-between items-center mt-4">
      <Button variant="text" onClick={onGoBack}>
        {t('operation.goBackButton')}
      </Button>
      <Button form="remove-pure-proxy-warning-form" pallet="error" type="submit" disabled={!canSubmit || !isDirty}>
        {t('pureProxyRemove.warning.revokeAuthorityButton')}
      </Button>
    </div>
  );
};
