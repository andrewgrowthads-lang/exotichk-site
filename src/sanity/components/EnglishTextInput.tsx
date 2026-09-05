import { Card, Stack, Text, TextArea } from "@sanity/ui";
import { set, type ObjectInputProps } from "sanity";

interface LocaleValue {
  _type?: string;
  en?: string;
  zhHantHK?: string;
}

/** Single English textarea. Chinese is filled by Publish Profile, not by the editor. */
export function EnglishTextInput(props: ObjectInputProps) {
  const value = (props.value as LocaleValue | undefined) ?? {};
  return (
    <Stack gap={2}>
      <TextArea
        fontSize={2}
        padding={3}
        rows={8}
        value={value.en ?? ""}
        onChange={(event) =>
          props.onChange(
            set({
              _type: "localeText",
              en: event.currentTarget.value,
              ...(value.zhHantHK ? { zhHantHK: value.zhHantHK } : {}),
            }),
          )
        }
      />
      <Card padding={0} tone="transparent">
        <Text muted size={1}>
          English only. Chinese is generated when you publish, if translation is available.
        </Text>
      </Card>
    </Stack>
  );
}
