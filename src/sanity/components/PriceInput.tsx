import { useEffect, useState } from "react";
import { Card, Flex, Text } from "@sanity/ui";
import { useClient, useFormValue, type NumberInputProps } from "sanity";
import { resolveCurrency } from "@/lib/countryPresets";
import { CURRENCY_SYMBOLS } from "@/lib/formatPrice";

interface CountryCurrency {
  slug?: string;
  currency?: string;
}

/** Number input prefixed with the currency of the profile's country. */
export function PriceInput(props: NumberInputProps) {
  const countryRef = (useFormValue(["country"]) as { _ref?: string } | undefined)?._ref;
  const client = useClient({ apiVersion: "2026-01-01" });
  const [loaded, setLoaded] = useState<{ ref: string; country: CountryCurrency | null } | null>(null);
  const country = countryRef && loaded?.ref === countryRef ? loaded.country : null;

  useEffect(() => {
    if (!countryRef) return;
    let cancelled = false;
    client
      .fetch<CountryCurrency | null>(
        `coalesce(*[_id == "drafts." + $id][0], *[_id == $id][0]){ "slug": slug.current, currency }`,
        { id: countryRef },
      )
      .then((result) => {
        if (!cancelled) setLoaded({ ref: countryRef, country: result });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ ref: countryRef, country: null });
      });
    return () => {
      cancelled = true;
    };
  }, [client, countryRef]);

  const currency = country?.slug ? resolveCurrency({ slug: country.slug, currency: country.currency }) : undefined;

  return (
    <Flex align="center" gap={2}>
      <Card padding={3} radius={2} tone={currency ? "primary" : "caution"} border>
        <Text size={1} weight="semibold">
          {currency ? CURRENCY_SYMBOLS[currency] : countryRef ? "No currency" : "Pick country"}
        </Text>
      </Card>
      <div style={{ flex: 1 }}>{props.renderDefault(props)}</div>
    </Flex>
  );
}
