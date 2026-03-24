
"use client";

import type { GeneralSettings } from "@/app/admin/settings/actions/general-actions";

interface AppLoaderProps {
  text?: string;
  settings: GeneralSettings | null;
  isLoading: boolean;
}

export default function AppLoader({ text, settings, isLoading }: AppLoaderProps) {
  
  const appName = settings?.website_name || "Loading";
  
  const loaderType = isLoading ? "pulse" : (settings?.loaderType || "pulse");

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">

      {loaderType === "pulse" && (
        <div className="flex flex-col items-center">
          <div className="pulse-ring"></div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "typing" && (
        <div className="flex flex-col items-center">
          <span className="typing">{appName}</span>
          {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "bars" && (
        <div className="flex flex-col items-center">
          <div className="bars-loader">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}></span>
            ))}
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "gradient" && (
        <div className="flex flex-col items-center">
          <div className="gradient-spinner"></div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "orbit" && (
        <div className="flex flex-col items-center">
          <div className="orbit">
            <div className="planet"></div>
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "dots" && (
        <div className="flex flex-col items-center">
          <div className="dots-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "progress" && (
        <div className="flex flex-col items-center w-64">
          <div className="progress-bar">
            <div className="progress"></div>
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "cube" && (
        <div className="flex flex-col items-center">
          <div className="cube-loader">
            <div className="cube"></div>
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "shine" && (
        <div className="flex flex-col items-center">
          <div className="shine-loader">
            <span>{appName}</span>
          </div>
          {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "bounce" && (
        <div className="flex flex-col items-center">
          <div className="bounce-loader">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "ring" && (
        <div className="flex flex-col items-center">
          <div className="ring-loader"></div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "flip" && (
        <div className="flex flex-col items-center">
          <div className="flip-loader"></div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
          {text && <p className="mt-2 text-muted-foreground">{text}</p>}
        </div>
      )}

      {loaderType === "wave" && (
        <div className="flex flex-col items-center">
          <div className="wave-loader">
            {[...Array(6)].map((_, i) => (
              <span key={i}></span>
            ))}
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
        </div>
      )}

      {loaderType === "heart" && (
        <div className="flex flex-col items-center">
          <div className="heart-loader"></div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
        </div>
      )}

      {loaderType === "matrix" && (
        <div className="flex flex-col items-center">
          <div className="matrix-loader">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i}>|</span>
            ))}
          </div>
          <span className="mt-6 text-2xl font-semibold">{appName}</span>
        </div>
      )}
    </div>
  );
}
