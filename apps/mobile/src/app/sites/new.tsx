import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Card, Field, Screen, ScreenHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';

export default function NewSite() {
  const router = useRouter();
  const { t } = useT();
  const S = t.sites;
  const { addSite } = useStore();
  const [name, setName] = useState('');
  const [client, setClient] = useState('');

  return (
    <Screen
      footer={
        <Button
          label={S.save}
          variant="success"
          icon="check"
          disabled={name.trim().length === 0}
          onPress={() => {
            addSite(name, client);
            router.dismissTo('/');
          }}
        />
      }
    >
      <ScreenHeader title={S.newTitle} subtitle={S.newSub} />
      <Card>
        <Field label={S.name} value={name} onChangeText={setName} placeholder="Noida 62" autoCapitalize="words" autoFocus />
        <Field label={S.client2} value={client} onChangeText={setClient} placeholder="Gupta Constructions" autoCapitalize="words" hint={S.clientHint} />
      </Card>
    </Screen>
  );
}
