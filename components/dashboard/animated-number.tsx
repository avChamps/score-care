"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AnimatedNumberProps = {
  value: string | number | null | undefined;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  formatIndianCurrency?: boolean;
  formatIndianNumber?: boolean;
};

type ParsedAnimatedValue = {
  numberValue: number;
  prefix: string;
  suffix: string;
  decimals: number;
  useIndianFormat: boolean;
};

export function AnimatedNumber({
  value,
  prefix,
  suffix,
  duration = 900,
  className,
  formatIndianCurrency = false,
  formatIndianNumber = false,
}: AnimatedNumberProps) {
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(() => formatStaticValue(value));
  const parsed = useMemo(() => parseAnimatedValue(value, prefix, suffix), [value, prefix, suffix]);

  useEffect(() => {
    if (!parsed) {
      setDisplayValue(formatStaticValue(value));
      return;
    }

    setDisplayValue(formatAnimatedValue(0, parsed, formatIndianCurrency, formatIndianNumber));
    hasAnimatedRef.current = false;

    const element = elementRef.current;
    if (!element) return;

    const animate = () => {
      if (hasAnimatedRef.current) return;

      hasAnimatedRef.current = true;
      const start = performance.now();
      const target = parsed.numberValue;

      const tick = (time: number) => {
        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(formatAnimatedValue(target * eased, parsed, formatIndianCurrency, formatIndianNumber));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [duration, formatIndianCurrency, formatIndianNumber, parsed]);

  return (
    <span ref={elementRef} className={className}>
      {displayValue}
    </span>
  );
}

function formatStaticValue(value: AnimatedNumberProps["value"]) {
  if (value === null || value === undefined || value === "") return value === "" ? "" : "-";

  return String(value);
}

function parseAnimatedValue(value: AnimatedNumberProps["value"], prefix?: string, suffix?: string) {
  if (value === null || value === undefined || value === "") return null;

  const rawValue = String(value).trim();
  if (!rawValue || rawValue === "-" || rawValue === "--" || rawValue === "...") return null;
  if (isNonAnimatedNumericText(rawValue)) return null;

  const match = rawValue.match(/^([+\-]?\s*(?:Rs\.|₹)?\s*)(\d[\d,]*(?:\.\d+)?)(\s*[A-Za-z%+][A-Za-z%+\s.-]*)?$/i);

  if (!match) return null;

  const detectedPrefix = prefix ?? match[1] ?? "";
  const detectedSuffix = suffix ?? match[3] ?? "";
  const numericText = match[2].replace(/,/g, "");
  const numberValue = Number(numericText);

  if (!Number.isFinite(numberValue)) return null;

  return {
    decimals: getDecimalPlaces(numericText),
    numberValue,
    prefix: detectedPrefix,
    suffix: detectedSuffix,
    useIndianFormat: match[2].includes(",") || /Rs\.|₹/i.test(detectedPrefix),
  } satisfies ParsedAnimatedValue;
}

function formatAnimatedValue(
  value: number,
  parsed: ParsedAnimatedValue,
  formatIndianCurrency: boolean,
  formatIndianNumber: boolean,
) {
  const normalizedValue = parsed.decimals ? Number(value.toFixed(parsed.decimals)) : Math.round(value);
  const shouldUseIndianFormat = formatIndianCurrency || formatIndianNumber || parsed.useIndianFormat;
  const formattedValue = shouldUseIndianFormat
    ? normalizedValue.toLocaleString("en-IN", {
        maximumFractionDigits: parsed.decimals,
        minimumFractionDigits: parsed.decimals,
      })
    : normalizedValue.toFixed(parsed.decimals);

  return `${parsed.prefix}${formattedValue}${parsed.suffix}`;
}

function getDecimalPlaces(value: string) {
  return value.includes(".") ? value.split(".")[1]?.length ?? 0 : 0;
}

function isNonAnimatedNumericText(value: string) {
  const compact = value.replace(/\s/g, "");

  return (
    /^[A-Z]{5}\d{4}[A-Z]$/i.test(value) ||
    /^\d{4,}$/.test(compact) && compact.length >= 9 ||
    /(?:\d{1,2}:\d{2}|\d{1,2}\s?(?:AM|PM))/i.test(value) ||
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i.test(value) ||
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value) ||
    /^X+\d{2,}$/i.test(value) ||
    /(?:account|id|otp|pan|mobile|phone)\s*[:#-]?\s*[A-Z0-9-]*\d/i.test(value)
  );
}
