"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const [pixelReady, setPixelReady] = useState(false);
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelReady || !window.fbq) return;

    // The initial PageView is already fired in the Meta script.
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    // Fire PageView only when the route actually changes.
    if (previousPathname.current !== pathname) {
      window.fbq("track", "PageView");
      previousPathname.current = pathname;
    }
  }, [pathname, pixelReady]);

  if (!metaPixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onReady={() => {
          setPixelReady(true);
          console.log("Meta Pixel initialized:", metaPixelId);
        }}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {
              if(f.fbq)return;

              n=f.fbq=function(){
                n.callMethod
                  ? n.callMethod.apply(n,arguments)
                  : n.queue.push(arguments)
              };

              if(!f._fbq)f._fbq=n;

              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];

              t=b.createElement(e);
              t.async=!0;
              t.src=v;

              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(
              window,
              document,
              'script',
              'https://connect.facebook.net/en_US/fbevents.js'
            );

            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          width="1"
          src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
          style={{ display: "none" }}
        />
      </noscript>
    </>
  );
}