'use client';

import { CircleCheck, CircleDashed, PlugZap } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UseMutationResult } from '@tanstack/react-query';
import {
  type IntegrationDefinition,
  type IntegrationValues,
  isConfigured,
  useSaveIntegration,
  useTestIntegration,
} from '@/lib/admin/integrations';
import { describeError } from '@/lib/api/errors';

function initialDraft(def: IntegrationDefinition<string>, values: IntegrationValues | undefined) {
  return Object.fromEntries(
    def.fields.map((field) => {
      const value = values?.[field.name];
      return [field.name, field.secret || typeof value !== 'string' ? '' : value];
    }),
  );
}

type SaveMutation = UseMutationResult<unknown, Error, Record<string, string>>;
type TestMutation = UseMutationResult<{ ok: boolean; detail: string }, Error, void>;

export function IntegrationCard({
  def,
  values,
}: {
  def: IntegrationDefinition;
  values: IntegrationValues | undefined;
}) {
  const save = useSaveIntegration(def.key);
  const test = useTestIntegration(def.key);
  return <IntegrationForm def={def} values={values} save={save} test={test} />;
}

export function IntegrationForm({
  def,
  values,
  save,
  test,
}: {
  def: IntegrationDefinition<string>;
  values: IntegrationValues | undefined;
  save: SaveMutation;
  test: TestMutation;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => initialDraft(def, values));
  const [saved, setSaved] = useState(false);
  const configured = isConfigured(values, def);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    test.reset();
    save.mutate(draft, {
      onSuccess: () => {
        setSaved(true);
        setDraft((current) =>
          Object.fromEntries(
            def.fields.map((field) => [
              field.name,
              field.secret ? '' : (current[field.name] ?? ''),
            ]),
          ),
        );
      },
    });
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{def.title}</CardTitle>
          <CardDescription>{def.description}</CardDescription>
        </div>
        <Badge tone={configured ? 'success' : 'neutral'} className="shrink-0">
          {configured ? (
            <CircleCheck className="size-3.5" />
          ) : (
            <CircleDashed className="size-3.5" />
          )}
          {configured ? 'Configurado' : 'Pendente'}
        </Badge>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          {def.fields.map((field) => {
            const current = values?.[field.name];
            const hint =
              field.secret && current && typeof current !== 'string'
                ? `Salvo (${current.hint}). Deixe em branco para manter.`
                : field.hint;
            const id = `${def.key}-${field.name}`;
            return (
              <Field key={field.name} label={field.label} htmlFor={id} hint={hint}>
                <Input
                  id={id}
                  type={field.secret ? 'password' : 'text'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={field.placeholder}
                  value={draft[field.name] ?? ''}
                  onChange={(event) =>
                    setDraft((state) => ({ ...state, [field.name]: event.target.value }))
                  }
                />
              </Field>
            );
          })}
        </div>
        {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
        {test.data ? (
          <Alert tone={test.data.ok ? 'success' : 'danger'}>{test.data.detail}</Alert>
        ) : null}
        {test.error ? <Alert>{describeError(test.error)}</Alert> : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={save.isPending}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="outline"
            loading={test.isPending}
            disabled={!configured}
            onClick={() => test.mutate()}
          >
            <PlugZap /> Testar conexão
          </Button>
          {saved && !save.isPending ? <span className="text-sm text-success">Salvo</span> : null}
        </div>
      </form>
    </Card>
  );
}
